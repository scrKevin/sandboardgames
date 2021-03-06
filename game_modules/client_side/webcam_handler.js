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
  this.relayPeers = {};
  this.myPlayerId = -1;
  this.streams = {};
  EventEmitter.call(this);
}

WebcamHandler.prototype = Object.create(EventEmitter.prototype);

WebcamHandler.prototype.setPlayerId = function(playerId)
{
  this.myPlayerId = playerId;
}

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

WebcamHandler.prototype.removeCaptureStream = function() {

  for (let [key, peer] of Object.entries(this.capturePeers))
  {
    peer.destroy();
    delete this.capturePeers[key];
  }
  var sendData = {
    type: "stopCaptureHost",
  }
  this.wsHandler.sendToWs(sendData);
}

WebcamHandler.prototype.initWebcamPeer = function(playerId, peerType, optionalRelayFor)
{
  var streamToSend = this.myStream;
  var peerArray = this.peers;
  if(peerType == 'capture'){
    streamToSend = this.captureStream;
    peerArray = this.capturePeers;
  }
  else if (peerType == 'relay')
  {
    streamToSend = this.streams[optionalRelayFor];
    if (!(optionalRelayFor in this.relayPeers)) this.relayPeers[optionalRelayFor] = {}
    peerArray = this.relayPeers[optionalRelayFor];
  }
  console.log("initiating peer for player " + playerId)
  var peerOptions = {
    initiator: true,
    trickle: true,
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
    if (peerType == 'relay') sendData.relayFor = optionalRelayFor
    this.wsHandler.sendToWs(sendData);
  });

  peerArray[playerId].on('stream', stream => {
    console.log("got stream for player " + playerId)
    ////// Delete this V
    // if (this.myPlayerId == 1 && playerId == 2)
    // {
    //   this.emit("stream", playerId, null, peerType);
    //   // peerArray[playerId].destroy();
    //   // delete peerArray[playerId]
    //   var sendData = {
    //     type: "connectionFailure",
    //     fromPlayerId: playerId,
    //     peerType: peerType
    //   }
    //   this.wsHandler.sendToWs(sendData);
    // }
    // /////
    // else {
    /////// Keep this V
    if (peerType == "webcam") this.streams[playerId] = stream;
    this.emit("stream", playerId, stream, peerType);
    var sendData = {
      type: "streamReceived",
      fromPlayerId: playerId,
      peerType: peerType
    }
    this.wsHandler.sendToWs(sendData);
    ///// end of keep this ^
    //}
    //////
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

WebcamHandler.prototype.peerConnected = function(fromPlayerId, stp, peerType, optionalRelayFor)
{
  var streamToSend = this.myStream;
  var peerArray = this.peers;
  if (peerType == 'capture')
  {
    streamToSend = null;
    peerArray = this.capturePeers;
  }
  else if (peerType == 'relay')
  {
    streamToSend = null;
    if (!(optionalRelayFor in this.relayPeers)) this.relayPeers[optionalRelayFor] = {}
    peerArray = this.relayPeers[optionalRelayFor]
  }
  if (!(fromPlayerId in peerArray))
  {
    console.log("peer connected from player " + fromPlayerId)
    var peerOptions = {
      initiator: false,
      trickle: true,
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
       ////// Delete this V
      // if (this.myPlayerId == 2 && fromPlayerId == 1)
      // {
      //   this.emit("stream", fromPlayerId, null, peerType);
      //   // peerArray[fromPlayerId].destroy();
      //   // delete peerArray[fromPlayerId]
      //   var sendData = {
      //     type: "connectionFailure",
      //     fromPlayerId: fromPlayerId,
      //     peerType: peerType
      //   }
      //   this.wsHandler.sendToWs(sendData);
      // }
      // /////
      // else {
      ///// keep this V
      if (peerType == "webcam") this.streams[fromPlayerId] = stream;
      this.emit("stream", fromPlayerId, stream, peerType, optionalRelayFor);
      var sendData = {
        type: "readyForNewPeer",
        fromPlayerId: fromPlayerId,
        peerType: peerType
      }
      this.wsHandler.sendToWs(sendData);
      //// end of keep this
      //}
      ///////
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
      if (peerType == 'relay') sendData.relayFor = optionalRelayFor
      this.wsHandler.sendToWs(sendData);
    });

    peerArray[fromPlayerId].on('error', err => {
      console.log("error in peerConnected from " + fromPlayerId + " peertype = " + peerType)
      console.log(err);
      if (err.code == "ERR_CONNECTION_FAILURE")
      {
        try {
          console.log(peerArray);
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
      this.emit("peerClosed", fromPlayerId, peerType, optionalRelayFor);
    });
  }

  peerArray[fromPlayerId].signal(stp);
}

WebcamHandler.prototype.peerAccepted = function(fromPlayerId, stp, peerType, optionalRelayFor)
{
  var peerArray = this.peers;
  if (peerType == 'capture')
  {
    peerArray = this.capturePeers;
  }
  else if (peerType == 'relay')
  {
    peerArray = this.relayPeers[optionalRelayFor]
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

WebcamHandler.prototype.relayLeft = function(playerId, relayFor)
{
  try {
    this.relayPeers[relayFor][playerId].destroy();
  }
  catch (error)
  {
    console.log(error)
  }
  delete this.relayPeers[relayFor][playerId]
}

WebcamHandler.prototype.stopRadio = function(fromPlayerId)
{
  if (fromPlayerId in this.capturePeers)
  {
    this.capturePeers[fromPlayerId].destroy();
    delete this.capturePeers[fromPlayerId];
  }
}

WebcamHandler.prototype.hostRelay = function (peerId1, peerId2)
{
  this.initWebcamPeer(peerId1, 'relay', peerId2);
  this.initWebcamPeer(peerId2, 'relay', peerId1);
}

module.exports = {WebcamHandler: WebcamHandler}