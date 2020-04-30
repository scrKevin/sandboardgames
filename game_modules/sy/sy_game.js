let Deck = require('../deck').Deck;
let Card = require('../card').Card;

var Startpositions = require("./startpositions")

let Game = require('../base_game').Game;

function SY_Game(wss){
  this.game = new Game(wss, this.resetGame);
}

SY_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];
  game.gameObj.scoreboxes = [];
  
  var pionRed = new Card('pion-red', 1620, 880);
  game.gameObj.cards.push(pionRed);
  var pionGreen = new Card('pion-green', 1680, 880);
  game.gameObj.cards.push(pionGreen);
  var pionBlue = new Card('pion-blue', 1740, 880);
  game.gameObj.cards.push(pionBlue);
  var pionOrange = new Card('pion-orange', 1800, 880);
  game.gameObj.cards.push(pionOrange);
  var pionYellow = new Card('pion-yellow', 1860, 880);
  game.gameObj.cards.push(pionYellow);
  var pionWhite = new Card('pion-white', 1560, 880);
  game.gameObj.cards.push(pionWhite);

  var blackTickets = [];
  for (var i = 0; i < 5; i++)
  {
    blackTickets.push(new Card('black-ticket' + i, 1600 + (60 * i), 1000))
    game.gameObj.cards.push(blackTickets[i]);
  }

  var twoXTickets = [];
  for (var i = 0; i < 2; i++)
  {
    twoXTickets.push(new Card('2x' + i, 1600 + (60 * i), 1040))
    game.gameObj.cards.push(twoXTickets[i]);
  }

  for (var j = 0; j < 6; j++)
  {
    var xOffset = 0;
    if (j == 1 || j == 3 || j == 5)
    {
      xOffset = -50
    }
    var deckPosX = Startpositions.webcamPos[j].left - 6 + xOffset;
    var deckPosY = Startpositions.webcamPos[j].top + 184;
    var newTaxiDeck = new Deck('taxiDeck' + j, deckPosX, deckPosY, 104, 66);
    for (var i = 0; i < 11; i++)
    {
      var newTaxi = new Card('taxi' + (i + (j * 11)), deckPosX + 20 + (i * 2), deckPosY + 5 + (i * 2));
      game.gameObj.cards.push(newTaxi);
      newTaxiDeck.attachedCards.push(newTaxi);
    }
    game.gameObj.decks.push(newTaxiDeck)
  }
  for (var j = 0; j < 6; j++)
  {
    var xOffset = 0;
    if (j == 1 || j == 3 || j == 5)
    {
      xOffset = -50
    }
    var deckPosX = Startpositions.webcamPos[j].left + 98 + xOffset;
    var deckPosY = Startpositions.webcamPos[j].top + 184;
    var newBusDeck = new Deck('busDeck' + j, deckPosX, deckPosY, 104, 66);
    for (var i = 0; i < 8; i++)
    {
      var newBus = new Card('bus' + (i + (j * 8)), deckPosX + 20 + (i * 2), deckPosY + 5 + (i * 2));
      game.gameObj.cards.push(newBus);
      newBusDeck.attachedCards.push(newBus);
    }
    game.gameObj.decks.push(newBusDeck)
  }
  for (var j = 0; j < 6; j++)
  {
    var xOffset = 0;
    if (j == 1 || j == 3 || j == 5)
    {
      xOffset = -50
    }
    var deckPosX = Startpositions.webcamPos[j].left + 202 + xOffset;
    var deckPosY = Startpositions.webcamPos[j].top + 184;
    var newMetroDeck = new Deck('metroDeck' + j, deckPosX, deckPosY, 104, 66);
    for (var i = 0; i < 4; i++)
    {
      var newMetro = new Card('metro' + (i + (j * 4)), deckPosX + 20 + (i * 2), deckPosY + 5 + (i * 2));
      game.gameObj.cards.push(newMetro);
      newMetroDeck.attachedCards.push(newMetro);
    }
    game.gameObj.decks.push(newMetroDeck)
  }
  for (var i = 6; i < 20; i++)
  {
    var startPosX = 1920;
    var startPosY = 20 + (35 * i);
    var moveBtnDeck = new Deck('webcamMoveBtn' + i, startPosX, startPosY, 32, 32)
    var webcamBox = new Card('webcambox' + i, startPosX, startPosY)
    game.gameObj.cards.push(webcamBox)
    moveBtnDeck.attachedCards.push(webcamBox)
    game.gameObj.decks.push(moveBtnDeck)
  }
}

module.exports = {SY_Game: SY_Game}