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
  game.gameObj.openboxes.push(new Openbox("lowerOpenbox", 0, 610, 1920, 300))

  game.gameObj.cards.push(new Card('charactersCard', 0, 752))
  game.gameObj.cards.push(new Card('scoring', 0, 1080))
  game.gameObj.cards.push(new Card('onyourturn', 438, 1080))
  game.gameObj.cards.push(new Card('specialDistricts', 875, 1080))

  charactersDeckX = 578;
  charactersDeckY = 934;
  charactersDeck = new Deck('charactersDeck0', charactersDeckX, charactersDeckY, 500, 144);

  var charCardData = [
    {color: "#000000", backgroundcolor: "#b1b1b1", text: "Assassin", secondarytext: "1"},
    {color: "#000000", backgroundcolor: "#b1b1b1", text: "Thief", secondarytext: "2"},
    {color: "#000000", backgroundcolor: "#b1b1b1", text: "Magician", secondarytext: "3"},
    {color: "#000000", backgroundcolor: "#fffa65", text: "King", secondarytext: "4"},
    {color: "#000000", backgroundcolor: "#80dcff", text: "Bishop", secondarytext: "5"},
    {color: "#000000", backgroundcolor: "#8cff7e", text: "Merchant", secondarytext: "6"},
    {color: "#000000", backgroundcolor: "#b1b1b1", text: "Architect", secondarytext: "7"},
    {color: "#000000", backgroundcolor: "#ff4d4d", text: "Warlord", secondarytext: "8"},
  ]

  for (var i = 1; i <= 8; i++)
  {
    c1Card = new Card('c' + i, charactersDeckX + 5, charactersDeckY + 50);
    c1Card.faceType = 'text';
    c1Card.backface = {color: "#000000", backgroundcolor: "#f79860", text: "Character", secondarytext: "-"};
    c1Card.frontface = charCardData[i - 1]
    c1Card.show = "backface";
    charactersDeck.attachedCards.push(c1Card);
    game.gameObj.cards.push(c1Card);
  }

  game.gameObj.decks.push(charactersDeck);

  var districtsData = [
    {
      color: "#000000",
      backgroundcolor: "#ff4d4d",
      cardTypes: [
        { cost: 1, text: "Watchtower", quantity: 3 },
        { cost: 2, text: "Prison", quantity: 3 },
        { cost: 3, text: "Battlefield", quantity: 3 },
        { cost: 5, text: "Fortress", quantity: 2 },
      ],
    },
    {
      color: "#000000",
      backgroundcolor: "#fffa65",
      cardTypes: [
        { cost: 3, text: "Manor", quantity: 5 },
        { cost: 4, text: "Castle", quantity: 4 },
        { cost: 5, text: "Palace", quantity: 3 },
      ],
    },
    {
      color: "#000000",
      backgroundcolor: "#8cff7e",
      cardTypes: [
        { cost: 1, text: "Tavern", quantity: 5 },
        { cost: 2, text: "Market", quantity: 4 },
        { cost: 2, text: "Trading Post", quantity: 3 },
        { cost: 3, text: "Docks", quantity: 3 },
        { cost: 4, text: "Harbor", quantity: 3 },
        { cost: 5, text: "Town Hall", quantity: 2 },
      ],
    },
    {
      color: "#000000",
      backgroundcolor: "#80dcff",
      cardTypes: [
        { cost: 1, text: "Temple", quantity: 3 },
        { cost: 2, text: "Church", quantity: 3 },
        { cost: 3, text: "Monastary", quantity: 3 },
        { cost: 5, text: "Cathedral", quantity: 2 },
      ],
    },
    {
      color: "#000000",
      backgroundcolor: "#c261cf",
      cardTypes: [
        {
          cost: 2,
          text: "Haunted City",
          quantity: 1,
          info:
            "For the purposes of victory points, the Haunted City is conisdered to be of the color of your choice. You cannot use this ability if you built it during the last round of the game.",
        },
        {
          cost: 3,
          text: "Keep",
          quantity: 2,
          info:
            "The Keep cannot be destroyed by the Warlord.",
        },
        {
          cost: 5,
          text: "Laboratory",
          quantity: 1,
          info:
            "Once during your turn, you may discard a district card from your hand and receive one gold from the bank",
        },
        {
          cost: 5,
          text: "Smithy",
          quantity: 1,
          info:
            "Once during your turn, you may pay two gold to draw 3 district cards.",
        },
        {
          cost: 5,
          text: "Observatory",
          quantity: 1,
          info:
            "If you choose to draw cards when you take an action, you draw 3 cards, keep one of your choice, and put the other 2 on the bottom of the deck",
        },
        {
          cost: 5,
          text: "Graveyard",
          quantity: 1,
          info:
            "When the Warlord destroys a district, you may pay one gold to take the destroyed district into your hand.  You may not do this if you are the Warlord",
        },
        {
          cost: 6,
          text: "Dragon Gate",
          quantity: 1,
          info:
            "This district costs 6 gold to build, but is worth 8 points at the end of the game",
        },
        {
          cost: 6,
          text: "University",
          quantity: 1,
          info:
            "This district costs 6 gold to build, but is worth 8 points at the end of the game",
        },
        {
          cost: 6,
          text: "Library",
          quantity: 1,
          info:
            "If you choose to draw cards before you take an action, you keep both of the cards you have drawn.",
        },
        {
          cost: 6,
          text: "Great Wall",
          quantity: 1,
          info:
            "The cost for the Warlord to destory any of your other districts is increased by one gold",
        },
        {
          cost: 6,
          text: "School of Magic",
          quantity: 1,
          info:
            "This district costs 6 gold to build, but is worth 8 points at the end of the game",
        },
      ],
    },
  ];

  districtsDeckX = 1100;
  districtsDeckY = 948;
  districtsDeck = new Deck('distrctsDeck0', districtsDeckX, districtsDeckY, 211, 128);

  var n = 0;
  for (var i = 0; i < districtsData.length; i++)
  {
    for (var district of districtsData[i].cardTypes)
    {
      for (var j = 1; j <= district.quantity; j++)
      {
        var dCard = new Card('d' + n, districtsDeckX + 5, districtsDeckY + 50);
        dCard.faceType = 'text';
        dCard.backface = {color: "#000000", backgroundcolor: "#d0eeff", text: "District", secondarytext: "?"};
        dCard.frontface = {color: districtsData[i].color, backgroundcolor: districtsData[i].backgroundcolor, text: district.text, secondarytext: district.cost}
        dCard.show = "backface";
        districtsDeck.attachedCards.push(dCard);
        game.gameObj.cards.push(dCard);
        n++;
      }
    }
  }

  districtsDeckX = 1350;
  districtsDeckY = 948;
  districtsDeck1 = new Deck('distrctsDeck1', districtsDeckX, districtsDeckY, 211, 128);
  //console.log(n)

  game.gameObj.decks.push(districtsDeck);
  game.gameObj.decks.push(districtsDeck1);

  game.gameObj.cards.push(new Card("crown", 1100, 821))

  var goldStartX = 1582
  var goldStartY = 910;
  var n = 0;
  for (var j = 0; j < 5; j++)
  {
    for(var i = 0; i < 5; i++)
    {
      game.gameObj.cards.push(new Card("gold" + n, goldStartX + (i * 35), goldStartY + (j * 35)))
      n++;
    }
  }


  for (var i = 7; i < 20; i++)
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

module.exports = {CTD_Game: CTD_Game}