let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

var Startpositions = require("./startpositions")

let Game = require('../base_game').Game;

function FKAR_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

FKAR_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = {};
  game.gameObj.decks = {};
  game.gameObj.openboxes = {};
  game.gameObj.scoreboxes = [];

  game.gameObj.highestZ = 10000;

  for (let player of Object.values(game.gameObj.players))
  {
    player.drawArray = [];
  }

  var startDeckX = 255;
  var startDeckY = 0;
  var startDeck = new Deck('startDeck', startDeckX, startDeckY, 207, 185);

  var fakeArtistCard = new Card('f0', startDeckX + 5, startDeckY + 80);
  fakeArtistCard.faceType = 'text';
  fakeArtistCard.backface = {color: "#000000", backgroundcolor: "#FF0000", text: " "}
  fakeArtistCard.frontface = {color: "#000000", backgroundcolor: "#FFFFFF", text: "X"}
  fakeArtistCard.show = 'backface';
  startDeck.attachedCards[fakeArtistCard.id] = fakeArtistCard;
  game.gameObj.cards[fakeArtistCard.id] = fakeArtistCard;

  game.gameObj.decks[startDeck.id] = startDeck;

  var remainingDeckX = 465;
  var remainingDeckY = 0;
  var remainingDeck = new Deck('remainingDeck', remainingDeckX, remainingDeckY, 207, 185);

  for (var i = 0; i < 9; i++)
  {
    var remainingCard = new Card('r' + i, remainingDeckX + 5, remainingDeckY + 80);
    remainingCard.faceType = 'text';
    remainingCard.varText = true;
    remainingCard.backface = {color: "#000000", backgroundcolor: "#FF0000", text: " "};
    remainingCard.frontface = {color: "#000000", backgroundcolor: "#FFFFFF", text: ""}
    remainingCard.show = 'backface';
    remainingDeck.attachedCards[remainingCard.id] = remainingCard;
    game.gameObj.cards[remainingCard.id] = remainingCard;
  }

  game.gameObj.decks[remainingDeck.id] = remainingDeck;

  for (var i = 10; i < 20; i++)
  {
    var startPosX = 1920;
    var startPosY = 20 + (35 * i);
    var moveBtnDeck = new Deck('webcamMoveBtn' + i, startPosX, startPosY, 32, 32)
    var webcamBox = new Card('webcambox' + i, startPosX, startPosY)
    webcamBox.attachedToDeck = true;
    game.gameObj.cards[webcamBox.id] = webcamBox;
    moveBtnDeck.attachedCards[webcamBox.id] = webcamBox;
    game.gameObj.decks[moveBtnDeck.id] = moveBtnDeck;
  }
}

module.exports = {FKAR_Game: FKAR_Game}