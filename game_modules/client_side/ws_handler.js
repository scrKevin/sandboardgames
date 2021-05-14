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
    //console.log(json);
    if(json.type == "patches")
    {
      // console.log(json.ms);
      this.lastGameObj = this.dmp.patch_apply(this.dmp.patch_fromText(json.patches), this.lastGameObj)[0];
      // try
      // {
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
      // }
      // catch (err)
      // {
      //   console.log(err);
      //   //console.log(this.lastGameObj)
      //   this.requestPlayerId();
      // }
      // if(json.echo)
      // {
      //   //console.log("sending echo")
      //   var sendData = {
      //     type: "echo"
      //   };
      //   this.sendToWs(sendData);
      // }
      var sendData = {
        type: "p",
        echo: json.echo
      }
      this.sendToWs(sendData);
    }
    else if (json.type == "playerId")
    {
      this.lastGameObj = json.gameObj;
      this.myPlayerId = json.playerId;
      this.eventEmitter.emit('turnCredentials', json.turnCredentials);
      this.eventEmitter.emit('playerId', json.playerId);
      this.eventEmitter.emit('updateGame', JSON.parse(this.lastGameObj), [], {}, true);
      var sendData = {
        type: "initiated"
      };
      this.sendToWs(sendData);
    }
    else if (json.type == "cardConflict")
    {
      this.eventEmitter.emit('cardConflict', json.cardId, json.replacementCardId);
    }
    else if (json.type == "newPeer")
    {
      if (json.playerId != this.myPlayerId)
      {
        this.eventEmitter.emit("newPeer", json.playerId, json.wasReset, json.peerType)
      }
    }
    else if (json.type == "leftPeer")
    {
      this.eventEmitter.emit("leftPeer", json.playerId, json.peerType)
    }
    else if (json.type == "relayLeft")
    {
      this.eventEmitter.emit("relayLeft", json.playerId, json.relayFor)
    }
    else if (json.type == "peerConnect")
    {
      this.eventEmitter.emit("peerConnect", json.fromPlayerId, json.stp, json.peerType, json.relayFor)
    }
    else if (json.type == "peerAccepted")
    {
      this.eventEmitter.emit("peerAccepted", json.fromPlayerId, json.stp, json.peerType, json.relayFor)
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
    else if (json.type == "hostRelay")
    {
      this.eventEmitter.emit("hostRelay", json.peerId1, json.peerId2);
    }
  }.bind(this);
  this.ws.onclose = function()
  { 
    console.error("WebSocket closed");
    this.eventEmitter.emit("wsClosed")
  }.bind(this);
  this.ws.onerror = function(e)
  {
    console.error("WebSocket error observed:", e);
    this.eventEmitter.emit("wsClosed");
  }
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
  console.log("requesting Player ID.")
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

WsHandler.prototype.rollDeck = function(deckId)
{
  var sendData = {
    type: "rollDeck",
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
    //console.log(data)
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
  this.sendToWs(sendData);
}

WsHandler.prototype.resetWebcam = function()
{
  var sendData = {
    type: "resetWebcam"
  }
  this.sendToWs(sendData);
}

WsHandler.prototype.takeSnapshot = function()
{
  var sendData = {
    type: 'takeSnapshot'
  }
  this.sendToWs(sendData);
}

WsHandler.prototype.recoverSnapshot = function()
{
  var sendData = {
    type: 'recoverSnapshot'
  }
  this.sendToWs(sendData);
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

WsHandler.prototype.resetScorebox = function(id, add)
{
  sendData = {
    type: "resetScorebox",
    id: id
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

WsHandler.prototype.reportPatched = function(init)
{
  // if (init)
  // {
  //   // var sendData = {
  //   //   type: "initiated"
  //   // };
  // }
  // else{
  //   var sendData = {
  //     type: "p",
  //   }
  // }

  var sendData = {
    type: "p",
    echo: false
  }
  this.sendToWs(sendData);
}

WsHandler.prototype.reportInitiated = function()
{
  var sendData = {
    type: "initiated"
  };
  this.sendToWs(sendData);
}

WsHandler.prototype.reportPlaying = function(playerId)
{
  var sendData = {
    type: "reportPlaying",
    playerId: playerId
  };
  this.sendToWs(sendData);
}

WsHandler.prototype.requestRadioFromPlayer = function(playerNumber)
{
  var sendData = {
    type: "requestRadioFromPlayer",
    playerNumber: playerNumber
  };
  this.sendToWs(sendData);
}

WsHandler.prototype.sendCustomMessage = function(json)
{
  var sendData = {
    type: "custom",
    message: json
  };
  this.sendToWs(sendData);
}

module.exports = {WsHandler: WsHandler}