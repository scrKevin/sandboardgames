let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;
let Scorebox = require('../scorebox').Scorebox;

let Game = require('../base_game').Game;

function SOC_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

function shuffle(a){
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

SOC_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = {};
  game.gameObj.decks = {};
  game.gameObj.openboxes = {};
  game.gameObj.scoreboxes = [];

  game.gameObj.highestZ = 10000;

  for (var i = 0; i < 4; i++)
  {
    game.gameObj.scoreboxes.push(new Scorebox(i));
  }

  var positionArray = [];
  xStart = 736;
  for (var i = 0; i < 3; i++)
  {
    positionArray.push({x: (xStart + (i * 148)), y: 195});
  }
  xStart = 662;
  for (var i = 0; i < 4; i++)
  {
    positionArray.push({x: (xStart + (i * 148)), y: 323});
  }
  xStart = 588;
  for (var i = 0; i < 5; i++)
  {
    positionArray.push({x: (xStart + (i * 148)), y: 451});
  }
  xStart = 662;
  for (var i = 0; i < 4; i++)
  {
    positionArray.push({x: (xStart + (i * 148)), y: 579});
  }
  xStart = 736;
  for (var i = 0; i < 3; i++)
  {
    positionArray.push({x: (xStart + (i * 148)), y: 707});
  }

  var shuffledPositions = shuffle(positionArray);
  // console.log(shuffledPositions);

  var hexObj = {
    "brick": {img: 'hex_brick.png', quantity: 3},
    "desert": {img: 'hex_desert.png', quantity: 1},
    "ore": {img: 'hex_ore.png', quantity: 3},
    "wheat": {img: 'hex_wheat.png', quantity: 4},
    "wood": {img: 'hex_wood.png', quantity: 4},
    "wool": {img: 'hex_wool.png', quantity: 4}
  }

  var diceDeck = new Deck("diceDeck", 520, 8, 260, 170);
  game.gameObj.decks[diceDeck.id] = diceDeck;

  var numberPositions = [];

  var index = 0;
  for (hex in hexObj)
  {
    for (var i = 0; i < hexObj[hex].quantity; i++)
    {
      var newHexCard = new Card("hex_" + index, shuffledPositions[index].x, shuffledPositions[index].y);
      newHexCard.fixedZ = true;
      game.gameObj.cards[newHexCard.id] = newHexCard;
      if (hex != "desert")
      {
        numberPositions.push({x: shuffledPositions[index].x + 52, y: shuffledPositions[index].y + 65})
      }
      else
      {
        var robberCard = new Card("robber0", shuffledPositions[index].x + 40, shuffledPositions[index].y + 45);
        game.gameObj.cards[robberCard.id] = robberCard;
      }
      index++;
    }
  }

  var shuffledNumberPositions = shuffle(numberPositions);
  // console.log(shuffledNumberPositions);

  index = 0;
  for (var i = 2; i <= 12; i++)
  {
    var jTotal = 2;
    if (i == 2 || i == 12){
      jTotal = 1;
    }
    if (i != 7)
    {
      for (var j = 1; j <= jTotal; j++)
      {
        // console.log(shuffledNumberPositions[index]);
        var newNumberCard = new Card("n_" + i + j, shuffledNumberPositions[index].x, shuffledNumberPositions[index].y);
        newNumberCard.fixedZ = true;
        game.gameObj.cards[newNumberCard.id] = newNumberCard;
        index++;
      }
    }
  }

  var harbourPositions = [];

  harbourPositions.push({x: 1139, y: 106});
  harbourPositions.push({x: 1288, y: 361});
  harbourPositions.push({x: 1288, y: 615});
  harbourPositions.push({x: 1140, y: 871});
  harbourPositions.push({x: 844, y: 871});
  harbourPositions.push({x: 623, y: 745});
  harbourPositions.push({x: 475, y: 489});
  harbourPositions.push({x: 623, y: 232});
  harbourPositions.push({x: 842, y: 104});

  var shuffledHarbourPositions = shuffle(harbourPositions);

  // var hd0 = new Card("hex_d0", 736, 195);
  // game.gameObj.cards.push(hd0)
  for (var i = 0; i < shuffledHarbourPositions.length; i++)
  {
    var h0 = new Card("harbour" + i, shuffledHarbourPositions[i].x, shuffledHarbourPositions[i].y);
    h0.fixedZ = true;
    game.gameObj.cards[h0.id] = h0;
  }

  var dice1 = new Card("dice1", diceDeck.x + 20, diceDeck.y + 60);
  dice1.rotationX = 0;
  dice1.rotationY = 0;
  game.gameObj.cards[dice1.id] = dice1;
  var dice2 = new Card("dice2", diceDeck.x + 145, diceDeck.y + 60);
  dice2.rotationX = 0;
  dice2.rotationY = 0;
  game.gameObj.cards[dice2.id] = dice2;

  diceDeck.attachedCards[dice1.id] = dice1;
  diceDeck.attachedCards[dice2.id] = dice2;


  var refPositions = [{x: 324, y: 475, leftRightDir: 1}, {x: 1540, y: 800, leftRightDir: -1}, {x: 1540, y: 475, leftRightDir: -1}, {x: 324, y: 800, leftRightDir: 1}];
  for (var p = 0; p < 4; p++)
  {  
    game.gameObj.cards["settlement_" + p + "_0"] = new Card("settlement_" + p + "_0", refPositions[p].x, refPositions[p].y);
    game.gameObj.cards["settlement_" + p + "_1"] = new Card("settlement_" + p + "_1", refPositions[p].x + (54 * refPositions[p].leftRightDir), refPositions[p].y);
    game.gameObj.cards["road_" + p + "_0"] = new Card("road_" + p + "_0", refPositions[p].x + (21 * refPositions[p].leftRightDir), refPositions[p].y - 44);
    game.gameObj.cards["road_" + p + "_1"] = new Card("road_" + p + "_1", refPositions[p].x + (75 * refPositions[p].leftRightDir), refPositions[p].y - 44);
    var xIncrement = 10;
    var yIncrement = 10;
    var startX = refPositions[p].x + (2*xIncrement*refPositions[p].leftRightDir);
    var startY = refPositions[p].y - 120 - (2*yIncrement);
    for (var i = 0; i < 3; i++)
    {
      game.gameObj.cards["settlement_" + p + "_" + (i + 2)] = new Card("settlement_" + p + "_" + (i + 2), startX - (xIncrement * i * refPositions[p].leftRightDir), startY + (yIncrement * i));
    }
    var xIncrement = 10;
    var yIncrement = 10;
    var startX = refPositions[p].x + ((3*xIncrement + 100)*refPositions[p].leftRightDir);
    var startY = refPositions[p].y - 120 - (3*yIncrement);
    for (var i = 0; i < 4; i++)
    {
      game.gameObj.cards["city_" + p + "_" + i] = new Card("city_" + p + "_" + i, startX - (xIncrement * i * refPositions[p].leftRightDir), startY + (yIncrement * i));
    }
    var xIncrement = 3;
    var yIncrement = 1;
    var startX = refPositions[p].x + ((12*xIncrement)*refPositions[p].leftRightDir);
    var startY = refPositions[p].y - 200 - (12*yIncrement);
    for (var i = 0; i < 13; i++)
    {
      game.gameObj.cards["road_" + p + "_" + (i + 2)] = new Card("road_" + p + "_" + (i + 2), startX - (xIncrement * i * refPositions[p].leftRightDir), startY + (yIncrement * i));
    }
  }
  var startX = 571;
  var startY = 897;
  var woolDeck = new Deck("woolDeck", startX, startY, 78, 182);
  for (var i = 0; i < 19; i++)
  {
    newCard = new Card('resource_' + i, startX + 5, startY + 80 - (i * 2));
    newCard.backface = '/img/soc/resource_bf.png';
    newCard.frontface = '/img/soc/wool_ff.png';
    newCard.show = "frontface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    woolDeck.attachedCards[newCard.id] = newCard;
  }

  game.gameObj.decks[woolDeck.id] = woolDeck;

  var startX = 658;
  var startY = 897;
  var brickDeck = new Deck("brickDeck", startX, startY, 78, 182);
  for (var i = 0; i < 19; i++)
  {
    newCard = new Card('resource_' + (i + 19), startX + 5, startY + 80 - (i * 2));
    newCard.backface = '/img/soc/resource_bf.png';
    newCard.frontface = '/img/soc/brick_ff.png';
    newCard.show = "frontface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    brickDeck.attachedCards[newCard.id] = newCard;
  }

  game.gameObj.decks[brickDeck.id] = brickDeck;

  var startX = 745;
  var startY = 897;
  var woodDeck = new Deck("woodDeck", startX, startY, 78, 182);
  for (var i = 0; i < 19; i++)
  {
    newCard = new Card('resource_' + (i + 38), startX + 5, startY + 80 - (i * 2));
    newCard.backface = '/img/soc/resource_bf.png';
    newCard.frontface = '/img/soc/wood_ff.png';
    newCard.show = "frontface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    woodDeck.attachedCards[newCard.id] = newCard;
  }

  game.gameObj.decks[woodDeck.id] = woodDeck;

  var startX = 957;
  var startY = 897;
  var wheatDeck = new Deck("wheatDeck", startX, startY, 78, 182);
  for (var i = 0; i < 19; i++)
  {
    newCard = new Card('resource_' + (i + 57), startX + 5, startY + 80 - (i * 2));
    newCard.backface = '/img/soc/resource_bf.png';
    newCard.frontface = '/img/soc/wheat_ff.png';
    newCard.show = "frontface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    wheatDeck.attachedCards[newCard.id] = newCard;
  }

  game.gameObj.decks[wheatDeck.id] = wheatDeck;

  var startX = 1044;
  var startY = 897;
  var oreDeck = new Deck("oreDeck", startX, startY, 78, 182);
  for (var i = 0; i < 19; i++)
  {
    newCard = new Card('resource_' + (i + 76), startX + 5, startY + 80 - (i * 2));
    newCard.backface = '/img/soc/resource_bf.png';
    newCard.frontface = '/img/soc/ore_ff.png';
    newCard.show = "frontface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    oreDeck.attachedCards[newCard.id] = newCard;
  }

  game.gameObj.decks[oreDeck.id] = oreDeck;

  var startX = 1239;
  var startY = 81;
  var developmentDeck = new Deck("developmentDeck0", startX, startY, 100, 222);
  for (var i = 0; i < 14; i++)
  {
    newCard = new Card('development_' + i, startX + 5, startY + 80 - (i * 2));
    newCard.backface = '/img/soc/development_bf.png';
    newCard.frontface = '/img/soc/knight_ff.png';
    newCard.show = "backface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    developmentDeck.attachedCards[newCard.id] = newCard;
  }

  for (var i = 14; i < 19; i++)
  {
    newCard = new Card('development_' + i, startX + 5, startY + 80 - (i * 2));
    newCard.backface = '/img/soc/development_bf.png';
    newCard.frontface = '/img/soc/victorypoint_ff.png';
    newCard.show = "backface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    developmentDeck.attachedCards[newCard.id] = newCard;
  }

  for (var i = 19; i < 21; i++)
  {
    newCard = new Card('development_' + i, startX + 5, startY + 80 - (i * 2));
    newCard.backface = '/img/soc/development_bf.png';
    newCard.frontface = '/img/soc/roadbuilding_ff.png';
    newCard.show = "backface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    developmentDeck.attachedCards[newCard.id] = newCard;
  }

  for (var i = 21; i < 23; i++)
  {
    newCard = new Card('development_' + i, startX + 5, startY + 80 - (i * 2));
    newCard.backface = '/img/soc/development_bf.png';
    newCard.frontface = '/img/soc/yearofplenty_ff.png';
    newCard.show = "backface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    developmentDeck.attachedCards[newCard.id] = newCard;
  }

  for (var i = 23; i < 25; i++)
  {
    newCard = new Card('development_' + i, startX + 5, startY + 80 - (i * 2));
    newCard.backface = '/img/soc/development_bf.png';
    newCard.frontface = '/img/soc/monopoly_ff.png';
    newCard.show = "backface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    developmentDeck.attachedCards[newCard.id] = newCard;
  }

  

  game.gameObj.openboxes['openbox0'] = new Openbox('openbox0', 320, 0, 1280, 1080);

  var developmentDeckClosedbox = new Openbox('closedbox0', startX, startY, 100, 222);
  developmentDeckClosedbox.showFace = 'backface';
  game.gameObj.openboxes[developmentDeckClosedbox.id] = developmentDeckClosedbox;

  developmentDeck.attachedOpenboxes[developmentDeckClosedbox.id] = developmentDeckClosedbox;
  game.gameObj.decks[developmentDeck.id] = developmentDeck;

  game.gameObj.cards['building_costs'] = new Card('building_costs', 0, 1080);
  game.gameObj.cards['longest_road'] = new Card('longest_road', 960, 1080);
  game.gameObj.cards['largest_army'] = new Card('largest_army', 960, 1280);
  game.gameObj.cards['development_cards'] = new Card('development_cards', 1200, 1080);

  for (var i = 4; i < 20; i++)
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


module.exports = {SOC_Game: SOC_Game}