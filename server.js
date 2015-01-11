module.exports = {
getUserByGoogleID: getUserByGoogleID

};


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


var cal = require('./calendar.js'); //used to load calendar data

/*
	Used to authenticate with google Oauth2
*/
var gstrat = require('passport-google-oauth').OAuth2Strategy;
var passport = require('passport');
var auth = require('./authentication.js'); //The authentication information for a google login


app.use(passport.initialize());		
app.use(passport.session({secret: 'test',     //This might be changed, passport persistent session
	cookie: {secure: true}
}));

//Google login, called when user clicks login button. Redirects to google login
app.get(auth.google.login, 
	passport.authenticate('google', 
		{scope: ['openid',
		'https://www.googleapis.com/auth/calendar']}), 
	function(req,res){}
);

//Google login callback, google will send back information here on a succesful callback
app.get(auth.google.loginCallback,
	passport.authenticate('google', 
		{//successRedirect: '/',					//Back to main page
		failureRedirect: auth.google.login}),	//Retry login. Perhapse this should do something else
	function(req, res){
		console.log('=======================================\n\n');
		console.log(req.user.id);
		res.redirect('/?userid='+req.user.id);
	}
);

function setProfile(index, profile){
    if (!googleIDusers[index]){
        googleIDusers[index] = {};
    }
    googleIDusers[index].profile = profile;
}

//Information from google login request
var request = function(accessToken, refreshToken, profile, done)
{
    console.log("test");
    process.nextTick(function() 
    {
	console.log('here');
        setProfile(profile.id, profile);
	console.log("User Id: "+profile.id);
	console.log("Display Name: "+profile.displayName);
	console.log("Email: "+profile.emails);
	console.log("Access Token: "+accessToken);
        
        cal.getGoogleCalendarData(accessToken, profile.id);
        
	    return done(null, profile);
	});
};

//Called when we attempt to authenticate through google with passport
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

User = function(wsID){
    this.socketID = wsID;
    this.name = "";
    //this.groups = [];
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

function loggedIn(user){
    return user.profile && user.profile.id;
}

function authenticate(user, event){
    return loggedIn(user) && event.eventOwner == user.profile.id;
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

function googleIDFind(userList, googleID){
    return getuser(userList, function(user){
        return user.profile.id == googleID;
    });
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

function changeAttendance(event, attendance, user){
    var attendingp = 
        event.attending.indexOf(user.profile.id) != -1;
    var notAttendingp = 
        event.notAttending.indexOf(user.profile.id) != -1;

    if (attendance == 1){ //yes
        if (!attendingp){
            event.attending.push(user.profile.id);
        }
        if (notAttendingp){
            event.notAttending.splice(event.notAttending.indexOf(user.profile.id), 1);
        }
    } else if (attendance == 2) { //no
        if (!notAttendingp){
            event.notAttending.push(user.profile.id);
        }
        if (attendingp){
            event.attending.splice(event.attending.indexOf(user.profile.id), 1);
        }
    }
    //console.log(event);
}

var serverFunctions = { //functions for various commands
    //gets an event of a specified id from eventList and sends it as a jsonified
    //string to the user who requested it
    "ATTENDANCE": function(decoded, user){
        if (loggedIn(user)){
            var group = getGroup(decoded.groupID);
            if (group){
                if (group.events[decoded.eventID]){
                    changeAttendance(group.events[decoded.eventID], 
                                     decoded.attendance, user);
                    broadcast(group, JSON.stringify(
                        {type: "SAVE_EVENT",
                         data: group.events[decoded.eventID]}));
                }
            }
        }
        return user;
    },
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
        if (loggedIn(user)){
            console.log(user);
            var group = getGroup(decoded.data.groupID);
            if (decoded.data.id[0] == 'c'){ //if it's a client id
                decoded.data.id = group.events.length; //assign an id
                decoded.data.eventOwner = user.profile.id;
                decoded.data.attending = [];
                decoded.data.notAttending = [];
                events.push(decoded.data);
                group.events.push(decoded.data);
                console.log("Making new event");
            } else { //else we're overwriting a currently saved event
                console.log("Overwriting old event");
                if (group.events[decoded.data.id]){ //if the event exists
                    console.log(group.events[decoded.data.id]);
                    if (authenticate(user, group.events[decoded.data.id])){
                        console.log("They have access to the event");
                        //replace our old event
                        group.events[decoded.data.id] = decoded.data;
                    } else {
                        console.log("they have no access");
                        return user;
                    }
                } else {
                    console.log("event doesn't exist");
                    //if the event is nonexistent, drop the packet
                    return user; 
                }
            }
            getSocket(user).send(JSON.stringify({type: "SAVE_EVENT",
                                                 data: decoded.data}));
            broadcastAllBut(group, JSON.stringify({type: "LOAD_EVENT",
                                                   data: decoded.data}), user);
        } else {
            console.log("user is not logged in");
        }
        return user;
    },
    "DELETE_EVENT": function(decoded, user){
        if (authenticate(user, decoded.data)){
            var group = getGroup(decoded.data.groupID);
            if (group){
                if (group.events[decoded.data]){ //if the event exists
                    group.events[decoded.data] = null; //delete it
                }
                //get all clients to delete it too
                broadcast(group, JSON.stringify({type: "DELETE_EVENT",
                                                 data: decoded.data}));
            }
        }
        return user;
    },
    //the same as above except for schedules
    "LOAD_SCHEDULE": function(decoded, user){
        getSocket(user).send(JSON.stringify({type: "LOAD_SCHEDULE",
                                             data: schedules[decoded.data]}));
        return user;
    },
    //indeed also the same as above
    "SAVE_SCHEDULE": function(decoded, user){
        if (authenticate(user)){
            decoded.data.id = schedules.length;
            schedules.push(decoded.data);
            getSocket(user).send(JSON.stringify({type: "SAVE_SCHEDULE",
                                                 data: decoded.data}));
        }
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
        if (authenticate(user, decoded.data)){
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
        }
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
    "UUID_LOOKUP": function(decoded, user){
        getSocket(user).send(
            JSON.stringify({type: "UUID_LOOKUP",
                            data: getUserByUUID(users, decoded.data)}));
        return user;
    },
    "GOOGLE_ID_LOOKUP": function(decoded, user){
        getSocket(user).send(
            JSON.stringify({type: "GOOGLE_ID_LOOKUP",
                            data: googleIDFind(users, decoded.data)}));
        //getUserByGoogleID(decoded.data)}));
        return user;
    },
    "GOOGLE_ID_LOGIN": function(decoded, user){
        var newuser = getUserByGoogleID(decoded.data);
        if (newuser){
            getSocket(user).send(
                JSON.stringify({type: "GOOGLE_ID_LOGIN",
                                data: newuser}));
            newuser.socketID = user.socketID;
            newuser.id = user.id;
            googleIDusers[decoded.data] = null;
            console.log(newuser);
            return newuser;
        }
        return user;
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
