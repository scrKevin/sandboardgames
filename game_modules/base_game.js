const WebSocket = require('ws');
let Player = require('./player').Player
let Client = require('./client').Client
let diff_match_patch = require('diff-match-patch')
var pako = require('pako');

let FpsLimiter = require('./fps_limiter').FpsLimiter;


function WS_distributor(wss, resetGameFunction)
{
  this.lastSentTime = new Date();
  this.broadcastLimiter = new FpsLimiter(20);
  this.broadcastLimiter.on("update", () => {
    var currentGameObj = JSON.stringify(this.gameObj)
    var diffs = this.dmp.diff_main(this.lastSentGameObj, currentGameObj);
    this.dmp.diff_cleanupEfficiency(diffs);
    var patches = this.dmp.patch_make(this.lastSentGameObj, diffs);
    this.lastSentGameObj = currentGameObj;
    var patchToSend = this.dmp.patch_toText(patches);
    var now = new Date();
    var sendData = {
      type: "patches",
      changedCards: this.changedCardsBuffer,
      patches: patchToSend,
      ms: now - this.lastSentTime
    }
    this.lastSentTime = now;
    var strToSend = JSON.stringify(sendData);
    this.changedCardsBuffer = [];
    for(player of this.gameObj.players)
    {
      player.resetBroadcastedDrawArray();
    }

    var binaryString = pako.deflate(strToSend, { to: 'string' });
    this.wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(binaryString);
      }
    });
  })
  this.transmittedBytes = 0;
  this.dmp = new diff_match_patch();

  this.resetGame = resetGameFunction;
  this.wss = wss;
  this.playerNumbers = []
  for (var i = 0; i < 20; i++)
  {
    this.playerNumbers.push(true);
  }
  this.clients = [];

  this.gameObj = {
    players:[],
    cards: [],
    decks: [],
    openboxes: []
  }
  this.lastSentGameObj = JSON.stringify(this.gameObj);
  this.changedCardsBuffer = [];

  this.timer = null;
  this.isIntervalSet = false;
  this.wss.on('connection', (ws) => {

    var player = new Player();

    var id = player.setId(this.playerNumbers);
    var client = new Client(id, ws);
    //var client = {playerId: id, ws: ws};

    this.clients.push(client);
    this.gameObj.players.push(player);

    ws.on('message', (message) => {
      var json = JSON.parse(pako.inflate(message, { to: 'string' }));
      if (json.type == "name")
      {
        player.updateName(json.name)
        this.broadcast();
      }
      else if(json.type == "varText")
      {
        for (card of this.gameObj.cards)
        {
          if (card.hasOwnProperty("varText"))
          {
            if (card.varText)
            {
              card.frontface.text = json.text;
              this.addToChangedCardsBuffer(card.id);
              this.broadcast();
            }
          }
        }
      }
      else if (json.type == "mouse")
      {
        var moved = player.updatePos(json.pos)
        if (json.card !== null)
        {
          this.addToChangedCardsBuffer(json.card);
          if (this.isDeck(json.card))
          {
            var deck = this.gameObj.decks.find(function(deck){
              return deck.id === json.card
            });
            if (!deck.immovable)
            {
              if (deck.isMyDeck(id, json.mouseclicked) && json.mouseclicked)
              {
                var xCorrection = 0;
                var yCorrection = 0;
                deck.x -= moved.deltaX;
                if (deck.x < 0)
                {
                  xCorrection = 0 - deck.x;
                  deck.x = 0;
                }
                deck.y -= moved.deltaY;
                if (deck.y < 0)
                {
                  yCorrection = 0 - deck.y;
                  deck.y = 0;
                }
                for (card of deck.attachedCards)
                {
                  card.x -= moved.deltaX - xCorrection;
                  card.y -= moved.deltaY - yCorrection;
                  this.addToChangedCardsBuffer(card.id);
                }
                for (openbox of deck.attachedOpenboxes)
                {
                  openbox.x -= moved.deltaX - xCorrection;
                  openbox.y -= moved.deltaY - yCorrection;
                }
              }
              if(!json.mouseclicked && deck.clickedBy == id)
              {
                deck.clickedBy = -1;
              }
            }
          }
          else
          {
            var card = this.gameObj.cards.find(function(card){
              return card.id === json.card;
            });
            card.setLastTouchedBy(id);
            if(card.isMyCard(id, json.mouseclicked) && json.mouseclicked)
            {
              card.x -= moved.deltaX;
              if (card.x < 0) { card.x = 0;}
              card.y -= moved.deltaY;
              if (card.y < 0) { card.y = 0;}
              for (deck of this.gameObj.decks)
              {
                if(deck.isInDeck(json.pos.x, json.pos.y))
                {
                  deck.addToDeck(card);
                }
                else
                {
                  deck.removeFromDeck(card);
                }
              }
            }
            if (!json.mouseclicked && card.clickedBy == id)
            {
              card.clickedBy = -1;
            }
            if (card.hasOwnProperty("show"))
            {
              var isInAnOpenbox = false;
              for (openbox of this.gameObj.openboxes)
              {
                if (openbox.isInOpenBox(json.pos.x, json.pos.y))
                {
                  isInAnOpenbox = true;
                  break;
                }
              }
              if (isInAnOpenbox && !json.mouseclicked)
              {
                card.show = 'frontface';
                card.isInAnOpenbox = true;
              }
              else
              {
                card.show = 'backface';
                card.isInAnOpenbox = false;
              }
            }
          }
        }
        this.broadcast();
      }
      else if (json.type == "touchcard")
      {
        player.updatePos(json.pos);
        this.broadcast();
      }
      else if (json.type == "touchbox")
      {
        if (!this.isDeck(json.card))
        {
          //console.log(json.card);
          
          var card = this.gameObj.cards.find(function(card){
            return card.id === json.card;
          });
          if (typeof(card) !== 'undefined')
          {
            this.addToChangedCardsBuffer(json.card);
            card.setLastTouchedBy(id);
            player.updatePos(json.pos);
            // card.x = json.pos.x;
            // card.y = json.pos.y;
            this.startAnimationCard(card, json.pos.x, json.pos.y);
            for (deck of this.gameObj.decks)
              {
                if(deck.isInDeck(json.pos.x, json.pos.y))
                {
                  deck.addToDeck(card);
                }
                else
                {
                  deck.removeFromDeck(card);
                }
              }
            if (card.hasOwnProperty("show"))
            {
              var isInAnOpenbox = false;
              for (openbox of this.gameObj.openboxes)
              {
                if (openbox.isInOpenBox(json.pos.x, json.pos.y))
                {
                  isInAnOpenbox = true;
                  break;
                }
              }
              if (isInAnOpenbox && !json.mouseclicked)
              {
                card.show = 'frontface';
                card.isInAnOpenbox = true;
              }
              else
              {
                card.show = 'backface';
                card.isInAnOpenbox = false;
              }
            }
            card.clickedBy = -1;
            this.broadcast();
          }
        }
      }
      else if (json.type == "shuffleDeck")
      {
        for (deck of this.gameObj.decks)
        {
          if (deck.id == json.deckId)
          {
            deck.shuffleDeck(json.xStackMinimum);
            for (card of deck.attachedCards)
            {
              this.addToChangedCardsBuffer(card.id)
            }
            break;
          }
        }
      }
      else if (json.type == "editScorebox")
      {
        for (scorebox of this.gameObj.scoreboxes)
        {
          if(scorebox.id == json.id)
          {
            scorebox.points += json.add;
          }
        }
        this.broadcast();
      }
      else if (json.type == "color")
      {
        player.updateColor(json.color)
        this.broadcast();
      }
      else if (json.type == "initiatorReady")
      {
        for (clientI of this.clients)
        {
          if (clientI.playerId == json.playerId)
          {
            client.peerStatus[clientI.playerId] = "initiatorReady";
            var sendData = {
              type: "peerConnect",
              fromPlayerId: id,
              stp: json.stp
            }
            var strToSend = JSON.stringify(sendData);
            var binaryString = pako.deflate(strToSend, { to: 'string' });
            clientI.ws.send(binaryString);
            break;
          }
        }
      }
      else if (json.type == "acceptPeer")
      {
        for (clientI of this.clients)
        {
          if (clientI.playerId == json.fromPlayerId)
          {
            client.peerStatus[clientI.playerId] = "peerAccepted";
            var sendData = {
              type: "peerAccepted",
              fromPlayerId: id,
              stp: json.stp
            }
            var strToSend = JSON.stringify(sendData);
            var binaryString = pako.deflate(strToSend, { to: 'string' });
            clientI.ws.send(binaryString)
            break;
          }
        }
      }
      else if (json.type == "streamReceived")
      {
        client.peerStatus[json.fromPlayerId] = "streamReceived";
      }
      else if (json.type == "connectionFailure")
      {
        client.peerStatus[json.fromPlayerId] = "connectionFailure";
        for(clientI of this.clients)
        {
          if(clientI.playerId == json.fromPlayerId)
          {
            if (clientI.peerStatus[id] == "connectionFailure")
            {
              // both peers have lost connection with each other but the connection with this server is ok.
              // retry connection
              var sendData = {
                type: "newPeer",
                playerId: json.fromPlayerId
              }
              var strToSend = JSON.stringify(sendData);
              var binaryString = pako.deflate(strToSend, { to: 'string' });
              ws.send(binaryString);
            }
          }
        }
      }
      else if (json.type == "requestId")
      {
        var sendData = {
          type: "playerId",
          playerId: id,
          gameObj: this.lastSentGameObj
        }
        var strToSend = JSON.stringify(sendData);
        var binaryString = pako.deflate(strToSend, { to: 'string' });
        ws.send(binaryString);
      }
      else if (json.type == "reset")
      {
        this.resetGame(this);
        this.broadcastReset();
      }
      else if (json.type == "draw")
      {
        player.addDrawCoordinates(json.coords);
      }
      
    });
    
    ws.on('close', () => {
      var removeIndexClients = this.clients.map(function(item) { return item.playerId; }).indexOf(id);
      this.clients.splice(removeIndexClients, 1);

      var removeIndexGameObj = this.gameObj.players.map(function(item){ return item.id;}).indexOf(id);
      this.gameObj.players.splice(removeIndexGameObj, 1);

      this.playerNumbers[id] = true;
      this.broadcastLeftPeer(id);

    });

    this.broadcastNewPeer(id, ws);
    
  });

  this.resetGame(this);
  this.lastSentGameObj = JSON.stringify(this.gameObj);
}

WS_distributor.prototype.addToChangedCardsBuffer = function(newItem)
{
  if (this.changedCardsBuffer.indexOf(newItem) === -1)
  {
    this.changedCardsBuffer.push(newItem);
  }
}

WS_distributor.prototype.isDeck = function (id)
{
  for (deck of this.gameObj.decks)
  {
    if (deck.id == id)
    {
      return true;
    }
  }
  return false;
}


WS_distributor.prototype.broadcastLeftPeer = function (playerId)
{
  //console.log("broadcasting left player " + playerId)
  for (clientI of this.clients)
  {
    if (clientI.playerId != playerId)
    {
      delete clientI.peerStatus[playerId];
    }
  }
  var sendData = {
    type: "leftPeer",
    playerId: playerId
  }
  var strToSend = JSON.stringify(sendData);
  var binaryString = pako.deflate(strToSend, { to: 'string' });
  this.wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(binaryString);
    }
  });
}

WS_distributor.prototype.broadcastNewPeer = function (playerId, newWs){
  //console.log("broadcasting new peer " + playerId)
  for (clientI of this.clients)
  {
    if (clientI.playerId != playerId)
    {
      clientI.peerStatus[playerId] = "newPeerSent";
    }
  }
  var sendData = {
    type: "newPeer",
    playerId: playerId
  }
  var strToSend = JSON.stringify(sendData);
  var binaryString = pako.deflate(strToSend, { to: 'string' });
  this.wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN && client != newWs) {
      client.send(binaryString);
    }
  });
}

WS_distributor.prototype.broadcastReset = function ()
{
  //console.log("broadcasting left player " + playerId)
  var sendData = {
    type: "reset"
  }
  var strToSend = JSON.stringify(sendData);
  var binaryString = pako.deflate(strToSend, { to: 'string' });
  this.wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(binaryString);
    }
  });
}

WS_distributor.prototype.broadcast = function(){
  this.broadcastLimiter.update();
}

WS_distributor.prototype.startAnimationCard = async function(card, targetX, targetY){
  var steps = (300 / (1000 / 20));

  var stepX = (targetX - card.x) / steps;
  var stepY = (targetY - card.y) / steps;

  for(var i = 0; i < steps -1; i++)
  {
    card.x += stepX;
    card.y += stepY;
    this.addToChangedCardsBuffer(card.id)
    this.broadcastLimiter.update();
    await delayAsync(300 / steps);
  }
  card.x = targetX;
  card.y = targetY;
  this.addToChangedCardsBuffer(card.id)
  this.broadcastLimiter.update();
}

function delayAsync(ms)
{
  return new Promise(function(resolve, reject) {
    setTimeout(function(){
      resolve();
    }, ms);
  });
}


module.exports = {Game: WS_distributor}