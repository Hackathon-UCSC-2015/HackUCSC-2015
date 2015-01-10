module.exports = {
getCalData: getCalData


};

var gstrat = require('passport-google-oauth').OAuth2Strategy;
var passport = require('passport');

var gcal = require('google-calendar');

//var googleCal = new gcal.GoogleCalendar(accessToken);

function getCalData()
{
	return {name: 'test', startTime: 8, endTime: 11};
}

var cal =
{
	name: "test",
	startTime: 10,
	endTime: 11
};