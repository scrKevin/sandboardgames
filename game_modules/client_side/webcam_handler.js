let SimplePeer = require('simple-peer');
let EventEmitter = require('events').EventEmitter;

var icehost = window.location.hostname;
console.log("icehost: " + icehost);
var peerConfig = {};

if(process.env.NODE_ENV === 'test')
{
  var wrtc = require('wrtc');
}

function WebcamHandler(wsHandler, myStream)
{
  this.wsHandler = wsHandler;
  this.myStream = myStream;
  this.captureStream = null;
  this.peers = {};
  this.capturePeers = {};
  EventEmitter.call(this);
}

WebcamHandler.prototype = Object.create(EventEmitter.prototype);

WebcamHandler.prototype.turnCredentials = function(turnCredentials)
{
  peerConfig = {iceServers: [ {
    urls: "turn:" + icehost + ':3478',
    username: turnCredentials.username,
    credential: turnCredentials.pass
  }]}
}

WebcamHandler.prototype.addCaptureStream = function(newCaptureStream){
  this.captureStream = newCaptureStream;
  var sendData = {
    type: "startCaptureHost",
  }
  this.wsHandler.sendToWs(sendData);
}

WebcamHandler.prototype.removeCaptureStream = function()
{
  for (let [key, peer] of Object.entries(this.capturePeers))
  {
    peer.destroy();
    delete this.capturePeers[key];
  }
}

WebcamHandler.prototype.initWebcamPeer = function(playerId, peerType)
{
  var streamToSend = this.myStream;
  var peerArray = this.peers;
  if(peerType == 'capture'){
    streamToSend = this.captureStream;
    peerArray = this.capturePeers;
  }
  console.log("initiating peer for player " + playerId)
  var peerOptions = {
    initiator: true,
    trickle: false,
    config: peerConfig,
    stream: streamToSend
  }
  if(process.env.NODE_ENV === 'test')
  {
    peerOptions.wrtc = wrtc;
  }
  peerArray[playerId] = new SimplePeer(peerOptions);

  peerArray[playerId].on('signal', (data) => {
    console.log("initiator ready - peer for player " + playerId)
    //console.log(data);
    var sendData = {
      type: "initiatorReady",
      playerId: playerId,
      stp: data,
      peerType: peerType
    }
    this.wsHandler.sendToWs(sendData);
  });

  peerArray[playerId].on('stream', stream => {
    console.log("got stream for player " + playerId)
    this.emit("stream", playerId, stream, peerType);
    var sendData = {
      type: "streamReceived",
      fromPlayerId: playerId,
      peerType: peerType
    }
    this.wsHandler.sendToWs(sendData);
  });

  peerArray[playerId].on('error', err => {
    console.log("error in initWebcamPeer for player " + playerId)
    console.log(err);
    if (err.code == "ERR_CONNECTION_FAILURE")
    {
      try {
        peerArray[playerId].destroy();
        //this.peers[playerId].destroy();
      }
      catch (error)
      {
        console.log(error)
      }
      //delete this.peers[playerId]
      delete peerArray[playerId]
      var sendData = {
        type: "connectionFailure",
        fromPlayerId: playerId,
        peerType: peerType
      }
      this.wsHandler.sendToWs(sendData);
    }

  });
  peerArray[playerId].on('close', () => {
    console.log("closed WebcamPeer for player " + playerId)
    try {
      //this.peers[playerId].destroy();
      peerArray[playerId].destroy();
    }
    catch (error)
    {
      console.log(error)
    }
    this.emit("peerClosed", playerId, peerType);
  });
  
  var sendData = {
    type: "newPeerReceived",
    playerId: playerId,
    peerType: peerType
  }
  this.wsHandler.sendToWs(sendData);
}

WebcamHandler.prototype.peerConnected = function(fromPlayerId, stp, peerType)
{
  var streamToSend = this.myStream;
  var peerArray = this.peers;
  if (peerType == 'capture')
  {
    streamToSend = null;
    peerArray = this.capturePeers;
  }
  console.log("peer connected from player " + fromPlayerId)
  var peerOptions = {
    initiator: false,
    trickle: false,
    config: peerConfig,
    stream: streamToSend
  }
  if(process.env.NODE_ENV === 'test')
  {
    peerOptions.wrtc = wrtc;
  }
  peerArray[fromPlayerId] = new SimplePeer(peerOptions);

  peerArray[fromPlayerId].on('stream', (stream) => {
    console.log("got stream for player " + fromPlayerId);
    this.emit("stream", fromPlayerId, stream, peerType);
    var sendData = {
      type: "readyForNewPeer",
      fromPlayerId: fromPlayerId,
      peerType: peerType
    }
    this.wsHandler.sendToWs(sendData);
  });

  peerArray[fromPlayerId].on('signal', (data) => {
    console.log("got peer signal from player " + fromPlayerId)
    //console.log(data);
    var sendData = {
      type: "acceptPeer",
      fromPlayerId: fromPlayerId,
      stp: data,
      peerType: peerType
    }
    this.wsHandler.sendToWs(sendData);
  });

  peerArray[fromPlayerId].on('error', err => {
    console.log("error in peerConnected from " + fromPlayerId)
    console.log(err);
    if (err.code == "ERR_CONNECTION_FAILURE")
    {
      try {
        peerArray[fromPlayerId].destroy();
      }
      catch (error)
      {
        console.log(error)
      }
      delete peerArray[fromPlayerId]
      var sendData = {
        type: "connectionFailure",
        fromPlayerId: fromPlayerId,
        peerType: peerType
      }
      this.wsHandler.sendToWs(sendData);
    }
  });

  peerArray[fromPlayerId].on('close', () => {
    console.log("closed WebcamPeer for player " + fromPlayerId);
    try {
      peerArray[fromPlayerId].destroy();
    }
    catch (error)
    {
      console.log(error)
    }
    delete peerArray[fromPlayerId];
    this.emit("peerClosed", fromPlayerId, peerType);
  });

  peerArray[fromPlayerId].signal(stp);
}

WebcamHandler.prototype.peerAccepted = function(fromPlayerId, stp, peerType)
{
  var peerArray = this.peers;
  if (peerType == 'capture')
  {
    peerArray = this.capturePeers;
  }
  console.log("peer accepted from player " + fromPlayerId);
  peerArray[fromPlayerId].signal(stp);
}

WebcamHandler.prototype.leftPeer = function(playerId, peerType)
{
  var peerArray = this.peers;
  if (peerType == 'capture')
  {
    peerArray = this.capturePeers;
  }
  try {
    peerArray[playerId].destroy();
  }
  catch (error)
  {
    console.log(error)
  }
  delete peerArray[playerId]
}

module.exports = {WebcamHandler: WebcamHandler}