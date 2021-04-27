let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;
let Scorebox = require('../scorebox').Scorebox;

let Game = require('../base_game').Game;

function DX_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

DX_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];
  game.gameObj.scoreboxes = [];
  game.gameObj.sharedPlayerbox = new Openbox("sharedPlayerbox", 320, 1080 - 422, 1280, 422);
  game.gameObj.projectionBoxScale = 0.25;
  game.gameObj.projectionBoxes = [];
  game.gameObj.projectionBoxes.push({y: 240, x: 0});
  game.gameObj.projectionBoxes.push({y: 735 + 240, x: 1920 - 320});
  game.gameObj.projectionBoxes.push({y: 240, x: 1920 - 320});
  game.gameObj.projectionBoxes.push({y: 735 + 240, x: 0});
  game.gameObj.projectionBoxes.push({y: 364 + 240, x: 0});
  game.gameObj.projectionBoxes.push({y: 364 + 240, x: 1920 - 320});

  game.gameObj.highestZ = 10000;

  for (var i = 0; i < 6; i++)
  {
    game.gameObj.scoreboxes.push(new Scorebox(i));
  }

  var startX = 480;
  var startY = 422;
  var drawDeck = new Deck("drawDeck", startX, startY, 134, 236);
  drawDeck.setImmovable();
  drawDeck.scale = 0.5;
  for (var i = 1; i <= 181; i++)
  {
    newCard = new Card('card' + i, startX, startY + 60);
    newCard.backface = '/img/dx/cardback.png';
    newCard.frontface = '/img/dx/cards/card-' + pad(i, 4) + '.jpg';
    newCard.show = 'backface';
    newCard.scale = drawDeck.scale;
    game.gameObj.cards.push(newCard);
    drawDeck.attachedCards.push(newCard);
  }

  game.gameObj.decks.push(drawDeck);

  var voteDeck = new Deck("voteDeck", 480 + 134 + 120, 422, 462, 236);
  voteDeck.setImmovable();
  voteDeck.scale = 0.5;

  game.gameObj.decks.push(voteDeck);

  var discardDeck = new Deck("discardDeck", 480 + 134 + 120 + 462 + 120, 422, 134, 236);
  discardDeck.setImmovable();
  discardDeck.scale = 0.5;

  game.gameObj.decks.push(discardDeck);

  for (var j = 0; j < 6; j++)
  {
    for (var i = 1; i <= 6; i++)
    {
      var newTile = new Card("vote" + j + "_" + i, 320 + 1225, 1080 - 422 + 61 + ((i - 1)*50));
      newTile.faceType = 'text';
      newTile.ownedBy = j;
      newTile.backface = {color: "#000000", backgroundcolor: "#FFFFFF", text: " "};
      newTile.frontface = {color: "#FFFFFF", backgroundcolor: "#000000", text: String(i)};
      newTile.show = "backface";
      game.gameObj.cards.push(newTile);
    }
  }

  game.gameObj.openboxes.push(new Openbox('openbox0', 320, 0, 1280, 422))

  for (var i = 6; i < 20; i++)
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

module.exports = {DX_Game: DX_Game}