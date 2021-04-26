let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;
let Scorebox = require('../scorebox').Scorebox;

let Game = require('../base_game').Game;

function MP_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

MP_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];
  game.gameObj.scoreboxes = [];
  game.gameObj.sharedPlayerbox = new Openbox("sharedPlayerbox", 1920-420, 0, 420, 1080);
  game.gameObj.projectionBoxScale = 0.185185;
  game.gameObj.projectionBoxes = [];
  game.gameObj.projectionBoxes.push({y: 139, x: 420+139 + 266});
  game.gameObj.projectionBoxes.push({y: 1080 - 139 - 200, x: 1920 - 420 - 139 - 266 - 78});
  game.gameObj.projectionBoxes.push({y: 139, x: 1920 - 420 - 139 - 266 - 78});
  game.gameObj.projectionBoxes.push({y: 1080 - 139 - 200, x: 420+139+266});
  game.gameObj.projectionBoxes.push({y: 139 + 200, x: 420+139+266});
  game.gameObj.projectionBoxes.push({y: 1080 - 139 - 200 - 200, x: 1920 - 420 - 139 - 266 - 78});
  game.gameObj.projectionBoxes.push({y: 139 + 200, x: 1920 - 420 - 139 - 266 - 78});
  game.gameObj.projectionBoxes.push({y: 1080 - 139 - 200 - 200, x: 420+139+266});

  game.gameObj.highestZ = 10000;

  for (var p = 0; p < 8; p++)
  {
    game.gameObj.cards.push(new Card("pion_" + p, 1920-420-139 + (p*8), 1080 - 100));
  }

  game.gameObj.scoreboxes.push(new Scorebox("auction"));
  var diceDeck = new Deck("diceDeck", 266, 384, 134, 236);
  game.gameObj.decks.push(diceDeck);

  var dice1 = new Card("dice1", diceDeck.x + 20, diceDeck.y + 60);
  dice1.rotationX = 0;
  dice1.rotationY = 0;
  game.gameObj.cards.push(dice1);
  var dice2 = new Card("dice2", diceDeck.x + 20, diceDeck.y + 60+85);
  dice2.rotationX = 0;
  dice2.rotationY = 0;
  game.gameObj.cards.push(dice2);

  diceDeck.attachedCards.push(dice1);
  diceDeck.attachedCards.push(dice2);

  var index = 0;
  for (p = 0; p < 8; p++)
  {
    var walletDeck = new Deck("wallet" + p, 1500, 0, 420, 445);
    walletDeck.setImmovable();
    walletDeck.setOwnership(p);
    walletDeck.scale = 0.42;
    walletDeck.wallet = true;

    //5g
    for (var i = 0; i < 4; i++)
    {
      var m5 = new Card("m5_" + p + "_" + i, walletDeck.x + 210 + (i*5), 343 + (i*5));
      m5.ownedBy = p;
      m5.scale = walletDeck.scale;
      m5.setCardValue(5);
      index++;
      game.gameObj.cards.push(m5);
      walletDeck.attachedCards.push(m5);
    }
    //25g
    for (var i = 0; i < 5; i++)
    {
      var m5 = new Card("m25_" + p + "_" + i, walletDeck.x + 210 + (i*5), 240 + (i*5));
      m5.ownedBy = p;
      m5.scale = walletDeck.scale;
      m5.setCardValue(25);
      index++;
      game.gameObj.cards.push(m5);
      walletDeck.attachedCards.push(m5);
    }
    //50g
    for (var i = 0; i < 2; i++)
    {
      var m5 = new Card("m50_" + p + "_" + i, walletDeck.x + 210 + (i*5), 128 + (i*5));
      m5.ownedBy = p;
      m5.scale = walletDeck.scale;
      m5.setCardValue(50);
      index++;
      game.gameObj.cards.push(m5);
      walletDeck.attachedCards.push(m5);
    }
    //250g
    for (var i = 0; i < 4; i++)
    {
      var m5 = new Card("m250_" + p + "_" + i, walletDeck.x + 210 + (i*5), 20 + (i*5));
      m5.ownedBy = p;
      m5.scale = walletDeck.scale;
      m5.setCardValue(250);
      index++;
      game.gameObj.cards.push(m5);
      walletDeck.attachedCards.push(m5);
    }
    //100g
    for (var i = 0; i < 2; i++)
    {
      var m5 = new Card("m100_" + p + "_" + i, walletDeck.x + 20 + (i*5), 128 + (i*5));
      m5.ownedBy = p;
      m5.scale = walletDeck.scale;
      m5.setCardValue(100);
      index++;
      game.gameObj.cards.push(m5);
      walletDeck.attachedCards.push(m5);
    }
    //10g
    for (var i = 0; i < 5; i++)
    {
      var m5 = new Card("m10_" + p + "_" + i, walletDeck.x + 20 + (i*5), 240 + (i*5));
      m5.ownedBy = p;
      m5.scale = walletDeck.scale;
      m5.setCardValue(10);
      index++;
      game.gameObj.cards.push(m5);
      walletDeck.attachedCards.push(m5);
    }
    //1g
    for (var i = 0; i < 5; i++)
    {
      var m5 = new Card("m1_" + p + "_" + i, walletDeck.x + 20 + (i*20), 343);
      m5.ownedBy = p;
      m5.scale = walletDeck.scale;
      m5.setCardValue(1);
      index++;
      game.gameObj.cards.push(m5);
      walletDeck.attachedCards.push(m5);
    }
    walletDeck.walletValue = 1500;
    game.gameObj.decks.push(walletDeck);
  }


  //bank
  var bankDeck = new Deck("bank", 0, 1080 - 445, 420, 445);
  bankDeck.setImmovable();
  bankDeck.scale = 0.42;
  //5g
  for (var i = 0; i < 100; i++)
  {
    var m5 = new Card("m5_" + i, bankDeck.x + 210, 343 + 635);
    m5.scale = bankDeck.scale;
    m5.setCardValue(5);
    index++;
    game.gameObj.cards.push(m5);
    bankDeck.attachedCards.push(m5);
  }
  //25g
  for (var i = 0; i < 50; i++)
  {
    var m5 = new Card("m25_" + i, bankDeck.x + 210, 240 + 635);
    m5.scale = bankDeck.scale;
    m5.setCardValue(25);
    index++;
    game.gameObj.cards.push(m5);
    bankDeck.attachedCards.push(m5);
  }
  //50g
  for (var i = 0; i < 50; i++)
  {
    var m5 = new Card("m50_" + i, bankDeck.x + 210, 128 + 635);
    m5.scale = bankDeck.scale;
    m5.setCardValue(50);
    index++;
    game.gameObj.cards.push(m5);
    bankDeck.attachedCards.push(m5);
  }
  //250g
  for (var i = 0; i < 20; i++)
  {
    var m5 = new Card("m250_" + i, bankDeck.x + 210, 20 + 635);
    m5.scale = bankDeck.scale;
    m5.setCardValue(250);
    index++;
    game.gameObj.cards.push(m5);
    bankDeck.attachedCards.push(m5);
  }
  //1000g
  for (var i = 0; i < 10; i++)
  {
    var m5 = new Card("m1000_" + i, bankDeck.x + 20, 20 + 635);
    m5.scale = bankDeck.scale;
    m5.setCardValue(1000);
    index++;
    game.gameObj.cards.push(m5);
    bankDeck.attachedCards.push(m5);
  }
  //100g
  for (var i = 0; i < 75; i++)
  {
    var m5 = new Card("m100_" + i, bankDeck.x + 20, 128 + 635);
    m5.scale = bankDeck.scale;
    m5.setCardValue(100);
    index++;
    game.gameObj.cards.push(m5);
    bankDeck.attachedCards.push(m5);
  }
  //10g
  for (var i = 0; i < 75; i++)
  {
    var m5 = new Card("m10_" + i, bankDeck.x + 20, 240 + 635);
    m5.scale = bankDeck.scale;
    m5.setCardValue(10);
    index++;
    game.gameObj.cards.push(m5);
    bankDeck.attachedCards.push(m5);
  }
  //1g
  for (var i = 0; i < 50; i++)
  {
    var m5 = new Card("m1_" + i, bankDeck.x + 20, 343 + 635);
    m5.scale = bankDeck.scale;
    m5.setCardValue(1);
    index++;
    game.gameObj.cards.push(m5);
    bankDeck.attachedCards.push(m5);
  }
  game.gameObj.decks.push(bankDeck);

  for (var i = 0; i < 32; i++)
  {
    var m5 = new Card("house" + i, 40, bankDeck.y - 30);
    game.gameObj.cards.push(m5);
  }

  for (var i = 0; i < 12; i++)
  {
    var m5 = new Card("hotel" + i, 80, bankDeck.y - 30);
    game.gameObj.cards.push(m5);
  }

  var townSequence = [2, 3, 3, 3, 3, 3, 3, 2];
  var index = 0;
  for (t in townSequence)
  {
    for (var i = 0; i < townSequence[t]; i++)
    {
      var posX = t * 192;
      var posY = 1090 + (i * 75);
      game.gameObj.cards.push(new Card("property" + index, posX, posY))
      index++;
    }
  }
  for (var i = 0; i < 4; i++)
  {
    var posX = townSequence.length * 192;
    var posY = 1090 + (i * 60);
    game.gameObj.cards.push(new Card("station" + i, posX, posY))
    index++;
  }

  for (var i = 0; i < 2; i++)
  {
    var posX = (townSequence.length + 1) * 192;
    var posY = 1090 + (i * 60);
    game.gameObj.cards.push(new Card("company" + i, posX, posY))
    index++;
  }

  var communityChestObj = {
    0: "U erft ƒ 100",
    1: "U ontvangt rente van 7% preferente aandelen ƒ 25",
    2: "Een vergissing van de bank in uw voordeel, u ontvangt ƒ 200",
    3: "Ga terug naar Dorpsstraat (Ons Dorp)",
    4: "Ga direct naar de gevangenis. Ga niet door 'Start', u ontvangt geen ƒ 200",
    5: "U bent jarig en ontvangt van iedere speler ƒ 10",
    6: "U hebt de tweede prijs in een schoonheidswedstrijd gewonnen en ontvangt ƒ 10",
    7: "Betaal uw doktersrekening ƒ 50",
    8: "Betaal uw verzekeringspremie ƒ 50",
    9: "Door verkoop van effecten ontvangt u ƒ 50",
    10: "Verlaat de gevangenis zonder betalen",
    11: "Restitutie inkomstenbelasting, u ontvangt ƒ 20",
    12: "Lijfrente vervalt, u ontvangt ƒ 100",
    13: "Betaal het hospitaal ƒ 100",
    14: "Ga verder naar 'Start'",
    15: "Betaal ƒ 10 boete of neem een Kanskaart"
  }

  var startDeckX = 0;
  var startDeckY = 0;
  var communityChestDeck = new Deck('communityChestDeck', startDeckX, startDeckY, 205, 182);
  communityChestDeck.setImmovable();
  var communityChestDiscardDeck = new Deck('communityChestDiscardDeck', startDeckX + 210, startDeckY, 205, 182);
  communityChestDiscardDeck.setImmovable();

  for (i in communityChestObj)
  {
    var communityChestCard = new Card('cc' + i, startDeckX + 5, startDeckY + 80);
    communityChestCard.faceType = 'text';
    communityChestCard.backface = {color: "#000000", backgroundcolor: "#02a4dc", text: "ALGEMEEN FONDS"}
    communityChestCard.frontface = {color: "#000000", backgroundcolor: "#FFFFFF", text: communityChestObj[i]}
    communityChestCard.show = 'backface';
    communityChestDeck.attachedCards.push(communityChestCard);
    game.gameObj.cards.push(communityChestCard);
  }

  game.gameObj.decks.push(communityChestDeck);
  game.gameObj.decks.push(communityChestDiscardDeck);

  var chanceObj = {
    0: "Boete voor te snel rijden ƒ 15",
    1: "Betaal schoolgeld ƒ 150",
    2: "Ga verder naar Barteljorisstraat. Indien u langs 'Start' komt, ontvangt u ƒ 200",
    3: "Reis naar station 'West' en indien u langs 'Start' komt, ontvangt u ƒ 200",
    4: "Ga verder naar 'Start'",
    5: "Ga drie plaatsen terug",
    6: "Ga direct naar de gevangenis. Ga niet langs 'Start'. U ontvangt geen ƒ 200",
    7: "Ga verder naar de Heerestraat. Indien u langs 'Start' komt ontvangt u ƒ 200",
    8: "De bank betaalt u ƒ 50 dividend",
    9: "Verlaat de gevangenis zonder te betalen",
    10: "Repareer uw huizen. Betaal voor elk huis ƒ 25, betaal voor elk hotel ƒ 100",
    11: "U wordt aangeslagen voor straatgeld. ƒ 40 per huis, ƒ 115 per hotel",
    12: "Uw bouwverzekering vervalt, u ontvangt ƒ 150",
    13: "Aangehouden wegens dronkenschap ƒ 20 boete",
    14: "Ga verder naar Kalverstraat",
    15: "U hebt een kruiswoordpuzzel gewonnen en ontvangt ƒ 100"
  }

  var startDeckX = 0;
  var startDeckY = 192;
  var chanceDeck = new Deck('chanceDeck', startDeckX, startDeckY, 205, 182);
  chanceDeck.setImmovable();
  var chanceDiscardDeck = new Deck('chanceDiscardDeck', startDeckX + 210, startDeckY, 205, 182);
  chanceDiscardDeck.setImmovable();

  for (i in chanceObj)
  {
    var chanceCard = new Card('c' + i, startDeckX + 5, startDeckY + 80);
    chanceCard.faceType = 'text';
    chanceCard.backface = {color: "#000000", backgroundcolor: "#c31676", text: "KANS"}
    chanceCard.frontface = {color: "#000000", backgroundcolor: "#FFFFFF", text: chanceObj[i]}
    chanceCard.show = 'backface';
    chanceDeck.attachedCards.push(chanceCard);
    game.gameObj.cards.push(chanceCard);
  }

  game.gameObj.decks.push(chanceDeck);
  game.gameObj.decks.push(chanceDiscardDeck);

  game.gameObj.openboxes.push(new Openbox("ob1", 420, 0, 1080, 1080));

  for (var i = 8; i < 20; i++)
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

module.exports = {MP_Game: MP_Game}