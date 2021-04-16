const WebSocket = require('ws');
let FpsLimiter = require('./fps_limiter').FpsLimiter;
let diff_match_patch = require('diff-match-patch')
var pako = require('pako');

function Client(playerId, ws)
{
  this.initiated = false;
  this.useZip = false;
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
  this.newPeerTimeouts = {};
  this.newPeerState = "idle";
  this.newPeerQueue = [];
  this.playerId = playerId;
  this.ws = ws;
  this.isAlive = true;
  this.latencyTestCounter = 6001;
  this.latencyTestCouterIncrement = 200;
  this.latencyTestTimeStamp = new Date();
  this.ws.on("pong", () => {
    this.isAlive = true;
    //this.latency = Math.round((new Date() - this.pingSentTimestamp) / 2);
    //this.broadcastLimiter.setMs(this.latency * 1.5)
    //console.log("player " + playerId + " latency = " + this.latency + " ms")
    //this.sendLatency();
  });
  const interval = setInterval(() => {
    if (this.isAlive === false) return this.ws.terminate();

    this.isAlive = false;
    //this.pingSentTimestamp = new Date();
    this.ws.ping(noop);
  }, 16000);
  this.pingSentTimestamp = new Date();
  this.ws.ping(noop);
  this.ws.on("close", function(){
    clearInterval(interval);
  });
}

Client.prototype.setGameObj = function(gameObj, turnCredentials)
{
  this.lastSentGameObj = JSON.stringify(gameObj);
  var sendData = {
    type: "playerId",
    playerId: this.playerId,
    gameObj: this.lastSentGameObj,
    turnCredentials: turnCredentials
  };
  var strToSend = JSON.stringify(sendData);
  var binaryString = this.constructMessage(strToSend);// pako.deflate(strToSend, { to: 'string' });
  if (this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(binaryString);
  }
  this.gameObj = gameObj;
}

Client.prototype.sendCardConflict = function(cardId)
{
  var sendData = {
    type: "cardConfilict",
    cardId: cardId
  };
  var strToSend = JSON.stringify(sendData);
  var binaryString = this.constructMessage(strToSend);// pako.deflate(strToSend, { to: 'string' });
  if (this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(binaryString);
  }
}

Client.prototype.sendNewPeer = function (playerId)
{
  this.newPeerQueue.push(playerId);
  if (this.newPeerState == "idle")
  {
    this.processNewPeerQueue();
  }
  else
  {
    console.log("Queued newPeer of " + playerId + " for " + this.playerId)
  }
}

Client.prototype.newPeerInitated = function()
{
  console.log("Last newPeer request for " + this.playerId + " was initiated.")
  this.newPeerState = 'idle';
  this.processNewPeerQueue();
}

Client.prototype.processNewPeerQueue = function()
{
  if (this.newPeerQueue.length > 0)
  {
    newPlayerId = this.newPeerQueue.shift();
    this.newPeerState = 'waitingForInitiator';
    var sendData = {
      type: "newPeer",
      playerId: newPlayerId
    }
    var strToSend = JSON.stringify(sendData);
    var binaryString = this.constructMessage(strToSend);
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(binaryString);
      console.log("SENT newPeer of " + newPlayerId + " to " + this.playerId);
    }
    else
    {
      console.log("ERROR in sending newPeer of " + newPlayerId + " to " + this.playerId + ". ws.readyState not OPEN.");
    }
    this.newPeerTimeouts[newPlayerId] = setTimeout(function(){
      this.sendNewPeer(newPlayerId);
    }, 5000);
  }
  else
  {
    this.newPeerState = 'idle';
    console.log("All newPeer requests for " + this.playerId + " initiated.")
  }
}

Client.prototype.newPeerConfirmed = function(playerId)
{
  clearTimeout(this.newPeerTimeouts[playerId]);
  console.log("newPeer " + playerId + " received by " + this.playerId);
}

Client.prototype.clearTimeouts = function()
{
  for (p in this.newPeerTimeouts){
    clearTimeout(this.newPeerTimeouts[p]);
  }
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
      patches: patchToSend,
      echo: false
    }
    this.latencyTestCounter += this.latencyTestCouterIncrement;
    if (this.latencyTestCounter >= 6000)
    {
      sendData.echo = true;
      this.latencyTestCounter = 0;
      this.latencyTestTimeStamp = new Date();
    }
    var strToSend = JSON.stringify(sendData);
    this.changedCardsBuffer = [];
    for(playerId in this.newDrawCoordinates)
    {
      this.newDrawCoordinates[playerId] = [];
    }
  
    var binaryString = this.constructMessage(strToSend);// pako.deflate(strToSend, { to: 'string' });
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(binaryString);
    }
  }
}

Client.prototype.deconstructMessage = function (data)
{
  if (this.useZip)
  {
    return pako.inflate(data, { to: 'string' })
  }
  else
  {
    return data
  }
}

Client.prototype.constructMessage = function (data)
{
  if (this.useZip)
  {
    return pako.deflate(JSON.stringify(data), { to: 'string' })
  }
  else
  {
    return data
  }
}

Client.prototype.echo = function()
{
  this.latency = Math.round((new Date() - this.latencyTestTimeStamp) / 2);
  var ms = this.latency * 1.5;
  this.latencyTestCouterIncrement = ms;
  if (ms < 40)
  {
    this.latencyTestCouterIncrement = 40
  }
  if (ms > 3000)
  {
    ms = 3000;
    this.latencyTestCouterIncrement = 3000;
  }

  this.broadcastLimiter.setMs(ms);
  //console.log("player " + playerId + " latency = " + this.latency + " ms")
  this.sendLatency();
}

Client.prototype.sendLatency = function()
{
  var sendData = {
    type: "latency",
    latency: this.latency,
    playerId: this.playerId
  }
  var strToSend = JSON.stringify(sendData);

  var binaryString = this.constructMessage(strToSend); //pako.deflate(strToSend, { to: 'string' });
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
  this.broadcastLimiter.update();
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
  this.broadcastLimiter.update();
}

function noop() {}

module.exports = {Client: Client}