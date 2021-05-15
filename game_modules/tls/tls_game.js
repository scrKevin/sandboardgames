const fs = require('fs');
var path = require('path');

let Deck = require('../deck').Deck;
let Card = require('../card').Card;

let Game = require('../base_game').Game;
let TlsPlayerObject = require('./tls_player_object').TlsPlayerObject;
let TlsGameObject = require('./tls_game_object').TlsGameObject;
let TlsSubject = require('./tls_subject').TlsSubject
let TlsDrawing = require('./tls_drawing').TlsDrawing
let TlsGuess = require('./tls_guess').TlsGuess

var wordArray = fs.readFileSync(path.join(__dirname, 'words_en.txt')).toString().split("\n");

function getRandom(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

function getRandomWords(n)
{
  return getRandom(wordArray, n);
}

function getRandomNumberArray(n)
{
  let numberArray = []
  for (let i = 0; i < n; i++)
  {
    numberArray.push(i);
  }
  return getRandom(numberArray, n)
}

function TLS_Game(wss, turnServer){
  this.game = new Game(wss, turnServer, this.resetGame, this.processClientMessage);
}

function getPerfectGrid(nOfSubjects)
{
  let perfect = false;
  while (!perfect) {
    let rSeed = []
    for (let y = 0; y < nOfSubjects; y++) {
      rSeed.push(getRandomNumberArray(nOfSubjects));
    }

    //console.log(rSeed)

    for (let x = 0; x < nOfSubjects; x++)
    {
      let registered = []
      for (let y = 0; y < nOfSubjects; y++)
      {
        if (!(registered.includes(rSeed[y][x])))
        {
          registered.push(rSeed[y][x])
        }
        else
        {
          let found = false
          for (let x2 = x + 1; x2 < nOfSubjects; x2++)
          {
            if (!(registered.includes(rSeed[y][x2])))
            {
              //swap
              let original = rSeed[y][x2]
              rSeed[y][x2] = rSeed[y][x]
              rSeed[y][x] = original
              found = true
              break;
            }
          }
          registered.push(rSeed[y][x])
        }
      }
    }

    //console.log(rSeed)

    for (let x = 0; x < nOfSubjects; x++)
    {
      let registered = []
      for (let y = 0; y < nOfSubjects; y++)
      {
        if (!(registered.includes(rSeed[y][x])))
        {
          registered.push(rSeed[y][x])
        }
        else
        {
          let numberToswap = rSeed[y][x]
          searchBlock: {
            for (let x2 = nOfSubjects - 1; x2 >= 0; x2--) {
              if (x2 == x) continue;
              if (!(registered.includes(rSeed[y][x2])))
              {
                let swappedNumber = rSeed[y][x2]
                //swap
                let original = rSeed[y][x2]
                rSeed[y][x2] = rSeed[y][x]
                rSeed[y][x] = original
                
                for (let y2 = nOfSubjects - 1; y2 >= 0; y2--)
                {
                  if (y2 == y) continue;
                  if (rSeed[y2][x2] == numberToswap) {
                    for (let x3 = nOfSubjects; x3 >= 0; x3--)
                    {
                      if (x3 == x2) continue;
                      if (rSeed[y2][x3] == swappedNumber)
                      {
                        //swap
                        let original = rSeed[y2][x3]
                        rSeed[y2][x3] = rSeed[y2][x2]
                        rSeed[y2][x2] = original
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
          
          registered.push(rSeed[y][x])
        }
      }
    }

    //console.log(rSeed)

    let errColumns = []
    for (let x = 0; x < nOfSubjects; x++)
    {
      let registered = []
      for (let y = 0; y < nOfSubjects; y++)
      {
        if (!(registered.includes(rSeed[y][x])))
        {
          registered.push(rSeed[y][x])
        }
        else
        {
          errColumns.push(x)
          continue
        }
      }
    }

    let errRows = []
    for (let y = 0; y < nOfSubjects; y++)
    {
      let registered = []
      for (let x = 0; x < nOfSubjects; x++)
      {
        if (!(registered.includes(rSeed[y][x])))
        {
          registered.push(rSeed[y][x])
        }
        else
        {
          errRows.push(y)
          continue;
        }
      }
    }

    perfect = true;

    //console.log(errColumns)
    if (errColumns.length > 0)
    {
      // console.log("error in columns " + errColumns)
      // console.log(rSeed)
      perfect = false;
    }
    if (errRows.length > 0)
    {
      // console.log("error in rows " + errRows)
      // console.log(rSeed)
      perfect = false;
    }
    if (perfect) return rSeed
  }
  //return rSeed
}

TLS_Game.prototype.resetGame = function(game)
{
  game.gameObj.cards = {};
  game.gameObj.decks = {};
  game.gameObj.openboxes = {};
  game.gameObj.scoreboxes = [];

  game.gameObj.highestZ = 10000;

  game.gameObj.tlsGameObject = new TlsGameObject();

  // for (let player of Object.values(game.gameObj.players))
  // {
  //   player.tlsPlayerObject = new TlsPlayerObject();
  // }
}

TLS_Game.prototype.processClientMessage = function(client, player, json)
{
  if (json.type == "start_tls_game")
  {
    if (this.gameObj.tlsGameObject.gameState == 0 || this.gameObj.tlsGameObject.gameState == -1)
    {
      this.gameObj.cards = {};
      this.gameObj.decks = {};
      this.gameObj.tlsGameObject = new TlsGameObject();
      this.gameObj.tlsGameObject.gameState = 1
      let nOfRounds = Object.keys(this.gameObj.players).length;
      //nOfRounds = 7 // testing
      let nOfSubjects = Object.keys(this.gameObj.players).length;
      //nOfSubjects = 7 // testing
      if (nOfRounds % 2 !== 0) nOfRounds--;// uneven number of players
      this.gameObj.tlsGameObject.nOfRounds = nOfRounds;

      let words = getRandomWords(nOfSubjects);
      let wordIndex = 0;
      for (let word of words) {
        this.gameObj.tlsGameObject.subjects.push(new TlsSubject(wordIndex, word));
        wordIndex++;
      }

      let grid = getPerfectGrid(nOfSubjects)

      let y = 0;
      for (let subject of this.gameObj.tlsGameObject.subjects)
      {
        for (let x = 0; x < nOfRounds; x++)
        {
          subject.seenBy.push(grid[y][x])
        }
        y++;
      }

      this.broadcast();
    }
  }
  else if (json.type == "submitDrawing")
  {
    for (let subject of this.gameObj.tlsGameObject.subjects)
    {
      if (subject.seenBy[this.gameObj.tlsGameObject.gameState - 1] == player.id)
      {
        //subject.drawings.push(json.drawing)
        subject.drawings.push(new TlsDrawing(player.id, json.drawing))
      }
    }
    if (allDrawingsCollected(this.gameObj.tlsGameObject))
    {
      this.gameObj.tlsGameObject.gameState++;
      this.broadcast();
    }
  }
  else if (json.type == "submitGuess")
  {
    for (let subject of this.gameObj.tlsGameObject.subjects)
    {
      if (subject.seenBy[this.gameObj.tlsGameObject.gameState - 1] == player.id)
      {
        //subject.guesses.push(json.guess)
        subject.guesses.push(new TlsGuess(player.id, json.guess))
      }
    }
    if (allGuessesCollected(this.gameObj.tlsGameObject))
    {
      this.gameObj.tlsGameObject.gameState++;
      if (this.gameObj.tlsGameObject.gameState > this.gameObj.tlsGameObject.nOfRounds)
      {
        this.gameObj.tlsGameObject.gameState = -1;
        var startX = 510;
        var startY = 0;
        for (let subject of this.gameObj.tlsGameObject.subjects)
        {
          let moveBtnDeck = new Deck("subjectMoveBtn" + subject.id, startX, startY, 50, 50)
          let subjectBox = new Card("subjectBox" + subject.id, startX, startY)
          this.gameObj.cards[subjectBox.id] = subjectBox;
          moveBtnDeck.attachedCards[subjectBox.id] = subjectBox;
          this.gameObj.decks[moveBtnDeck.id] = moveBtnDeck;
          // this.addToChangedCardsBuffer(subjectBox.id)
          // this.addToChangedCardsBuffer(moveBtnDeck.id)
        }
      }
      this.broadcast();
    }
  }
  else if (json.type == "collapseBtn")
  {
    for (let subject of this.gameObj.tlsGameObject.subjects)
    {
      if (subject.id == json.subjectId)
      {
        subject.collapsed = !subject.collapsed;
        break;
      }
    }
    this.broadcast();
  }
  else if (json.type == "subjectScrollDown")
  {
    for (let subject of this.gameObj.tlsGameObject.subjects)
    {
      if (subject.id == json.subjectId)
      {
        subject.scrollPosition++;
        //console.log(subject.scrollPosition)
        break;
      }
    }
    this.broadcast();
  }
  else if (json.type == "subjectScrollUp")
  {
    for (let subject of this.gameObj.tlsGameObject.subjects)
    {
      if (subject.id == json.subjectId)
      {
        if (subject.scrollPosition > 0) subject.scrollPosition--;
        break;
      }
    }
    this.broadcast();
  }
}

function allDrawingsCollected(tlsGameObj)
{
  let nOfDrawings = (tlsGameObj.gameState + 1) / 2;
  for (let subject of tlsGameObj.subjects)
  {
    if (subject.drawings.length !== nOfDrawings)
    {
      return false;
    }
  }
  return true;
}

function allGuessesCollected(tlsGameObj)
{
  let nOfGuesses = (tlsGameObj.gameState) / 2;
  for (let subject of tlsGameObj.subjects)
  {
    if (subject.guesses.length !== nOfGuesses)
    {
      return false;
    }
  }
  return true;
}

module.exports = {TLS_Game: TLS_Game}
