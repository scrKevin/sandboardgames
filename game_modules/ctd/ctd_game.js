let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

var Startpositions = require("./startpositions")

let Game = require('../base_game').Game;

function CTD_Game(wss){
  this.game = new Game(wss, this.resetGame);
}

CTD_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];
}

module.exports = {CTD_Game: CTD_Game}