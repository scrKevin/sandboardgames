var webcamBoxWidth = 240;
var webcamBoxHeight = 180;

var wsLocation = "mk";

var maxPlayers = 6;

var maxSpectators = 20;

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

  for (player of gameObj.players)
  {
    shouldBeVisibleArray[player.id] = true;
  }

  shouldBeVisibleArray.forEach(function (shouldBeVisible, index) {
    toggleVisible("#webcamMoveBtn" + index, shouldBeVisible);
    toggleVisible("#webcambox" + index, shouldBeVisible);
  });

});

$(document).on("addWebcam", function(e, playerId, mirrored, muted){
  updateCss("#scoreboxlevel" + playerId, "display", "block");
  updateCss("#scoreboxbonus" + playerId, "display", "block");
});

$(document).on("leftPeer", function(e, playerId){
  updateCss("#scoreboxlevel" + playerId, "display", "none");
  updateCss("#scoreboxbonus" + playerId, "display", "none");
});