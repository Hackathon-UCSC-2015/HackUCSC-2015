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
//small change

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
		$('#map').hide();
        return;
    }
    var data = eventDataByID(eventID);
    currentlyViewing = eventID;
    $('#welcomeMessage').hide();
    $('#eventImage').show();
    $('#timeSelect').show();
	$('#map').show();
    $('#eventDetails > h2').html(data.name);
    $('#miniDescription').html(data.miniDescription);
    $('#description').html(data.description);
	$('#location').val(data.location)
    $('#eventDetails > #eventImage').html('<img id="eventImageImage" src="'+data.imageName+'" />');
	$('#saveButton').hide();
    $('#editButton').hide();
    $('#startDate').val(data.startTime.toDateString());
    $('#endDate').val(data.endTime.toDateString());
    $('#startTime').val(data.startTime.getHours()+":"+data.startTime.getMinutes());
    $('#endTime').val(data.endTime.getHours()+":"+data.endTime.getMinutes());
	updateMap(data.location);
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
            newUser.find('span').html("Unamed User");
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
    $('#usernameBox > #profileName').html(me._json.name);
    $('#addEvent').show();
}

function updateMap(place){
	if(place===undefined || place==""){
		place = "UCSC";
	}
	$('#map').attr('src','https://www.google.com/maps/embed/v1/place?q='+place+'&key=AIzaSyAxfOFUkT_m9TKfSjoxQmuB_QI1ZCaXnQw');
}

var debounce = false;
var mouseOver = false;

$(document).ready(function() {
    $('#addEvent').hide();
    $('#addEvent').click(function() {
        var newEventData = {};
        newEventData.id = "c"+idCounter++;
        newEventData.name = "Enter an event name.";
        newEventData.miniDescription = "Enter a short description.";
        newEventData.description = "Enter a long description here";
		newEventData.imageName = "images/sampleImages/sampleEvent"+Math.floor(Math.random()*18)+".jpg";
        newEventData.groupID = 0;
        newEventData.editing = true;
        newEventData.startTime = new Date();
        newEventData.endTime = new Date();
		newEventData.attending = new Array();
		newEventData.notAttending = new Array();
		newEventData.location = "";
        events.push(newEventData);
		
        newEventSidebarFromData(newEventData);
    });
    
    $('#saveButton').click(function() {
        var startDate = getDate('#startDate');
        var endDate = getDate('#endDate');
        var data = eventDataByID(currentlyViewing);
        var startTime = parseTime($('#startTime').val());
        if(!isNaN(startTime)) {
            data.startTime.setHours(startTime.getHours());
            data.startTime.setMinutes(startTime.getMinutes());
        }
        data.startTime.setFullYear(startDate.getFullYear());
        data.startTime.setMonth(startDate.getMonth());
        data.startTime.setDate(startDate.getDate());
        var endTime = parseTime($('#endTime').val());
        console.log(endTime);
        if(!isNaN(endTime)){   
            data.endTime.setHours(endTime.getHours());
            data.endTime.setMinutes(endTime.getMinutes());
        }
        data.endTime.setFullYear(startDate.getFullYear());
        data.endTime.setMonth(startDate.getMonth());
        data.endTime.setDate(startDate.getDate());
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
	$('#map').hide()
	$('#location').focusout(function(){
		console.log("Try to update map.");
		eventDataByID(currentlyViewing).location = $('#location').val();
		updateMap($('#location').val());
	});
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
    
    $('#usernameBox').hide().hover(function(){
		$(this).animate({right:"60px"},100);
		$(this).children("#logout").animate({right:"10px"},100);	
		debounce = true;
		mouseOver = true;
		setTimeout("debounce = false",500);
	},function(){
		mouseOver = false;
		sleepOne();
	});
	$('#logout').click(function(){
		window.location.replace("/index.html");	
	});
    
    displayEvent(undefined);
});

function sleepOne(){
	if(debounce){
		setTimeout("sleepTwo()",100);
	}else if(!mouseOver){
		closeLogout();	
	}
}

function sleepTwo(){
	sleepOne();
}

function closeLogout(){
	$("#usernameBox").animate({right:"0px"},100);
	$("#logout").animate({right:"-50px"},100);
}

function getDate(date) {
    var ret = $(date).datepick('getDate')[0];
    if(ret === undefined) {
        ret = new Date($(date).val());
        if(ret === undefined)
            ret = new Date();
    }
    return ret;
}

function parseTime(timeStr) {
    
    var dt = new Date();
 
    var time = timeStr.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
    if (!time) {
        return NaN;
    }
    var hours = parseInt(time[1], 10);
    if (hours == 12 && !time[3]) {
        hours = 0;
    }
    else {
        hours += (hours < 12 && time[3]) ? 12 : 0;
    }
 
    dt.setHours(hours);
    dt.setMinutes(parseInt(time[2], 10) || 0);
    dt.setSeconds(0, 0);
    return dt;
}