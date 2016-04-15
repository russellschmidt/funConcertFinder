var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

/*
 * FunConcertFinder is a way to find out about favorite bands' upcoming tours,
 * when tickets go on sale for events, what shows are happening at preferred venues,
 * and upcoming concerts in specific areas.
 */

/**
 * App ID for the skill
 */
var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var http = require('http'),
    alexaDateUtil = require('./alexaDateUtil');

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var FunConcertFinder = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
FunConcertFinder.prototype = Object.create(AlexaSkill.prototype);
FunConcertFinder.prototype.constructor = FunConcertFinder;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

FunConcertFinder.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

FunConcertFinder.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

FunConcertFinder.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};








/* JSON parsing */
var artist = "LCD Soundsystem";
var city = "Los Angeles";
var state = "CA";
var radius = '25';
var start_date = '2016-01-01';
var end_date = '2016-12-31';

var xmlhttp = new XMLHttpRequest();

// appID is required to be sent with every request to BandsInTown, appended to end of request
var appID = "app_id=FunConcertFinder";



/*
 *  Querying an artist to see if they are on tour or not
 */
var getArtistTourOverview = function(artist) {
  // http://api.bandsintown.com/artists/Skrillex.json?app_id=YOUR_APP_ID
  var artistURL = "http://api.bandsintown.com/artists/" + artist + ".json?" + appID;

  return sendGetRequest(artistURL);
}

/*
 *  Getting a list of upcoming concert dates from an artist
 */
var getArtistSchedule = function(artist) {
  // check to see if band is on tour
  var response = getArtistTourOverview(artist);

  if (response.upcoming_events_count == 0) {
    return artist + " is not touring or announced a tour.";
  } else {
    // http://api.bandsintown.com/artists/Skrillex/events.json?app_id=YOUR_APP_ID
    var artistEventsURL = "http://api.bandsintown.com/artists/" + artist + "/events.json?" + appID;
    response = sendGetRequest(artistEventsURL);
    return response;
  }
}

/*
 *  Search by artist upcoming shows in a specific city, state with a given radius
 *   returns data on band and venue { id:, url:, name:, city:, region:, country,: latitude:, longitude:, ticket_status:, on_sale_datetime:}
 */
var getArtistShowInCity = function(artist, city, state, radius) {
  // check to see if band is on tour
  var response = getArtistTourOverview(artist);

  if (response.upcoming_events_count == 0) {
    return artist + " is not touring or announced a tour.";
  } else {
    // http://api.bandsintown.com/events/search?artists[]=Skrillex&location=Boston,MA&radius=10&format=json&app_id=YOUR_APP_ID
    var artistShowInCityURL =
    "http://api.bandsintown.com/events/search?artists[]=" + artist + "&location=" + city + "," + state + "&radius=" + radius + "&format=json&" + appID;

    response = sendGetRequest(artistShowInCityURL);
    return response;
  }
}

/*
 *  Search by artist upcoming shows -
 *   returns data on venue { id:, url:, name:, city:, region:, country:, longitude:, latitude:, ticket_status:, on_sale_datetime: }
 */
var getArtistUpcomingShows = function(artist) {
  // check to see if band is on tour
  var response = getArtistTourOverview(artist);

  if (response.upcoming_events_count == 0) {
    return artist + " is not touring or announced a tour.";
  } else {
    // http://api.bandsintown.com/events/search?artists[]=Common&artists[]=Dwele&format=xml&app_id=YOUR_APP_ID
    var artistUpcomingShowsURL =
    "http://api.bandsintown.com/events/search?artists[]=" + artist + "&format=json&" + appID;

    response = sendGetRequest(artistUpcomingShowsURL);
    return response;
  }
}

/*
 * Search by artist for upcoming shows within a data range - date needs to be YYYY-MM-DD format
 *  id: 10560908,
    url:, datetime:, ticket_url: , artists: [ [Object] ],
    venue:
     { id:, url: name: city: region: null, country:, latitude:, longitude:, ticket_status:, on_sale_datetime: } ]
 *
 */
var getArtistUpcomingShowsInRange = function(artist, start_date, end_date) {
  // check to see if band is on tour
  var response = getArtistTourOverview(artist);

  if (response.upcoming_events_count == 0) {
    return artist + " is not touring or announced a tour.";
  } else {
    // http://api.bandsintown.com/events/search.json?artists[]=Crystal+Castlesk&date=2012-09-01,2012-12-01&app_id=YOUR_APP_ID
    var artistUpcomingShowsInRangeURL =
      "http://api.bandsintown.com/events/search.json?artists[]=" + artist + "&date=" + start_date + "," + end_date + "&" + appID;

    response = sendGetRequest(artistUpcomingShowsInRangeURL);
    return response;
  }
}

/*
 *   On Sale Soon Events
 *
 */
var getEventsGoingOnSaleInCity = function (city) {
  // http://api.bandsintown.com/events/on_sale_soon.json?location=Boston,MA&app_id=YOUR_APP_ID
  var artistGoingOnSaleInCityURL =
    "http://api.bandsintown.com/events/on_sale_soon.json?location=" + city + "," + state + "&" + appID;

  response = sendGetRequest(artistGoingOnSaleInCityURL);
  return response;
}

var getEventsGoingOnSaleInCityWithRadius = function (city, radius) {
  // http://api.bandsintown.com/events/on_sale_soon.json?location=Boston,MA&app_id=YOUR_APP_ID
  var artistGoingOnSaleInCityURL =
    "http://api.bandsintown.com/events/on_sale_soon.json?location=" + city + "," + state + "&radius=" + radius + "&" + appID;

  response = sendGetRequest(artistGoingOnSaleInCityURL);
  return response;
}

/*
 *  Send request
 */
var sendGetRequest = function (url) {
  var response = {};
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
          response = JSON.parse(xmlhttp.responseText);
      }
    }

  xmlhttp.open("GET", url, false);
  xmlhttp.send();
  return response;
}


// console.log(getArtistTourOverview(artist));
// console.log(getArtistSchedule(artist));
// console.log(getArtistShowInCity(artist, city, state, radius));
// console.log(getArtistUpcomingShows(artist));
// console.log(getArtistUpcomingShowsInRange(artist, start_date, end_date));
// console.log(getEventsGoingOnSaleInCity(city));
// console.log(getEventsGoingOnSaleInCityWithRadius(city, radius));
