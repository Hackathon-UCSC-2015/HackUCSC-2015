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

var serverFunctions = { //functions for various commands
    "LOAD_EVENT": function(decoded){
        
    },
    "SAVE_EVENT": function(decoded){
        
    },
    "LOAD_SCHEDULE": function(decoded){
        
    },
    "SAVE_SCHEDULE": function(decoded){
        
    },
    "ENTER_GROUP": function(decoded){
        
    },
    "EXIT_GROUP": function(decoded){
        
    },
    "LIST_EVENTS": function(decoded){
        
    },
    "ADD_COMMENT": function(decoded){
        
    }
};

wss.on('connection', function(ws){
    console.log('user connected');
    ws.on('message', function(packet){
        var decoded = JSON.parse(packet);
        console.log("Received "+decoded); //debug
        //search for and run the command recieved in our server table
        var fn = serverFunctions[decoded.type];
        if (fn){
            fn(decoded); //run the function if we find it in our table
        } else {
            console.log("Packet type "+decoded.type+" unknown in "+decoded);
        }
    });
});
