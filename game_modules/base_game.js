const WebSocket = require('ws');
let Player = require('./player').Player
let Client = require('./client').Client
let diff_match_patch = require('diff-match-patch')
var pako = require('pako');

let FpsLimiter = require('./fps_limiter').FpsLimiter;


function WS_distributor(wss, resetGameFunction)
{
  this.useZip = false;
  this.lastSentTime = new Date();
  this.transmittedBytes = 0;

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
  this.changedCardsBuffer = [];

  this.timer = null;
  this.isIntervalSet = false;
  this.wss.on('connection', (ws) => {

    var player = new Player();

    var id = player.setId(this.playerNumbers);
    var client = new Client(id, ws);

    this.clients.push(client);
    this.gameObj.players.push(player);

    ws.on('message', (message) => {
      var json = JSON.parse(this.deconstructMessage(message));
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
        if (json.card.id !== null)
        {
          this.addToChangedCardsBuffer(json.card.id);
          if (this.isDeck(json.card.id))
          {
            var deck = this.gameObj.decks.find(function(deck){
              return deck.id === json.card.id
            });
            if (!deck.immovable)
            {
              if (deck.isMyDeck(id, json.mouseclicked) && json.mouseclicked)
              {
                var movedDeck = deck.updatePos(json.card.pos)
                for (card of deck.attachedCards)
                {
                  card.x -= movedDeck.deltaX - movedDeck.xCorrection;
                  card.y -= movedDeck.deltaY - movedDeck.yCorrection;
                  this.addToChangedCardsBuffer(card.id);
                }
                for (openbox of deck.attachedOpenboxes)
                {
                  openbox.x -= movedDeck.deltaX - movedDeck.xCorrection;
                  openbox.y -= movedDeck.deltaY - movedDeck.yCorrection;
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
              return card.id === json.card.id;
            });
            card.setLastTouchedBy(id);
            if((card.isMyCard(id, json.mouseclicked) && json.mouseclicked) || json.card.release)
            {
              card.updatePos(json.card.pos)
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
          
          var card = this.gameObj.cards.find(function(card){
            return card.id === json.card;
          });
          if (typeof(card) !== 'undefined')
          {
            this.addToChangedCardsBuffer(json.card);
            card.setLastTouchedBy(id);
            player.updatePos(json.pos);
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
            var binaryString = this.constructMessage(strToSend);
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
            var binaryString = this.constructMessage(strToSend);
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
              // both peers have lost connection with each other but the connection with the server is ok.
              // retry connection
              var sendData = {
                type: "newPeer",
                playerId: json.fromPlayerId
              }
              var strToSend = JSON.stringify(sendData);
              var binaryString = this.constructMessage(strToSend);
              ws.send(binaryString);
            }
          }
        }
      }
      else if (json.type == "requestId")
      {
        client.setGameObj(this.gameObj);
      }
      else if (json.type == "reset")
      {
        this.resetGame(this);
        this.broadcastReset();
        this.broadcast();
      }
      else if (json.type == "draw")
      {
        player.addDrawCoordinates(json.coords);
        for(client of this.clients)
        {
          client.addDrawCoordinates(id, json.coords);
        }
      }
      else if (json.type == "devToolsState")
      {
        this.broadcastDevToolsState(id, json.opened);
      }
      else if (json.type == "echo")
      {
        client.echo();
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

WS_distributor.prototype.deconstructMessage = function (data)
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

WS_distributor.prototype.constructMessage = function (data)
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

WS_distributor.prototype.addToChangedCardsBuffer = function(newItem)
{
  // if (this.changedCardsBuffer.indexOf(newItem) === -1)
  // {
  //   this.changedCardsBuffer.push(newItem);
  // }
  for (client of this.clients)
  {
    client.addToChangedCardsBuffer(newItem)
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
  var binaryString = this.constructMessage(strToSend);
  this.wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(binaryString);
    }
  });
}

WS_distributor.prototype.broadcastNewPeer = function (playerId, newWs){
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
  var binaryString = this.constructMessage(strToSend);
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
  var binaryString = this.constructMessage(strToSend);
  this.wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(binaryString);
    }
  });
}

WS_distributor.prototype.broadcastDevToolsState = function (playerId, opened)
{
  var sendData = {
    type: "devToolsState",
    playerId: playerId,
    opened: opened
  }
  var strToSend = JSON.stringify(sendData);
  var binaryString = this.constructMessage(strToSend);
  this.wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(binaryString);
    }
  });
}

WS_distributor.prototype.broadcast = function(){
  for (client of this.clients)
  {
    client.updateBroadcast();
  }
  //this.broadcastLimiter.update();
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
    this.broadcast();
    //this.broadcastLimiter.update();
    await delayAsync(300 / steps);
  }
  card.x = targetX;
  card.y = targetY;
  this.addToChangedCardsBuffer(card.id)
  this.broadcast();
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