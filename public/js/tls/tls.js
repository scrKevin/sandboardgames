var webcamBoxWidth = 250;
var webcamBoxHeight = 300;

var wsLocation = "tls";

var maxPlayers = 10;

var maxSpectators = 20;

var clientController = null;

var myPlayerId = -1;

var lastGameState = -1;

var canvas = null;
var ctx = null;
var w = 0;
var h = 0;
var l = 0;
var t = 0;

var scale = 1;

var currX = 0;
var currY = 0;
var prevX = 0;
var prevY = 0;

var flag = false;
var dot_flag = false;

var currentDrawing = []

function initCanvas (canvasNew)
{
  canvas = canvasNew;
  //console.log(canvas)
  ctx = canvas.getContext("2d");
  w = canvas.width;
  h = canvas.height;
  l = $("#tlsDrawCanvas").position().left;
  t = $("#tlsDrawCanvas").position().top;


  canvas.addEventListener("mousemove", (e) => {
    processMouse('move', e)
  }, false);
  canvas.addEventListener("mousedown", (e) => {
    processMouse('down', e)
  }, false);
  canvas.addEventListener("mouseup", (e) => {
    processMouse('up', e)
  }, false);
  canvas.addEventListener("mouseout", (e) => {
    processMouse('out', e)
  }, false);
}

function processMouse (res, e)
{
  
  if (res == 'down') {
    prevX = currX;
    prevY = currY;
    currX = Math.round((e.clientX ) * (1 / scale)) - 710;
    currY = Math.round((e.clientY ) * (1 / scale)) - 180;

    //console.log(currX + ", " + currY)

    flag = true;
    dot_flag = true;
    if (dot_flag) {
      ctx.beginPath();
      ctx.fillStyle = "#000000";
      ctx.fillRect(currX, currY, 2, 2);
      ctx.closePath();
      dot_flag = false;
    }
  }
  if (res == 'up' || res == "out") {
    flag = false;
    //canvasFpsLimiter.update();
  }
  if (res == 'move') {
    if (flag) {
      prevX = currX;
      prevY = currY;
      currX = Math.round((e.clientX ) * (1 / scale)) - 710;
      currY = Math.round((e.clientY ) * (1 / scale)) - 180;
      draw();
    }
  }
}
function draw ()
{
  this.currentDrawing.push({x0: this.prevX, y0: this.prevY, x1: this.currX, y1: this.currY});
  //this.canvasFpsLimiter.update();
  ctx.beginPath();
  ctx.moveTo(prevX, prevY);
  ctx.lineTo(currX, currY);
  ctx.strokeStyle = "#000000"
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

function erase () {
  if (canvas != null)
  {
    ctx.clearRect(0, 0, w, h);
  }
}


$(document).on("cardTextChanged", function(e, cardId){
  textFit($('#' + cardId + "FF"), {multiLine: true, maxFontSize: 32})
})

function updateCss(selector, property, value)
{
  if ($(selector).css(property) !== value)
  {
    $(selector).css(property, value);
  }
}

function toggleVisible(selector, shouldBeVisible)
{
  var displayValue = shouldBeVisible ? "block":"none"
  if ($(selector).css("display") !== displayValue)
  {
    $(selector).css("display", displayValue);
  }
}

function isDrawPhase(gameState)
{
  if (gameState > 0 && gameState % 2 !== 0)
  {
    return true;
  }
  return false;
}

function isGuessPhase(gameState)
{
  if (gameState > 0 && gameState % 2 === 0)
  {
    return true;
  }
  return false;
}

$(document).on("gameObj", function(e, gameObj, myPlayerId, scale){

  let tlsGame = gameObj.tlsGameObject;

  if (tlsGame.gameState === 0)
  {
    updateCss("#startGameBtn", "display", "block");
  }
  else
  {
    updateCss("#startGameBtn", "display", "none");
  }
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

  //console.log(tlsGame)
  if (tlsGame.gameState !== lastGameState){
    lastGameState = tlsGame.gameState;

    if (isDrawPhase(tlsGame.gameState))
    {
      for (let subject of tlsGame.subjects)
      {
        if (subject.seenBy[tlsGame.gameState] == myPlayerId)
        {
          $("#word").html(subject.word);
          break;
        }
      }
      erase();
      currentDrawing = [];
      updateCss("#drawplane", "display", "block");
      updateCss("#guessplane", "display", "none");
      submitTimeout = setTimeout(() =>{
        let sendData = {
          type: "submitDrawing",
          drawing: currentDrawing
        }
        clientController.sendCustomMessage(sendData)
      }, 10000);
    }
    else if (isGuessPhase(tlsGame.gameState))
    {
      updateCss("#guessplane", "display", "block");
      updateCss("#drawplane", "display", "none");
    }
  }

});

$(document).on("clientControllerReady", function(e, newClientController){
  clientController = newClientController;

  initCanvas(document.getElementById('tlsDrawCanvas'));

  $("#startGameBtn").on('click', (e) => {
    let sendData = {
      type: "start_tls_game"
    }
    clientController.sendCustomMessage(sendData)
  })

})

$(document).on("scale", function(e, newScale){
  scale = newScale;
})

$(document).on("scale", function(e, newPlayerId){
  myPlayerId = newPlayerId;
})

