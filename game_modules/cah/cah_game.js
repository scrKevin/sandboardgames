let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

let Game = require('../base_game').Game;

function CAH_Game(wss){
  this.game = new Game(wss, this.resetGame);
}

CAH_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];

  for (var i = 0; i < 5; i++)
  {
    for (var j = 0; j < 4; j++)
    {
      var startPosX = j * 300;
      var startPosY = i * 45;
      var moveBtnDeck = new Deck('webcamMoveBtn' + ((i * 4) + j), startPosX, startPosY, 32, 32)
      var webcamBox = new Card('webcambox' + ((i * 4) + j), startPosX, startPosY)
      game.gameObj.cards.push(webcamBox)
      moveBtnDeck.attachedCards.push(webcamBox)
      game.gameObj.decks.push(moveBtnDeck)
    }
  }

  for (var p = 1; p <= 14; p++)
  {
    if (p != 4)
    {
      for (var n = 0; n < 40; n++)
      {
        
      }
    }
  }
}