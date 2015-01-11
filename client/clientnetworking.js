var socket = new WebSocket('ws://127.0.0.1:8080/');

var serverFunctions = { //functions for various commands
    //gets an event of a specified id from eventList and sends it as a jsonified
    //string to the user who requested it
    "LOAD_EVENT": function(decoded){
        //JSON.stringify turns a date object to a string, and then JSON.parse parses it as a string again
        //so we have to remake the date objects
        var data = eventDataByID(decoded.id);
        if(data === undefined) {
            decoded.startTime = new Date(decoded.startTime);
            decoded.endTime = new Date(decoded.endTime);
            events.push(decoded);
            newEventSidebarFromData(decoded);
        } else {
            data = decoded;
            syncSideBarWithData(data.id);
        }
    },
    //gets an event from a client and assigns it an id, saves it in eventList
    //and sends the whole event back to the client
    "SAVE_EVENT": function(decoded){
        var eventData = eventDataByID(currentlyViewing);
        eventData.id = decoded.id;
        var eventSidebar = eventSidebarElementByID(currentlyViewing);
        eventSidebar.attr('codeID', decoded.id);
        eventData.editing = false;
        displayEvent(eventData.id);
    },
    "GOOGLE_ID_LOGIN": function(decoded) {
        console.log(decoded);
        me = decoded.profile;
        login();
    },
    //the same as above except for schedules
    "LOAD_SCHEDULE": function(decoded){
    },
    //indeed also the same as above
    "SAVE_SCHEDULE": function(decoded){
    },
    "ENTER_GROUP": function(decoded){
        
    },
    "EXIT_GROUP": function(decoded){
        
    },
    "LIST_EVENTS": function(decoded){
        
    },
    "LIST_SCHEDULES": function(decoded){
        
    },
    "LIST_GROUPS": function(decoded){

    },
    "ADD_COMMENT": function(decoded){
        
    }
};

socket.onopen = function() {
    var packet = {};
    packet.type = "LIST_EVENTS";
    socket.send(JSON.stringify(packet));
    console.log("Sent LIST_EVENTS");
    
    var googleid = getUrlParameter("userid");
    if(googleid != undefined) {
        var packet = {};
        packet.type = "GOOGLE_ID_LOGIN";
        packet.data = googleid;
        socket.send(JSON.stringify(packet));
    }
}

socket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    var fn = serverFunctions[data.type];
    console.log('Received '+data.type);
    if (fn){
        fn(data.data); //run the function if we find it in our table
    } else {
        console.log('Packet type '+data.type+' unknown in '+data);
    }
}

function save(id) {
    var packet = {};
    packet.type = "SAVE_EVENT";
    packet.data = eventDataByID(id);
    packet.data.editing = false;
    displayEvent(packet.data.id);
    socket.send(JSON.stringify(packet));
}
