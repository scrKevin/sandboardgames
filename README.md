# Sandboardgames

Working Example: 
https://bitwiseworkshop.nl

Play some board games with your friends around a virtual table.

Sandbox style board game engine running on NodeJS.
P2P Webcam support with WebRTC.

### Quick Linode install:
Create a Linode. "Debian 11" is fine.
Edit A and AAAA records in DNS settings for your domain.
SSH into your linode and execute:

 `bash <(curl https://raw.githubusercontent.com/scrKevin/sandboardgames/master/quick-install-linode.sh)`

 `tmux`

 `cd sandboardgames`

 `export PORT=443`

 `npm start`

 Detach from Tmux: CTRL^B -> D

 Re-attach: `tmux a -t 0`

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

### Detailed instructions:
#### Step 1:
- Start by adding a folder to the `sandboardgames/game_modules/` directory. Give it an abbreviated name of the new game (i.e. 'scbl' for Scrabble, etc.). The abbreviated name is referred to as `[new game name]` in further documentation.
- Create a new file in this folder named: `[new game name]_game.js` (i.e. scbl_game.js)

Copy the scaffold-code below to get you started:
```javascript
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
#### Step 2:

- Add a folder for your game in `sandboardgames/public/js`. Add a new javascript file in this folder and rename it to `[new game name].js` (i.e. scbl.js).
Copy/paste example below and change where needed.
```javascript
// The dimensions of the webcam video feeds.
var webcamBoxWidth = 320;
var webcamBoxHeight = 240;

var wsLocation = "scbl";
// rename it to [new game name]. This is used to route the websocket to your game.

var maxPlayers = 4;
// the maximum number of players for this game

var maxSpectators = 20;
// the maximum number of spectators (it is recommended to keep this at 20 for now).

// the snippets below will hide/show webcam boxes whenever needed. It is recommended to keep this code.
function toggleVisible(selector, shouldBeVisible)
{
  var displayValue = shouldBeVisible ? "block":"none"
  if ($(selector).css("display") !== displayValue)
  {
    $(selector).css("display", displayValue);
  }
}

$(document).on("gameObj", function(e, gameObj, myPlayerId, scale){

  var shouldBeVisibleArray = [];
  for (var i = 0; i < maxSpectators; i++)
  {
    shouldBeVisibleArray.push(false);
  }

  for (player of gameObj.players)
  {
    shouldBeVisibleArray[player.id] = true;
  }

  shouldBeVisibleArray.forEach(function (shouldBeVisible, index) {
    toggleVisible("#webcamMoveBtn" + index, shouldBeVisible);
    toggleVisible("#webcambox" + index, shouldBeVisible);
  });

});
```
#### Step 3:
- Add a folder for your game in `sandboardgames/views`. Create two new folders in the created directory: `pages` and `partials`. The system will render your EJS template located at `sandboardgames/views/[new game name]/pages/index.ejs`. See an example `index.ejs` below (this is for the Scrabble (scbl) game):
```html
<html>
  <head>
    <%- include ("../partials/head") %>
  </head>
  <body>
    <%- include ('../../common/welcomeModal'); -%>
    <%- include ('../../common/resetModal'); -%>
    <div class="scaleplane">
      <%- include ('../partials/board') %>
      <%- include ('../partials/playerboxes', {playerboxStartPos: playerboxStartPos}); -%>
      <%- include ('../../common/webcams', {webcamPos: webcamPos, fixedPlayers:fixedPlayers}); -%>
      <%- include ('../partials/openbox') %>
      <%- include ('../partials/touchboxes') %>
      <%  var scoreboxValues = [10, 1];
          for (var i = 0; i < fixedPlayers; i++) { 
            var id = i; -%>
            <%- include('../../common/scorebox', {scoreboxId: id, scoreboxValues: scoreboxValues}); %>
      <%  } -%>
      <%- include ('../partials/decks') %>
      <%- include ('../../common/cursors'); -%>
    </div>
  </body>
</html>
```
For your convenience, you can re-use the welcome modal (where players can select their color and player name), reset modal for the game admin (displayed after pressing ctrl - q), webcam boxes and cursors. They are located at `sandboardgames/views/common`.

Create your own `header.ejs` file in `sandboardgames/views/[new game name]/partials`. Copy/Paste the example below and edit to fit your needs.
```html
 
<!-- views/partials/head.ejs -->
<meta charset="UTF-8">
<!-- <meta name="viewport" content="width=device-width,user-scalable=no"> -->
<title>Your awesome game title.</title> 

<!-- Bootstrap CSS -->
<link href="/css/bootstrap.min.css" rel="stylesheet" type="text/css"> <!-- required to use Modals (Player color selection etc.) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.slim.min.js" integrity="sha256-pasqAKBDmFT4eHoN2ndd6lN370kFiGUFyTiUHWhU7k8=" crossorigin="anonymous"></script> <!-- required since JQuery is used extensively on the client-side javascript -->
<script src='/js/bootstrap.min.js'></script> <!-- required for those Modals -->
<script src="/js/scbl/scbl.js"></script> <!-- replace with your own .js file you created in Step 2. -->
<script src="/js/bundle.js"></script> <!-- this is the client-side javascript shared across all games for basic functionality -->

<style>
// Add your css styling here.
</style>
```

#### Step 4:
- Insert references to your created Game object into `sandboardgames/game_modules/game_list.js`. See example and comments below:
```javascript
const StartpositionsSH = require("./sh/startpositions");
const StartpositionsSY = require("./sy/startpositions");
const StartpositionsRMK = require("./rmk/startpositions");
const StartpositionsCTD = require("./ctd/startpositions");
const StartpositionsFKAR = require("./fkar/startpositions");
const StartpositionsSTRG = require("./strg/startpositions");
const StartpositionsSCBL = require("./scbl/startpositions");
// These are references to JSON files that contain starting positions. If you import them here, you can pass these as variables to your EJS layout. See example for scbl game below:
/*
module.exports.playerBoxes = {
  0: {top: 0, left: 0},
  1: {top: 540, left: 498},
  2: {top: 0, left: 498},
  3: {top: 540, left: 0}
}

module.exports.webcamPos = {
  0: {top: 300, left: 0},
  1: {top: 540, left: 498},
  2: {top: 300, left: 498},
  3: {top: 540, left: 0}
}
*/

let SY_Game = require("./sy/sy_game").SY_Game;
let SH_Game = require("./sh/sh_game").SH_Game;
let Lobby_Game = require("./lobby/lobby_game").Lobby_Game;
let CAH_Game = require("./cah/cah_game").CAH_Game;
let RMK_Game = require("./rmk/rmk_game").RMK_Game;
let CTD_Game = require("./ctd/ctd_game").CTD_Game;
let FKAR_Game = require("./fkar/fkar_game").FKAR_Game;
let STRG_Game = require("./strg/strg_game").STRG_Game;
let SCBL_Game = require("./scbl/scbl_game").SCBL_Game;
// add a reference to your own game here.


function ImplementedGame(name, wsLocation, GameClass, routerLocation, viewsLocation, objectToPassToView)
{
  this.name = name;
  this.wsLocation = wsLocation;
  this.GameClass = GameClass;
  this.routerLocation = routerLocation;
  this.viewsLocation = viewsLocation;
  this.objectToPassToView = objectToPassToView;
}

// Create your own 'ImplementedGame' object here and add it to the dictionary
module.exports.availableGames = {
  'lobby': new ImplementedGame('Lobby', 'lobby', Lobby_Game, "lobby", 'lobby', {fixedPlayers: 0}),
  'sy': new ImplementedGame('Scotland Yard', 'sy', SY_Game, "sy", 'sy', {webcamPos: StartpositionsSY.webcamPos, fixedPlayers: 6}),
  'sh': new ImplementedGame('Secret Hitler', 'sh', SH_Game, "sh", 'sh', {playerboxStartPos: StartpositionsSH.playerBoxes, webcamPos: StartpositionsSH.webcamPos, fixedPlayers: 10}),
  'cah': new ImplementedGame('Cards against Humanity', 'cah', CAH_Game.class, 'cah', 'cah', {nBlackCards: CAH_Game.nBlackCards, nWhiteCards: CAH_Game.nWhiteCards, fixedPlayers: 0}),
  'rmk': new ImplementedGame("Rummikub", 'rmk', RMK_Game, 'rmk', 'rmk', {playerboxStartPos: StartpositionsRMK.playerBoxes, webcamPos: StartpositionsRMK.webcamPos, fixedPlayers: 4}),
  'ctd': new ImplementedGame("Citadels", 'ctd', CTD_Game, 'ctd', 'ctd', {playerboxStartPos: StartpositionsCTD.playerBoxes, webcamPos: StartpositionsCTD.webcamPos, fixedPlayers: 7}),
  'fkar': new ImplementedGame('Fake Artist goes to New York', 'fkar', FKAR_Game, "fkar", 'fkar', {playerboxStartPos: StartpositionsFKAR.playerBoxes, webcamPos: StartpositionsFKAR.webcamPos, fixedPlayers: 10}),
  'strg': new ImplementedGame("Stratego", 'strg', STRG_Game, 'strg', 'strg', {playerboxStartPos: StartpositionsSTRG.playerBoxes, webcamPos: StartpositionsSTRG.webcamPos, fixedPlayers: 2}),
  'scbl': new ImplementedGame("Scrabble", 'scbl', SCBL_Game, 'scbl', 'scbl', {playerboxStartPos: StartpositionsSCBL.playerBoxes, webcamPos: StartpositionsSCBL.webcamPos, fixedPlayers: 4}),
}
```