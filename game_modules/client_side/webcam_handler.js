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
  console.log("initiating peer for player " + playerId)
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
    var sendData = {
      type: "initiatorReady",
      playerId: playerId,
      stp: data
    }
    this.wsHandler.sendToWs(sendData)
  });

  this.peers[playerId].on('stream', stream => {
    this.emit("stream", playerId, stream);
  });
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
    this.emit("stream", fromPlayerId, stream)
  });

  this.peers[fromPlayerId].on('signal', data => {

    var sendData = {
      type: "acceptPeer",
      fromPlayerId: fromPlayerId,
      stp: data
    }
    this.wsHandler.sendToWs(sendData);
  });

  this.peers[fromPlayerId].signal(stp);
}

WebcamHandler.prototype.peerAccepted = function(fromPlayerId, stp)
{
  this.peers[fromPlayerId].signal(stp);
}

module.exports = {WebcamHandler: WebcamHandler}