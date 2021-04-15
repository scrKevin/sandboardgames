const StartpositionsSH = require("./sh/startpositions");
const StartpositionsSY = require("./sy/startpositions");
const StartpositionsRMK = require("./rmk/startpositions");
const StartpositionsCTD = require("./ctd/startpositions");
const StartpositionsFKAR = require("./fkar/startpositions");
const StartpositionsSTRG = require("./strg/startpositions");
const StartpositionsSCBL = require("./scbl/startpositions");
const StartpositionsSOC = require("./soc/startpositions");
const StartpostionsPM = require("./pm/startpositions");

let SY_Game = require("./sy/sy_game").SY_Game;
let SH_Game = require("./sh/sh_game").SH_Game;
let Lobby_Game = require("./lobby/lobby_game").Lobby_Game;
let CAH_Game = require("./cah/cah_game").CAH_Game;
let RMK_Game = require("./rmk/rmk_game").RMK_Game;
let CTD_Game = require("./ctd/ctd_game").CTD_Game;
let FKAR_Game = require("./fkar/fkar_game").FKAR_Game;
let STRG_Game = require("./strg/strg_game").STRG_Game;
let SCBL_Game = require("./scbl/scbl_game").SCBL_Game;
let SOC_Game = require("./soc/soc_game").SOC_Game;
let PM_Game = require("./pm/pm_game").PM_Game;

function ImplementedGame(name, wsLocation, GameClass, routerLocation, viewsLocation, objectToPassToView)
{
  this.name = name;
  this.wsLocation = wsLocation;
  this.GameClass = GameClass;
  this.routerLocation = routerLocation;
  this.viewsLocation = viewsLocation;
  this.objectToPassToView = objectToPassToView;
}

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
  'soc': new ImplementedGame("Settlers of Catan", "soc", SOC_Game, "soc", "soc", {playerboxStartPos: StartpositionsSOC.playerBoxes, webcamPos: StartpositionsSOC.webcamPos, fixedPlayers:4}),
  'pm': new ImplementedGame("Pickomino", 'pm', PM_Game, "pm", "pm", {playerboxStartPos: StartpostionsPM.playerBoxes, webcamPos: StartpostionsPM.webcamPos, fixedPlayers: 8}),
}