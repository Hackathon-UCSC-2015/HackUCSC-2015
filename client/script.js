var events = [];
var currentlyViewing = "";
var editing = false;
var idCounter = 0;

function eventDataIndexByID(id) {
    for (var i = 0; i < events.length; i++) {
        if(events[i].id == id) {
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
    if(data.name.length<100) {
        eventSidebarElementByID(data.id).children('.eventTitle').html(data.name);
    }
}

var miniDescriptionCallback = function() {
    var data = eventDataByID(currentlyViewing);
    data.miniDescription = $('#eventDetails > span').html();
    if(data.miniDescription.length<100) {
        eventSidebarElementByID(data.id).children('.eventMiniDescription').html(data.miniDescription);
    }
}

function stopEditing() {
    eventSidebarElementByID(currentlyViewing).children('.statusImage').hide();
    $('#eventDetails > h2').prop('contentEditable', false);
    $('#eventDetails > h2').get(0).removeEventListener('input', headerCallback);
    $('#eventDetails > span').prop('contentEditable', false);
    $('#eventDetails > span').get(0).removeEventListener('input', miniDescriptionCallback);
    $('#description').prop('contentEditable', false);
    eventDataByID(currentlyViewing).editing = false;
}

function eventSidebarElementByID(id) {
    return $('#eventList').children('div[codeID="'+id+'"]');
}

function displayEvent(eventID) {
    var data = eventDataByID(eventID);
    console.log(eventID);
    $('#eventDetails > h2').html(data.name);
    $('#eventDetails > span').html(data.miniDescription);
    $('#description').html(data.description);
    $('#eventDetails > img').attr('src','images/'+data.imageName);
    if(data.editing) {
        $('#eventDetails > h2').html(data.name).prop('contentEditable', true);
        $('#eventDetails > h2').get(0).addEventListener('input', headerCallback);
        $('#eventDetails > span').html(data.miniDescription).prop('contentEditable', true);
        $('#eventDetails > span').get(0).addEventListener('input', miniDescriptionCallback);
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
            $('.event').removeClass('selected');
            newEvent.addClass('selected');
            currentlyViewing = newEvent.attr("codeID");
            displayEvent(newEvent.attr('codeID'));

        });
        newEventData.name = newEvent.children('.eventTitle').html();
        newEventData.miniDescription = newEvent.children('.eventMiniDescription').html();
        newEventData.description = "Enter a long description here";
		newEventData.imageName = "sampleImages/sampleEvent"+Math.floor(Math.random()*15)+".jpg";
        newEventData.groupID = 0;
        newEventData.editing = true;
		newEvent.children('.eventImagePreview').css('background-image','url(images/'+newEventData.imageName+')');
		newEvent.children('.statusImage').click(function(){deleteEvent($(this).parent().attr("codeID"));stopEditing();});
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