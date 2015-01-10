var socket = new WebSocket('ws://127.0.0.1:8080/');

socket.onopen = function() {
    var packet = {};
    packet.type = "LIST_EVENTS";
    socket.send(JSON.stringify(packet));
}

socket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    
}
