let WsHandler = require("./ws_handler").WsHandler;
let WebcamHandler = require("./webcam_handler").WebcamHandler;
let MouseHandler = require("./mouse_handler").MouseHandler;
let CanvasHandler = require("./canvas_handler").CanvasHandler;

let EventEmitter = require('events').EventEmitter;

function ClientController()
{
  this.init = false;
  EventEmitter.call(this);
  this.wsHandler = null
  this.webcamHandler = null;
  this.canvasHandler = new CanvasHandler();
}

ClientController.prototype = Object.create(EventEmitter.prototype);

ClientController.prototype.initialize = function(ws, myStream)
{
  this.wsHandler = new WsHandler(ws);
  this.wsHandler.eventEmitter.on("playerId", (playerId) => {
    this.emit("playerId", playerId);
  });
  this.wsHandler.eventEmitter.on("cardConflict", (cardId) => {
    this.emit("cardConflict", cardId);
  });
  this.wsHandler.eventEmitter.on("updateGame", (gameObj, changedCardsBuffer, newDrawCoords, init) => {
    this.emit("updateGame", gameObj, changedCardsBuffer, newDrawCoords, init);
  });
  this.wsHandler.eventEmitter.on("turnCredentials", (turnCredentials) => {
    this.webcamHandler.turnCredentials(turnCredentials);
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
    this.canvasHandler.wsHandler = null;
    this.emit("wsClosed");
  });
  this.wsHandler.eventEmitter.on("devToolsState", (playerId, opened) => {
    this.emit("devToolsState", playerId, opened);
  });
  this.wsHandler.eventEmitter.on("latency", (latency, playerId) => {
    this.init && this.mouseHandler.adjustLatency(latency);
    this.init && this.canvasHandler.adjustLatency(latency);
    this.emit("latency", latency, playerId);
  });

  this.mouseHandler = new MouseHandler(this.wsHandler);
  
  this.webcamHandler = new WebcamHandler(this.wsHandler, myStream);
  this.webcamHandler.on("stream", (playerId, stream) => {
    this.emit("stream", playerId, stream);
  });

  this.canvasHandler.initWsHandler(this.wsHandler)

  this.init = true;
}

ClientController.prototype.mouseMove = function(x, y, cardX, cardY)
{
  this.init && this.mouseHandler.mouseMove(x, y, cardX, cardY);
}

ClientController.prototype.mouseUp = function()
{
  this.init && this.mouseHandler.mouseUp();
}

ClientController.prototype.clickOnCard = function(id, cardX, cardY)
{
  this.init && this.mouseHandler.clickOnCard(id, cardX, cardY);
}

ClientController.prototype.touchCard = function(id, x, y)
{
  this.init && this.mouseHandler.touchCard(id, x, y);
}

ClientController.prototype.touchTouchbox = function(x, y)
{
  this.init && this.mouseHandler.touchTouchbox(x, y);
}

ClientController.prototype.releaseCard = function(x, y, cardX, cardY)
{
  this.init && this.mouseHandler.releaseCard(x, y, cardX, cardY);
}

ClientController.prototype.shuffleDeck = function(deckId, xStackMinimum)
{
  this.init && this.wsHandler.shuffleDeck(deckId, xStackMinimum);
}

ClientController.prototype.rollDeck = function(deckId)
{
  this.init && this.wsHandler.rollDeck(deckId);
}

ClientController.prototype.selectColor = function(color)
{
  this.init && this.wsHandler.selectColor(color);
}

ClientController.prototype.resetGame = function()
{
  this.init && this.wsHandler.resetGame();
}

ClientController.prototype.takeSnapshot = function()
{
  this.init && this.wsHandler.takeSnapshot();
}

ClientController.prototype.recoverSnapshot = function()
{
  this.init && this.wsHandler.recoverSnapshot();
}

ClientController.prototype.typeName = function(name)
{
  this.init && this.wsHandler.typeName(name);
}

ClientController.prototype.typeVarText = function(text)
{
  this.init && this.wsHandler.typeVarText(text);
}

ClientController.prototype.editScorebox = function(id, add)
{
  this.init && this.wsHandler.editScorebox(id, add);
}

ClientController.prototype.devToolsState = function(opened)
{
  this.init && this.wsHandler.devToolsState(opened);
}


module.exports = {ClientController: ClientController}