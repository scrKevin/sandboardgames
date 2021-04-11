let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;
let Scorebox = require('../scorebox').Scorebox;

let Game = require('../base_game').Game;

function SOC_Game(wss){
  this.game = new Game(wss, this.resetGame);
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

SOC_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];
  game.gameObj.scoreboxes = [];

  var positionArray = [];
  xStart = 736;
  for (var i = 0; i < 3; i++)
  {
    positionArray.push({x: (xStart + (i * 148)), y: 195});
  }
  xStart = 662;
  for (var i = 0; i < 4; i++)
  {
    positionArray.push({x: (xStart + (i * 148)), y: 323});
  }
  xStart = 588;
  for (var i = 0; i < 5; i++)
  {
    positionArray.push({x: (xStart + (i * 148)), y: 451});
  }
  xStart = 662;
  for (var i = 0; i < 4; i++)
  {
    positionArray.push({x: (xStart + (i * 148)), y: 579});
  }
  xStart = 736;
  for (var i = 0; i < 3; i++)
  {
    positionArray.push({x: (xStart + (i * 148)), y: 707});
  }

  var shuffledPositions = shuffle(positionArray);
  // console.log(shuffledPositions);

  var hexObj = {
    "brick": {img: 'hex_brick.png', quantity: 3},
    "desert": {img: 'hex_desert.png', quantity: 1},
    "ore": {img: 'hex_ore.png', quantity: 3},
    "wheat": {img: 'hex_wheat.png', quantity: 4},
    "wood": {img: 'hex_wood.png', quantity: 4},
    "wool": {img: 'hex_wool.png', quantity: 4}
  }

  var diceDeck = new Deck("diceDeck", 20, 20);
  game.gameObj.decks.push(diceDeck);

  var numberPositions = [];

  var index = 0;
  for (hex in hexObj)
  {
    for (var i = 0; i < hexObj[hex].quantity; i++)
    {
      var newHexCard = new Card("hex_" + index, shuffledPositions[index].x, shuffledPositions[index].y);
      game.gameObj.cards.push(newHexCard);
      if (hex != "desert")
      {
        numberPositions.push({x: shuffledPositions[index].x + 52, y: shuffledPositions[index].y + 65})
      }
      else
      {
        var robberCard = new Card("robber0", shuffledPositions[index].x + 40, shuffledPositions[index].y + 45);
        game.gameObj.cards.push(robberCard);
      }
      index++;
    }
  }

  var shuffledNumberPositions = shuffle(numberPositions);
  // console.log(shuffledNumberPositions);

  index = 0;
  for (var i = 2; i <= 12; i++)
  {
    var jTotal = 2;
    if (i == 2 || i == 12){
      jTotal = 1;
    }
    if (i != 7)
    {
      for (var j = 1; j <= jTotal; j++)
      {
        // console.log(shuffledNumberPositions[index]);
        var newNumberCard = new Card("n_" + i + j, shuffledNumberPositions[index].x, shuffledNumberPositions[index].y);
        game.gameObj.cards.push(newNumberCard);
        index++;
      }
    }
  }

  var harbourPositions = [];

  harbourPositions.push({x: 1139, y: 106});
  harbourPositions.push({x: 1288, y: 361});
  harbourPositions.push({x: 1288, y: 615});
  harbourPositions.push({x: 1140, y: 871});
  harbourPositions.push({x: 844, y: 871});
  harbourPositions.push({x: 623, y: 745});
  harbourPositions.push({x: 475, y: 489});
  harbourPositions.push({x: 623, y: 232});
  harbourPositions.push({x: 842, y: 104});

  var shuffledHarbourPositions = shuffle(harbourPositions);

  // var hd0 = new Card("hex_d0", 736, 195);
  // game.gameObj.cards.push(hd0)
  for (var i = 0; i < shuffledHarbourPositions.length; i++)
  {
    var h0 = new Card("harbour" + i, shuffledHarbourPositions[i].x, shuffledHarbourPositions[i].y);
    game.gameObj.cards.push(h0)
  }
}

module.exports = {SOC_Game: SOC_Game}