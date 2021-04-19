let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;
let Scorebox = require('../scorebox').Scorebox;

let Game = require('../base_game').Game;

function MK_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

MK_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];
  game.gameObj.scoreboxes = [];
  game.gameObj.sharedPlayerbox = new Openbox("sharedPlayerbox", 480, 540, 1920 - 480, 540);
  game.gameObj.projectionBoxScale = 0.16666667;
  game.gameObj.projectionBoxes = [];
  game.gameObj.projectionBoxes.push({y: 90, x: 240});
  game.gameObj.projectionBoxes.push({y: 990, x: 240});
  game.gameObj.projectionBoxes.push({y: 450, x: 240});
  game.gameObj.projectionBoxes.push({y: 630, x: 240});
  game.gameObj.projectionBoxes.push({y: 270, x: 240});
  game.gameObj.projectionBoxes.push({y: 810, x: 240});

  game.gameObj.highestZ = 10000;

  var startX = 480;
  var startY = 0;
  var doorDeck = new Deck("doorDeck", startX, startY, 152, 264);
  doorDeck.setImmovable();
  var doorDiscardDeck = new Deck("doorDiscardDeck", 1920 - 152, startY, 152, 264);
  doorDiscardDeck.setImmovable();
  doorDeck.scale = 0.5;
  doorDiscardDeck.scale = 0.5;
  for (var i = 0; i < 96; i++)
  {
    newDoorCard = new Card('door' + i, startX, startY + 60);
    newDoorCard.backface = '/img/mk/cards/door_bf.png';
    newDoorCard.frontface = '/img/mk/cards/doors/card' + pad(i, 3) + '.png';
    newDoorCard.show = 'backface';
    newDoorCard.scale = doorDeck.scale;
    game.gameObj.cards.push(newDoorCard);
    doorDeck.attachedCards.push(newDoorCard);
  }

  game.gameObj.decks.push(doorDeck);
  game.gameObj.decks.push(doorDiscardDeck);

  startX = 480;
  startY = 270;
  var treasureDeck = new Deck("treasureDeck", startX, startY, 152, 264);
  treasureDeck.setImmovable();
  var treasureDiscardDeck = new Deck("treasureDiscardDeck", 1920 - 152, startY, 152, 264);
  treasureDiscardDeck.setImmovable();
  treasureDeck.scale = 0.5;
  treasureDiscardDeck.scale = 0.5;
  for (var i = 0; i < 74; i++)
  {
    newTreasureCard = new Card('treasure' + i, startX, startY + 60);
    newTreasureCard.backface = '/img/mk/cards/treasure_bf.png';
    newTreasureCard.frontface = '/img/mk/cards/treasure/card' + pad(i, 3) + '.png';
    newTreasureCard.show = 'backface';
    newTreasureCard.scale = treasureDeck.scale;
    game.gameObj.cards.push(newTreasureCard);
    treasureDeck.attachedCards.push(newTreasureCard);
  }

  game.gameObj.decks.push(treasureDeck);
  game.gameObj.decks.push(treasureDiscardDeck);

  game.gameObj.openboxes.push(new Openbox('openbox0', 480+152, 0, 1920 - (480 + (152*2)), 540))
  game.gameObj.openboxes.push(new Openbox('openbox1', 480+910, 540, 530, 540))

}

module.exports = {MK_Game: MK_Game}