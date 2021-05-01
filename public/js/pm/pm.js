// The dimensions of the webcam video feeds.
var webcamBoxWidth = 320;
var webcamBoxHeight = 240;

var wsLocation = "pm";
// rename it to [new game name]. This is used to route the websocket to your game.

var maxPlayers = 8;
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

  for (let player of Object.values(gameObj.players))
  {
    shouldBeVisibleArray[player.id] = true;
  }

  shouldBeVisibleArray.forEach(function (shouldBeVisible, index) {
    toggleVisible("#webcamMoveBtn" + index, shouldBeVisible);
    toggleVisible("#webcambox" + index, shouldBeVisible);
  });

});