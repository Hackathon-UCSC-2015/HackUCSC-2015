//express requires (for hosting server client side bits)
var express = require('express');
var app = express();
app.use(express.static(__dirname+'/client'));
app.listen(3000);

//fs, for saving and loading things server side
var fs = require('fs');

//websockets for communicating with client
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port:8080});

//uuid
var uuid = require('node-uuid');

//var cal = require('./calendar.js');
//var data = cal.getCalData();
//console.log(data.name +'\n'+data.startTime +'\n'+data.endTime);













//=========================================================

///
//var cal = require('./calendar.js');

///

var gstrat = require('passport-google-oauth').OAuth2Strategy;
var passport = require('passport');
var gcal = require('google-calendar');

//app.use(express.session({secret: "test"}));
app.use(passport.initialize());
app.use(passport.session({secret: 'test', 
	cookie: {secure: true}
}));

//var clientId ='150705574355-54aapich5dkqr7gts5j9rolh96h87fll.apps.googleusercontent.com';
//var clientSecret = 'Lh8PNvlR8515OckCtXNnNN68'; //it is smart to keep private keys in public repos

var auth = require('./authentication.js');

//var gc = new gcal.GoogleCalendar(accessToken);
app.get(auth.google.login, 
	passport.authenticate('google', 
		{scope: ['openid',
		'https://www.googleapis.com/auth/calendar']}), 
	function(req,res){}
);

app.get(auth.google.loginCallback,
	passport.authenticate('google', 
		{successRedirect: '/',					//Back to main page
		failureRedirect: auth.google.login}),	//Retry login. Perhapse this should do something else
	function(req, res){}
);

function setProfile(index, profile){
    if (!googleIDusers[index]){
        googleIDusers[index] = {};
    }
    googleIDusers[index].profile = profile;
}

var request = function(accessToken, refreshToken, profile, done)
{
    console.log("test");
    process.nextTick(function() 
    {
	console.log('here');
        setProfile(profie.id, profile);
	console.log("User Id: "+profile.id);
	console.log("Display Name: "+profile.displayName);
	console.log("Email: "+profile.emails);
	console.log("Access Token: "+accessToken);
        
        //cal.getGoogleCalendarData(accessToken);
        
	    return done(null, profile);
            
	    //return done(null, profile);
	});
};

passport.use(
	new gstrat(
	{
		clientID: auth.google.clientId,
		clientSecret: auth.google.clientSecret,
		callbackURL: auth.google.callbackURL,
	},
	request
	)
);

passport.serializeUser(function(user, done) 
{
	console.log("\nserialize\n");
	console.log(user);
	console.log('\n\n');
	//console.log(done);
	done(null, user);
});

passport.deserializeUser(function(obj, done)
{
	console.log("\ndeserialize\n");
	done(null, obj);
});



//===============================================================






User = function(wsID){
    this.socketID = wsID;
    this.name = "";
    this.groups = [];
    this.connectionClosed = false;
    this.id = uuid.v4();
}
var users = [];
var googleIDusers = {};

function getSocket(user){
    return wss.clients[user.socketID];
}

function addNewUser(wsID){
    var user = new User(wsID);
    users.push(user);
    return user;
}

var events = [];
var schedules = [];

//group object
Group = function(){
    this.events = [];
    this.users = [];
    this.id = groupID++;
};

var groupID = 0;
var globalGroup = new Group();
var groups = [globalGroup];

//broadcast a message to a group
function broadcast(group, data){
    group.users.forEach(function(client){
        if (!client.connectionClosed){
            getSocket(client).send(data);
        }
    });
}

function broadcastAllBut(group, data, user){
    group.users.forEach(function(client){
        if (!client.connectionClosed && client != user){
            getSocket(client).send(data);
        }
    });
}

function getUser(userList, fn){
    for (var i = 0; i < userList; i++){
        if (fn(userList[i])){
            return userList[i];
        }
    }
    return null;
}

function getUserByUUID(userList, UUID){
    return getUser(userList, function(user){
        return user.id == UUID;
    });
}

function getUserByGoogleID(googleID){
    return googleIDusers[googleID];
}

function getGroup(ID){
    return groups[parseInt(ID)];
}

var serverFunctions = { //functions for various commands
    //gets an event of a specified id from eventList and sends it as a jsonified
    //string to the user who requested it
    "LOAD_EVENT": function(decoded, user){
        getSocket(user).send(
            JSON.stringify(
                {type: "LOAD_EVENT",
                 data: getGroup(decoded.data.groupID).events[decoded.data.id]}));
        return user;
    },
    //gets an event from a client and assigns it an id, saves it in eventList
    //and sends the whole event back to the client
    "SAVE_EVENT": function(decoded, user){
        var group = getGroup(decoded.data.groupID);
        if (decoded.data.id[0] == 'c'){ //if it's a client id
            decoded.data.id = group.events.length; //assign an id
            events.push(decoded.data); 
            group.events.push(decoded.data);
        } else { //else we're overwriting a currently saved event
            group.events[decoded.data.id] = decoded.data; //replace our old event
        }
        getSocket(user).send(JSON.stringify({type: "SAVE_EVENT",
                                             data: decoded.data}));
        broadcastAllBut(group, JSON.stringify({type: "LOAD_EVENT",
                                               data: decoded.data}), user);
        return user;
    },
    "DELETE_EVENT": function(decoded, user){
        
    },
    //the same as above except for schedules
    "LOAD_SCHEDULE": function(decoded, user){
        getSocket(user).send(JSON.stringify({type: "LOAD_SCHEDULE",
                                             data: schedules[decoded.data]}));
        return user;
    },
    //indeed also the same as above
    "SAVE_SCHEDULE": function(decoded, user){
        decoded.data.id = schedules.length;
        schedules.push(decoded.data);
        getSocket(user).send(JSON.stringify({type: "SAVE_SCHEDULE",
                                             data: decoded.data}));
        return user;
    },
    "ENTER_GROUP": function(decoded, user){
        //add the user if they're not already part of the group
        pushOnlyOne(getGroup(decoded.data).users, user); 
        return user;
    },
    "EXIT_GROUP": function(decoded, user){
        getGroup(decoded.data).users = 
            getGroup(decoded.data).users.filter(function(filteruser){
                return user !== filteruser;
            });
        return user;
    },
    "SAVE_GROUP": function(decoded, user){
        if (decoded.data.id[0] == 'c'){ //if id's generated by client
            decoded.data.id = groups.length;
            groups.push(decoded.data);
        } else {
            groups[decoded.data.id] = decoded.data;
        }
        getSocket(user).send(JSON.stringify({type: "SAVE_GROUP",
                                             data: decoded.data}));
        broadcastAllBut(group, JSON.stringify({type: "LOAD_GROUP",
                                               data: decoded.data}), user);
        return user;
    },
    "LOAD_GROUP": function(decoded, user){
        getSocket(user).send(JSON.stringify({type: "LOAD_GROUP",
                                             data: groups[decoded.data]}));
        return user;
    },
    "LIST_EVENTS": function(decoded, user){
        //Give the user all current events
        events.forEach(function(event) {
            getSocket(user).send(JSON.stringify({type: "LOAD_EVENT",
                                                 data: event}));
        });
        return user;
    },
    "LIST_SCHEDULES": function(decoded, user){
        schedules.forEach(function(schedule) {
            getSocket(user).send(JSON.stringify({type: "LOAD_SCHEDULE",
                                                 data: schedule}));
        });
        return user;
    },
    "LIST_GROUPS": function(decoded, user){
        groups.forEach(function(group) {
            getSocket(user).send(JSON.stringify({type: "LOAD_GROUP",
                                                 data: group}));
        });
        return user;
    },
    "ADD_COMMENT": function(decoded, user){
        return user;
    },
    "OVERWRITE_SCHEDULE": function(decoded, user){
        return user;
    },
    "UUID_LOOKUP": function(decoded, user){
        getSocket(user).send(
            JSON.stringify({type: "UUID_LOOKUP",
                            data: getUserByUUID(users, decoded.data)}));
        return user;
    },
    "GOOGLE_ID_LOOKUP": function(decoded, user){
        getSocket(user).send(
            JSON.stringify({type: "GOOGLE_ID_LOOKUP",
                            data: getUserByGoogleID(decoded.data)}));
        return user;
    },
    "GOOGLE_ID_LOGIN": function(decoded, user){
        var newuser = getUserByGoogleID(decoded.data);
        getSocket(user).send(
            JSON.stringify({type: "GOOGLE_ID_LOGIN",
                            data: newuser}));
        newuser.socketID = user.socketID;
        newuser.id = user.id;
        return newuser;
    },
    "GOOGLE_LOOKUP_SET": function(decoded, user){
        var newuser = getUserByGoogleID(decoded.data);
        newuser.socketID = user.socketID;
        newuser.id = user.id;
        return newuser;
    },
    "UUID_LOOKUP_SET": function(decided, user){
        return user;
    },
};

//write to use uuids
wss.on('connection', function(ws){
    console.log('user connected');
    //var userExists 
    ws.on('message', function(packet){
        var decoded = JSON.parse(packet);
        console.log('Received '+decoded); //debug
        //search for and run the command recieved in our server table
        var fn = serverFunctions[decoded.type];
        console.log('Received '+decoded.type);
        if (fn){
            ws.userData = fn(decoded, ws.userData); //run the function if we find it in our table
        } else {
            console.log('Packet type '+decoded.type+' unknown in '+decoded);
        }
    });
    ws.on('close', function(code, reason){
        ws.connectionClosed = true;
        console.log("User "+ws.userData.id+" quit");
    });
    //console.log(ws);
    var user = addNewUser(wss.clients.length-1);
    ws.userData = user;
    globalGroup.users.push(user); //add the user to the global userlist
});

//save the schedule and events and groups to file
function saveAllData(){
    console.log('Beginning save');
    console.log(events);
    console.log(schedules);
    console.log(groups);
    console.log(users);
    fs.writeFileSync(__dirname+'/server_files/data',
                     JSON.stringify({
                         events: events,
                         schedules: schedules,
                         groups: groups,
                         users: users}));
    console.log('Saved all data.');
}

//this is basically pointless right now without anything to get it working
function loadAllData(){
    var data = JSON.parse(readFileSync(__dirname+'/server_files/data', 'utf8'));
    events = data.events;
    schedules = data.schedules;
    groups = data.groups;
    users = data.users;
}

function pushOnlyOne(array, value){
    if (array.indexOf(value) === -1){
        array.push(value);
    }
}

//create our server file directory
if (!fs.existsSync(__dirname+'/server_files')){
    fs.mkdirSync(__dirname+'/server_files');
}
fs.writeFileSync(__dirname+'/server_files/data');

//every six minutes save all events and schedules
setInterval(saveAllData, 2*60*1000);
