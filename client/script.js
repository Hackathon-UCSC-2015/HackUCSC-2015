var socket = new WebSocket('ws://127.0.0.1:8080/');

socket.onopen = function() {
    var packet;
    packet.type = "EVENT_LIST";
    socket.send(JSON.stringify(packet));
}

socket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    
}

function loadEvent(event) {
    $('#eventDetails > h2').html(event.children('.eventTitle').html());
}

$(document).ready(function() {
    $('#addEvent').click(function() {
        console.log('Add event!');
        var newEvent = $('#eventTemplate').clone();
        newEvent.show();
        newEvent.click(function() {
            $('.event').removeClass('selected');
            newEvent.addClass('selected');
            loadEvent(newEvent);
        });
        $('#eventList').prepend(newEvent);
    });
});