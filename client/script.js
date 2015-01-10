
$(document).ready(function() {
    $('#addEvent').click(function() {
        console.log('Add event!');
        var newEvent = $('#eventTemplate').clone();
        newEvent.show();
        $('#eventList').prepend(newEvent);
    });
});