let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

// var Startpositions = require("./startpositions")

let Game = require('../base_game').Game;

var games = ['sh', 'sy', 'cah', 'rmk', 'ctd', 'fkar']

function Lobby_Game(wss){
  this.game = new Game(wss, this.resetGame);
}

Lobby_Game.prototype.resetGame = function(game)
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

  for (var i = 0; i < games.length; i++)
  {
    var startPosX = 1500;
    var startPosY = i * 60;
    var gameMoveBtnDeck = new Deck('gamecardMoveBtn' + i, startPosX, startPosY, 32, 32)
    var gameBox = new Card('gamecard' + i, startPosX, startPosY)
    game.gameObj.cards.push(gameBox)
    gameMoveBtnDeck.attachedCards.push(gameBox)
    game.gameObj.decks.push(gameMoveBtnDeck)
  }

}

module.exports = {Lobby_Game: Lobby_Game}