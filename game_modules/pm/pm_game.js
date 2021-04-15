let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;
let Scorebox = require('../scorebox').Scorebox;

let Game = require('../base_game').Game;

function PM_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

PM_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];
  game.gameObj.scoreboxes = [];

  game.gameObj.highestZ = 10000;

  var diceDeck = new Deck("diceDeck", (320 + 150 + 5), 8, 970, 300);
 

  for (var i = 1; i <= 8; i++)
  {
    var dice1 = new Card("dice" + i, (diceDeck.x + 20) + ((i - 1) * 120), diceDeck.y + 60);
    dice1.rotationX = 0;
    dice1.rotationY = 0;
    game.gameObj.cards.push(dice1);
    diceDeck.attachedCards.push(dice1);
  }

  game.gameObj.decks.push(diceDeck);

  var startX = 320;
  var startY = 480;
  for (var i = 21; i <= 36; i++)
  {
      game.gameObj.cards.push(new Card("tile" + i, startX + ((i - 21) * 80), startY))
  }


}


module.exports = {PM_Game: PM_Game}