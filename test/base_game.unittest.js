let assert = require('assert');
let chai = require('chai');
let expect = require('chai').expect;

// let WebSocket = require('mock-socket').WebSocket;
// let Server = require('mock-socket').Server;

let WebSocket = require('ws');

let Game = require("../game_modules/base_game").Game;
let Card = require("../game_modules/card").Card;
let Deck = require("../game_modules/deck").Deck;
let Openbox = require("../game_modules/openbox").Openbox;

describe("Unit test base_game", function () {
  const fakeWsUrl = "ws://localhost:8080";
  var testResetGame = function(game){
    game.gameObj.cards = [];
    game.gameObj.decks = [];
    game.gameObj.openboxes = [];

    var testDeck = new Deck("testDeck", 0, 0, 200, 200);
    var testCard0 = new Card("testCard0", 0, 0);

    testDeck.attachedCards.push(testCard0);
    game.gameObj.cards.push(testCard0);
    game.gameObj.decks.push(testDeck);
    
  }
  var mockServer = {};
  for (var prop in WebSocket.prototype) {
      mockServer[prop] = function () {}; // some properties aren't functions.
  }
  //const mockServer = new Server(fakeWsUrl);
  var game;

  it("should have the correct amount of cards/decks and openboxes", (done) => {
    game = new Game(mockServer, testResetGame);
    expect(game.gameObj.decks.length).to.equal(1);
    expect(game.gameObj.cards.length).to.equal(1);
    done();
  });

  // it("should add new player when connection is received", (done) => {
  //   testClient0 = new WebSocket(fakeWsUrl);
  //   expect(game.gameObj.players.length).to.equal(1);
  //   done();
  // });
})