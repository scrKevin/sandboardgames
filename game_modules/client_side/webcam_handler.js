let SimplePeer = require('simple-peer');
let EventEmitter = require('events').EventEmitter;

if(process.env.NODE_ENV === 'test')
{
  var wrtc = require('wrtc');
}

function WebcamHandler(wsHandler, myStream)
{
  this.wsHandler = wsHandler;
  this.myStream = myStream;
  this.peers = {};
  EventEmitter.call(this);
}

WebcamHandler.prototype = Object.create(EventEmitter.prototype);

WebcamHandler.prototype.initWebcamPeer = function(playerId)
{
  //console.log("initiating peer for player " + playerId)
  var peerOptions = {
    initiator: true,
    trickle: false,
    stream: this.myStream
  }
  if(process.env.NODE_ENV === 'test')
  {
    peerOptions.wrtc = wrtc;
  }
  this.peers[playerId] = new SimplePeer(peerOptions);

  this.peers[playerId].on('signal', (data) => {
    console.log("initalizing peer for player " + playerId)
    console.log(data);
    var sendData = {
      type: "initiatorReady",
      playerId: playerId,
      stp: data
    }
    this.wsHandler.sendToWs(sendData);
  });

  this.peers[playerId].on('stream', stream => {
    console.log("got stream for player " + playerId)
    this.emit("stream", playerId, stream);
    var sendData = {
      type: "streamReceived",
      fromPlayerId: playerId
    }
    this.wsHandler.sendToWs(sendData);
  });

  this.peers[playerId].on('error', err => {
    console.log("error in initWebcamPeer for player " + playerId)
    console.log(err.code);
    if (err.code == "ERR_CONNECTION_FAILURE")
    {
      try {
        this.peers[playerId].destroy();
      }
      catch (error)
      {
        console.log(error)
      }
      delete this.peers[playerId]
      var sendData = {
        type: "connectionFailure",
        fromPlayerId: playerId
      }
      this.wsHandler.sendToWs(sendData);
    }

  })
}

WebcamHandler.prototype.peerConnected = function(fromPlayerId, stp)
{
  var peerOptions = {
    initiator: false,
    trickle: false,
    stream: this.myStream
  }
  if(process.env.NODE_ENV === 'test')
  {
    peerOptions.wrtc = wrtc;
  }
  this.peers[fromPlayerId] = new SimplePeer(peerOptions);

  this.peers[fromPlayerId].on('stream', stream => {
    console.log("got stream for player " + fromPlayerId)
    this.emit("stream", fromPlayerId, stream)
  });

  this.peers[fromPlayerId].on('signal', data => {
    console.log("got peer signal from player " + fromPlayerId)
    var sendData = {
      type: "acceptPeer",
      fromPlayerId: fromPlayerId,
      stp: data
    }
    this.wsHandler.sendToWs(sendData);
  });

  this.peers[fromPlayerId].on('error', err => {
    console.log("error in peerConnected")
    if (err.code == "ERR_CONNECTION_FAILURE")
    {
      try {
        this.peers[fromPlayerId].destroy();
      }
      catch (error)
      {
        console.log(error)
      }
      delete this.peers[fromPlayerId]
      var sendData = {
        type: "connectionFailure",
        fromPlayerId: fromPlayerId
      }
      this.wsHandler.sendToWs(sendData);
    }
  })

  this.peers[fromPlayerId].signal(stp);
}

WebcamHandler.prototype.peerAccepted = function(fromPlayerId, stp)
{
  this.peers[fromPlayerId].signal(stp);
}

WebcamHandler.prototype.leftPeer = function(playerId)
{
  try {
    this.peers[playerId].destroy();
  }
  catch (error)
  {
    //console.log(error)
  }
  delete this.peers[playerId]
}

module.exports = {WebcamHandler: WebcamHandler}