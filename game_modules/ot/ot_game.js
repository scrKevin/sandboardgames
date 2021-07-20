let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

let Game = require('../base_game').Game;

function OT_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

OT_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = {};
  game.gameObj.decks = {};
  game.gameObj.openboxes = {};
  game.gameObj.scoreboxes = [];

  game.gameObj.highestZ = 10000;

  game.gameObj.playerRotation = 180;

  var movesDeck = new Deck("movesDeck", 1920-360, 0, 360, 220);
  movesDeck.setImmovable();

  var rotationBox1 = new Openbox('o1', 0, 0, 1298, 338);
  rotationBox1.showFace = 'frontface'
  rotationBox1.rotation = 180;

  var rotationBox2 = new Openbox('o2', 1298, 0, 622, 743);
  rotationBox2.showFace = 'frontface'
  rotationBox2.rotation = 180;

  game.gameObj.openboxes[rotationBox1.id] = rotationBox1
  game.gameObj.openboxes[rotationBox2.id] = rotationBox2

  for (var i = 1; i <= 16; i++)
  {
    posX = 1920 - 360
    posY = 20
    newCard = new Card('m' + i, posX, posY);
    newCard.backface = '/img/ot/m' + i + '.png';
    newCard.frontface = '/img/ot/m' + i + '.png';
    newCard.rotatable = true;
    newCard.rotation = 0;
    //newCard.show = 'frontface';
    game.gameObj.cards[newCard.id] = newCard;
    movesDeck.attachedCards[newCard.id] = newCard;
  }

  startX = 622.5 + 37,5 - 3
  startY = 202.5 + 37.5 - 3

  for (var i = 0; i < 5; i++)
  {
    posX = startX + (i*135)
    posY = startY
    if (i == 2)
    {
      posX -= 28
      posY -= 28
    }
    newCard = new Card('r' + i, posX, posY);
    if (i==2)
    {
      newCard.backface = '/img/ot/r2.png';
      newCard.frontface = '/img/ot/r2.png';
    }
    else
    {
      newCard.backface = '/img/ot/r1.png';
      newCard.frontface = '/img/ot/r1.png';
    }
    newCard.rotatable = true;
    newCard.rotation = 0;
    game.gameObj.cards[newCard.id] = newCard;
  }

  startY += (4*135)

  for (var i = 0; i < 5; i++)
  {
    posX = startX + (i*135)
    posY = startY
    if (i == 2)
    {
      posX -= 28
      posY -= 28
    }
    newCard = new Card('b' + i, posX, posY);
    if (i==2)
    {
      newCard.backface = '/img/ot/b2.png';
      newCard.frontface = '/img/ot/b2.png';
    }
    else
    {
      newCard.backface = '/img/ot/b1.png';
      newCard.frontface = '/img/ot/b1.png';
    }
    
    newCard.rotatable = true;
    newCard.rotation = 0;
    game.gameObj.cards[newCard.id] = newCard;
  }

  game.gameObj.decks[movesDeck.id] = movesDeck;


  for (var i = 2; i < 20; i++)
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

module.exports = {OT_Game: OT_Game}