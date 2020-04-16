let assert = require('assert');
let chai = require('chai');
let expect = require('chai').expect;
let sinon = require('sinon');

let Deck = require("../game_modules/deck").Deck;
let Card = require("../game_modules/card").Card;

describe("Unit test Deck", function(){

  var shuffleMethod = sinon.spy(Deck.prototype, 'shuffle');
  var setCardZMethod = sinon.spy(Card.prototype, 'setZ');
  var setCardXMethod = sinon.spy(Card.prototype, 'setX');
  var setCardYMethod = sinon.spy(Card.prototype, 'setY');
  var testDeck = new Deck("test", 100, 100, 200, 200);
  var testCard0 = new Card("testId0", 0, 0);
  var testCard1 = new Card("testId1", 0, 0);

  it("should return true when coördinates are in Deck", function(done) {
    expect(testDeck.isInDeck(101, 101)).to.equal(true);
    expect(testDeck.isInDeck(299, 101)).to.equal(true);
    done();
  });

  it("should return false when coördinates are NOT in Deck", function(done) {
    expect(testDeck.isInDeck(10, 10)).to.equal(false);
    expect(testDeck.isInDeck(300, 300)).to.equal(false);
    done();
  });

  it("should be able to add card to deck", function(done) {
    testDeck.addToDeck(testCard0);
    expect(testDeck.attachedCards.length).to.equal(1);
    expect(testCard0.attachedToDeck).to.equal(true);
    done();
  });

  it("should not be able to add the same card twice", function(done) {
    testDeck.addToDeck(testCard0);
    expect(testDeck.attachedCards.length).to.equal(1);
    done();
  });

  it("should be able to add a different card", function(done) {
    testDeck.addToDeck(testCard1);
    expect(testDeck.attachedCards.length).to.equal(2);
    expect(testCard1.attachedToDeck).to.equal(true);
    done();
  });

  it("should be able to shuffle deck", function(done) {
    
    testDeck.shuffleDeck();
    sinon.assert.calledOnce(shuffleMethod);
    sinon.assert.callCount(setCardZMethod, 2);
    sinon.assert.callCount(setCardXMethod, 2);
    sinon.assert.callCount(setCardYMethod, 2);
    done();
  });

  it("should be able to remove a card from deck", function(done) {
    testDeck.removeFromDeck(testCard0);
    expect(testDeck.attachedCards.length).to.equal(1);
    expect(testCard0.attachedToDeck).to.equal(false);
    done();
  });
});