let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

let Game = require('../base_game').Game;

function SCBL_Game(wss){
  this.game = new Game(wss, this.resetGame);
}

SCBL_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];

  var tileDeckX = 352;
  var tileDeckY = 540 - (172 / 2);
  var tileDeck = new Deck('tileDeck', tileDeckX, tileDeckY, 117, 165);
  tileDeck.setImmovable();

  var scblNlObj = {
    "A": {points: 1, quantity: 6},
    "B": {points: 3, quantity: 2},
    "C": {points: 5, quantity: 2},
    "D": {points: 2, quantity: 5},
    "E": {points: 1, quantity: 18},
    "F": {points: 4, quantity: 2},
    "G": {points: 3, quantity: 3},
    "H": {points: 4, quantity: 2},
    "I": {points: 1, quantity: 4},
    "J": {points: 4, quantity: 2},
    "K": {points: 3, quantity: 3},
    "L": {points: 3, quantity: 3},
    "M": {points: 3, quantity: 3},
    "N": {points: 1, quantity: 10},
    "O": {points: 1, quantity: 6},
    "P": {points: 3, quantity: 2},
    "Q": {points: 10, quantity: 1},
    "R": {points: 2, quantity: 5},
    "S": {points: 2, quantity: 5},
    "T": {points: 2, quantity: 5},
    "U": {points: 4, quantity: 3},
    "V": {points: 4, quantity: 2},
    "W": {points: 5, quantity: 2},
    "X": {points: 8, quantity: 1},
    "Y": {points: 8, quantity: 1},
    "IJ": {points: 4, quantity: 2},
    "Z": {points: 4, quantity: 2},
    " ": {points: 0, quantity: 2},
  }

  var n = 0;
  for (letter in scblNlObj)
  {
    for (var i = 0; i < scblNlObj[letter].quantity; i++)
    {
      var newPiece = new Card("t" + n, tileDeckX + 5, tileDeckY + 80);
      newPiece.faceType = 'text';
      newPiece.backface = {color: "#000000", backgroundcolor: "#efe2d2", text: " ", secondarytext: " "};
      newPiece.frontface = {color: "#000000", backgroundcolor: "#efe2d2", text: letter, secondarytext: scblNlObj[letter].points}
      newPiece.show = "backface";
      tileDeck.attachedCards.push(newPiece);
      game.gameObj.cards.push(newPiece);
      n++;
    }
  }
  //console.log(n)
  game.gameObj.decks.push(tileDeck);
  game.gameObj.openboxes.push(new Openbox('openbox0', 818, 0, 1080, 1080))
}

module.exports = {SCBL_Game: SCBL_Game}