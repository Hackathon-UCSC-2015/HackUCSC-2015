var events = [];
var currentlyViewing = "";
var editing = false;
var idCounter = 0;

function eventDataIndexByID(id) {
    for (var i = 0; i < events.length; i++) {
        if(events[i].id === id) {
            return i;
        }
    }
}

function eventDataByID(id) {
    return events[eventDataIndexByID(id)];
}

function deleteEvent(eventID) {
    events.splice(eventDataIndexByID(eventID), 1);
    eventSidebarElementByID(eventID).remove();
}

var headerCallback = function() {
    var data = eventDataByID(currentlyViewing);
    data.name = $('#eventDetails > h2').html();
    eventSidebarElementByID(data.id).children('.eventTitle').html(data.name);
}

function stopEditing() {
    eventSidebarElementByID(currentlyViewing).children('.statusImage').hide();
    $('#eventDetails > h2').prop('contentEditable', false);
    $('#eventDetails > h2').get(0).removeEventListener('input', headerCallback);
    $('#eventDetails > span').prop('contentEditable', false);
    $('#description').prop('contentEditable', false);
    editing = false;
}

function eventSidebarElementByID(id) {
    return $('#eventList').children('div[codeID="'+id+'"]');
}

function displayEvent(eventID) {
    var data = eventDataByID(eventID);
    $('#eventDetails > h2').html(data.name);
    $('#eventDetails > span').html(data.miniDescription);
    $('#description').html(data.description);
    $('#eventDetails > img').attr('src','images/'+data.imageName);
}

function prepareNewEvent(event) {
    editing = true;
    var data = eventDataByID(event.attr('codeID'));
    currentlyViewing = data.id;
    if(editing) {
        $('#eventDetails > h2').html(data.name).prop('contentEditable', true);
        $('#eventDetails > h2').get(0).addEventListener('input', headerCallback);
        $('#eventDetails > span').html(data.miniDescription).prop('contentEditable', true);
        $('#eventDetails > span').get(0).addEventListener('input', function() {
            data.miniDescription = $('#eventDetails > span').html();
            eventSidebarElementByID(data.id).children('.eventMiniDescription').html(data.miniDescription);
        });
        $('#description').html(data.description).prop('contentEditable', true);
        $('#eventDetails > img').attr('src','images/'+data.imageName);
    }
}

$(document).ready(function() {
    $('#addEvent').click(function() {
        var newEvent = $('#eventTemplate').clone();
        newEvent.show();
        var newEventData = {};
        newEventData.id = "c"+idCounter++;
        newEvent.attr("codeID", newEventData.id);
        newEvent.click(function() {
            if(editing && currentlyViewing != "" && newEvent.attr('codeID') != currentlyViewing) {
                deleteEvent(currentlyViewing);
                stopEditing();
            }
            if (newEvent.attr('codeID') != currentlyViewing) {
                $('.event').removeClass('selected');
                newEvent.addClass('selected');
                currentlyViewing = newEvent.attr("codeID");
                console.log(newEvent.attr('codeID'));
                prepareNewEvent(newEvent);
            }
        });
        newEventData.name = newEvent.children('.eventTitle').html();
        newEventData.miniDescription = newEvent.children('.eventMiniDescription').html();
        newEventData.description = "Enter a long description here";
		newEventData.imageName = "sampleEvent"+Math.floor(Math.random()*9)+".jpg";
        newEventData.groupID = 0;
		newEvent.children('.eventImagePreview').css('background-image','url(images/'+newEventData.imageName+')');
        events.push(newEventData);
		
        $('#eventList').prepend(newEvent);
    });
    
    $('#saveButton').click(function() {
        save(currentlyViewing);
    });
    
    $('#loginButton').click(function() {
        window.location.replace("/auth/google/");
    });
});