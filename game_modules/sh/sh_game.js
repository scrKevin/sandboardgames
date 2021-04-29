let Deck = require('../deck').Deck;
let Card = require('../card').Card;
let Openbox = require('../openbox').Openbox;

var Startpositions = require("./startpositions")

let Game = require('../base_game').Game;

function SH_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame);
}

SH_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = {};
  game.gameObj.decks = {};
  game.gameObj.openboxes = {};
  game.gameObj.scoreboxes = [];

  game.gameObj.highestZ = 10000;
  
  for (var i = 0; i < 10; i++)
  {
    bNCard = new Card('ballotnein' + i, Startpositions.playerBoxes[i].left + 5, Startpositions.playerBoxes[i].top + 105)
    game.gameObj.cards[bNCard.id] = bNCard;
    bJCard = new Card('ballotja' + i, Startpositions.playerBoxes[i].left + 5, Startpositions.playerBoxes[i].top + 20)
    game.gameObj.cards[bJCard.id] = bJCard;
  }

  
  policyDeck1X = 465;
  policyDeck1Y = 325;
  policyDeck1 = new Deck('policydeck1', policyDeck1X, policyDeck1Y, 160, 207);

  game.gameObj.decks[policyDeck1.id] = policyDeck1;

  for (var i = 0; i < 6; i++)
  {
    newPolicyCard = new Card('policy' + i, policyDeck1X + 5 + (i * 2), policyDeck1Y + 80 - (i * 2));
    newPolicyCard.backface = '/img/sh/policy-l.png';
    newPolicyCard.frontface = '/img/sh/liberalp-l.png';
    newPolicyCard.show = "backface";
    newPolicyCard.attachedToDeck = true;
    game.gameObj.cards[newPolicyCard.id] = newPolicyCard;
    policyDeck1.attachedCards[newPolicyCard.id] = newPolicyCard;

  }

  for (var i = 6; i < 17; i++)
  {
    newPolicyCard = new Card('policy' + i, policyDeck1X + 5 + (i * 2), policyDeck1Y + 80 - (i * 2));
    newPolicyCard.backface = '/img/sh/policy-l.png';
    newPolicyCard.frontface = '/img/sh/fascistp-l.png';
    newPolicyCard.show = "backface";
    newPolicyCard.attachedToDeck = true;
    game.gameObj.cards[newPolicyCard.id] = newPolicyCard;
    policyDeck1.attachedCards[newPolicyCard.id] = newPolicyCard;
  }

  policyDeck2X = 1254;
  policyDeck2Y = 325;
  policyDeck2 = new Deck('policydeck2', policyDeck2X, policyDeck2Y, 160, 207);

  game.gameObj.decks[policyDeck2.id] = policyDeck2;


  f56TrackX = -50;
  f56TrackY = 1050;
  f56TrackDeck = new Deck('fascisttrack56', f56TrackX, f56TrackY, 650, 220);
  f56Openbox = new Openbox('fascistOpenbox56', f56TrackX + 44, f56TrackY + 44, 560, 136);
  game.gameObj.openboxes[f56Openbox.id] = f56Openbox;
  f56TrackDeck.attachedOpenboxes[f56Openbox.id] = f56Openbox;
  game.gameObj.decks[f56TrackDeck.id] = f56TrackDeck;

  f78TrackX = -60;
  f78TrackY = 1050;
  f78TrackDeck = new Deck('fascisttrack78', f78TrackX, f78TrackY, 650, 220);
  f78Openbox = new Openbox('fascistOpenbox78', f78TrackX + 44, f78TrackY + 44, 560, 136);
  game.gameObj.openboxes[f78Openbox.id] = f78Openbox;
  f78TrackDeck.attachedOpenboxes[f78Openbox.id] = f78Openbox;
  game.gameObj.decks[f78TrackDeck.id] = f78TrackDeck;

  f910TrackX = -70;
  f910TrackY = 1050;
  f910TrackDeck = new Deck('fascisttrack910', f910TrackX, f910TrackY, 650, 220);
  f910Openbox = new Openbox('fascistOpenbox910', f910TrackX + 44, f910TrackY + 44, 560, 136);
  game.gameObj.openboxes[f910Openbox.id] = f910Openbox;
  f910TrackDeck.attachedOpenboxes[f910Openbox.id] = f910Openbox;
  game.gameObj.decks[f910TrackDeck.id] = f910TrackDeck;

  liberalTrackX = -70;
  liberaltrackY = -100;
  liberalTrackDeck = new Deck('liberaltrack', liberalTrackX, liberaltrackY, 650, 220);
  liberalOpenbox = new Openbox('liberalOpenbox', liberalTrackX + 89, liberaltrackY + 42, 476, 136);
  game.gameObj.openboxes[liberalOpenbox.id] = liberalOpenbox;
  liberalTrackDeck.attachedOpenboxes[liberalOpenbox.id] = liberalOpenbox;
  game.gameObj.decks[liberalTrackDeck.id] = liberalTrackDeck;

  electionTracker = new Card('electionTracker', -10, -10);
  game.gameObj.cards[electionTracker.id] = electionTracker;

  chancellortoken = new Card('chancellortoken', 10, 10);
  game.gameObj.cards[chancellortoken.id] = chancellortoken;

  presidenttoken = new Card('presidenttoken', 20, 20);
  game.gameObj.cards[presidenttoken.id] = presidenttoken;

  rolecardsstartX = 700;
  rolecardsstartY = 550;
  rolecardsstartDeck = new Deck('rolecardsstart', rolecardsstartX, rolecardsstartY, 160, 207);

  hRoleCard = new Card('hRoleCard', rolecardsstartX + 5, rolecardsstartY + 80);
  hRoleCard.backface = '/img/sh/partymembership.png';
  hRoleCard.frontface = '/img/sh/h0.png';
  hRoleCard.altFrontface = '/img/sh/membership-fascist.png'
  hRoleCard.show = "backface";
  hRoleCard.attachedToDeck = true;

  game.gameObj.cards[hRoleCard.id] = hRoleCard;
  rolecardsstartDeck.attachedCards[hRoleCard.id] = hRoleCard;
  game.gameObj.decks[rolecardsstartDeck.id] = rolecardsstartDeck;

  liberalsstartX = 870;
  liberalsstartY = 550;
  liberalsstartDeck = new Deck('rolecardsliberals', liberalsstartX, liberalsstartY, 160, 207);

  for (var i = 0; i < 6; i++)
  {
    newCard = new Card('lRoleCard' + i, liberalsstartX + 5 + (i * 2), liberalsstartY + 80 - (i * 2));
    newCard.backface = '/img/sh/partymembership.png';
    newCard.frontface = '/img/sh/liberal' + i + '.png';
    newCard.altFrontface = '/img/sh/membership-liberal.png'
    newCard.show = "backface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    liberalsstartDeck.attachedCards[newCard.id] = newCard;
  }

  game.gameObj.decks[liberalsstartDeck.id] = liberalsstartDeck;

  fascistsstartX = 1040;
  fascistsstartY = 550;
  fascistsstartDeck = new Deck('rolecardsfascists', fascistsstartX, fascistsstartY, 160, 207);

  for (var i = 0; i < 3; i++)
  {
    newCard = new Card('fRoleCard' + i, fascistsstartX + 5 + (i * 2), fascistsstartY + 80 - (i * 2));
    newCard.backface = '/img/sh/partymembership.png';
    newCard.frontface = '/img/sh/fascist' + i + '.png';
    newCard.altFrontface = '/img/sh/membership-fascist.png'
    newCard.show = "backface";
    newCard.attachedToDeck = true;
    game.gameObj.cards[newCard.id] = newCard;
    fascistsstartDeck.attachedCards[newCard.id] = newCard;
  }

  game.gameObj.decks[fascistsstartDeck.id] = fascistsstartDeck;

  for (var i = 10; i < 20; i++)
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

  game.gameObj.cards['inpsectorbox0'] = new Card('inpsectorbox0', 1900, 1040);
}

module.exports = {SH_Game: SH_Game}