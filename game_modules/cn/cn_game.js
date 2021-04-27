const fs = require('fs');
var path = require('path');

let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

let Game = require('../base_game').Game;

var wordArray = fs.readFileSync(path.join(__dirname, 'words_nl.txt')).toString().split("\n");

function CN_Game(wss, turnServer){
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
  return getRandom(wordArray, 25);
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}
function shuffle(a){
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

CN_Game.prototype.resetGame = function(game)
{
  var words = getRandomCards();
  //console.log(words);
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];
  game.gameObj.scoreboxes = [];

  game.gameObj.highestZ = 10000;

  var redOrBlue = getRandomIntInclusive(0, 1);
  var redCards = 9;
  var blueCards = 9;
  if (redOrBlue == 0)
  {
    redCards = 8;
  }
  else
  {
    blueCards = 8;
  }
  cardArray = [];
  for (var i = 0; i < redCards; i++)
  {
    cardArray.push({color: "#FFFFFF", backgroundcolor: "#FF0000"});
  }
  for (var i = 0; i < blueCards; i++)
  {
    cardArray.push({color: "#FFFFFF", backgroundcolor: "#0000FF"});
  }

  for (var i = 0; i < 7; i++)
  {
    cardArray.push({color: "#000000", backgroundcolor: "#cec2b2"});
  }

  cardArray.push({color: "#FFFFFF", backgroundcolor: "#000000"});

  shuffle(cardArray);

  var cardDeck = new Deck('cardDeck', 436, 220, 1048, 860);

  for (var i = 0; i < 5; i++)
  {
    for (var j = 0; j < 5; j++)
    {
      var textCard = new Card("textCard" + i + j, 446 + (i * 212), 260 + (j * 160));
      textCard.faceType = 'text';
      textCard.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: words[(i*5) + j]}
      textCard.frontface = {color: cardArray[(i*5) + j].color, backgroundcolor: cardArray[(i*5) + j].backgroundcolor, text: words[(i*5) + j]}
      textCard.show = 'backface';
      cardDeck.attachedCards.push(textCard);
      game.gameObj.cards.push(textCard);
    }
  }

  game.gameObj.decks.push(cardDeck);

  for (var amount = 0; amount < 5; amount++)
  {
    for (var type = 1; type <= 2; type++)
    {
      game.gameObj.cards.push(new Card("spy1" + String(amount) + String(type), 100, 50));
    }
  }

  for (var amount = 0; amount < 5; amount++)
  {
    for (var type = 1; type <= 2; type++)
    {
      game.gameObj.cards.push(new Card("spy2" + String(amount) + String(type), 1920 - 300, 50));
    }
  }

  for (var amount = 0; amount < 4; amount++)
  {
    for (var type = 1; type <= 2; type++)
    {
      game.gameObj.cards.push(new Card("innocent" + String(amount) + String(type), 600, 50));
    }
  }

  game.gameObj.cards.push(new Card("assassin", 1920 - 800, 50));

  var rows = 10;
  var columns = 2;

  for (var i = 0; i < rows; i++)
  {
    for (var j = 0; j < columns; j++)
    {
      if (((i * columns) + j) < 20)
      {
        var startPosX = j * (1920-340);
        var startPosY = (i * 240) + 240;
        var moveBtnDeck = new Deck('webcamMoveBtn' + ((i * columns) + j), startPosX, startPosY, 435, 261)
        var webcamBox = new Card('player' + ((i * columns) + j) + "box", startPosX, startPosY)
        game.gameObj.cards.push(webcamBox)
        moveBtnDeck.attachedCards.push(webcamBox)
        game.gameObj.decks.push(moveBtnDeck)
      }
    }
  }
}


module.exports = {CN_Game: CN_Game}