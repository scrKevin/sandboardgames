let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

let Game = require('../base_game').Game;

function RMK_Game(wss){
  this.game = new Game(wss, this.resetGame);
}

RMK_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];
  game.gameObj.scoreboxes = [];

  var tileDeckX = 960 - (134 / 2);
  var tileDeckY = 540 - (172 / 2);
  var tileDeck = new Deck('tileDeck', tileDeckX, tileDeckY, 134, 172);
  tileDeck.setImmovable();

  for (var j = 0; j < 2; j++)
  {
    for (var i = 1; i <= 13; i++)
    {
      var newTile = new Card("blue_" + j + "_" + i, tileDeckX + 5, tileDeckY + 80);
      newTile.faceType = 'text';
      newTile.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: " "};
      newTile.frontface = {color: "#002EFF", backgroundcolor: "#E1E7FF", text: String(i)};
      newTile.show = "backface";
      game.gameObj.cards.push(newTile);
      tileDeck.attachedCards.push(newTile);
    }
  }

  for (var j = 0; j < 2; j++)
  {
    for (var i = 1; i <= 13; i++)
    {
      var newTile = new Card("orange_" + j + "_" + i, tileDeckX + 5, tileDeckY + 80);
      newTile.faceType = 'text';
      newTile.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: " "};
      newTile.frontface = {color: "#FF9700", backgroundcolor: "#FFF1E4", text: String(i)};
      newTile.show = "backface";
      game.gameObj.cards.push(newTile);
      tileDeck.attachedCards.push(newTile);
    }
  }

  for (var j = 0; j < 2; j++)
  {
    for (var i = 1; i <= 13; i++)
    {
      var newTile = new Card("red_" + j + "_" + i, tileDeckX + 5, tileDeckY + 80);
      newTile.faceType = 'text';
      newTile.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: " "};
      newTile.frontface = {color: "#FF0000", backgroundcolor: "#FFE8E8", text: String(i)};
      newTile.show = "backface";
      game.gameObj.cards.push(newTile);
      tileDeck.attachedCards.push(newTile);
    }
  }

  for (var j = 0; j < 2; j++)
  {
    for (var i = 1; i <= 13; i++)
    {
      var newTile = new Card("black_" + j + "_" + i, tileDeckX + 5, tileDeckY + 80);
      newTile.faceType = 'text';
      newTile.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: " "};
      newTile.frontface = {color: "#000000", backgroundcolor: "#F3F3F3", text: String(i)};
      newTile.show = "backface";
      game.gameObj.cards.push(newTile);
      tileDeck.attachedCards.push(newTile);
    }
  }


  for (var i = 0; i < 2; i++)
  {
    var newTile = new Card("j_" + i, tileDeckX + 5, tileDeckY + 80);
    newTile.faceType = 'text';
    newTile.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: " "};
    newTile.frontface = {color: "#FFFFFF", backgroundcolor: "#FF0000", text: "J"};
    newTile.show = "backface";
    game.gameObj.cards.push(newTile);
    tileDeck.attachedCards.push(newTile);
  }

  game.gameObj.decks.push(tileDeck);

  game.gameObj.openboxes.push(new Openbox('openbox0', 320, 240, 1280, 262))
  game.gameObj.openboxes.push(new Openbox('openbox1', 320, 625, 1280, 214))
  game.gameObj.openboxes.push(new Openbox('openbox2', 320, 499, 573, 126))
  game.gameObj.openboxes.push(new Openbox('openbox3', 1027, 499, 573, 126))

  for (var i = 4; i < 20; i++)
  {
    var startPosX = 1920;
    var startPosY = 20 + (35 * i);
    var moveBtnDeck = new Deck('webcamMoveBtn' + i, startPosX, startPosY, 32, 32)
    var webcamBox = new Card('webcambox' + i, startPosX, startPosY)
    webcamBox.attachedToDeck = true;
    game.gameObj.cards.push(webcamBox)
    moveBtnDeck.attachedCards.push(webcamBox)
    game.gameObj.decks.push(moveBtnDeck)
  }
}

module.exports = {RMK_Game: RMK_Game}