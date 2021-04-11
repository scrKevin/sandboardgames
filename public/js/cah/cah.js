var webcamBoxWidth = 320;
var webcamBoxHeight = 240;

var wsLocation = "cah";

var maxPlayers = 20;

$(document).on("cardTextChanged", function(e, cardId){
  // textFit($('#' + cardId)[0], {multiLine: true, maxFontSize: 18})
  textFit($('#' + cardId + "FF"), {multiLine: true, maxFontSize: 18})
})

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
  for (var i = 0; i < maxPlayers; i++)
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