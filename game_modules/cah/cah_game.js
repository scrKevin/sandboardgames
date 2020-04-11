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

  for (var i = 0; i < 5; i++)
  {
    for (var j = 0; j < 4; j++)
    {
      var startPosX = j * 300;
      var startPosY = i * 45;
      var moveBtnDeck = new Deck('webcamMoveBtn' + ((i * 4) + j), startPosX, startPosY, 320 + 16, 240 + 16)
      var webcamBox = new Card('player' + ((i * 4) + j) + "box", startPosX, startPosY)
      game.gameObj.cards.push(webcamBox)
      moveBtnDeck.attachedCards.push(webcamBox)
      game.gameObj.decks.push(moveBtnDeck)
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

  // var blackDeckX = 0;
  // var blackDeckY = 0;
  // var whiteDeck = new Deck('whiteDeck', whiteDeckX, whiteDeckY, 139, 180)
  // whiteDeck.setImmovable();

  // var i = 0;
  // for (var p = 1; p <= 14; p++)
  // {
  //   if (p != 4)
  //   {
  //     var startN = 0;
  //     if (p == 2)
  //     {
  //       startN = 20;
  //     }
  //     for (var n = startN; n < 40; n++)
  //     {
  //       var cardX = whiteDeckX + 5 + Math.round(i * 0.06);
  //       var cardY = whiteDeckY + 80 - Math.round(i * 0.06);
  //       var newWhiteCard = new Card(p + "_" + n, cardX, cardY);
  //       newWhiteCard.backface = "/img/cah/whiteBackface.svg";
  //       newWhiteCard.frontface = "/img/cah/" + p + "_" + n + ".png";
  //       newWhiteCard.show = 'backface';
  //       whiteDeck.attachedCards.push(newWhiteCard);
  //       game.gameObj.cards.push(newWhiteCard);
  //       i++;
  //     }
  //   }
  // }
  // game.gameObj.decks.push(whiteDeck)
}

module.exports = {CAH_Game: CAH_Game}