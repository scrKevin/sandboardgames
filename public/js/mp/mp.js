var webcamBoxWidth = 266;
var webcamBoxHeight = 200;

var wsLocation = "mp";

var maxPlayers = 8;

var maxSpectators = 20;

var moneyObj = {5: 4, 25: 5, 50: 2, 250: 4, 100: 2, 10: 5, 1: 5};

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

$(document).on("pieceColor", function(e, playerId, filter){
  for(var i = 1; i <= 8; i++)
  {
    //updateCss("#vote" + playerId + "_" + i + "FF", "filter", filter);
  }
});

$(document).on("addWebcam", function(e, playerId, mirrored, muted){
  updateCss("#walletScorebox" + playerId, "display", "block");
  for (m in moneyObj)
  {
    for (var i = 0; i < moneyObj[m]; i++)
    {
      updateCss("#m" + m + "_" + playerId + "_" + i, "display", "block");
    }
  }
});

$(document).on("leftPeer", function(e, playerId){
  updateCss("#walletScorebox" + playerId, "display", "none");
  for (m in moneyObj)
  {
    for (var i = 0; i < moneyObj[m]; i++)
    {
      updateCss("#m" + m + "_" + playerId + "_" + i, "display", "none");
    }
  }
});