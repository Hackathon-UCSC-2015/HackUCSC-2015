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
    eventDataByID(currentlyViewing).editing = false;
	$('#saveButton').hide(100);
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
    $('#eventDetails > #eventImage').html('<img src="images/'+data.imageName+'" />');
	$('#saveButton').hide();
    if(data.editing) {
        $('#eventDetails > h2').html(data.name).prop('contentEditable', true);
        $('#eventDetails > h2').get(0).addEventListener('input', headerCallback);
        $('#eventDetails > span').html(data.miniDescription).prop('contentEditable', true);
        $('#eventDetails > span').get(0).addEventListener('input', miniDescriptionCallback);
        $('#description').html(data.description).prop('contentEditable', true);
		$('#saveButton').show();
    }
}

function clearContentFrame(){
    $('#eventDetails > h2').html('');
    $('#eventDetails > span').html('');
    $('#description').html('');
    $('#eventDetails > #eventImage').html('');
	$('#saveButton').hide();
}

function deletePendingEvent(eventID) {
	deleteEvent(eventID);
	clearContentFrame();
	stopEditing();
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
    newEvent.children('.statusImage').click(function(){deletePendingEvent($(this).parent().attr("codeID"));});
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
        events.push(newEventData);
		
        newEventSidebarFromData(newEventData);
    });
    
    $('#saveButton').click(function() {
        save(currentlyViewing);
    });
	
	$('#saveButton').hide();
    
    $('#loginButton').click(function() {
        window.location.replace("/auth/google/");
    });
	
	$('#confirmButton').hover(function() {
		$('#confirmText').show(200);
	},function(){
		$('#confirmText').hide(200);	
	});
	$('#confirmText').hide();
	
	$('#denyButton').hover(function() {
		$('#denyText').show(200);
	},function(){
		$('#denyText').hide(200);	
	});
	$('#denyText').hide();
});