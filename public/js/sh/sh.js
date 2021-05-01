var webcamBoxWidth = 250;
var webcamBoxHeight = 300;

var wsLocation = "sh";

var maxPlayers = 10;

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

  for (let player of Object.values(gameObj.players))
  {
    shouldBeVisibleArray[player.id] = true;
  }

  shouldBeVisibleArray.forEach(function (shouldBeVisible, index) {
    toggleVisible("#webcamMoveBtn" + index, shouldBeVisible);
    toggleVisible("#webcambox" + index, shouldBeVisible);
  });

});

$(document).on("addWebcam", function(e, playerId, mirrored, muted){
  updateCss("#ballotja" + playerId, "display", "block");
  updateCss("#ballotnein" + playerId, "display", "block");
});

$(document).on("leftPeer", function(e, playerId){
  updateCss("#ballotja" + playerId, "display", "none");
  updateCss("#ballotnein" + playerId, "display", "none");
});