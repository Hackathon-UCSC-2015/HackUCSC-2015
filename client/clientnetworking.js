var socket = new WebSocket('ws://127.0.0.1:8080/');

var serverFunctions = { //functions for various commands
    //gets an event of a specified id from eventList and sends it as a jsonified
    //string to the user who requested it
    "LOAD_EVENT": function(decoded){
        
    },
    //gets an event from a client and assigns it an id, saves it in eventList
    //and sends the whole event back to the client
    "SAVE_EVENT": function(decoded){
        var eventData = eventDataByID(currentlyEditing);
        eventData.id = decoded.id;
        var eventSidebar = eventSidebarElementByID(currentlyEditing);
        eventSidebar.id = decoded.id;
        stopEditing();
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
}

socket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    var fn = serverFunctions[data.type];
    console.log('Received '+data.type);
    if (fn){
        fn(decoded); //run the function if we find it in our table
    } else {
        console.log('Packet type '+data.type+' unknown in '+data);
    }
}

function save(id) {
    var packet = {};
    packet.type = "SAVE_EVENT";
    packet.data = eventDataByID(id);
    socket.send(packet);
}
