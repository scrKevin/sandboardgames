let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

let Game = require('../base_game').Game;

function STRG_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

STRG_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = {};
  game.gameObj.decks = {};
  game.gameObj.openboxes = {};
  game.gameObj.scoreboxes = [];

  game.gameObj.highestZ = 10000;

  var pieces = {
    "B": {img: "B.svg", info: "Bomb", quantity: 6},
    "10": {img: "1.svg", info: "Marshall", quantity: 1},
    "9": {img: "2.svg", info: "General", quantity: 1},
    "8": {img: "3.svg", info: "Colonel", quantity: 2},
    "7": {img: "4.svg", info: "Major", quantity: 3},
    "6": {img: "5.svg", info: "Captain", quantity: 4},
    "5": {img: "6.svg", info: "Lieutenant", quantity: 4},
    "4": {img: "7.svg", info: "Sergeant", quantity: 4},
    "3": {img: "8.svg", info: "Miner", quantity: 5},
    "2": {img: "9.svg", info: "Scout", quantity: 8},
    "S": {img: "S.svg", info: "Spy", quantity: 1},
    "F": {img: "F.svg", info: "Flag", quantity: 1},
  }

  var n = 0;

  var rStartX = 0;
  var rStartY = 400;

  var nInRow = 5

  for (piece in pieces)
  {
    for (var i = 0; i < pieces[piece].quantity; i++)
    {
      var xPos = ((n % nInRow) * (420 / nInRow)) + rStartX;
      var yPos = (Math.floor(n / nInRow) * (420 / nInRow)) + rStartY;
      var newPiece = new Card("r" + n, xPos, yPos);
      newPiece.faceType = 'text';
      newPiece.backface = {color: "#FFFFFF", backgroundcolor: "#FF0000", text: " ", secondarytext: " "};
      newPiece.frontface = {color: "#FFFFFF", backgroundcolor: "#FF0000", text: piece, secondarytext: "<img src='/img/strg/pieces/" + pieces[piece].img + "' />"}
      newPiece.show = "backface";
      newPiece.visibleFor = 0;
      game.gameObj.cards[newPiece.id] = newPiece;
      n++;
    }
  }

  n = 0;
  rStartX = 1500;
  rStartY = 0;

  for (piece in pieces)
  {
    for (var i = 0; i < pieces[piece].quantity; i++)
    {
      var xPos = ((n % nInRow) * (420 / nInRow)) + rStartX;
      var yPos = (Math.floor(n / nInRow) * (420 / nInRow)) + rStartY;
      var newPiece = new Card("b" + n, xPos, yPos);
      newPiece.faceType = 'text';
      newPiece.backface = {color: "#FFFFFF", backgroundcolor: "#0000FF", text: " ", secondarytext: " "};
      newPiece.frontface = {color: "#FFFFFF", backgroundcolor: "#0000FF", text: piece, secondarytext: "<img src='/img/strg/pieces/" + pieces[piece].img + "' />"}
      newPiece.show = "backface";
      newPiece.visibleFor = 1;
      game.gameObj.cards[newPiece.id] = newPiece;
      n++;
    }
  }

  game.gameObj.cards['cheatsheet'] = new Card('cheatsheet', 460, 1081);

  for (var i = 2; i < 20; i++)
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

module.exports = {STRG_Game: STRG_Game}