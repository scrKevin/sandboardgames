let SimplePeer = require('simple-peer');
let EventEmitter = require('events').EventEmitter;

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
  
  this.peers[playerId] = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: this.myStream
  });

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
  this.peers[fromPlayerId] = new SimplePeer({
    initiator: false,
    trickle: false,
    stream: this.myStream
  });

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