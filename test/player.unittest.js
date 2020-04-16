let assert = require('assert');
let chai = require('chai');
let expect = require('chai').expect;

let Player = require("../game_modules/player").Player


describe("Unit test Player", function () {
  var testPlayerNumbers = [true, true];
  var testPlayer0 = new Player();
  var testPlayer1 = new Player();

  it("should set id to 0 when first player", function(done){
    testPlayer0.setId(testPlayerNumbers);
    expect(testPlayer0.getId()).to.equal(0);
    expect(testPlayerNumbers[0]).to.equal(false);
    expect(testPlayerNumbers[1]).to.equal(true);
    done();
  });

  it("should set id to 1 when second player", function(done){
    testPlayer1.setId(testPlayerNumbers);
    expect(testPlayer1.getId()).to.equal(1);
    expect(testPlayerNumbers[0]).to.equal(false);
    expect(testPlayerNumbers[1]).to.equal(false);
    done();
  });
})