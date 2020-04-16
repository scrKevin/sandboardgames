let pako = require('pako');
let diff_match_patch = require('diff-match-patch');
let FpsLimiter = require('../fps_limiter').FpsLimiter;
let EventEmitter = require('events').EventEmitter;

function WsHandler(ws)
{
  this.ws = ws;
  this.myPlayerId = -1;
  this.lastGameObj = "";

  this.dmp = new diff_match_patch();
  this.changedCardsBuffer = [];
  this.eventEmitter = new EventEmitter();
  this.updateGameLimiter = new FpsLimiter(20);
  this.updateGameLimiter.on("update", () => {
    this.eventEmitter.emit("updateGame", JSON.parse(this.lastGameObj), this.changedCardsBuffer, false);
  });

  this.ws.onopen = function () {
    this.requestPlayerId()
  }.bind(this);

  this.ws.onmessage = function (evt) 
  {
    var json = JSON.parse(pako.inflate(evt.data, { to: 'string' }));
    if(json.type == "patches")
    {
      this.lastGameObj = this.dmp.patch_apply(this.dmp.patch_fromText(json.patches), this.lastGameObj)[0];
      try
      {
        for (changedCard of json.changedCards)
        {
          this.addToChangedCardsBuffer(changedCard);
        }
        this.updateGameLimiter.update();
      }
      catch (err)
      {
        console.log(err);
        this.requestPlayerId();
      }
    }
    else if (json.type == "playerId")
    {
      this.lastGameObj = json.gameObj;
      this.myPlayerId = json.playerId;
      this.eventEmitter.emit('playerId', json.playerId);
      this.eventEmitter.emit('updateGame', JSON.parse(this.lastGameObj), [], true)
    }
    else if (json.type == "newPeer")
    {
      if (json.playerId != this.myPlayerId)
      {
        this.eventEmitter.emit("newPeer", json.playerId)
      }
    }
    else if (json.type == "leftPeer")
    {
      this.eventEmitter.emit("leftPeer", json.playerId)
    }
    else if (json.type == "peerConnect")
    {
      this.eventEmitter.emit("peerConnect", json.fromPlayerId, json.stp)
    }
    else if (json.type == "peerAccepted")
    {
      this.eventEmitter.emit("peerAccepted", json.fromPlayerId, json.stp)
    }
  }.bind(this);
  ws.onclose = function()
  { 
    
    this.eventEmitter.emit("wsClosed")
  }.bind(this);
}

WsHandler.prototype.requestPlayerId = function()
{
  var sendData = {
    type: "requestId"
  }
  this.sendToWs(sendData);
}

WsHandler.prototype.shuffleDeck = function(deckId)
{
  var sendData = {
    type: "shuffleDeck",
    deckId: deckId
  }
  this.sendToWs(sendData);
}

WsHandler.prototype.selectColor = function(color)
{
  var sendData = {
    type: "color",
    color: color
  }
  this.sendToWs(sendData);
}

WsHandler.prototype.sendToWs = function(data)
{
  if (this.ws != null && this.ws.readyState === this.ws.constructor.OPEN)
  {
    this.ws.send(pako.deflate(JSON.stringify(data), { to: 'string' }));
  }
}

WsHandler.prototype.addToChangedCardsBuffer = function(newItem)
{
  if (!this.changedCardsBuffer.includes(newItem))
  {
    this.changedCardsBuffer.push(newItem);
  }
}

WsHandler.prototype.resetGame = function()
{
  var sendData = {
    type: "reset"
  }
  this.sendToWs(sendData)
}

WsHandler.prototype.typeName = function(name)
{
  sendData = {
    type: "name",
    name: name
  }
  this.sendToWs(sendData);
}

module.exports = {WsHandler: WsHandler}