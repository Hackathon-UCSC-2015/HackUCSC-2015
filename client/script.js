var socket = new WebSocket('ws://127.0.0.1:8080/');

socket.onopen = function() {
    var packet;
    packet.type = "EVENT_LIST";
    socket.send(JSON.stringify(packet));
}

socket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    
}

$(document).ready(function() {
    $('#addEvent').click(function() {
        console.log('Add event!');
        var newEvent = $('#eventTemplate').clone();
        newEvent.show();
        newEvent.click(function() {
            $('.event').removeClass('selected');
            newEvent.toggleClass('selected');
        });
        $('#eventList').prepend(newEvent);
    });
});