require('./game_modules/consoleTimestamp')();



var Turn = require('node-turn');
var turnServer = new Turn({
  // set options
  authMech: 'long-term',
  realm: 'sandboardgames',
  // minPort: 49152,
  // maxPort: 49252,
  externalIps: String(process.env.EXTERNAL_IP),
  debugLevel: "INFO",
  debug: function(dl, message) {
    console.log("TS (" + dl + "): " + message)
  }
});
turnServer.start();

const express = require('express');
const path = require("path");
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const url = require('url');
const fs = require('fs');

let GameRoom = require("./game_modules/game_room").GameRoom;

const availableGames = require("./game_modules/game_list").availableGames;

const app = express();
const httpsPort = process.env.PORT || "8000";
let httpPort = "8080";
if (process.env.NODE_ENV === 'development') {
  httpPort = "8080";
}
else if (process.env.NODE_ENV === 'production') {
  httpPort = "8080";
}

console.log("PORTS: https: " + httpsPort + ", http: " + httpPort);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }))

var privKeyPath = './security/privkey.pem'
var fullchainPath = './security/fullchain.pem'

var certificatesExist = false;
try {
  if (fs.existsSync(privKeyPath) && fs.existsSync(fullchainPath)) {
    certificatesExist = true
  }
} catch(err) {
  console.error(err)
}

if (certificatesExist) {

  const httpsOptions = {
      key: fs.readFileSync('./security/privkey.pem'),
      cert: fs.readFileSync('./security/fullchain.pem')
  }

  var httpsServer = https.createServer(httpsOptions, app);

}
if (process.env.NODE_ENV === 'development') {
  var httpServer = http.createServer(app);
}
else if (process.env.NODE_ENV === 'production') {
  if (certificatesExist) {
    var redirectApp = express ()
    var httpServer = http.createServer(redirectApp);

    redirectApp.use(function requireHTTPS(req, res, next) {
      if (!req.secure) {
        return res.redirect('https://' + req.headers.host + req.url);
      }
      next();
    })
  }
  else
  {
    var httpServer = http.createServer(app);
  }
}

var gameRooms = [];

console.log("process.env.NODE_ENV = " + process.env.NODE_ENV);

if(process.env.NODE_ENV === 'development')
{
  // create a test gameroom on startup, this speeds up development..
  console.log("test gameRoom created at /0/");
  newGameRoom = new GameRoom("test", " ", availableGames, true, turnServer);
  newGameRoom.hash = "0";
  gameRooms.push(newGameRoom);
}


function onUpgrade(request, socket, head)
{
  const pathname = url.parse(request.url).pathname;
  var paths = pathname.split("/");
  const requestedHash = paths[1]
  const wsLocation = paths[2]

  var valid = false;
  for (gameRoom of gameRooms)
  {
    if (gameRoom.processWs(requestedHash, wsLocation, request, socket, head))
    {
      valid = true;
      break;
    }
  }

  if (!valid){
    socket.destroy();
  }
}

if (certificatesExist) {

  httpsServer.on('upgrade', function upgrade(request, socket, head) {
    onUpgrade(request, socket, head);
  });

} else {
  httpServer.on('upgrade', function upgrade(request, socket, head) {
    onUpgrade(request, socket, head);
  });
}

if (process.env.NODE_ENV === 'development' && certificatesExist) {
  httpServer.on('upgrade', function upgrade(request, socket, head) {
    onUpgrade(request, socket, head);
  });
}

app.get("/", (req, res) => {
  res.render("mainpage/pages/index", {gameRooms: gameRooms});
});

app.get("/:hash/:location", (req, res) => {
  var index = gameRooms.map(function(item){ return item.hash;}).indexOf(req.params.hash);
  if (index != -1)
  {
    res.render(availableGames[req.params.location].viewsLocation + "/pages/index", availableGames[req.params.location].objectToPassToView);
  }
  else
  {
    res.status(404).send('Not found');
  }
});

app.get("/browsercheck", (req, res) => {
  res.render('browsercheck/index');
});


app.post("/api/create", (req, res) => {
  var index = gameRooms.map(function(item){ return item.name;}).indexOf(req.body.nameCreate);
  var useWebcams = req.body.hasOwnProperty("useWebcams")
  if (index == -1)
  {
    newGameRoom = new GameRoom(req.body.nameCreate, req.body.passCreate, availableGames, useWebcams, turnServer);
    gameRooms.push(newGameRoom);
    console.log("Created GameRoom '" + req.body.nameCreate + "'");
    res.redirect("/" + newGameRoom.hash + "/lobby");
  }
  else
  {
    //gameroom name already exists
    console.log("GameRoom: '" + req.body.nameCreate + "' already exists.");
    res.redirect("/");
  }
});

app.post("/api/join", (req, res) => {
  var hash = crypto.createHash('md5').update(req.body.nameJoin + req.body.passJoin).digest("hex")

  var index = gameRooms.map(function(item){ return item.hash;}).indexOf(hash);
  if (index != -1)
  {
    res.redirect("/" + hash + "/lobby");
  }
  else
    {
      res.status(404).send('Not found');
    }
});

if (certificatesExist) {
  httpsServer.listen(httpsPort, () => {
    console.log('httpsServer running at ' + httpsPort)
  });
}

httpServer.listen(httpPort, () => {
  console.log('httpServer running at ' + httpPort)
});


if(process.env.NODE_ENV !== 'development')
{
  setInterval(function(){
    for (gameRoom of gameRooms)
    {
      if(!gameRoom.hasActivePlayers())
      {
        gameRoom.close();
        var index = gameRooms.map(function(item){ return item.name;}).indexOf(gameRoom.name);
        gameRooms.splice(index, 1);
        console.log("Removed GameRoom '" + gameRoom.name + "'");
      }
    }
    //console.log(gameRooms)
  }, 10000);
}

module.exports = app;
module.exports.appVariables = {gameRooms: gameRooms}