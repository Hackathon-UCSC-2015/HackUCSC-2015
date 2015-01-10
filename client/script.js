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

function replaceEvent(event) {
    var i = eventDataIndexByID(id)
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
    data.miniDescription = $('#miniDescription').html();
    if(data.miniDescription.length<100) {
        eventSidebarElementByID(data.id).children('.eventMiniDescription').html(data.miniDescription);
    }
}

function stopEditing() {
    eventSidebarElementByID(currentlyViewing).children('.statusImage').hide();
    $('#eventDetails > h2').prop('contentEditable', false);
    $('#eventDetails > h2').get(0).removeEventListener('input', headerCallback);
    $('#miniDescription').prop('contentEditable', false);
    $('#miniDescription').get(0).removeEventListener('input', miniDescriptionCallback);
    $('#description').prop('contentEditable', false);
    $('.timePicker').prop('readonly', true);
    eventDataByID(currentlyViewing).editing = false;
	$('#saveButton').hide(100);
    $('.timePicker').prop('readonly', true);
    $('#startDate').datepick('destroy');
    $('#endDate').datepick('destroy');
	$('#attendance').show();
}

function eventSidebarElementByID(id) {
    return $('#eventList').children('div[codeID="'+id+'"]');
}

function displayEvent(eventID) {
    var data = eventDataByID(eventID);
    $('#eventDetails > h2').html(data.name);
    $('#miniDescription').html(data.miniDescription);
    $('#description').html(data.description);
    $('#eventDetails > #eventImage').html('<img id="eventImageImage" src="images/'+data.imageName+'" />');
	$('#saveButton').hide();
    $('#startDate').val(data.startTime.toDateString());
    $('#endDate').val(data.endTime.toDateString());
    if(data.editing) {
        $('#eventDetails > h2').html(data.name).prop('contentEditable', true);
        $('#eventDetails > h2').get(0).addEventListener('input', headerCallback);
        $('#miniDescription').html(data.miniDescription).prop('contentEditable', true);
        $('#miniDescription').get(0).addEventListener('input', miniDescriptionCallback);
        $('#description').html(data.description).prop('contentEditable', true);
		$('#saveButton').show();
        $('.timePicker').prop('readonly', false);
        $('#startDate').datepick();
        $('#endDate').datepick();
		$('#attendance').hide();
    }else{
		$('#attendance').show();
	}
}

function clearContentFrame(){
    $('#eventDetails > h2').html('');
    $('#miniDescription').html('');
    $('#description').html('');
    $('#eventDetails > #eventImage').html('');
	$('#saveButton').hide();
}

function deletePendingEvent(eventID) {
	deleteEvent(eventID);
	clearContentFrame();
	stopEditing();
}

function syncSideBarWithData(eventID) {
    var newEventData = eventDataByID(eventID);
    var newEvent = eventSidebarElementByID(eventID);
    newEvent.children('.eventImagePreview').css('background-image','url(images/'+newEventData.imageName+')');
    newEvent.children('.statusImage').click(function(){deletePendingEvent($(this).parent().attr("codeID"));});
    newEvent.children('.eventTitle').html(newEventData.name);
    newEvent.children('.eventMiniDescription').html(newEventData.miniDescription);
	if(newEventData.attending==0){
		newEvent.children('.attendStatusImage').hide();
	}else{
		if(newEventData.attending==1){
			newEvent.children('.attendStatusImage').attr('src','images/confirmDown.png');	
		}else if(newEventData.attending==2){
			newEvent.children('.attendStatusImage').attr('src','images/denyDown.png');					
		}
		newEvent.children('.attendStatusImage').show();
	}
    if(!newEventData.editing)
        newEvent.children('.statusImage').hide();
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
    
    $('#eventList').prepend(newEvent);
    syncSideBarWithData(newEventData.id);
}

function denyEvent(){
	eventDataByID(currentlyViewing).attendance = 2;
    syncSideBarWithData(currentlyViewing);
	save(currentlyViewing);
}

function confirmEvent(){
	eventDataByID(currentlyViewing).attendance = 1;
    syncSideBarWithData(currentlyViewing);
	save(currentlyViewing);
}

$(document).ready(function() {
    $('#addEvent').click(function() {
        var newEventData = {};
        newEventData.id = "c"+idCounter++;
        newEventData.name = getName();
        newEventData.miniDescription = getContent();
        newEventData.description = "Enter a long description here";
		newEventData.imageName = "sampleImages/sampleEvent"+Math.floor(Math.random()*18)+".jpg";
        newEventData.groupID = 0;
        newEventData.editing = true;
        newEventData.startTime = new Date();
        newEventData.endTime = new Date();
		newEventData.attending = 0;
        events.push(newEventData);
		
        newEventSidebarFromData(newEventData);
    });
    
    $('#saveButton').click(function() {
        var startDate = getDate('#startDate');
        var endDate = getDate('#endDate');
        var data = eventDataByID(currentlyViewing);
        data.startTime.setFullYear(startDate.getFullYear());
        data.startTime.setMonth(startDate.getMonth());
        data.startTime.setDate(startDate.getDay());
        data.endTime.setFullYear(startDate.getFullYear());
        data.endTime.setMonth(startDate.getMonth());
        data.endTime.setDate(startDate.getDay());
        data.description = $('#description').html();
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
	}).click(confirmEvent);
	$('#confirmText').hide();
	
	$('#denyButton').hover(function() {
		$('#denyText').show(200);
	},function(){
		$('#denyText').hide(200);	
	}).click(denyEvent);
	$('#denyText').hide();
	$('#attendance').hide();
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

function getDate(date) {
    var ret = $(date).datepick('getDate')[0];
    if(ret === undefined) {
        ret = new Date($(date).val());
        if(ret === undefined)
            ret = new Date();
    }
    return ret;
}