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

  game.gameObj.openboxes.push(new Openbox("upperOpenbox", 0, 0, 1920, 300))

  game.gameObj.cards.push(new Card('charactersCard', 0, 752))

  charactersDeckX = 500;
  charactersDeckY = 752;
  charactersDeck = new Deck('charactersDeck', charactersDeckX, charactersDeckY, 500, 200);

  var charCardData = [
    {color: "#000000", backgroundcolor: "#b1b1b1", text: "<span class='cN'>1</span>Assassin"},
    {color: "#000000", backgroundcolor: "#b1b1b1", text: "<span class='cN'>2</span>Thief"},
    {color: "#000000", backgroundcolor: "#b1b1b1", text: "<span class='cN'>3</span>Magician"},
    {color: "#000000", backgroundcolor: "#fffa65", text: "<span class='cN'>4</span>King"},
    {color: "#000000", backgroundcolor: "#80dcff", text: "<span class='cN'>5</span>Bishop"},
    {color: "#000000", backgroundcolor: "#8cff7e", text: "<span class='cN'>6</span>Merchant"},
    {color: "#000000", backgroundcolor: "#b1b1b1", text: "<span class='cN'>7</span>Architect"},
    {color: "#000000", backgroundcolor: "#ff4d4d", text: "<span class='cN'>8</span>Warlord"},
  ]

  for (var i = 1; i <= 8; i++)
  {
    c1Card = new Card('c' + i, charactersDeckX + 5, charactersDeckY + 50);
    c1Card.faceType = 'text';
    c1Card.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: " "};
    c1Card.frontface = charCardData[i - 1]
    c1Card.show = "backface";
    charactersDeck.attachedCards.push(c1Card);
    game.gameObj.cards.push(c1Card);
  }

  game.gameObj.decks.push(charactersDeck);
}

module.exports = {CTD_Game: CTD_Game}