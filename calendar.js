module.exports = {
getGoogleCalendarData: getGoogleCalendarData


};
var gcal = require('google-calendar');

function getGoogleCalendarData(accessToken)
{
	var googleCalendar = new gcal.GoogleCalendar(accessToken); //The google calendar for a user's access token
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
							calLength = eventList.items.length;

							for(var j = 0; j < calLength; j++)
							{
								currentEvent = eventList.items[j];
								var calEvent;

								if(currentEvent.start == null)
								{
									calEvent ={name: currentEvent.summary, 
												location: currentEvent.location,
												description: currentEvent.description,

												timeZone: undefined,
												start: undefined,
												end: undefined
									};
								}
								else
								{
									calEvent ={name: currentEvent.summary, 
												location: currentEvent.location,
												description: currentEvent.description,

												timeZone: currentEvent.start.timeZone,
												start: currentEvent.start.dateTime,
												end: currentEvent.end.dateTime
								};
								}
								
								
								
								console.log(calEvent);
							}
							
							
						});
				}
			}


		});

	//console.log(customEvents);
	//return customEvents;

	//return {name: 'test', startTime: 8, endTime: 11};
}

function getICalData()
{

}
