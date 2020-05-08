const WebSocket = require('ws');
let FpsLimiter = require('./fps_limiter').FpsLimiter;
let diff_match_patch = require('diff-match-patch')
var pako = require('pako');

function Client(playerId, ws)
{
  this.gameObj = null;
  this.lastSentGameObj = ""
  this.changedCardsBuffer = [];
  this.newDrawCoordinates = {};
  this.broadcastLimiter = new FpsLimiter(5);
  this.broadcastLimiter.on("update", () => {
    this.broadcast();
  });
  this.dmp = new diff_match_patch();
  this.peerStatus = {};
  this.playerId = playerId;
  this.ws = ws;
  this.isAlive = true;
  this.ws.on("pong", () => {
    this.isAlive = true;
    this.latency = Math.round((new Date() - this.pingSentTimestamp) / 2);
    this.broadcastLimiter.setFps(1000 / (this.latency + 1))
    //console.log("player " + playerId + " latency = " + this.latency + " ms")
    this.sendLatency();
  });
  const interval = setInterval(() => {
    if (this.isAlive === false) return this.ws.terminate();

    this.isAlive = false;
    this.pingSentTimestamp = new Date();
    this.ws.ping(noop);
  }, 16000);
  this.pingSentTimestamp = new Date();
  this.ws.ping(noop);
  this.ws.on("close", function(){
    clearInterval(interval);
  });
}

Client.prototype.setGameObj = function(gameObj)
{
  this.lastSentGameObj = JSON.stringify(gameObj);
  var sendData = {
    type: "playerId",
    playerId: this.playerId,
    gameObj: this.lastSentGameObj
  };
  var strToSend = JSON.stringify(sendData);
  var binaryString = pako.deflate(strToSend, { to: 'string' });
  if (this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(binaryString);
  }
  this.gameObj = gameObj;
}

Client.prototype.updateBroadcast = function()
{
  this.broadcastLimiter.update();
}

Client.prototype.broadcast = function()
{
  if(this.gameObj != null)
  {
    var currentGameObj = JSON.stringify(this.gameObj)
    var diffs = this.dmp.diff_main(this.lastSentGameObj, currentGameObj);
    this.dmp.diff_cleanupEfficiency(diffs);
    var patches = this.dmp.patch_make(this.lastSentGameObj, diffs);
    this.lastSentGameObj = currentGameObj;
    var patchToSend = this.dmp.patch_toText(patches);
    var sendData = {
      type: "patches",
      changedCards: this.changedCardsBuffer,
      newDrawCoords: this.newDrawCoordinates,
      patches: patchToSend
    }
    var strToSend = JSON.stringify(sendData);
    this.changedCardsBuffer = [];
    for(playerId in this.newDrawCoordinates)
    {
      this.newDrawCoordinates[playerId] = [];
    }
  
    var binaryString = pako.deflate(strToSend, { to: 'string' });
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(binaryString);
    }
  }
}

Client.prototype.sendLatency = function()
{
  var sendData = {
    type: "latency",
    latency: this.latency
  }
  var strToSend = JSON.stringify(sendData);

  var binaryString = pako.deflate(strToSend, { to: 'string' });
  if (this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(binaryString);
  }
}

Client.prototype.addToChangedCardsBuffer = function(newItem)
{
  if (this.changedCardsBuffer.indexOf(newItem) === -1)
  {
    this.changedCardsBuffer.push(newItem);
  }
}

Client.prototype.addDrawCoordinates = function(playerId, newCoords)
{
  if (!(playerId in this.newDrawCoordinates))
  {
    this.newDrawCoordinates[playerId] = [];
  }
  for (coord of newCoords)
  {
    this.newDrawCoordinates[playerId].push(coord);
  }
}

function noop() {}

module.exports = {Client: Client}