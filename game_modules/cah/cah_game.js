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

  var rows = 4;
  var columns = 6;

  for (var i = 0; i < rows; i++)
  {
    for (var j = 0; j < columns; j++)
    {
      if (((i * columns) + j) < 20)
      {
        var startPosX = j * 300;
        var startPosY = (i * 180) + 240;
        var moveBtnDeck = new Deck('webcamMoveBtn' + ((i * columns) + j), startPosX, startPosY, 320 + 16, 240 + 16)
        var webcamBox = new Card('player' + ((i * columns) + j) + "box", startPosX, startPosY)
        game.gameObj.cards.push(webcamBox)
        moveBtnDeck.attachedCards.push(webcamBox)
        game.gameObj.decks.push(moveBtnDeck)
      }
    }
  }

  var whiteDeckX = 0;
  var whiteDeckY = 0;
  var whiteDeck = new Deck('whiteDeck', whiteDeckX, whiteDeckY, 139, 180)
  whiteDeck.setImmovable();

  var i = 0;
  for (var p = 1; p <= 14; p++)
  {
    if (p != 4)
    {
      var startN = 0;
      if (p == 2)
      {
        startN = 20;
      }
      for (var n = startN; n < 40; n++)
      {
        var cardX = whiteDeckX + 5 + Math.round(i * 0.06);
        var cardY = whiteDeckY + 80 - Math.round(i * 0.06);
        var newWhiteCard = new Card(p + "_" + n, cardX, cardY);
        newWhiteCard.backface = "/img/cah/whiteBackface.svg";
        newWhiteCard.frontface = "/img/cah/" + p + "_" + n + ".png";
        newWhiteCard.show = 'backface';
        whiteDeck.attachedCards.push(newWhiteCard);
        game.gameObj.cards.push(newWhiteCard);
        i++;
      }
    }
  }
  game.gameObj.decks.push(whiteDeck)

  var blackDeckX = 168;
  var blackDeckY = 0;
  var blackDeck = new Deck('blackDeck', blackDeckX, blackDeckY, 139, 180)
  blackDeck.setImmovable();

  var i = 0;
  for (var p = 15; p <= 16; p++)
  {
    for (var n = 0; n < 40; n++)
    {
      var cardX = blackDeckX + 5 + Math.round(i * 0.06);
      var cardY = blackDeckY + 80 - Math.round(i * 0.06);
      var newBlackCard = new Card(p + "_" + n, cardX, cardY);
      newBlackCard.backface = "/img/cah/blackBackface.svg";
      newBlackCard.frontface = "/img/cah/" + p + "_" + n + ".png";
      newBlackCard.show = 'backface';
      blackDeck.attachedCards.push(newBlackCard);
      game.gameObj.cards.push(newBlackCard);
      i++;
    }
  }
  game.gameObj.decks.push(blackDeck);

  openbox = new Openbox('openbox0', 336, 0, 1610, 240);
  game.gameObj.openboxes.push(openbox);
}



module.exports = {CAH_Game: CAH_Game}