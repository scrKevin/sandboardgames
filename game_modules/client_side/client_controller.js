let WsHandler = require("./ws_handler").WsHandler;
let WebcamHandler = require("./webcam_handler").WebcamHandler;
let MouseHandler = require("./mouse_handler").MouseHandler;
let EventEmitter = require('events').EventEmitter;


function ClientController()
{
  this.init = false;
  EventEmitter.call(this);
  this.wsHandler = null
  this.webcamHandler = null;
}

ClientController.prototype = Object.create(EventEmitter.prototype);

ClientController.prototype.initialize = function(ws, myStream)
{
  this.wsHandler = new WsHandler(ws);
  this.wsHandler.eventEmitter.on("playerId", (playerId) => {
    this.emit("playerId", playerId);
  });
  this.wsHandler.eventEmitter.on("updateGame", (gameObj, changedCardsBuffer, init) => {
    this.emit("updateGame", gameObj, changedCardsBuffer, init);
  });
  this.wsHandler.eventEmitter.on("newPeer", (playerId) => {
    this.webcamHandler.initWebcamPeer(playerId);
    this.emit("newPeer", playerId);
  });
  this.wsHandler.eventEmitter.on("leftPeer", (playerId) => {
    this.webcamHandler.leftPeer(playerId);
    this.emit("leftPeer", playerId);
  });
  this.wsHandler.eventEmitter.on("peerConnect", (fromPlayerId, stp) => {
    this.webcamHandler.peerConnected(fromPlayerId, stp);
  });
  this.wsHandler.eventEmitter.on("peerAccepted", (fromPlayerId, stp) => {
    this.webcamHandler.peerAccepted(fromPlayerId, stp);
  });
  this.wsHandler.eventEmitter.on("wsClosed", () => {
    this.wsHandler.eventEmitter.removeAllListeners();
    if (this.webcamHandler)
    {
      for (peer in this.webcamHandler.peers)
      {
        this.webcamHandler.peers[peer].destroy();
      }
    }
    this.webcamHandler.removeAllListeners();
    this.emit("wsClosed");
  });

  this.mouseHandler = new MouseHandler(this.wsHandler);
  
  this.webcamHandler = new WebcamHandler(this.wsHandler, myStream);
  this.webcamHandler.on("stream", (playerId, stream) => {
    this.emit("stream", playerId, stream);
  });

  this.init = true;
}

ClientController.prototype.mouseMove = function(x, y)
{
  this.init && this.mouseHandler.mouseMove(x, y);
}

ClientController.prototype.mouseUp = function()
{
  this.init && this.mouseHandler.mouseUp();
}

ClientController.prototype.clickOnCard = function(id)
{
  this.init && this.mouseHandler.clickOnCard(id);
}

ClientController.prototype.touchCard = function(id, x, y)
{
  this.init && this.mouseHandler.touchCard(id, x, y);
}

ClientController.prototype.releaseCard = function(x, y)
{
  this.init && this.mouseHandler.releaseCard(x, y);
}

ClientController.prototype.shuffleDeck = function(deckId, xStackMinimum)
{
  this.init && this.wsHandler.shuffleDeck(deckId, xStackMinimum);
}

ClientController.prototype.selectColor = function(color)
{
  this.init && this.wsHandler.selectColor(color);
}

ClientController.prototype.resetGame = function()
{
  this.init && this.wsHandler.resetGame();
}

ClientController.prototype.typeName = function(name)
{
  this.init && this.wsHandler.typeName(name);
}


module.exports = {ClientController: ClientController}