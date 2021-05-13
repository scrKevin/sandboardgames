const WebSocket = require('ws');
let FpsLimiter = require('./fps_limiter').FpsLimiter;
var getPreferredMs = require('./fps_limiter').getPreferredMs;
let diff_match_patch = require('diff-match-patch')
var pako = require('pako');

function Client(playerId, ws, distributor)
{
  this.distributor = distributor;
  this.initiated = false;
  this.useZip = false;
  this.gameObj = null;
  this.lastSentGameObj = ""
  this.changedCardsBuffer = [];
  this.newDrawCoordinates = {};
  this.broadcastLimiter = new FpsLimiter(0.5);
  this.broadcastLimiter.on("update", () => {
    this.broadcast();
  });
  this.dmp = new diff_match_patch();
  this.peerStatus = {};
  this.newPeerTimeouts = {};
  this.newPeerState = "idle";
  this.acceptPeerState = "idle";
  this.acceptPeerTimeout = null;
  this.newPeerQueue = [];
  this.playerId = playerId;
  this.ws = ws;
  this.isAlive = true;
  this.patched = false;
  this.broadCastNextAvailable = false;
  this.latencyTestCounter = 20001;
  this.latencyTestCouterIncrement = 5000;
  this.latencyTestTimeStamp = new Date();
  this.isReset = false;
  //this.seekingRelay = [];
  this.hostingRelays = [];
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

Client.prototype.sendCardConflict = function(cardId, replacementCardId)
{
  var sendData = {
    type: "cardConflict",
    cardId: cardId,
    replacementCardId: replacementCardId
  };
  var strToSend = JSON.stringify(sendData);
  var binaryString = this.constructMessage(strToSend);// pako.deflate(strToSend, { to: 'string' });
  if (this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(binaryString);
  }
  this.addToChangedCardsBuffer(cardId);
  this.addToChangedCardsBuffer(replacementCardId);
  this.updateBroadcast();
}

Client.prototype.sendNewPeer = function (otherClient)
{
  this.newPeerQueue.push(otherClient);
  if (this.newPeerState == "idle")
  {
    //console.log(this.playerId + " is processing peer " + otherClient.playerId);
    this.processNewPeerQueue();
  }
  else
  {
    console.log("Queued newPeer of " + otherClient.playerId + " for " + this.playerId)
  }
}

Client.prototype.newPeerInitiated = function(fromPlayerId)
{
  clearTimeout(this.newPeerTimeouts[fromPlayerId]);
  delete this.newPeerTimeouts[fromPlayerId];
  console.log(this.playerId + " cleared timeout for " + fromPlayerId);
  console.log("Stream from " + fromPlayerId + " received by " + this.playerId)
  this.newPeerState = 'idle';
  this.processNewPeerQueue();
}

// Client.prototype.onNewPeerTimeout = function()
// {
//   //console.log("newPeer for " + newPlayerId + " TIMEOUT")
//   this.peerStatus = 'idle';
//   this.processNewPeerQueue();
// }

Client.prototype.sendRadioRequest = function(forPlayerId){
  var sendData = {
    type: "newPeer",
    playerId: forPlayerId,
    wasReset: false,
    peerType: "capture"
  }
  var strToSend = JSON.stringify(sendData);
  var binaryString = this.constructMessage(strToSend);
  if (this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(binaryString);
    console.log("SENT newPeer (radio) of " + forPlayerId + " to " + this.playerId);
  }
  else
  {
    console.log("ERROR in sending (radio) newPeer of " + forPlayerId + " to " + this.playerId + ". ws.readyState not OPEN.");
  }
}

Client.prototype.processNewPeerQueue = function()
{
  //this.clearTimeouts();
  if (this.newPeerQueue.length > 0)
  {
    var found = false;
    for (var i = 0; i < this.newPeerQueue.length; i++)
    {
      if (this.newPeerQueue[i].acceptPeerState == "idle")
      {
        found = true;
        var otherClient = this.newPeerQueue.splice(i, 1)[0];
        newPlayerId = otherClient.playerId;
        otherClient.acceptPeerState = 'busy';
        otherClient.acceptPeerTimeout = setTimeout(function(){
          console.log("acceptPeerTimeout for " + otherClient.playerId + " to " + this.playerId);
          otherClient.acceptPeerState = 'idle';
          this.distributor.allClientsProcessNewPeerQueue();
        }.bind(this), 10000);
        this.newPeerState = 'waitingForInitiator';
        var sendData = {
          type: "newPeer",
          playerId: newPlayerId,
          wasReset: otherClient.isReset,
          peerType: "webcam"
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
          console.log(this.playerId + ": newPeer for " + newPlayerId + " TIMEOUT")
          this.peerStatus = 'idle';
          this.processNewPeerQueue();
        }.bind(this), 10000);
        break;
      }
    }
    if (!found)
    {
      console.log("no peers ready for " + this.playerId);
    }
  }
  else
  {
    this.newPeerState = 'idle';
    console.log("All newPeer requests for " + this.playerId + " finished.")
  }
}

Client.prototype.newPeerConfirmed = function(playerId)
{
  // clearTimeout(this.newPeerTimeouts[playerId]);
  // delete this.newPeerTimeouts[playerid];
  console.log("newPeer " + playerId + " received by " + this.playerId);
}

Client.prototype.clearTimeouts = function()
{
  for (p in this.newPeerTimeouts){
    console.log(this.playerId + " removed newPeerTimeout for " + p);
    clearTimeout(this.newPeerTimeouts[p]);
    delete this.newPeerTimeouts[p];
  }
}

Client.prototype.updateBroadcast = function()
{
  this.broadcastLimiter.update();
}

Client.prototype.reportPatched = function()
{
  setTimeout(() => {
    this.patched = true;
    if (this.broadCastNextAvailable)
    {
      this.broadcast();
    }
  }, this.broadcastLimiter.ms * 1.5);
  
}

Client.prototype.broadcast = function()
{
  //console.log(this.playerId + " update, patched = " + this.patched)
  if(this.gameObj != null && this.patched)
  {
    // console.log("player " + this.playerId + " changedCardsBuffer:")
    // console.log(this.changedCardsBuffer)
    this.patched = false;
    this.broadCastNextAvailable = false;
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
    if (this.latencyTestCounter >= 20000)
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
  else if (!this.patched)
  {
    this.broadCastNextAvailable = true;
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
  var ms = this.latency * 5;
  //this.latencyTestCouterIncrement = ms;
  // if (ms < 40)
  // {
  //   this.latencyTestCouterIncrement = 40
  // }
  this.latencyTestCouterIncrement = getPreferredMs(ms)
  // if (ms > 3000)
  // {
  //   ms = 3000;
  //   this.latencyTestCouterIncrement = 3000;
  // }

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

Client.prototype.sendBinaryString = function(binaryString)
{
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
  //this.broadcastLimiter.update();
}

Client.prototype.hostRelay = function(peerId1, peerId2)
{
  console.log(this.playerId + " will host relay between " + peerId1 + " and " + peerId2)
  this.hostingRelays.push({"first": peerId1, "second": peerId2})
  var sendData = {
    type: "hostRelay",
    peerId1: peerId1,
    peerId2: peerId2
  }
  var strToSend = JSON.stringify(sendData);

  var binaryString = this.constructMessage(strToSend); //pako.deflate(strToSend, { to: 'string' });
  if (this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(binaryString);
  }
}

Client.prototype.reportRelayLeft = function (relayPlayerId, relayFor)
{
  var sendData = {
    type: "relayLeft",
    playerId: relayPlayerId,
    relayFor: relayFor
  }
  var strToSend = JSON.stringify(sendData);

  var binaryString = this.constructMessage(strToSend); //pako.deflate(strToSend, { to: 'string' });
  if (this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(binaryString);
  }
}

Client.prototype.reportLeftPeer = function(playerId)
{
  if (this.hostingRelays.length > 0)
  {
    for (hr of this.hostingRelays)
    {
      if (hr['first'] == playerId || hr['second'] == playerId)
      {
        this.reportRelayLeft(hr['first'], hr['second']);
        this.reportRelayLeft(hr['second'], hr['first']);
        this.hostingRelays.splice(this.hostingRelays.indexOf(hr), 1);
      }
    }
  }
}

// Client.prototype.addSeekingRelay = function(peerId)
// {
//   if (this.seekingRelay.indexOf(peerId) === -1)
//   {
//     this.seekingRelay.push(peerId);
//   }
// }

// Client.prototype.removeSeekingRelay = function(peerId)
// {
//   var index = this.seekingRelay.indexOf(peerId);
//   if (index !== -1)
//   {
//     this.seekingRelay.splice(index, 1);
//   }
// }

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