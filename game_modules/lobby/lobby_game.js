let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

// var Startpositions = require("./startpositions")

let Game = require('../base_game').Game;

//var games = ['sh', 'sy', 'cah', 'rmk', 'ctd', 'fkar', 'strg', 'scbl', 'soc', 'pm', 'mk']
var games = [];

function Lobby_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
  this.gamesList = [];
}

function setGamesList(newGamesList)
{
  games = newGamesList;
}

Lobby_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = {};
  game.gameObj.decks = {};
  game.gameObj.openboxes = {};
  game.gameObj.scoreboxes = [];

  game.gameObj.highestZ = 10000;

  for (var i = 0; i < 5; i++)
  {
    for (var j = 0; j < 4; j++)
    {
      var startPosX = j * 300;
      var startPosY = i * 45;
      var moveBtnDeck = new Deck('webcamMoveBtn' + ((i * 4) + j), startPosX, startPosY, 32, 32)
      var webcamBox = new Card('webcambox' + ((i * 4) + j), startPosX, startPosY)
      game.gameObj.cards[webcamBox.id] = webcamBox;
      moveBtnDeck.attachedCards[webcamBox.id] = webcamBox;
      game.gameObj.decks[moveBtnDeck.id] = moveBtnDeck;
    }
  }

  for (var i = 0; i < games.length; i++)
  {
    var startPosX = 1500;
    var startPosY = i * 60;
    var gameMoveBtnDeck = new Deck('gamecardMoveBtn' + i, startPosX, startPosY, 32, 32)
    var gameBox = new Card('gamecard' + i, startPosX, startPosY)
    game.gameObj.cards[gameBox.id] = gameBox;
    gameMoveBtnDeck.attachedCards[gameBox.id] = gameBox;
    game.gameObj.decks[gameMoveBtnDeck.id] = gameMoveBtnDeck;
  }

  var moveWatchPartyDeck = new Deck("watchPartyMoveBtn", 0, 0, 32, 32)
  var watchPartyBox = new Card("watchPartyBox", 0, 0)
  game.gameObj.cards[watchPartyBox.id] = watchPartyBox;
  moveWatchPartyDeck.attachedCards[watchPartyBox.id] = watchPartyBox;
  game.gameObj.decks[moveWatchPartyDeck.id] = moveWatchPartyDeck;

}

module.exports = {Lobby_Game: Lobby_Game, setGamesList: setGamesList};