var webcamBoxWidth = 270;
var webcamBoxHeight = 360;

var wsLocation = "crp";

var maxPlayers = 6;

var maxSpectators = 20;

//////
var clientController = null;

function toggleVisible(selector, shouldBeVisible)
{
  var displayValue = shouldBeVisible ? "block":"none"
  if ($(selector).css("display") !== displayValue)
  {
    $(selector).css("display", displayValue);
  }
}

function updateCss(selector, property, value)
{
  if ($(selector).css(property) !== value)
  {
    $(selector).css(property, value);
  }
}

$(document).on("gameObj", function(e, gameObj, myPlayerId, scale){

  var shouldBeVisibleArray = [];
  for (var i = 0; i < maxSpectators; i++)
  {
    shouldBeVisibleArray.push(false);
  }

  for (let player of Object.values(gameObj.players))
  {
    shouldBeVisibleArray[player.id] = true;
  }

  shouldBeVisibleArray.forEach(function (shouldBeVisible, index) {
    toggleVisible("#webcamMoveBtn" + index, shouldBeVisible);
    toggleVisible("#webcambox" + index, shouldBeVisible);
  });

});

$(document).on("clientControllerReady", function(e, newClientController){
  clientController = newClientController;
});

$(document).on("shuffleSeating", function(e) {
  var pos = []
  for (let p = 0; p < maxPlayers; p++) {
    var newPos = {}
    newPos.webcam = {}
    newPos.webcam.left = $("#webcam" + p).css("left")
    newPos.webcam.top = $("#webcam" + p).css("top")
    newPos.playerbox = {}
    newPos.playerbox.left = $("#scaledProjectionBox" + p).css("left")
    newPos.playerbox.top = $("#scaledProjectionBox" + p).css("top")
    pos.push(newPos)
  }
  clientController.shuffleSeating(pos)
})

$(document).on("newSeating", function(e, newSeating){
  console.log(newSeating)
  for (let p = 0; p < maxPlayers; p++) {
    $("#webcam" + p).css("left", newSeating[p].webcam.left)
    $("#webcam" + p).css("top", newSeating[p].webcam.top)
    $("#scaledProjectionBox" + p).css("left", newSeating[p].playerbox.left)
    $("#scaledProjectionBox" + p).css("top", newSeating[p].playerbox.top)
  }
});

$(document).on("addWebcam", function(e, playerId, mirrored, muted){
  // updateCss("#scoreboxlevel" + playerId, "display", "block");
  // updateCss("#scoreboxbonus" + playerId, "display", "block");
  // updateCss("#levelText" + playerId, "display", "block");
  // updateCss("#bonusText" + playerId, "display", "block");
});

$(document).on("leftPeer", function(e, playerId){
  // updateCss("#scoreboxlevel" + playerId, "display", "none");
  // updateCss("#scoreboxbonus" + playerId, "display", "none");
  // updateCss("#levelText" + playerId, "display", "none");
  // updateCss("#bonusText" + playerId, "display", "none");
});