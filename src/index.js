var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

/*
 * FunConcertFinder is a way to find out about favorite bands' upcoming tours,
 * when tickets go on sale for events, what shows are happening at preferred venues,
 * and upcoming concerts in specific areas.
 */

/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

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


/**
 * override intentHandlers to map intent handling functions.
 */
FunConcertFinder.prototype.intentHandlers = {

    "SearchByArtistIntent": function (intent, session, response) {
        // Determine if this turn is for city, for date, or an error.
        // We could be passed slots with values, no slots, slots with no value.
        var artistSlot = intent.slots.Artist;
        if (artistSlot && artistSlot.value) {
            handleArtistDialogRequest(intent, session, response);

        } else {
            handleNoArtistSlotDialogRequest(intent, session, response);
        }
    },

    "SearchByVenueIntent": function (intent, session, response) {
        // Determine if this turn is for city, for date, or an error.
        // We could be passed slots with values, no slots, slots with no value.
        var venueSlot = intent.slots.Venue;
        if (venueSlot && venueSlot.value) {
            handleVenueDialogRequest(intent, session, response);

        } else {
            handleNoVenueSlotDialogRequest(intent, session, response);
        }
    },

    "SearchByCityIntent": function (intent, session, response) {
        // Determine if this turn is for city, for date, or an error.
        // We could be passed slots with values, no slots, slots with no value.
        var citySlot = intent.slots.City;
        if (citySlot && citySlot.value) {
            handleCityDialogRequest(intent, session, response);

        } else {
            handleNoCitySlotDialogRequest(intent, session, response);
        }
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

// -------------------------- FunConcertFinder Domain Specific Business Logic --------------------------

function handleWelcomeRequest(response) {
    var speechOutput = {
            speech: "<speak>Welcome to Fun Concert Finder. "
                + "<audio src='https://s3.amazonaws.com/funconcertfinder/99636__tomlija__small-crowd-yelling-yeah.wav'/> "
                + "I provide concert information by artist, venue and city. "
                + "You can start your search for concerts by saying artist, venue or city. "
                + "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech: "You can start your search for concerts by saying artist, venue or city.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.ask(speechOutput, repromptOutput);
}

function handleHelpRequest(response) {
    var repromptText = "Would you like to look up concerts by artists, venue or city?";
    var speechOutput = "I can give you current and upcoming tour information for "
        + "artists, bands and musical groups you are interested in. "
        + "To search by artist name, say Artist. "
        + "You can look up concerts by venue. "
        + "Start your search by venue by saying Venue. "
        + "You can look up concerts by city. "
        + "Start your search by city by saying City. "
        + "Or you can say exit. "
        + repromptText;

    response.ask(speechOutput, repromptText);
}

/*
 * User said an artist name
 */
 function handleArtistDialogRequest(intent, session, response) {

  var artist = getArtistFromIntent(intent, false),
      repromptText,
      speechOutput;

  if (artist.error) {
    repromptText = "Please say the name of the artist again, or name a different artist.";
    speechOutput = artist ? "I am sorry, I do not know about " + artist + ". " + repromptText: repromptText;
    response.ask(speechOutput, repromptText);
  } else {
    getArtistTourResponse(artist, response)
  }
 }

/*
 * Check for empty and invalid artist slot cases
 */
 function getArtistFromIntent(intent, assignDefault) {
   var artistSlot = intent.slots.Artist;

   if (!artistSlot || !artistSlot.value) {
    if (!assignDefault) {
        return {
            error: true
        }
    } else {
        // For sample skill, default to Nine Inch Nails.
        return {
            artist: 'Nine Inch Nails'
        }
    }
  } else {
      // lookup the artist.
      var artistName = artistSlot.value;
      if (artistName) {
          return {
              artist: artistName,
          }
      } else {
          return {
              error: true,
              artist: artistName
          }
      }
    }
  }

/*
 * Issue request for artist info and respond to user with the answer
 */
function getArtistTourResponse(artist, response) {
  // make the API request and respond to the user
  getArtistSchedule(artist, function getArtistScheduleCallback(err, data) {
    var speechOutput = '';

    if (err) {
      speechOutput = "Sorry, we are having trouble connecting to our data source. Please try again later.";
    } else if (data == "no tour") {
      speechOutput = artist + " has not announced upcoming dates yet.";
    } else {
      speechOutput = artist + " has the following concerts.";
      for (var key in data) {
        speechOutput  += alexaDateUtil.getFormattedDate(data[key].datetime);
                      + " at " + data[key].venue.name
                      + " in " + data[key].venue.city;
        if (data[key].on_sale_datetime == null && data[key].ticket_status == 'available') {
          speechOutput += "Sale date has not been announced.";
        } else if (data[key].on_sale_datetime != null && data[key].ticket_status == 'available') {
          speechOutput += "Tickets are available for sale. Sale date is "+ alexaDateUtil.getFormattedDate(data[key].on_sale_datetime) + ".";
        } else if (data[key].on_sale_datetime != null && data[key].ticket_status == 'unavailable') {
          speechOutput += "This event is sold out.";
        } else {
          speechOutput += "On sale dates have not been announced yet.";
        }
      }
    }
    response.tellWithCard(speechOutput, "FunConcertFinder", speechOutput);

  });
}

/*
 * Alexa did not receive a complete response
 */
function handleNoArtistSlotDialogRequest(intent, session, response) {
    if (session.attributes.city) {
        // get date re-prompt
        var repromptText = "Please try saying artist and then their name, such as, artist, The Rolling Stones. ";
        var speechOutput = repromptText;

        response.ask(speechOutput, repromptText);
    }
}

function handleNoVenueSlotDialogRequest(intent, session, response) {
    if (session.attributes.city) {
        // get date re-prompt
        var repromptText = "Please try saying venue and the venue name, such as, venue, Grand Old Opry. ";
        var speechOutput = repromptText;

        response.ask(speechOutput, repromptText);
    }
}

function handleNoCitySlotDialogRequest(intent, session, response) {
    if (session.attributes.city) {
        // get date re-prompt
        var repromptText = "Please try saying city and the city name again, such as, city, Seattle. ";
        var speechOutput = repromptText;

        response.ask(speechOutput, repromptText);
    }
}

/*
 * format yyyymmdd into something useable
 */
function formatDateForSpeech(date) {
  var spokenDate = '';

  var year = date.substr(0,4);
  var month = date.substr(4,2);
  var day = date.substr(6,2);

  day = DAYS_OF_MONTH[date.getDate() - 1]

  return spokenDate;
}

/* test variables */
var artist = "Radiohead";
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
var getArtistSchedule = function(artist, artistScheduleCallback) {
  // check to see if band is on tour
  var response = getArtistTourOverview(artist);

  if (response.upcoming_events_count == 0) {
    return "no tour";
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
    return "no tour";
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
    return "no tour";
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
 *  id:, url:, datetime:, ticket_url: , artists: [ [Object] ],
    venue:
     { id:, url: name: city: region: null, country:, latitude:, longitude:, ticket_status:, on_sale_datetime: } ]
 *
 */
var getArtistUpcomingShowsInRange = function(artist, start_date, end_date) {
  // check to see if band is on tour
  var response = getArtistTourOverview(artist);

  if (response.upcoming_events_count == 0) {
    return "no tour";
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
 console.log(getArtistSchedule(artist));
// console.log(getArtistShowInCity(artist, city, state, radius));
// console.log(getArtistUpcomingShows(artist));
// console.log(getArtistUpcomingShowsInRange(artist, start_date, end_date));
// console.log(getEventsGoingOnSaleInCity(city));
// console.log(getEventsGoingOnSaleInCityWithRadius(city, radius));

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var funConcertFinder = new FunConcertFinder();
    funConcertFinder.execute(event, context);
};
