const WebSocket = require('ws');
const crypto = require('crypto');
let Player = require('./player').Player
let Client = require('./client').Client
let diff_match_patch = require('diff-match-patch')
var pako = require('pako');

var Card = require('./card').Card
var Deck = require('./deck').Deck
var Openbox = require('./openbox').Openbox

let FpsLimiter = require('./fps_limiter').FpsLimiter;
const deck = require('./deck');


function WS_distributor(wss, turnServer, resetGameFunction)
{
  this.useZip = false;
  this.lastSentTime = new Date();
  this.transmittedBytes = 0;

  this.resetGame = resetGameFunction;
  this.turnServer = turnServer;
  this.wss = wss;
  this.playerNumbers = []
  for (var i = 0; i < 20; i++)
  {
    this.playerNumbers.push(true);
  }
  this.clients = [];

  this.gameObj = {
    players:{},
    cards: {},
    decks: {},
    openboxes: {},
  }
  this.changedCardsBuffer = [];

  this.timer = null;
  this.isIntervalSet = false;
  this.wss.on('connection', (ws) => {

    var player = new Player();
    var id = player.setId(this.playerNumbers);
    var turnUsername =  crypto.randomBytes(20).toString('hex');
    var turnPass = crypto.randomBytes(20).toString('hex');
    this.turnServer.addUser(turnUsername, turnPass);
    console.log("added turnCredentials for player " + id + ": u:" + turnUsername + " p:" + turnPass);
    var client = new Client(id, ws, this);

    this.clients.push(client);
    this.gameObj.players[id] = player;//.push(player);

    ws.on('message', (message) => {
      var json = JSON.parse(this.deconstructMessage(message));
      if (json.type == "name")
      {
        player.updateName(json.name)
        this.broadcast();
      }
      else if (json.type == "p")
      {
        client.reportPatched();
        if (json.echo)
        {
          client.echo();
        }
      }
      else if (json.type == "requestId")
      {
        console.log(id + " is requesting id");
        client.setGameObj(this.gameObj, {username: turnUsername, pass: turnPass});
        // this.broadcastNewPeer(id, ws);
      }
      else if (json.type == "initiated")
      {
        client.initiated = true;
        client.reportPatched();
        console.log("player " + id + " initiated.")
        this.broadcastNewPeer(client, id, ws);
      }
      else if(json.type == "varText")
      {
        var changed = false;
        for (let card of Object.values(this.gameObj.cards)) {
          if (card.hasOwnProperty("varText"))
          {
            if (card.varText)
            {
              changed = true;
              card.frontface.text = json.text;
              this.addToChangedCardsBuffer(card.id);
            }
          }
        }
        if (changed) this.broadcast();
      }
      else if (json.type == "mouse")
      {
        var moved = player.updatePos(json.pos)
        if (json.card.id !== null)
        {
          this.addToChangedCardsBuffer(json.card.id);
          if (this.isDeck(json.card.id))
          {
            var deck = this.gameObj.decks[json.card.id];

            if (!deck.immovable)
            {
              if (deck.isMyDeck(id, json.mouseclicked) && json.mouseclicked || json.card.release)
              {
                var movedDeck = deck.updatePos(json.card.pos)
                for (let card of Object.values(deck.attachedCards))
                {
                  card.x -= movedDeck.deltaX - movedDeck.xCorrection;
                  card.y -= movedDeck.deltaY - movedDeck.yCorrection;
                  this.addToChangedCardsBuffer(card.id);
                }
                for (let openbox of Object.values(deck.attachedOpenboxes))
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
            var card = this.gameObj.cards[json.card.id];
            card.setLastTouchedBy(id);
            if((card.isMyCard(id, json.mouseclicked) && json.mouseclicked) || json.card.release)
            {
              card.updatePos(json.card.pos);
              if (this.gameObj.hasOwnProperty("sharedPlayerbox"))
              {
                if(this.gameObj.sharedPlayerbox.isInOpenBox(card.x, card.y))
                {
                  card.ownedBy = id;
                }
                else
                {
                  card.ownedBy = -1;
                }
              }
              for (let deck of Object.values(this.gameObj.decks))
              {
                if(deck.isInDeck(json.pos.x, json.pos.y))
                {
                  if (deck.addToDeck(card, id)) this.addToChangedCardsBuffer(deck.id);
                }
                else
                {
                  if (deck.removeFromDeck(card, id)) this.addToChangedCardsBuffer(deck.id);
                }
              }
            }
            if (!json.mouseclicked && card.clickedBy == id)
            {
              card.clickedBy = -1;
            }
            if (card.hasOwnProperty("show"))
            {
              var openboxData = {isInAnOpenBox: false, openbox: null};
              for (let openbox of Object.values(this.gameObj.openboxes))
              {
                if (openbox.isInOpenBox(json.pos.x, json.pos.y))
                {
                  openboxData.isInAnOpenbox = true;
                  openboxData.openbox = openbox;
                  // break;
                }
              }
              if (openboxData.isInAnOpenbox && (!json.mouseclicked || json.card.release))
              {
                this.addToChangedCardsBuffer(card.id);
                card.show = openboxData.openbox.showFace;
                card.isInAnOpenbox = true;
              }
              else
              {
                this.addToChangedCardsBuffer(card.id);
                card.show = 'backface';
                card.isInAnOpenbox = false;
              }
            }
          }
        }
        this.broadcast();
      }
      else if (json.type == "clickcard")
      {
        if (json.card in this.gameObj.cards)
        {
          var card = this.gameObj.cards[json.card];
          if (card.clickedBy == -1 || card.clickedBy == id)
          {
            card.clickedBy = id;

            this.gameObj.highestZ++;
            card.setZ(this.gameObj.highestZ);
            
            this.addToChangedCardsBuffer(card.id);
            this.broadcast();
          }
          else
          {
            // confilict with clicked cards
            console.log("card confilict for " + card.id + " with " + card.clickedBy + " (first) and " + id + " (second)")
            var validReplacements = {};
            for (let replacementCard of Object.values(this.gameObj.cards))
            {
              if (replacementCard.id != card.id)
              {
                if (replacementCard.isValidReplacement(json.cardX, json.cardY))
                {
                  validReplacements[replacementCard.z] = replacementCard;
                }
              }
            }
            //console.log(validReplacements)
            var orderedByZ = Object.keys(validReplacements).sort().reduce(
              (obj, key) => { 
                obj[key] = validReplacements[key]; 
                return obj;
              }, 
              {}
            );
            //console.log(orderedByZ)
            var replacementCardId = -1;
            if (Object.keys(orderedByZ).length > 0)
            {
              var replacementCard = orderedByZ[Object.keys(orderedByZ)[Object.keys(orderedByZ).length - 1]]
              this.gameObj.cards[replacementCard.id].clickedBy = id;
              console.log("found replacement card for " + id + ": " + replacementCard.id)
              replacementCardId = replacementCard.id;
            }
            
            client.sendCardConflict(card.id, replacementCardId);
            this.broadcast();
          }
        }
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
          if (json.card in this.gameObj.cards)
          {
            var card = this.gameObj.cards[json.card];
            this.addToChangedCardsBuffer(json.card);
            card.setLastTouchedBy(id);
            player.updatePos(json.pos);
            this.startAnimationCard(card, json.pos.x, json.pos.y);
            for (let deck of Object.values(this.gameObj.decks))
            {
              if(deck.isInDeck(json.pos.x, json.pos.y))
              {
                deck.addToDeck(card, id);
                this.addToChangedCardsBuffer(deck.id);
              }
              else
              {
                deck.removeFromDeck(card, id);
                this.addToChangedCardsBuffer(deck.id);
              }
            }
            if (card.hasOwnProperty("show"))
            {
              var isInAnOpenbox = false;
              for (let openbox of this.gameObj.openboxes)
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
        let deck = this.gameObj.decks[json.deckId];
        deck.shuffleDeck(json.xStackMinimum);
        for (let card of Object.values(deck.attachedCards))
        {
          this.addToChangedCardsBuffer(card.id)
        }
        this.broadcast();
      }
      else if (json.type == "rollDeck")
      {
        let deck = this.gameObj.decks[json.deckId];
        deck.rollDeck();
        for (let card of Object.values(deck.attachedCards))
        {
          this.addToChangedCardsBuffer(card.id)
        }
        this.broadcast();
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
      else if (json.type == "resetScorebox")
      {
        for (scorebox of this.gameObj.scoreboxes)
        {
          if(scorebox.id == json.id)
          {
            scorebox.points = 0;
          }
        }
        this.broadcast();
      }
      else if (json.type == "color")
      {
        player.updateColor(json.color)
        this.broadcast();
      }
      else if (json.type == "startCaptureHost")
      {
        player.isHostingCapture = true;
        this.broadcast();
      }
      else if (json.type == "stopCaptureHost")
      {
        console.log(id + " is stopping capture host.")
        player.isHostingCapture = false;
        this.broadcast();
      }
      else if (json.type == "requestRadioFromPlayer")
      {
        if (this.gameObj.players[json.playerNumber].isHostingCapture)
        {
          for (clientIS of this.clients)
          {
            if (clientIS.playerId == json.playerNumber)
            {
              clientIS.sendRadioRequest(id);
              continue;
            }
          }
        }
      }
      else if (json.type == "newPeerReceived")
      {
        client.newPeerConfirmed(json.playerId);
      }
      else if (json.type == "initiatorReady")
      {
        //client.newPeerInitated();
        for (clientI of this.clients)
        {
          if (clientI.playerId == json.playerId)
          {
            if(json.peerType == "webcam"){
              client.peerStatus[clientI.playerId] = "initiatorReady";
            }
            var sendData = {
              type: "peerConnect",
              fromPlayerId: id,
              stp: json.stp,
              peerType: json.peerType
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
            if (json.peerType == "webcam")
            {
              client.peerStatus[clientI.playerId] = "peerAccepted";
            }
            var sendData = {
              type: "peerAccepted",
              fromPlayerId: id,
              stp: json.stp,
              peerType: json.peerType
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
        if (json.peerType == "webcam")
        {
          setTimeout(function(){
            try{
              client.newPeerInitiated(json.fromPlayerId);
            }
            catch(error){
              console.log("error: " + error);
            }
            
          }, 500);
          client.peerStatus[json.fromPlayerId] = "streamReceived";
        }
      }
      else if (json.type == "readyForNewPeer")
      {
        if (json.peerType == "webcam")
        {
          client.peerStatus[json.fromPlayerId] = "streamReceived";
          client.acceptPeerState = "idle";
          if (client.acceptPeerTimeout != null)
          {
            console.log(id + " removed acceptPeerTimeout");
            clearTimeout(client.acceptPeerTimeout);
          }
          console.log(id + " is ready to accept new peers.");
          this.allClientsProcessNewPeerQueue();
        }
      }
      else if (json.type == "connectionFailure")
      {
        if (json.peerType == "webcam")
        {
          console.log("connection failure reported by " + id + ", with " + json.fromPlayerId);
          client.peerStatus[json.fromPlayerId] = "connectionFailure";
          for(clientI of this.clients)
          {
            if(clientI.playerId == json.fromPlayerId)
            {
              console.log("Found match")
              if (clientI.peerStatus[id] == "connectionFailure" && clientI.initiated)
              {
                // both peers have lost connection with each other but the connection with the server is ok.
                // retry connection
                console.log("Retrying peer connection from " + id + " to " + json.fromPlayerId);
                clientI.sendNewPeer(client);
              }
            }
          }
      }
      }
      else if (json.type == "reset")
      {
        this.resetGame(this);
        for (let card of Object.values(this.gameObj.cards))
        {
          this.addToChangedCardsBuffer(card.id);
        }
        for (let deck of Object.values(this.gameObj.decks))
        {
          this.addToChangedCardsBuffer(deck.id);
        }
        this.broadcastReset();
        this.broadcast();
      }
      else if (json.type == "resetWebcam")
      {
        client.isReset = true;
        this.broadcastLeftPeer(id);
        this.broadcastNewPeer(client, id, ws);
      }
      else if (json.type == "takeSnapshot")
      {
        this.snapshot = JSON.stringify(this.gameObj);
        //console.log(this.snapshot);
      }
      else if (json.type == 'recoverSnapshot')
      {
        this.restoreSnapshot();
        for (let card of Object.values(this.gameObj.cards))
        {
          this.addToChangedCardsBuffer(card.id);
        }
        this.broadcastReset();
        this.broadcast();
      }
      else if (json.type == "draw")
      {
        player.addDrawCoordinates(json.coords);
        for(clientI of this.clients)
        {
          clientI.addDrawCoordinates(id, json.coords);
        }
      }
      else if (json.type == "devToolsState")
      {
        this.broadcastDevToolsState(id, json.opened);
      }
      
    });
    
    ws.on('close', () => {
      this.turnServer.removeUser(this.turnServer);
      console.log("removed turnCredentials for player " + id);
      client.clearTimeouts();
      client.initiated = false;
      var removeIndexClients = this.clients.map(function(item) { return item.playerId; }).indexOf(id);
      this.clients.splice(removeIndexClients, 1);

      // var removeIndexGameObj = this.gameObj.players.map(function(item){ return item.id;}).indexOf(id);
      // this.gameObj.players.splice(removeIndexGameObj, 1);

      delete this.gameObj.players[id];

      this.playerNumbers[id] = true;
      this.broadcastLeftPeer(id);

    });

    // this.broadcastNewPeer(id, ws);
    
  });

  this.resetGame(this);
  this.lastSentGameObj = JSON.stringify(this.gameObj);
  this.snapshot = JSON.stringify(this.gameObj);
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
  for (client of this.clients)
  {
    client.addToChangedCardsBuffer(newItem)
  }
}

WS_distributor.prototype.isDeck = function (id)
{
  if (id in this.gameObj.decks)
  {
    return true;
  }
  else
  {
    return false;
  }
}

WS_distributor.prototype.restoreSnapshot = function()
{
  var snapshotObj = JSON.parse(this.snapshot);
  this.gameObj.cards = {};
  this.gameObj.decks = {};
  this.gameObj.openboxes = {};
  this.gameObj.scoreboxes = snapshotObj.scoreboxes;

  for (let card of Object.values(snapshotObj.cards))
  {
    var newCard = new Card(card.id, card.x, card.y);

    for (var key in card)
    {
      newCard[key] = card[key];
    }

    this.gameObj.cards[newCard.id] = newCard;
  }

  for (let openbox of Object.values(snapshotObj.openboxes))
  {
    var newOpenbox = new Openbox(openbox.id, openbox.x, openbox.y, openbox.width, openbox.height);
    for (var key in openbox)
    {
      if (key !== "attachedCards")
      {
        newOpenbox[key] = openbox[key];
      }
    }
    
    this.gameObj.openboxes[newOpenbox.id] = newOpenbox;
  }

  for (let deck of Object.values(snapshotObj.decks))
  {
    var newDeck = new Deck(deck.id, deck.x, deck.y, deck.width, deck.height);
    for (var key in deck)
    {
      if (key !== "attachedCards" && key !== "attachedOpenboxes")
      {
        newDeck[key] = deck[key];
      }
    }

    for (let card of Object.values(deck.attachedCards))
    {
      // var cardToAttach = this.gameObj.cards.find(function(cardToAttach){
      //   return cardToAttach.id === card.id;
      // });
      var cardToAttach = this.gameObj.cards[card.id];
      newDeck.attachedCards[cardToAttach.id] = cardToAttach;
    }

    for (let openbox of Object.values(deck.attachedOpenboxes))
    {
      // var openboxToAttach = this.gameObj.openboxes.find(function(openboxToAttach){
      //   return openboxToAttach.id === openbox.id;
      // });
      var openboxToAttach = this.gameObj.openboxes[openbox.id];
      newDeck.attachedOpenboxes[openbox.id] = openboxToAttach;
    }

    this.gameObj.decks[newDeck.id] = newDeck;
  }

}

WS_distributor.prototype.broadcastLeftPeer = function (playerId)
{
  for (clientI of this.clients)
  {
    if (clientI.playerId != playerId)
    {
      //delete clientI.peerStatus[playerId];
      clientI.peerStatus[playerId] = 'left';
    }
  }
  var sendData = {
    type: "leftPeer",
    playerId: playerId,
    peerType: "webcam"
  }
  var strToSend = JSON.stringify(sendData);
  var binaryString = this.constructMessage(strToSend);
  for (clientI of this.clients)
  {
    if (clientI.playerId != playerId)
    {
      //delete clientI.peerStatus[playerId];
      clientI.sendBinaryString(binaryString);
    }
  }
  // this.wss.clients.forEach(function each(client) {
  //   if (client.readyState === WebSocket.OPEN && client.playerId != playerId) {
  //     client.send(binaryString);
  //   }
  // });
}

// WS_distributor.prototype.newPeerReceived = function (playerId, forPlayerId){
//   for (clientI of this.clients)
//   {
//     if (clientI.playerId != playerId)
//     {
//       // clientI.peerStatus[playerId] = "newPeerSent";
//     }
//   }
// }

WS_distributor.prototype.broadcastNewPeer = function (client, playerId, newWs){
  for (clientI of this.clients)
  {
    if (clientI.playerId != playerId)
    {
      // console.log("clientI.peerStatus[" + playerId + "] = " + clientI.peerStatus[playerId])
      if(clientI.initiated)// && clientI.peerStatus[playerId] != "streamReceived" && clientI.peerStatus[playerId] != "peerAccepted")
      {
        clientI.peerStatus[playerId] = "newPeerSent";
        clientI.sendNewPeer(client);
      }
      
    }
  }
}

WS_distributor.prototype.allClientsProcessNewPeerQueue = function()
{
  for(clientI of this.clients)
  {
  // if(clientI.playerId != id)
  // {
    if(clientI.newPeerState == "idle" && clientI.initiated)
    {
      clientI.processNewPeerQueue();
    }
  // }
  }
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