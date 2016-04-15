var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

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
    url: 'http://www.bandsintown.com/event/10560908?app_id=FunConcertFinder',
    datetime: '2016-09-04T09:00:00',
    ticket_url: 'http://www.bandsintown.com/event/10560908/buy_tickets?app_id=FunConcertFinder&came_from=233',
    artists: [ [Object] ],
    venue:
     { id: 1054482,
       url: 'http://www.bandsintown.com/venue/1054482',
       name: 'Stradbally Hall',
       city: 'Co. Laois',
       region: null,
       country: 'Ireland',
       latitude: 53.0112008,
       longitude: -7.1692148 },
    ticket_status: 'available',
    on_sale_datetime: null } ]
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
console.log(getArtistUpcomingShowsInRange(artist, start_date, end_date));