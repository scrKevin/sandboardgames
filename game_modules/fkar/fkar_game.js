let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

var Startpositions = require("./startpositions")

let Game = require('../base_game').Game;

function FKAR_Game(wss){
  this.game = new Game(wss, this.resetGame);
}

FKAR_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];

  var startDeckX = 255;
  var startDeckY = 0;
  var startDeck = new Deck('startDeck', startDeckX, startDeckY, 207, 185);

  var fakeArtistCard = new Card('f0', startDeckX + 5, startDeckY + 80);
  fakeArtistCard.faceType = 'text';
  fakeArtistCard.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: "Role"}
  fakeArtistCard.frontface = {color: "#000000", backgroundcolor: "#FFFFFF", text: "X"}
  fakeArtistCard.show = 'backface';
  startDeck.attachedCards.push(fakeArtistCard);
  game.gameObj.cards.push(fakeArtistCard);

  game.gameObj.decks.push(startDeck);

  var remainingDeckX = 465;
  var remainingDeckY = 0;
  var remainingDeck = new Deck('remainingDeck', remainingDeckX, remainingDeckY, 207, 185);

  for (var i = 0; i < 9; i++)
  {
    var remainingCard = new Card('r' + i, remainingDeckX + 5, remainingDeckY + 80);
    remainingCard.faceType = 'text';
    remainingCard.varText = true;
    remainingCard.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: "Role"};
    remainingCard.frontface = {color: "#000000", backgroundcolor: "#FFFFFF", text: ""}
    remainingCard.show = 'backface';
    remainingDeck.attachedCards.push(remainingCard);
    game.gameObj.cards.push(remainingCard);
  }

  game.gameObj.decks.push(remainingDeck);
}

module.exports = {FKAR_Game: FKAR_Game}