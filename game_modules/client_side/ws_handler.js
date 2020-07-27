let pako = require('pako');
let diff_match_patch = require('diff-match-patch');
let FpsLimiter = require('../fps_limiter').FpsLimiter;
let EventEmitter = require('events').EventEmitter;

function WsHandler(ws)
{
  this.useZip = false;

  this.ws = ws;
  this.myPlayerId = -1;
  this.lastGameObj = "";

  this.lastReceivedPatch = new Date();
  // this.lagTimeout = null;

  this.dmp = new diff_match_patch();
  this.changedCardsBuffer = [];
  this.eventEmitter = new EventEmitter();

  this.ws.onopen = function () {
    this.requestPlayerId();
  }.bind(this);


  this.ws.onmessage = function (evt) 
  {
    // console.log(evt.data)
    var json = JSON.parse(this.deconstructMessage(evt.data));
    if(json.type == "patches")
    {
      // console.log(json.ms);
      this.lastGameObj = this.dmp.patch_apply(this.dmp.patch_fromText(json.patches), this.lastGameObj)[0];
      try
      {
        for (changedCard of json.changedCards)
        {
          this.addToChangedCardsBuffer(changedCard);
        }
        // var now = new Date();
        // var ms = now - this.lastReceivedPatch;
        // console.log(ms);
        // console.log(" ");
        // this.lastReceivedPatch = now;
        // if (ms >= json.ms * 1.25)
        // {
        //   //console.log("Detected lag. Delay this update.")
        //   //client is lagging, skip to give it some time to catch up.
        //   clearTimeout(this.lagTimeout);
        //   this.lagTimeout = setTimeout(() => {
        //     //console.log(this.changedCardsBuffer)
        //     this.eventEmitter.emit("updateGame", JSON.parse(this.lastGameObj), this.changedCardsBuffer, false);
        //     this.changedCardsBuffer = [];
        //   }, 125);
        // }
        // else
        // {
          // clearTimeout(this.lagTimeout);
        //console.log(this.lastGameObj);
        //console.log("patches")
        this.eventEmitter.emit("updateGame", JSON.parse(this.lastGameObj), this.changedCardsBuffer, json.newDrawCoords, false);
        this.changedCardsBuffer = [];
        // }
      }
      catch (err)
      {
        console.log(err);
        //console.log(this.lastGameObj)
        this.requestPlayerId();
      }
      if(json.echo)
      {
        //console.log("sending echo")
        var sendData = {
          type: "echo"
        };
        this.sendToWs(sendData);
      }
    }
    else if (json.type == "playerId")
    {
      this.lastGameObj = json.gameObj;
      this.myPlayerId = json.playerId;
      this.eventEmitter.emit('playerId', json.playerId);
      this.eventEmitter.emit('updateGame', JSON.parse(this.lastGameObj), [], {}, true)
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
    else if (json.type == "reset")
    {
      this.eventEmitter.emit("reset");
      this.eventEmitter.emit('updateGame', JSON.parse(this.lastGameObj), [], {}, true)
    }
    else if (json.type == "devToolsState")
    {
      this.eventEmitter.emit("devToolsState", json.playerId, json.opened);
    }
    else if (json.type == "latency")
    {
      this.eventEmitter.emit("latency", json.latency, json.playerId);
    }
  }.bind(this);
  this.ws.onclose = function()
  { 
    this.eventEmitter.emit("wsClosed")
  }.bind(this);
}

WsHandler.prototype.deconstructMessage = function (data)
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

WsHandler.prototype.constructMessage = function (data)
{
  if (this.useZip)
  {
    return pako.deflate(JSON.stringify(data), { to: 'string' })
  }
  else
  {
    return JSON.stringify(data)
  }
}

WsHandler.prototype.requestPlayerId = function()
{
  var sendData = {
    type: "requestId"
  }
  this.sendToWs(sendData);
}

WsHandler.prototype.shuffleDeck = function(deckId, xStackMinimum)
{
  var sendData = {
    type: "shuffleDeck",
    xStackMinimum: xStackMinimum,
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
  // console.log(data)
  if (this.ws != null && this.ws.readyState === this.ws.constructor.OPEN)
  {
    this.ws.send(this.constructMessage(data));
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

WsHandler.prototype.typeVarText = function(text)
{
  sendData = {
    type: "varText",
    text: text
  }
  this.sendToWs(sendData);
}

WsHandler.prototype.editScorebox = function(id, add)
{
  sendData = {
    type: "editScorebox",
    id: id,
    add: add
  }
  this.sendToWs(sendData);
}

WsHandler.prototype.devToolsState = function(opened)
{
  sendData = {
    type: "devToolsState",
    opened: opened
  }
  this.sendToWs(sendData);
}

module.exports = {WsHandler: WsHandler}