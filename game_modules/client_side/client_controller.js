let WsHandler = require("./ws_handler").WsHandler;
let WebcamHandler = require("./webcam_handler").WebcamHandler;
let MouseHandler = require("./mouse_handler").MouseHandler;
let CanvasHandler = require("./canvas_handler").CanvasHandler;

let EventEmitter = require('events').EventEmitter;

function ClientController(useWebcams)
{
  this.init = false;
  EventEmitter.call(this);
  this.wsHandler = null
  this.webcamHandler = null;
  this.canvasHandler = new CanvasHandler();
  this.useWebcams = useWebcams;
}

ClientController.prototype = Object.create(EventEmitter.prototype);

ClientController.prototype.initialize = function(ws)//, myStream)
{
  this.wsHandler = new WsHandler(ws);
  this.wsHandler.eventEmitter.on("playerId", (playerId) => {
    this.emit("playerId", playerId);
    this.webcamHandler.setPlayerId(playerId);
  });
  this.wsHandler.eventEmitter.on("cardConflict", (cardId, replacementCardId) => {
    if (replacementCardId !== -1)
    {
      this.mouseHandler.dragCardId = replacementCardId;
    }
    this.emit("cardConflict", cardId, replacementCardId);
  });
  this.wsHandler.eventEmitter.on("updateGame", (gameObj, changedCardsBuffer, newDrawCoords, init) => {
    this.emit("updateGame", gameObj, changedCardsBuffer, newDrawCoords, init);
  });
  this.wsHandler.eventEmitter.on("turnCredentials", (turnCredentials) => {
    this.webcamHandler.turnCredentials(turnCredentials);
  });
  this.wsHandler.eventEmitter.on("newPeer", (playerId, wasReset, peerType) => {
    if (this.useWebcams) {
      this.webcamHandler.initWebcamPeer(playerId, peerType);
    }
    this.emit("newPeer", playerId, wasReset, peerType);
  });
  this.wsHandler.eventEmitter.on("leftPeer", (playerId, peerType) => {
    if (this.useWebcams) {
      this.webcamHandler.leftPeer(playerId, peerType);
    }
    this.emit("leftPeer", playerId, peerType);
  });
  this.wsHandler.eventEmitter.on("relayLeft", (playerId, relayFor) => {
    this.webcamHandler.relayLeft(playerId, relayFor);
    //this.emit("relayLeft", playerId, relayFor);
  });
  this.wsHandler.eventEmitter.on("peerConnect", (fromPlayerId, stp, peerType, relayFor) => {
    this.webcamHandler.peerConnected(fromPlayerId, stp, peerType, relayFor);
  });
  this.wsHandler.eventEmitter.on("peerAccepted", (fromPlayerId, stp, peerType, relayFor) => {
    this.webcamHandler.peerAccepted(fromPlayerId, stp, peerType, relayFor);
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
  this.wsHandler.eventEmitter.on("pause", () => {
    this.emit("pause");
  });
  this.wsHandler.eventEmitter.on("resume", () => {
    this.emit("resume");
  });
  this.wsHandler.eventEmitter.on("latency", (latency, playerId) => {
    this.init && this.mouseHandler.adjustLatency(latency);
    this.init && this.canvasHandler.adjustLatency(latency);
    this.emit("latency", latency, playerId);
  });
  this.wsHandler.eventEmitter.on("hostRelay", (peerId1, peerId2) => {
    this.webcamHandler.hostRelay(peerId1, peerId2);
  });

  this.mouseHandler = new MouseHandler(this.wsHandler);
  
  this.webcamHandler = new WebcamHandler(this.wsHandler)//, myStream);
  this.webcamHandler.on("stream", (playerId, stream, peerType, optionalRelayFor) => {
    this.emit("stream", playerId, stream, peerType, optionalRelayFor);
  });
  this.webcamHandler.on("peerClosed", (playerId, peerType, optionalRelayFor) => {
    this.emit("peerClosed", playerId, peerType, optionalRelayFor);
  });

  this.webcamHandler.on("connectionFailure", (playerId, peerType, errorCode) => {
    this.emit("peerConnectionFailure", playerId, peerType, errorCode);
  });

  this.canvasHandler.initWsHandler(this.wsHandler)

  this.init = true;
}

ClientController.prototype.addCaptureStream = function(newCaptureStream){
  this.init && this.webcamHandler.addCaptureStream(newCaptureStream);
}

ClientController.prototype.removeCaptureStream = function(){
  this.webcamHandler.removeCaptureStream();
}

ClientController.prototype.addWatchPartyStream = function(newCaptureStream){
  this.init && this.webcamHandler.addWatchPartyStream(newCaptureStream);
}

ClientController.prototype.removeWatchPartyStream = function(){
  this.webcamHandler.removeWatchPartyStream();
}

ClientController.prototype.stopRadio = function(playerId)
{
  this.init && this.webcamHandler.stopRadio(playerId);
}

ClientController.prototype.stopWatchParty = function(playerId)
{
  this.init && this.webcamHandler.stopWatchParty(playerId);
}

ClientController.prototype.mouseMove = function(x, y, cardX, cardY)
{
  this.init && this.mouseHandler.mouseMove(x, y, cardX, cardY);
}

ClientController.prototype.mouseUp = function()
{
  this.init && this.mouseHandler.mouseUp();
}

ClientController.prototype.clickOnCard = function(id, cardX, cardY, dragCardDeltaX, dragCardDeltaY)
{
  this.init && this.mouseHandler.clickOnCard(id, cardX, cardY, dragCardDeltaX, dragCardDeltaY);
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

ClientController.prototype.resetWebcam = function()
{
  if(this.init) {
    this.webcamHandler.resetWebcam();
    this.wsHandler.resetWebcam();
  } 
}

ClientController.prototype.setWebcamStream = function(stream) {
  this.init && this.webcamHandler.setWebcamStream(stream)
}

ClientController.prototype.takeSnapshot = function()
{
  this.init && this.wsHandler.takeSnapshot();
}

ClientController.prototype.recoverSnapshot = function()
{
  this.init && this.wsHandler.recoverSnapshot();
}

// ClientController.prototype.pause = function()
// {
//   this.init && this.wsHandler.pause();
// }

// ClientController.prototype.resume = function()
// {
//   this.init && this.wsHandler.resume();
// }


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

ClientController.prototype.resetScorebox = function(id)
{
  this.init && this.wsHandler.resetScorebox(id);
}

ClientController.prototype.devToolsState = function(opened)
{
  this.init && this.wsHandler.devToolsState(opened);
}

ClientController.prototype.reportPatched = function()
{
  this.init && this.wsHandler.reportPatched();
}

ClientController.prototype.reportInitiated = function()
{
  this.init && this.wsHandler.reportInitiated();
}

ClientController.prototype.reportPlaying = function(playerId)
{
  this.init && this.wsHandler.reportPlaying(playerId);
}

ClientController.prototype.requestRadioFromPlayer = function(playerNumber)
{
  this.init && this.wsHandler.requestRadioFromPlayer(playerNumber);
}

ClientController.prototype.requestWatchPartyFromPlayer = function(playerNumber)
{
  this.init && this.wsHandler.requestWatchPartyFromPlayer(playerNumber);
}

ClientController.prototype.sendCustomMessage = function(json)
{
  this.init && this.wsHandler.sendCustomMessage(json);
}

module.exports = {ClientController: ClientController}