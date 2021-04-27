const StartpositionsSH = require("./sh/startpositions");
const StartpositionsSY = require("./sy/startpositions");
const StartpositionsRMK = require("./rmk/startpositions");
const StartpositionsCTD = require("./ctd/startpositions");
const StartpositionsFKAR = require("./fkar/startpositions");
const StartpositionsSTRG = require("./strg/startpositions");
const StartpositionsSCBL = require("./scbl/startpositions");
const StartpositionsSOC = require("./soc/startpositions");
const StartpositionsPM = require("./pm/startpositions");
const StartpositionsMK = require("./mk/startpositions");
const StartpositionsDX = require("./dx/startpositions");
const StartpositionsMP = require("./mp/startpositions");

let SY_Game = require("./sy/sy_game").SY_Game;
let SH_Game = require("./sh/sh_game").SH_Game;
let CAH_Game = require("./cah/cah_game").CAH_Game;
let RMK_Game = require("./rmk/rmk_game").RMK_Game;
let CTD_Game = require("./ctd/ctd_game").CTD_Game;
let FKAR_Game = require("./fkar/fkar_game").FKAR_Game;
let STRG_Game = require("./strg/strg_game").STRG_Game;
let SCBL_Game = require("./scbl/scbl_game").SCBL_Game;
let SOC_Game = require("./soc/soc_game").SOC_Game;
let PM_Game = require("./pm/pm_game").PM_Game;
let MK_Game = require("./mk/mk_game").MK_Game;
let DX_Game = require("./dx/dx_game").DX_Game;
let MP_Game = require("./mp/mp_game").MP_Game;
let CN_Game = require("./cn/cn_game").CN_Game;

function ImplementedGame(name, wsLocation, GameClass, routerLocation, viewsLocation, iconLocation, nOfPlayers, objectToPassToView)
{
  this.name = name;
  this.wsLocation = wsLocation;
  this.GameClass = GameClass;
  this.routerLocation = routerLocation;
  this.viewsLocation = viewsLocation;
  this.iconLocation = iconLocation;
  this.nOfPlayers = nOfPlayers;
  this.objectToPassToView = objectToPassToView;
}

let availableGames = {
  'sy': new ImplementedGame('Scotland Yard', 'sy', SY_Game, "sy", 'sy', 'sy/scotland-yard.svg', "3-6", {webcamPos: StartpositionsSY.webcamPos, fixedPlayers: 6}),
  'sh': new ImplementedGame('Secret Hitler', 'sh', SH_Game, "sh", 'sh', 'sh/logo.png', "5-10", {playerboxStartPos: StartpositionsSH.playerBoxes, webcamPos: StartpositionsSH.webcamPos, fixedPlayers: 10}),
  'cah': new ImplementedGame('Cards against Humanity', 'cah', CAH_Game.class, 'cah', 'cah', 'cah/cah.png', "3+", {nBlackCards: CAH_Game.nBlackCards, nWhiteCards: CAH_Game.nWhiteCards, fixedPlayers: 0}),
  'rmk': new ImplementedGame("Rummikub", 'rmk', RMK_Game, 'rmk', 'rmk', 'rmk/rummikub.svg', "2-4", {playerboxStartPos: StartpositionsRMK.playerBoxes, webcamPos: StartpositionsRMK.webcamPos, fixedPlayers: 4}),
  'ctd': new ImplementedGame("Citadels", 'ctd', CTD_Game, 'ctd', 'ctd', 'ctd/citadels.svg', "2-7", {playerboxStartPos: StartpositionsCTD.playerBoxes, webcamPos: StartpositionsCTD.webcamPos, fixedPlayers: 7}),
  'fkar': new ImplementedGame('Fake Artist goes to New York', 'fkar', FKAR_Game, "fkar", 'fkar', 'fkar/fake_artist.svg', "5-10", {playerboxStartPos: StartpositionsFKAR.playerBoxes, webcamPos: StartpositionsFKAR.webcamPos, fixedPlayers: 10}),
  'strg': new ImplementedGame("Stratego", 'strg', STRG_Game, 'strg', 'strg', 'strg/stratego.svg', '2', {playerboxStartPos: StartpositionsSTRG.playerBoxes, webcamPos: StartpositionsSTRG.webcamPos, fixedPlayers: 2}),
  'scbl': new ImplementedGame("Scrabble", 'scbl', SCBL_Game, 'scbl', 'scbl', 'scbl/scrabble.svg', "2-4", {playerboxStartPos: StartpositionsSCBL.playerBoxes, webcamPos: StartpositionsSCBL.webcamPos, fixedPlayers: 4}),
  'soc': new ImplementedGame("Settlers of Catan", "soc", SOC_Game, "soc", "soc", 'soc/settlersOfCatan.svg', "2-4", {playerboxStartPos: StartpositionsSOC.playerBoxes, webcamPos: StartpositionsSOC.webcamPos, fixedPlayers:4}),
  'pm': new ImplementedGame("Pickomino", 'pm', PM_Game, "pm", "pm", 'pm/pickomino.svg', "2-8", {playerboxStartPos: StartpositionsPM.playerBoxes, webcamPos: StartpositionsPM.webcamPos, fixedPlayers: 8}),
  'mk': new ImplementedGame("Munchkin", 'mk', MK_Game, 'mk', 'mk', 'mk/munckin_lobby_icon.svg', "3-6", {playerboxStartPos: StartpositionsMK.playerBoxes, webcamPos: StartpositionsMK.webcamPos, fixedPlayers: 6}),
  'dx': new ImplementedGame("Dixit", "dx", DX_Game, "dx", "dx", "dx/dixit_lobby_icon.svg", "3-6", {playerboxStartPos: StartpositionsDX.playerBoxes, webcamPos: StartpositionsDX.webcamPos, fixedPlayers: 6}),
  'mp': new ImplementedGame("Monopoly", "mp", MP_Game, "mp", "mp", "mp/monopoly_lobby_icon.svg", "2-8", {playerboxStartPos: StartpositionsMP.playerBoxes, webcamPos: StartpositionsMP.webcamPos, fixedPlayers: 8, board: StartpositionsMP.board}),
  'cn': new ImplementedGame("Codenames", "cn", CN_Game, "cn", "cn", "cn/codenames_lobby_icon.svg", "4+", {fixedPlayers: 0}),
}

let gamesList = [];
let gameInfo = {};
for (ag in availableGames)
{
  gamesList.push(availableGames[ag].routerLocation);
  gameInfo[ag] = {};
  gameInfo[ag]['lobbyIcon'] = availableGames[ag].iconLocation;
  gameInfo[ag]['nOfPlayers'] = availableGames[ag].nOfPlayers;
}

require("./lobby/lobby_game").setGamesList(gamesList);
let Lobby_Game = require("./lobby/lobby_game").Lobby_Game;

availableGames['lobby'] = new ImplementedGame('Lobby', 'lobby', Lobby_Game, "lobby", 'lobby', '', "1+", {fixedPlayers: 0, gameInfo: gameInfo})


module.exports.availableGames = availableGames;