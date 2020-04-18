require('./game_modules/consoleTimestamp')();

const express = require('express');
const path = require("path");
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const url = require('url');
const fs = require('fs');

let GameRoom = require("./game_modules/game_room").GameRoom;

const StartpositionsSH = require("./game_modules/sh/startpositions")
const StartpositionsSY = require("./game_modules/sy/startpositions")
const StartpositionsRMK = require("./game_modules/rmk/startpositions")
const StartpositionsCTD = require("./game_modules/ctd/startpositions")

let SY_Game = require("./game_modules/sy/sy_game").SY_Game;
let SH_Game = require("./game_modules/sh/sh_game").SH_Game;
let Lobby_Game = require("./game_modules/lobby/lobby_game").Lobby_Game;
let CAH_Game = require("./game_modules/cah/cah_game").CAH_Game;
let RMK_Game = require("./game_modules/rmk/rmk_game").RMK_Game;
let CTD_Game = require("./game_modules/ctd/ctd_game").CTD_Game;

function ImplementedGame(name, wsLocation, GameClass, routerLocation, viewsLocation, objectToPassToView)
{
  this.name = name;
  this.wsLocation = wsLocation;
  this.GameClass = GameClass;
  this.routerLocation = routerLocation;
  this.viewsLocation = viewsLocation;
  this.objectToPassToView = objectToPassToView;
}

const availableGames = {
  'lobby': new ImplementedGame('Lobby', 'lobby', Lobby_Game, "lobby", 'lobby', {fixedPlayers: 0}),
  'sy': new ImplementedGame('Scotland Yard', 'sy', SY_Game, "sy", 'sy', {webcamPos: StartpositionsSY.webcamPos, fixedPlayers: 6}),
  'sh': new ImplementedGame('Secret Hitler', 'sh', SH_Game, "sh", 'sh', {playerboxStartPos: StartpositionsSH.playerBoxes, webcamPos: StartpositionsSH.webcamPos, fixedPlayers: 10}),
  'cah': new ImplementedGame('Cards against Humanity', 'cah', CAH_Game.class, 'cah', 'cah', {nBlackCards: CAH_Game.nBlackCards, nWhiteCards: CAH_Game.nWhiteCards, fixedPlayers: 0}),
  'rmk': new ImplementedGame("Rummikub", 'rmk', RMK_Game, 'rmk', 'rmk', {playerboxStartPos: StartpositionsRMK.playerBoxes, webcamPos: StartpositionsRMK.webcamPos, fixedPlayers: 4}),
  'ctd': new ImplementedGame("Citadels", 'ctd', CTD_Game, 'ctd', 'ctd', {playerboxStartPos: StartpositionsCTD.playerBoxes, webcamPos: StartpositionsCTD.webcamPos, fixedPlayers: 7})
}


const app = express();
const httpsPort = process.env.PORT || "8000";
const httpPort = "8080";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }))

const httpsOptions = {
    key: require('fs').readFileSync('./security/privkey.pem'),
    cert: require('fs').readFileSync('./security/fullchain.pem')
}

var httpsServer = https.createServer(httpsOptions, app);
var httpServer = http.createServer(app);

var gameRooms = [];

console.log("process.env.NODE_ENV = " + process.env.NODE_ENV);

if(process.env.NODE_ENV === 'development')
{
  // create a test gameroom on startup, this speeds up development..
  console.log("test gameRoom created at /0/");
  newGameRoom = new GameRoom("test", " ", availableGames);
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

httpsServer.on('upgrade', function upgrade(request, socket, head) {
  onUpgrade(request, socket, head);
});

httpServer.on('upgrade', function upgrade(request, socket, head) {
  onUpgrade(request, socket, head);
});

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
  if (index == -1)
  {
    newGameRoom = new GameRoom(req.body.nameCreate, req.body.passCreate, availableGames);
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


httpsServer.listen(httpsPort, () => {
  console.log('httpsServer running at ' + httpsPort)
});

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