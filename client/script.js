var events = [];

function eventDataByID(id) {
    for (var i = 0; i < events.length; i++) {
        if(events[i].id === id) {
            return events[i];
        }
    }
}

function eventSidebarElementByID(id) {
    return $('#eventList').children('div[codeID="'+id+'"]');
}

function prepareNewEvent(event) {
    var data = eventDataByID(event.attr('codeID'));
    $('#eventDetails > h2').html(data.title).prop('contentEditable', true);
    $('#eventDetails > h2').get(0).addEventListener('input', function() {
        data.title = $('#eventDetails > h2').html();
        eventSidebarElementByID(data.id).children('.eventTitle').html(data.title);
    });
    $('#eventDetails > span').html(data.miniDescription).prop('contentEditable', true);
    $('#description').html(data.description).prop('contentEditable', true);
	$('#eventDetails > img').attr('src','images/'+data.imageName);
}

$(document).ready(function() {
    $('#addEvent').click(function() {
        console.log('Add event!');
        var newEvent = $('#eventTemplate').clone();
        newEvent.show();
        newEvent.click(function() {
            $('.event').removeClass('selected');
            newEvent.addClass('selected');
            prepareNewEvent(newEvent);
        });
        var newEventData = {};
        newEventData.id = "c"+events.length;
        newEvent.attr("codeID", newEventData.id);
        newEventData.title = newEvent.children('.eventTitle').html();
        newEventData.miniDescription = newEvent.children('.eventMiniDescription').html();
        newEventData.description = "Enter a long description here";
		newEventData.imageName = "sampleEvent"+Math.floor(Math.random()*4)+".jpg"
		console.log(newEventData.imageName);
		newEvent.children('.eventImagePreview').css('background-image','url(images/'+newEventData.imageName+')');
        events.push(newEventData);
		
        $('#eventList').prepend(newEvent);
    });
});