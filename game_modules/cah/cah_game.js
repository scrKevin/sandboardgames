const fs = require('fs');
var path = require('path');

let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

let Game = require('../base_game').Game;

var cardsJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json')));


function CAH_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

function getRandom(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

function getRandomCards()
{
  var black = getRandom(cardsJson.blackCards, 20);
  var white = getRandom(cardsJson.whiteCards, 160);
  return {blackCards: black, whiteCards: white}
}

CAH_Game.prototype.resetGame = function(game)
{
  var cah_cards = getRandomCards();
  game.gameObj.cards = {};
  game.gameObj.decks = {};
  game.gameObj.openboxes = {};
  game.gameObj.scoreboxes = [];

  game.gameObj.highestZ = 10000;

  var rows = 4;
  var columns = 6;

  for (var i = 0; i < rows; i++)
  {
    for (var j = 0; j < columns; j++)
    {
      if (((i * columns) + j) < 20)
      {
        var startPosX = j * 300;
        var startPosY = (i * 180) + 240;
        var moveBtnDeck = new Deck('webcamMoveBtn' + ((i * columns) + j), startPosX, startPosY, 435, 261)
        var webcamBox = new Card('player' + ((i * columns) + j) + "box", startPosX, startPosY)
        game.gameObj.cards[webcamBox.id] = webcamBox;
        moveBtnDeck.attachedCards[webcamBox.id] = webcamBox;
        game.gameObj.decks[moveBtnDeck.id] = moveBtnDeck;
      }
    }
  }

  var whiteDeckX = 0;
  var whiteDeckY = 0;
  var whiteDeck = new Deck('whiteDeck', whiteDeckX, whiteDeckY, 139, 180)
  whiteDeck.setImmovable();

  var i = 0;
  for (whiteCardText of cah_cards.whiteCards)
  {
    var newCard = new Card('w' + i, whiteDeckX + 5, whiteDeckY + 80);
    newCard.faceType = 'text';
    newCard.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: " "};
    newCard.frontface = {color: "#000000", backgroundcolor: "#FFFFFF", text: whiteCardText};
    newCard.show = 'backface';
    whiteDeck.attachedCards[newCard.id] = newCard;
    game.gameObj.cards[newCard.id] = newCard;
    i++;
  }
  game.gameObj.decks[whiteDeck.id] = whiteDeck;

  var blackDeckX = 168;
  var blackDeckY = 0;
  var blackDeck = new Deck('blackDeck', blackDeckX, blackDeckY, 139, 180)
  blackDeck.setImmovable();

  var i = 0;
  for (blackCard of cah_cards.blackCards)
  {
    var newCard = new Card('b' + i, blackDeckX + 5, blackDeckY + 80);
    newCard.faceType = 'text';
    newCard.backface = {color: "#FFFFFF", backgroundcolor: "#000000", text: " "};
    newCard.frontface = {color: "#FFFFFF", backgroundcolor: "#000000", text: blackCard.text};
    newCard.show = 'backface';
    blackDeck.attachedCards[newCard.id] = newCard;
    game.gameObj.cards[newCard.id] = newCard;
    i++;
  }
  game.gameObj.decks[blackDeck.id] = blackDeck;

  openbox = new Openbox('openbox0', 336, 0, 1610, 240);
  game.gameObj.openboxes[openbox.id] = openbox;
}


module.exports = {CAH_Game: {class: CAH_Game, nBlackCards: 20, nWhiteCards: 160}}