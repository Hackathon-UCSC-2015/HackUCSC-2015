function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
} 

var events = [];
var currentlyViewing = "";
var editing = false;
var idCounter = 0;
var me = undefined;

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
    if(eventDataIndexByID(eventID) === undefined) {
        return;
    }
    events.splice(eventDataIndexByID(eventID), 1);
    eventSidebarElementByID(eventID).remove();
    displayEvent(undefined);
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

/*function stopEditing() {
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
    //$('#startDate').datepick('destroy');
    //$('#endDate').datepick('destroy');
	//displayEvent(currentlyViewing);
}*/

function eventSidebarElementByID(id) {
    return $('#eventList').children('div[codeID="'+id+'"]');
}

function displayEvent(eventID) {
    if(eventID === undefined) {
        $('#eventDetails > h2').prop('contentEditable', false);
        $('#eventDetails > h2').get(0).removeEventListener('input', headerCallback);
        $('#miniDescription').prop('contentEditable', false);
        $('#miniDescription').get(0).removeEventListener('input', miniDescriptionCallback);
        $('#description').prop('contentEditable', false);
        $('#eventDetails > h2').html("");
        $('#miniDescription').html("");
        $('#description').html("");
        $('#saveButton').hide();
        $('#editButton').hide();
        $('.timePicker').prop('readonly', true).val("");
        $('#eventImage').hide();
        $('#welcomeMessage').show();
        $('#timeSelect').hide();
	    $('#attendance').hide();
        return;
    }
    var data = eventDataByID(eventID);
    currentlyViewing = eventID;
    $('#welcomeMessage').hide();
    $('#eventImage').show();
    $('#timeSelect').show();
    $('#eventDetails > h2').html(data.name);
    $('#miniDescription').html(data.miniDescription);
    $('#description').html(data.description);
    $('#eventDetails > #eventImage').html('<img id="eventImageImage" src="'+data.imageName+'" />');
	$('#saveButton').hide();
    $('#editButton').hide();
    $('#startDate').val(data.startTime.toDateString());
    $('#endDate').val(data.endTime.toDateString());
	if(data.attending.length==1){
		$('#numberAttend').html("1 person attending");
	}else{
		$('#numberAttend').html(data.attending.length+" people attending");
	}
    $('#attendingUsers > .user').remove();
    serverFunctions["GOOGLE_ID_LOOKUP"] = function(googleUser) {
        var profile = googleUser.profile._json;
        var newUser = $('#attendingTemplate').clone().show();
        newUser.children('a').attr('href', profile.link);
        newUser.find('img').attr('src', profile.picture);
        if(profile.name === undefined || profile.name == "") {
            newUser.find('span').html("Unknown User");
        } else {
            newUser.find('span').html(profile.name);
        }
        $('#attendingUsers').append(newUser);
    }
    console.log(data.attending);
    for(var i=0; i<data.attending.length; i++) {
        console.log("Looking up: "+data.attending[i]);
        socket.send(JSON.stringify({type: "GOOGLE_ID_LOOKUP",
                                    data: data.attending[i]}));
    }
    
    if(data.editing) {
        $('#eventDetails > h2').html(data.name).prop('contentEditable', true);
        $('#eventDetails > h2').get(0).addEventListener('input', headerCallback);
        $('#miniDescription').html(data.miniDescription).prop('contentEditable', true);
        $('#miniDescription').get(0).addEventListener('input', miniDescriptionCallback);
        $('#description').html(data.description).prop('contentEditable', true);
		$('#saveButton').show();
        $('#timeSelect > input').prop('readonly', false);
        $('#startDate').datepick({dateFormat: "D M dd yyyy"});
        $('#endDate').datepick({dateFormat: "D M dd yyyy"});
		$('#attendance').hide();
		$('#attendingUsersWrapper').hide();
		$('#editButton').hide();
    }else{
        $('#eventDetails > h2').html(data.name).prop('contentEditable', false);
        $('#eventDetails > h2').get(0).removeEventListener('input', headerCallback);
        $('#miniDescription').html(data.miniDescription).prop('contentEditable', false);
        $('#miniDescription').get(0).removeEventListener('input', miniDescriptionCallback);
        $('#description').html(data.description).prop('contentEditable', false);
        $('#startDate').datepick('destroy');
        $('#timeSelect > input').prop('readonly', true);
        $('#endDate').datepick('destroy');
		$('#attendance').show();
		$('#attendingUsersWrapper').show();
        $('#editButton').show();
	}
	syncSideBarWithData(eventID);
}

function syncSideBarWithData(eventID) {
    var newEventData = eventDataByID(eventID);
    var newEvent = eventSidebarElementByID(eventID);
    newEvent.children('.eventImagePreview').css('background-image','url('+newEventData.imageName+')');
    newEvent.children('.statusImage').click(function(){
        deleteEvent($(this).parent().attr("codeID"));
    });
    newEvent.children('.eventTitle').html(newEventData.name);
    newEvent.children('.eventMiniDescription').html(newEventData.miniDescription);
	newEvent.children('.littlePerson').html(newEventData.attending.length);
	if(me){
		if(newEventData.notAttending.indexOf(me.id)>-1){
			newEvent.children('.attendStatusImage').attr('src','images/denyDown.png');	
			newEvent.children('.attendStatusImage').show();
		}else if(newEventData.attending.indexOf(me.id)>-1){
			newEvent.children('.attendStatusImage').attr('src','images/confirmDown.png');	
			newEvent.children('.attendStatusImage').show();				
		}else{
			newEvent.children('.attendStatusImage').hide();
		}
	}else{
		newEvent.children('.attendStatusImage').hide();
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
	attend(currentlyViewing, 2, 0);
}

function confirmEvent(){
    console.log("confirmEvent");
    attend(currentlyViewing, 1, 0);
}

function login() {
    $('#loginButton').hide();
    $('#usernameBox').show();
    $('#usernameBox > img').attr('src', me._json.picture);
    $('#usernameBox > span').html(me._json.name);
    $('#addEvent').show();
}

$(document).ready(function() {
    $('#addEvent').hide();
    $('#addEvent').click(function() {
        var newEventData = {};
        newEventData.id = "c"+idCounter++;
        newEventData.name = "Enter and event name.";
        newEventData.miniDescription = "Enter a short description.";
        newEventData.description = "Enter a long description here";
		newEventData.imageName = "images/sampleImages/sampleEvent"+Math.floor(Math.random()*18)+".jpg";
        newEventData.groupID = 0;
        newEventData.editing = true;
        newEventData.startTime = new Date();
        newEventData.endTime = new Date();
		newEventData.attending = new Array();
		newEventData.notAttending = new Array();
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
	$('#editButton').click(function(){	
		eventDataByID(currentlyViewing).editing = true;
		displayEvent(currentlyViewing);
	});
    
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
	$('#attendingUsersWrapper').hide();
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
    
    $('#usernameBox').hide();
    
    displayEvent(undefined);
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