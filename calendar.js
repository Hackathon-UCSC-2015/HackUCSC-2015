module.exports = {
getGoogleCalendarData: getGoogleCalendarData


};
var gcal = require('google-calendar');
var ser = require('./server');

function parseTime(time)
{
	var res = time.split(/[.T\/ -\/ :]/);

	return new Date(res[0], res[1]-1, res[2], res[3], res[4], res[5], 0, 0);

}

function withinDate(calendarEvent, current)
{
	if(calendarEvent.start < current && current > calendarEvent.end)
	{
		return true;
	}
	else
	{
		return false;
	}
}

function getValidEvents(calendar, events)
{
	var calendarLength = calendar.length;
	var eventsLength = events.length;
	var validEvents = [];

	for(int i = 0; i < events.length; i++)
	{
		var validEvent = {id: events[i].id, valid: true, start: new Date(events[i].startDate), end: new Date(events[i].endDate)};
		validEvents.push(validEvent);
	}

	for(int i =0; i < calendarLength; i++)
	{
		for(int j = 0; j < eventsLength; j++)
		{
			if(validEvents[i].valid)
			{
				if(withinDate(calendar[i], validEvents[i].start) || withinDate(calendar[i].end) || (calendar[i].start > validEvents[i].start && calendar[i].end < validEvents[i].end))
				{
					validEvents[i].valid = false;
				}
			}
		}
	}

	return validEvents;
}

function getGoogleCalendarData(accessToken, userid)
{
	var googleCalendar = new gcal.GoogleCalendar(accessToken); //The google calendar for a user's access token
	var user = ser.getUserByGoogleID(userid);
	//console.log('\n\n\nthis is the user login ======================================================')
	//console.log(user);
	//console.log('end user login \n\n')
	//var customEvents =[];

	googleCalendar.calendarList.list(
		function(err, calendarList)
		{
			if(!err)
			{
				for(var i = 0; i < calendarList.items.length; i++) //Loops through all a users calendars
				{
					var calid = calendarList.items[i].id;

					googleCalendar.events.list(calid,
						function(err, eventList)
						{
							if(!err)
							{				
								calLength = eventList.items.length;
								var formattedData=[];

								for(var j = 0; j < calLength; j++)
								{
									currentEvent = eventList.items[j];
									var calEvent;

									if(currentEvent.start)
									{
										if(currentEvent.start.dateTime != undefined)
										{
											calEvent ={name: currentEvent.summary, 
														location: currentEvent.location,
														description: currentEvent.description,

														//timeZone: currentEvent.start.timeZone,
														start: parseTime(currentEvent.start.dateTime),
														end: parseTime(currentEvent.end.dateTime)
											};
											formattedData.push(calEvent);
										}	
									}
									
									
								}
								//console.log(formattedData);
								if(formattedData != null && formattedData.length != 0)
								{
									console.log('====================== attempting to save data to user ============================');
								//	console.log(user);
									//user.gcdata = formattedData;
									if(user.gcdata == null)
									{

									//	console.log('was null')
										user.gcdata = formattedData;
									}
									else
									{
									//	console.log('not null')
										user.gcdata.push(formattedData);
									}
								//	console.log('after save:')
								//	console.log(user);
									
								}
								//console.log(user); 
							}
							else
							{
								console.log('Error retrieving Google Calendar data: '+err);

								//Add something to alert user/server
							}
							
						});
				}
			}
			else
			{
				console.log('Error retrieving Google Calendar data: '+err);

				//Add something to alert user/server
			}


		});
}

function getICalData()
{

}
