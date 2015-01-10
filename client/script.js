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
    return undefined;
}

function eventDataByID(id) {
    var i = eventDataIndexByID(id);
    if(i === undefined)
        return undefined;
    return events[i];
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
    $('.timePicker').prop('readonly', true);
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
        $('.timePicker').prop('readonly', false);
    }
}

function newEventSidebarFromData(newEventData) {
    var newEvent = $('#eventTemplate').clone();
    newEvent.show();
    newEvent.attr("codeID", newEventData.id);
    newEvent.click(function() {
        $('.event').removeClass('selected');
        newEvent.addClass('selected');
        currentlyViewing = newEvent.attr("codeID");
        displayEvent(newEvent.attr('codeID'));

    });
    newEvent.children('.eventImagePreview').css('background-image','url(images/'+newEventData.imageName+')');
    newEvent.children('.statusImage').click(function(){deleteEvent($(this).parent().attr("codeID"));stopEditing();});
    newEvent.children('.eventTitle').html(newEventData.name);
    newEvent.children('.eventMiniDescription').html(newEventData.miniDescription);
    if(!newEventData.editing)
        newEvent.children('.statusImage').hide();
    
    $('#eventList').prepend(newEvent);
}

$(document).ready(function() {
    $('#addEvent').click(function() {
        var newEventData = {};
        newEventData.id = "c"+idCounter++;
        newEventData.name = "Event Title";
        newEventData.miniDescription = "Mini Description";
        newEventData.description = "Enter a long description here";
		newEventData.imageName = "sampleImages/sampleEvent"+Math.floor(Math.random()*15)+".jpg";
        newEventData.groupID = 0;
        newEventData.editing = true;
        newEventData.startTime = new Date();
        newEventData.endTime = new Date();
        events.push(newEventData);
		
        newEventSidebarFromData(newEventData);
    });
    
    $('#saveButton').click(function() {
        save(currentlyViewing);
    });
    
    $('#loginButton').click(function() {
        window.location.replace("/auth/google/");
    });
    
    $('#startTime').timepicker({change: function(time) {
        var data = eventDataByID(currentlyViewing);
        if(data.editing) {
            $('#endTime').timepicker({minTime: time});
            var data = eventDataByID(currentlyViewing);
            data.startTime.setHours(time.getHours());
            data.startTime.setMinutes(time.getMinutes());
        } else {
            $('#startTime').val($(this).timepicker().format(data.startTime));
        }
    }});
    
    $('#endTime').timepicker({change: function(time) {
        var data = eventDataByID(currentlyViewing);
        if(data.editing) {
            data.endTime.setHours(time.getHours());
            data.endTime.setMinutes(time.getMinutes());
        } else {
            $('#endTime').val($(this).timepicker().format(data.endTime));
        }
    }});
});