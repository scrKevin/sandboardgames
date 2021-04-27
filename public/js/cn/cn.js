var webcamBoxWidth = 320;
var webcamBoxHeight = 240;

var wsLocation = "cn";

var maxPlayers = 20;

function updateCss(selector, property, value)
{
  if ($(selector).css(property) !== value)
  {
    $(selector).css(property, value);
  }
}

$(document).on("cardTextChanged", function(e, cardId){
  //console.log("cardTextChanged.")
  // textFit($('#' + cardId)[0], {multiLine: true, maxFontSize: 18})
  textFit($('#' + cardId + "BF"), {multiLine: false, maxFontSize: 30})
  // updateCss('#' + cardId + "BF", "line-height", "100px");
  // $('#' + cardId + "BF").css("line-height", "100px");
  textFit($('#' + cardId + "FF"), {multiLine: false, maxFontSize: 30})
  // updateCss('#' + cardId + "FF", "line-height", "100px");
  // $('#' + cardId + "FF").css("line-height", "100px");
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