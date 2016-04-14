var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

/* JSON parsing */
var artist = "LCD Soundsystem";

var xmlhttp = new XMLHttpRequest();
// appID is required to be sent with every request to BandsInTown, appended to end of request
var appID = "?app_id=FunConcertFinder";

// http://api.bandsintown.com/artists/Skrillex.json?app_id=YOUR_APP_ID
var artistURL =
  "http://api.bandsintown.com/artists/" + artist + ".json" + appID;

// http://api.bandsintown.com/artists/Skrillex/events.json?app_id=YOUR_APP_ID
var artistEventsURL =
  "http://api.bandsintown.com/artists/" + artist + "/events.json" + appID;

var sendRequest = function (url) {
  var response = {};
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
          response = JSON.parse(xmlhttp.responseText);
      }
    }

  xmlhttp.open("GET", url, false);
  xmlhttp.send();
  console.log(response);
}

// Send artist request
sendRequest(artistURL);

sendRequest(artistEventsURL);
