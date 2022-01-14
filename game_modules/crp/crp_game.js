let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;
let Scorebox = require('../scorebox').Scorebox;

let Game = require('../base_game').Game;

function CRP_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

CRP_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = {};
  game.gameObj.decks = {};
  game.gameObj.openboxes = {};
  game.gameObj.scoreboxes = [];
  game.gameObj.sharedPlayerbox = new Openbox("sharedPlayerbox", 0, 0, 540, 1080);
  game.gameObj.projectionBoxScale = 0.3333333333;
  game.gameObj.projectionBoxes = [];
  game.gameObj.projectionBoxes.push({y: 0, x: 1200-180});
  game.gameObj.projectionBoxes.push({y: 720, x: 1470+270});
  game.gameObj.projectionBoxes.push({y: 0, x: 1470+270});
  game.gameObj.projectionBoxes.push({y: 720, x: 1200-180});
  game.gameObj.projectionBoxes.push({y: 360, x: 1470+270});
  game.gameObj.projectionBoxes.push({y: 360, x: 1200-180});

  game.gameObj.highestZ = 10000;

  var startX = 600;
  var startY = 0;
  var cardDeck = new Deck("cardDeck", startX, startY, 152, 264);
  cardDeck.scale = 1;
  var types = [
    'bat',
    'toad',
    'rat',
    'cockroach',
    'bug',
    'scorpion',
    'spider',
    'fly'
  ]
  var cardId = 0
  for (let cardType of types) {
    for (var i = 0; i < 8; i++)
    {
      newCard = new Card('card' + cardId, startX, startY + 100);
      newCard.backface = '/img/crp/bf.png';
      newCard.frontface = '/img/crp/' + cardType + '.png';
      newCard.show = 'backface';
      newCard.scale = cardDeck.scale;
      game.gameObj.cards[newCard.id] = newCard;
      cardDeck.attachedCards[newCard.id] = newCard;
      cardId++;
    }
  }

  game.gameObj.decks[cardDeck.id] = cardDeck;


  game.gameObj.openboxes['openbox0'] = new Openbox('openbox0', 540 + 60, 540, 480, 540);
  game.gameObj.openboxes['openbox1'] = new Openbox('openbox1', 0, 540, 540, 540);

  for (var i = 6; i < 20; i++)
  {
    var startPosX = 1920;
    var startPosY = 20 + (35 * i);
    var moveBtnDeck = new Deck('webcamMoveBtn' + i, startPosX, startPosY, 32, 32)
    var webcamBox = new Card('webcambox' + i, startPosX, startPosY)
    webcamBox.attachedToDeck = true;
    game.gameObj.cards[webcamBox.id] = webcamBox;
    moveBtnDeck.attachedCards[webcamBox.id] = webcamBox;
    game.gameObj.decks[moveBtnDeck.id] = moveBtnDeck;
  }

}

module.exports = {CRP_Game: CRP_Game}