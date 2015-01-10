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

//var cal = require('./calendar.js');
//var data = cal.getCalData();
//console.log(data.name +'\n'+data.startTime +'\n'+data.endTime);


//=========================================================



var gstrat = require('passport-google-oauth').OAuth2Strategy;
var passport = require('passport');
var gcal = require('google-calendar');

app.use(passport.initialize());
app.use(passport.session({secret: "test"}));

var clientId ='150705574355-54aapich5dkqr7gts5j9rolh96h87fll.apps.googleusercontent.com';
var clientSecret = 'Lh8PNvlR8515OckCtXNnNN68';

//var gc = new gcal.GoogleCalendar(accessToken);
app.get('/auth/google', 
	passport.authenticate('google', 
		{scope: ['openid',
		'https://www.googleapis.com/auth/calendar']}), 
	function(req,res){}
	);

app.get('/auth/google/callback',
	passport.authenticate('google', {successRedirect: '/',failureRedirect: '/fail'}),
	function(req, res){
	    console.log("/auth/google/callback");
	}
       );

var request = function(accessToken, refreshToken, profile, done)
{
    console.log("test");
    process.nextTick(
	function()
	{
	    console.log('here');
	    console.log("User Id: "+profile.id);
	    console.log("Display Name: "+profile.displayName);
	    console.log("Email: "+profile.emails);
	    console.log("Access Token: "+accessToken);
            
	    return done(null, profile);
            
	    //return done(null, profile);
	});
    
};

passport.use(
    new gstrat(
	{
	    clientID: clientId,
	    clientSecret: clientSecret,
	    callbackURL: 'http://localhost:3000/auth/google/callback',
	},
	request
    )
);

passport.serializeUser(function(user, done) {
done(null, user);
});



//===============================================================





var events = [];
var schedules = [];

//group object
Group = function() {
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
            client.send(data);
        }
    });
}

function getGroup(ID){
    return groups[ID];
}

var serverFunctions = { //functions for various commands
    //gets an event of a specified id from eventList and sends it as a jsonified
    //string to the user who requested it
    "LOAD_EVENT": function(decoded, ws){
        ws.send(JSON.stringify({type: "LOAD_EVENT",
                                data: events[decoded.data]}));
    },
    //gets an event from a client and assigns it an id, saves it in eventList
    //and sends the whole event back to the client
    "SAVE_EVENT": function(decoded, ws){
        var group = getGroup(decoded.data.groupID);
        decoded.data.id = group.events.length;
        events.push(decoded.data);
        group.events.push(decoded.data);
        broadcast(group,
                  JSON.stringify({type: "SAVE_EVENT",
                                  data: decoded.data}));
    },
    //the same as above except for schedules
    "LOAD_SCHEDULE": function(decoded, ws){
        ws.send(JSON.stringify({type: "LOAD_SCHEDULE",
                                data: schedules[decoded.data]}));
    },
    //indeed also the same as above
    "SAVE_SCHEDULE": function(decoded, ws){
        decoded.data.id = schedules.length;
        schedules.push(decoded.data);
        ws.send(JSON.stringify({type: "SAVE_SCHEDULE",
                                data: decoded.data}));
    },
    "ENTER_GROUP": function(decoded, ws){
        
    },
    "EXIT_GROUP": function(decoded, ws){
        
    },
    "MAKE_GROUP": function(decoded, ws){

    },
    "LIST_EVENTS": function(decoded, ws){
        ws.send(JSON.stringify({type: "LIST_EVENTS",
                                data: events}));
    },
    "LIST_SCHEDULES": function(decoded, ws){
        ws.send(JSON.stringify({type: "LIST_SCHEDULES",
                                data: schedules}));
    },
    "LIST_GROUPS": function(decoded, ws){
        ws.send(JSON.stringify({type: "LIST_GROUPS",
                                data: groups}));
    },
    "ADD_COMMENT": function(decoded, ws){
        
    }
};

wss.on('connection', function(ws){
    console.log('user connected');
    ws.on('message', function(packet){
        var decoded = JSON.parse(packet);
        console.log('Received '+decoded); //debug
        //search for and run the command recieved in our server table
        var fn = serverFunctions[decoded.type];
        console.log('Received '+decoded.type);
        if (fn){
            fn(decoded, ws); //run the function if we find it in our table
        } else {
            console.log('Packet type '+decoded.type+' unknown in '+decoded);
        }
    });
    ws.on('close', function(code, reason){
        ws.connectionClosed = true;
        console.log("User "+ws.IDNumber+" quit");
    });
    ws.IDNumber = globalGroup.users.length;
    globalGroup.users.push(ws); //add the user to the global userlist
});

function safeUsers(group){
    return group.users.map(function(ws){
        return {IDNumber: ws.IDNumber,
                connectionClosed: ws.connectionClosed};
    });
}

//save the schedule and events and groups to file
function saveAllData(){
    console.log(events);
    console.log(schedules);
    console.log(groups);
    var newgroups = groups.map(function(group){
        return new Group(group.events,
                         safeUsers(group),
                         group.id);
    });
    fs.writeFileSync(__dirname+'/server_files/data',
                     JSON.stringify({
                         events1: events,
                         schedules1: schedules,
                         groups1: newgroups}));
    console.log('Saved all data.');
}

function loadAllData(){
    var data = JSON.parse(readFileSync(__dirname+'/server_files/data', 'utf8'));
    events = data.events1;
    schedules = data.schedules1;
    groups = data.groups1; //make this work
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
