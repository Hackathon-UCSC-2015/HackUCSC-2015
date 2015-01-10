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

var cal = require('./calendar.js');
var data = cal.getCalData();
console.log(data.name +'\n'+data.startTime +'\n'+data.endTime);

//really nasty stuff follows
var eventIDNumber = 0;
var eventList = [];
var scheduleIDNumber = 0;
var scheduleList = [];
var groupIDNumber = 0;
var groupList = [];

var serverFunctions = { //functions for various commands
    //gets an event of a specified id from eventList and sends it as a jsonified
    //string to the user who requested it
    "LOAD_EVENT": function(decoded, ws){
        ws.send(JSON.stringify({type: "LOAD_EVENT", 
                                data: eventList[decoded.data]}));
    },
    //gets an event from a client and assigns it an id, saves it in eventList
    //and sends the whole event back to the client
    "SAVE_EVENT": function(decoded, ws){
        decoded.data.id = eventIDNumber++;
        eventList.push(decoded.data);
        ws.send(JSON.stringify({type: "SAVE_EVENT",
                                data: decoded.data}));
    },
    //the same as above except for schedules
    "LOAD_SCHEDULE": function(decoded, ws){
        ws.send(JSON.stringify({type: "LOAD_SCHEDULE",
                                data: scheduleList[decoded.data]}));
    },
    //indeed also the same as above
    "SAVE_SCHEDULE": function(decoded, ws){
        decoded.data.id = scheduleIDNumber++;
        scheduleList.push(decoded.data);
        ws.send(JSON.stringify({type: "SAVE_SCHEDULE",
                                data: decoded.data}));
    },
    "ENTER_GROUP": function(decoded, ws){
        
    },
    "EXIT_GROUP": function(decoded, ws){
        
    },
    "LIST_EVENTS": function(decoded, ws){
        
    },
    "ADD_COMMENT": function(decoded, ws){
        
    }
};

wss.on('connection', function(ws){
    console.log('user connected');
    ws.on('message', function(packet){
        var decoded = JSON.parse(packet);
        //console.log('Received '+decoded); //debug
        //search for and run the command recieved in our server table
        var fn = serverFunctions[decoded.type];
        console.log('Received '+decoded.type);
        if (fn){
            fn(decoded, ws); //run the function if we find it in our table
        } else {
            console.log('Packet type '+decoded.type+' unknown in '+decoded);
        }
    });
    //every six minutes save all events and schedules
    //setInterval(saveAllData, 6*60*1000);
});

//save the schedule and events and groups to file
function saveAllData(){
    fs.writeFileSync('./server_files/data', JSON.stringify({
        events: eventList, eventID: eventIDNumber,
        schedules: scheduleList, scheduleID: scheduleIDNumber,
        groups: groupList, groupID: groupIDNumber}));
    console.log('Saved all data.');
}

function loadAllData(){
    var data = JSON.parse(readFileSync('./server_files/data', 'utf8'));
    eventList = data.events;
    eventIDNumber = data.eventID;
    schedulesList = data.schedules;
    scheduleIDNumber = data.scheduleID;
    groupList = data.groups;
    groupIDNumber = data.groupID;
}

function pushOnlyOne(array, value){
    if (array.indexOf(value) === -1){
        array.push(value);
    }
}
