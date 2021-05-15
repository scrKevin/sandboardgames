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

var guessCanvas = null;
var guessCtx = null;
var wGuess = 0;
var hGuess = 0;
var lGuess = 0;
var tGuess = 0;

var scale = 1;

var currX = 0;
var currY = 0;
var prevX = 0;
var prevY = 0;

var flag = false;
var dot_flag = false;

var currentDrawing = []

var scrollSteps = [80, 80, 900];

var drawTimeLimit = 10;
var drawTimeLeft = 30;
var countDownDisplayInterval = null;

this.colorMap = {
  "#FF0000": "#FF5252",
  "#88ff91": "#88ff91",
  "#0000FF": "#8080FF",
  "#FFFF00": "#FFFF00",
  "#00FFFF": "#00FFFF",
  "#790079": "#E600E6",
  "#FF8800": "#FF8800",
  "#888888": "#888888",
  "#0e8200": "#109E00",
  "#ffbff7": "#ffbff7"
}

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

function initGuessCanvas (canvasNew)
{
  guessCanvas = canvasNew;
  //console.log(canvas)
  guessCtx = guessCanvas.getContext("2d");
  wGuess = guessCanvas.width;
  hGuess = guessCanvas.height;
  lGuess = $("#tlsGuessCanvas").position().left;
  tGuess = $("#tlsGuessCanvas").position().top;
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

function displayDrawingToGuess (drawing)
{
  for (let line of drawing)
  {
    //console.log(line)
    guessCtx.beginPath();
    guessCtx.moveTo(line.x0, line.y0);
    guessCtx.lineTo(line.x1, line.y1);
    guessCtx.strokeStyle = "#000000"
    guessCtx.lineWidth = 2;
    guessCtx.stroke();
    guessCtx.closePath();
  }
}

function displayResultDrawing (resultCanvas, drawing)
{
  resultCtx = resultCanvas.getContext("2d");
  for (let line of drawing)
  {
    //console.log(line)
    resultCtx.beginPath();
    resultCtx.moveTo(line.x0, line.y0);
    resultCtx.lineTo(line.x1, line.y1);
    resultCtx.strokeStyle = "#000000"
    resultCtx.lineWidth = 2;
    resultCtx.stroke();
    resultCtx.closePath();
  }
}

function erase () {
  if (canvas != null)
  {
    ctx.clearRect(0, 0, w, h);
  }
}

function eraseGuessCanvas () {
  if (guessCanvas != null)
  {
    guessCtx.clearRect(0, 0, wGuess, hGuess);
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

  if (tlsGame.gameState === 0 || tlsGame.gameState === -1)
  {
    updateCss("#startGameBtn", "display", "block");
    updateCss("#guessplane", "display", "none");
    updateCss("#drawplane", "display", "none");
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

    if (tlsGame.gameState == 1)
    {
      $(".subjectBox").remove();
      $(".moveBtn").remove();
    }
    

    if (isDrawPhase(tlsGame.gameState))
    {
      for (let subject of tlsGame.subjects)
      {
        if (subject.seenBy[tlsGame.gameState - 1] == myPlayerId)
        {
          if (tlsGame.gameState == 1){
            $("#word").html(subject.word);
          }
          else {
            $("#word").html(subject.guesses[((tlsGame.gameState - 1) / 2) - 1].word);
          }
          
          break;
        }
      }
      erase();
      currentDrawing = [];
      updateCss("#drawplane", "display", "block");
      updateCss("#guessplane", "display", "none");
      drawTimeLeft = drawTimeLimit;
      countDownDisplayInterval = setInterval(() => {
        drawTimeLeft--;
        $(".countdown").html(drawTimeLeft);
      }, 1000);
      submitTimeout = setTimeout(() =>{
        clearInterval(countDownDisplayInterval);
        let sendData = {
          type: "submitDrawing",
          drawing: currentDrawing
        }
        clientController.sendCustomMessage(sendData)
      }, drawTimeLimit * 1000);
    }
    else if (isGuessPhase(tlsGame.gameState))
    {
      eraseGuessCanvas();
      for (let subject of tlsGame.subjects)
      {
        if (subject.seenBy[tlsGame.gameState - 1] == myPlayerId)
        {
          //console.log(subject.drawings[(tlsGame.gameState / 2) - 1])
          displayDrawingToGuess(subject.drawings[(tlsGame.gameState / 2) - 1].lines)
          break;
        }
      }

      updateCss("#guessplane", "display", "block");
      updateCss("#drawplane", "display", "none");
    }
    else if (tlsGame.gameState == -1)
    {
      // show results
      updateCss("#guessplane", "display", "none");
      updateCss("#drawplane", "display", "none");
      for (let subject of tlsGame.subjects)
      {

        $('.scaleplane').append("<div class='subjectBox moveable' id='subjectBox" + subject.id + "'></div>")
        $('.scaleplane').append('<div class="card moveBtn" id="subjectMoveBtn' + subject.id + '"><img src="/img/lobby/move.png"/></div>')
        let subjectHtml = "<div class='collapseBtn' id='subjectCollapseBtn" + subject.id + "'><img src='/img/tls/collapse.png'/></div><div class='upBtn' id='subjectUpBtn" + subject.id + "'><img src='/img/tls/up.png'/></div><div class='downBtn' id='subjectDownBtn" + subject.id + "'><img src='/img/tls/down.png'/></div><div class='scrollbox' id='scrollbox" + subject.id + "'><div class='subjectWordText'><span style='font-weight: bold;'>" + subject.word + "</span></div>";
        for (let round = 0; round < subject.guesses.length; round++)
        {
          let playerThatDrew = "";
          let playerThatGuessed = "";
          let playerThatDrewColor = "#FFFFFF"
          let playerThatGuessedColor = "#FFFFFF"
          for (let dPlayer of Object.values(gameObj.players))
          {
            if (dPlayer.id == subject.drawings[round].drawnBy)
            {
              playerThatDrew = dPlayer.name;
              playerThatDrewColor = colorMap[dPlayer.color];
            }
            if (dPlayer.id == subject.guesses[round].guessedBy)
            {
              playerThatGuessed = dPlayer.name;
              playerThatGuessedColor = colorMap[dPlayer.color];
            }
          }
          subjectHtml += "<div class='subjectWordText' style='background-color:" + playerThatDrewColor + "'><span style='font-weight: bold;'>" + playerThatDrew + "</span> drew:</div>";
          subjectHtml += "<canvas class='subjectCanvas' id='canvasSubject" + subject.id + "_" + round + "' width='700' height='900'></canvas>";
          subjectHtml += "<div class='subjectWordText' style='background-color:" + playerThatGuessedColor + "'><span style='font-weight: bold;'>" + playerThatGuessed + "</span> guessed: " + subject.guesses[round].word + "</div>";
        }
        subjectHtml += "</div>"
        $("#subjectBox" + subject.id).html(subjectHtml)
      }
      for (let subject of tlsGame.subjects)
      {
        for (let round = 0; round < subject.guesses.length; round++)
        {
          let resultCanvas = document.getElementById("canvasSubject" + subject.id + "_" + round)
          displayResultDrawing(resultCanvas, subject.drawings[round].lines);
        }
        $("#subjectCollapseBtn" + subject.id).on("click", (e) =>{
          let sendData = {
            type: "collapseBtn",
            subjectId: subject.id
          }
          clientController.sendCustomMessage(sendData)
        })
        $("#subjectUpBtn" + subject.id).on("click", (e) =>{
          let sendData = {
            type: "subjectScrollUp",
            subjectId: subject.id
          }
          clientController.sendCustomMessage(sendData)
        })
        $("#subjectDownBtn" + subject.id).on("click", (e) =>{
          let sendData = {
            type: "subjectScrollDown",
            subjectId: subject.id
          }
          clientController.sendCustomMessage(sendData)
        })
      }
      $(document).trigger("initCardFunctions")
      
    }

    
  }
  else if (tlsGame.gameState == -1)
  {
    for (let subject of tlsGame.subjects)
    {
      if (subject.collapsed)
      {
        updateCss("#subjectBox" + subject.id, "height", "160px")
      }
      else
      {
        updateCss("#subjectBox" + subject.id, "height", "1060px")
      }
      let pos = 0;
      for (i = 0; i < subject.scrollPosition; i++)
      {
        pos += scrollSteps[i % scrollSteps.length]
      }
      updateCss("#scrollbox" + subject.id, "top", "-" + pos + "px")
    }
  }

});

$(document).on("clientControllerReady", function(e, newClientController){
  clientController = newClientController;

  initCanvas(document.getElementById('tlsDrawCanvas'));
  initGuessCanvas(document.getElementById('tlsGuessCanvas'))

  $("#startGameBtn").on('click', (e) => {
    let sendData = {
      type: "start_tls_game"
    }
    clientController.sendCustomMessage(sendData)
  })

  $("#submitGuessBtn").on('click', (e) => {
    let guess = $("#guess").val();
    //console.log(guess);
    if (typeof guess !== 'undefined' && guess !== '')
    {
      updateCss("#guessplane", "display", "none");
      $("#guess").val("");
      let sendData = {
        type: "submitGuess",
        guess: guess
      }
      clientController.sendCustomMessage(sendData)
    }
  })

})

$(document).on("scale", function(e, newScale){
  scale = newScale;
})

$(document).on("playerId", function(e, newPlayerId){
  myPlayerId = newPlayerId;
})

$(document).on("reset", function(e){
  $(".subjectBox").remove();
  $(".moveBtn").remove();
})


