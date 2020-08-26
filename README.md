# Sandboardgames

Play some board games with your friends around a virtual table.

Sandbox style board game engine running on NodeJS.
P2P Webcam support with WebRTC.

### Requirements:

- You will need a SSL certificate for the webcams to work.
  - Use (https://greenlock.domains/) for a free certificate.
  - If you just want to quickly test locally (over _HTTP_), create a self-signed
    certificate:
    `openssl req -nodes -x509 -newkey rsa:4096 -keyout security/privkey.pem -out security/fullchain.pem -days 365`
- NodeJS (https://nodejs.org/).
- Browserify (`npm install --global browserify`).

#### Optional:

- Watchify (`npm install --global watchify`).

### Getting started:

- Ensure external port 443 of your internet connection is forwarded to your
  machine.
- Install NodeJS (https://nodejs.org/).
- Clone this repostitory:
  `git clone https://github.com/scrKevin/sandboardgames.git`.
- `cd sandboardgames` into the created directory.
- Type `npm install`.
- In the root directory of 'sandboardgames' create a folder called 'security'
  and paste the 'privkey.pem' and 'fullchain.pem' files you received from
  Greenlock.

### Run the server:

`cd` into the root directory of `sandboardgames` (ie.
`cd /home/pi/sandboardgames`). Run `npm start`. Invite your friends and enjoy
some games.

For detailed instructions on how to setup a server-environment from scratch, see
[docs/EC2.md](./docs/EC2.md).

### Development:

To automatically update the `bundle.js` file (client side javascript):

- `cd sandboardgames` into the root directory.
- `watchify game_modules/client_side/client-side.js -o public/js/bundle.js -v`

Run the test server in a separate terminal:

- `cd` into the root directory of `sandboardgames`.
- Run `npm run dev`.
- Browse to http://localhost:8080 or go to https://your-domain-name
- A test gameroom will be started automatically at http://localhost:8080/0/lobby
  or https://your-domain-name/0/lobby
  
### Creating a new game:

Requirements for a new game (detailed instructions below):
1. A javascript file in `sandboardgames/game_modules/` that constructs the required Card and Deck objects and ensures they are correctly loaded at startup.
2. A javascript file in `sandboardgames/public/js/[new game name]` that defines some specific client-side settings for this game and has some specific function overrides (if needed).
3. A folder in the `sandboardgames/views` directory that holds the HTML layout (EJS templating is supported).
4. Add your game and created objects to `sandboardgames/game_modules/game_list.js`.
5. Add an icon/image of your game to `sandboardgames/public/img/[new game name]`.
6. Add your game icon to the Lobby view in `sandboardgames/views/lobby/partials/games.ejs`.
7. Add your game name into the games array of the lobby_game.js file in `sandboardgames/game_modules/lobby/lobby_game.js`. Yes, the Lobby is also a game ;).

### Detailed instructions:
#### Step 1:
- Start by adding a folder to the `sandboardgames/game_modules/` directory. Give it an abbreviated name of the new game (i.e. 'scbl' for Scrabble, etc.). The abbreviated name is referred to as `[new game name]` in further documentation.
- Create a new file in this folder named: `[new game name]_game.js` (i.e. scbl_game.js)

Copy the scaffold-code below for easy development:
```
let Card = require('../card').Card;
// The 'Card' object makes an element on the webpage draggable by players. 
// Construcor: var myCard = new Card([id of card - IMPORTANT: id should match an id in the HTML DOM)], [x-position at start], [y-position at start])

let Deck = require('../deck').Deck;
// The 'Deck' object can be used to stack Card objects (i.e. Drag cards into a box to create a draw pile or discard pile). Cards inside a Deck can be shuffled.
// Constructor: var myDeck = new Deck([id of deck - IMPORTANT: id should match an id in the HTML DOM], [x-position at start], [y-position at start], [width], [height])

let Openbox = require('../openbox').Openbox;
// An 'Openbox' is a box in the play-area where the frontface of a Card is revealed to ALL players when a Card object is dragged into it.
// Constructor: var myOpenbox = new Openbox([id of openbox - IMPORTANT: id should match an id in the HTML DOM], [x-position at start], [y-position at start], [width], [height])

let Game = require('../base_game').Game;
// The base game Object.

// use function below to define your new game Class (do not change, except for the [new game name])
function [new game name]_Game(wss){
  this.game = new Game(wss, this.resetGame);
  // Create a new game object for this game. 
}

[new game name]_Game.prototype.resetGame = function(game)
{
  // Define your game objects in his function.
  
  // This snippet is always required.
  game.gameObj.cards = [];
  game.gameObj.decks = [];
  game.gameObj.openboxes = [];
  game.gameObj.scoreboxes = [];

  // This snippet is an example for the Scrabble game.
  var tileDeckX = 352;
  var tileDeckY = 540 - (172 / 2);
  var tileDeck = new Deck('tileDeck', tileDeckX, tileDeckY, 117, 165);
  // If a Deck object is set as Immovable it cannot be dragged by players.
  tileDeck.setImmovable();

  var scblNlObj = {
    "A": {points: 1, quantity: 6},
    "B": {points: 3, quantity: 2},
    "C": {points: 5, quantity: 2},
    "D": {points: 2, quantity: 5},
    "E": {points: 1, quantity: 18},
    "F": {points: 4, quantity: 2},
    "G": {points: 3, quantity: 3},
    "H": {points: 4, quantity: 2},
    "I": {points: 1, quantity: 4},
    "J": {points: 4, quantity: 2},
    "K": {points: 3, quantity: 3},
    "L": {points: 3, quantity: 3},
    "M": {points: 3, quantity: 3},
    "N": {points: 1, quantity: 10},
    "O": {points: 1, quantity: 6},
    "P": {points: 3, quantity: 2},
    "Q": {points: 10, quantity: 1},
    "R": {points: 2, quantity: 5},
    "S": {points: 2, quantity: 5},
    "T": {points: 2, quantity: 5},
    "U": {points: 4, quantity: 3},
    "V": {points: 4, quantity: 2},
    "W": {points: 5, quantity: 2},
    "X": {points: 8, quantity: 1},
    "Y": {points: 8, quantity: 1},
    "IJ": {points: 4, quantity: 2},
    "Z": {points: 4, quantity: 2},
    " ": {points: 0, quantity: 2},
  }

  var n = 0;
  for (letter in scblNlObj)
  {
    for (var i = 0; i < scblNlObj[letter].quantity; i++)
    {
      var newPiece = new Card("t" + n, tileDeckX + 5, tileDeckY + 80);
      newPiece.faceType = 'text';
      newPiece.backface = {color: "#000000", backgroundcolor: "#efe2d2", text: " ", secondarytext: " "};
      newPiece.frontface = {color: "#000000", backgroundcolor: "#efe2d2", text: letter, secondarytext: scblNlObj[letter].points}
      newPiece.show = "backface";
      tileDeck.attachedCards.push(newPiece);
      game.gameObj.cards.push(newPiece);
      n++;
    }
  }
  // Do not forget to push your Card, Deck and Openbox object into the game.gameObj arrays.
  game.gameObj.decks.push(tileDeck);
  game.gameObj.openboxes.push(new Openbox('openbox0', 818, 0, 1080, 1080))

  // The snippet below is required to add spectators. The variable i should be set to the maximum number of players.
  for (var i = 4; i < 20; i++)
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

// export your game object
module.exports = {[new game name]_Game: [new game name]_Game}
```
