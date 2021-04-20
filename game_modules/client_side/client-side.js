let ClientController = require("./client_controller").ClientController;
require("./devtools-detect");

var clientController = new ClientController()
var myGameObj = null;
var scale = 1;

var myStream = null;

var myPlayerId = -1;

var state = {
  color: "#FFFFFF"
}

var myColor = -1

var colors = [
  "#FF0000",
  "#88ff91",
  "#0000FF",
  "#FFFF00",
  "#00FFFF",
  "#790079",
  "#FF8800",
  "#888888",
  "#0e8200",
  "#ffbff7"
]

var filterMap = {
  "#FF0000": "invert(11%) sepia(88%) saturate(7320%) hue-rotate(5deg) brightness(104%) contrast(114%)",
  "#88ff91": "invert(93%) sepia(56%) saturate(660%) hue-rotate(52deg) brightness(104%) contrast(102%)",
  "#0000FF": "invert(10%) sepia(100%) saturate(5585%) hue-rotate(245deg) brightness(92%) contrast(152%)",
  "#FFFF00": "invert(96%) sepia(55%) saturate(6571%) hue-rotate(356deg) brightness(102%) contrast(105%)",
  "#00FFFF": "invert(93%) sepia(100%) saturate(5902%) hue-rotate(103deg) brightness(103%) contrast(102%)",
  "#790079": "invert(12%) sepia(41%) saturate(6323%) hue-rotate(289deg) brightness(97%) contrast(134%)",
  "#FF8800": "invert(65%) sepia(50%) saturate(5390%) hue-rotate(2deg) brightness(105%) contrast(103%)",
  "#888888": "invert(60%) sepia(5%) saturate(5%) hue-rotate(344deg) brightness(89%) contrast(86%)",
  "#0e8200": "invert(27%) sepia(61%) saturate(2095%) hue-rotate(81deg) brightness(106%) contrast(104%)",
  "#ffbff7": "invert(81%) sepia(19%) saturate(976%) hue-rotate(285deg) brightness(106%) contrast(106%)"
}

var cssFilterBorder = " drop-shadow(1px 1px 0px black) drop-shadow(-1px 1px 0px black) drop-shadow(1px -1px 0px black) drop-shadow(-1px -1px 0px black)"

var ws = null;

var doorbell = new Audio('/wav/doorbell.wav');
var scoreMinSound = new Audio('/wav/score_min.wav');
var scorePlusSound = new Audio('/wav/score_plus.wav');

var latestMouseX = -1;
var latestMouseY = -1;
var dragCardId = null;
var dragCardIds = [];
var inspectingCardId = null;
// var suppressNextChanges = [];
var lastTouchedCardId = null;

var highestZ;

var blockCardChange = [];

var devToolsOpenedTimes = {};

function addWebcam(stream, playerId, mirrored, muted)
{
  var video = document.createElement('video');
  $("#webcam" + playerId).html(video)
  if (mirrored)
  {
    $("#webcam" + playerId).css("transform", "scale(-1, 1)")
  }
  video.muted = muted;
  video.srcObject = stream;
  video.addEventListener("playing", function () {
    setTimeout(function () {
      console.log("Stream dimensions: " + video.videoWidth + "x" + video.videoHeight);
      var aspectRatio = video.videoWidth / video.videoHeight;
      if (aspectRatio < 1)
      {
        var correctedHeight = video.videoHeight * (webcamBoxWidth / video.videoWidth);
        $("#webcam" + playerId + " video").css("width", webcamBoxWidth + "px")
        $("#webcam" + playerId + " video").css("height", correctedHeight + "px");
        $("#webcam" + playerId + " video").css("margin-left", "0px")
        $("#webcam" + playerId + " video").css("margin-top", ((webcamBoxHeight - correctedHeight) * 0.5) + "px")
      }
      else
      {
        var correctedWidth = video.videoWidth * (webcamBoxHeight / video.videoHeight);
        $("#webcam" + playerId + " video").css("width", correctedWidth + "px")
        $("#webcam" + playerId + " video").css("height", webcamBoxHeight + "px");
        $("#webcam" + playerId + " video").css("margin-left", ((webcamBoxWidth - correctedWidth) * 0.5) + "px")
        $("#webcam" + playerId + " video").css("margin-top", "0px")
      }
    }, 500);
  });
  video.play();
  updateCss("#webcam" + playerId, "display", "block");
  updateCss("#player" + playerId + "box", "display", "block");
  updateCss("#scaledProjectionBox" + playerId, "display", "block");
  updateCss(".pieceFor_" + playerId, "display", "block");
  updateCss("#player" + playerId + "NameText", "display", "initial");
  updateCss("#player" + playerId + "Name", "display", "initial");
  $(document).trigger("addWebcam", [playerId, mirrored, muted]);
}

var gameInitialized = false;

function InitWebSocket()
{
  var scheme = "wss";
  var port = "";
  if (location.protocol !== 'https:') {
    scheme = "ws";
    port = ":8080";
  }
  if ("WebSocket" in window)
  {
    var host = window.location.hostname;
     //console.log(window.location)
    ws = new WebSocket(scheme + "://" + host + port + window.location.pathname);

    clientController.initialize(ws, myStream);

    clientController.on("playerId", (playerId) => {
      myPlayerId = playerId;
      if (myPlayerId + 1 > maxPlayers)
      {
        $('#welcomeModal').modal('hide');
      }
      if (!gameInitialized)
      {
        addWebcam(myStream, myPlayerId, true, true);
        gameInitialized = true;
      }
      else
      {
        for (var i = 0; i < 20; i++)
        {
          $("#micContainer" + i).css("display", "none");
        }
      }
      $("#micContainer" + myPlayerId).css("display", "block");
    });

    clientController.on("updateGame", (gameObj, changedCardsBuffer, newDrawCoords, init) => {
      myGameObj = gameObj;
      highestZ = gameObj.highestZ;
      // console.log(gameObj.highestZ);
      if(init)
      {
        initCards(gameObj)
        console.log("reset or init")
      }
      else
      {
        updateCards(gameObj, changedCardsBuffer);
      }

      //updateOpenboxes(gameObj);
      updateCursors(gameObj);
      updateScoreboxes(gameObj);
      updateColorSelection(gameObj);


      $(document).trigger("gameObj", [gameObj, myPlayerId, scale]);
    });

    clientController.on("cardConflict", (cardId) => {
      if (dragCardId === cardId)
      {
        console.log("Card conflict detected for " + cardId);
        dragCardId = null;
        dragCardIds = [];
      }
    });

    clientController.on("newPeer", (playerId) => {
      doorbell.play();
    });

    clientController.on("leftPeer", (playerId) => {
      $("#webcam" + playerId).html("");
      updateCss("#webcam" + playerId, "display", "none");
      updateCss("#cursor" + playerId, "display", "none");
      updateCss("#player" + playerId + "box", "display", "none");
      updateCss("#scaledProjectionBox" + playerId, "display", "none");
      updateCss(".pieceFor_" + playerId, "display", "none");
      updateCss("#player" + playerId + "NameText", "display", "none");
      updateCss("#player" + playerId + "Name", "display", "none");
      updateCss("#player" + playerId + "box", "background-color", "#FFFFFF00");
      updateCss("#scaledProjectionBox" + playerId, "background-color", "#FFFFFF00");
      updateHtml("#player" + playerId + "NameText", "");
      $(document).trigger("leftPeer", [playerId]);
    });

    clientController.on("stream", (playerId, stream) => {
      addWebcam(stream, playerId, false, false);
    });

    clientController.on("wsClosed", () => {
      clientController.removeAllListeners();
      setTimeout(function(){InitWebSocket();}, 2000);
    });

    clientController.on("devToolsState", (playerId, opened) => {
      if(opened)
      {
        devToolsOpenedTimes[playerId] = new Date();
        $("#duncehat" + playerId).css("display", "block");
      }
      else
      {
        var msHatVisible = new Date() - devToolsOpenedTimes[playerId];
        if(msHatVisible < 20000)
        {
          setTimeout(() => {
            $("#duncehat" + playerId).css("display", "none");
          }, (20000 - msHatVisible));
        }
        else
        {
          $("#duncehat" + playerId).css("display", "none");
        }
      }
    });
    clientController.on("latency", (latency, playerId) => {
      $("#latency" + playerId).html("Latency: " + latency + "ms");
    });
  }
  else
  {
     // The browser doesn't support WebSocket
     alert("WebSocket NOT supported by your Browser!");
  }
}


$(document).bind('mousemove', function (e) {
  e.preventDefault();

  var currentXScaled = Math.round(e.pageX * (1 / scale));
  var currentYScaled = Math.round(e.pageY * (1 / scale));

  var cardX = 0;
  var cardY = 0;

  if (latestMouseX != -1)
  {
    var deltaX = latestMouseX - currentXScaled;
    var deltaY = latestMouseY - currentYScaled;

    if (dragCardId != null)
    {
      cardX = (($("#" + dragCardId).position().left * (1 / scale)) - deltaX)
      if (cardX < 0)
      {
        cardX = 0;
      }
      cardY = (($("#" + dragCardId).position().top * (1 / scale)) - deltaY)
      if (cardY < 0)
      {
        cardY = 0;
      }
    }
    for (attachedCard of dragCardIds)
    {
      cardXLocal = (($("#" + attachedCard).position().left * (1 / scale)) - deltaX)
      if (cardXLocal < 0)
      {
        cardXLocal = 0;
      }
      cardYLocal = (($("#" + attachedCard).position().top * (1 / scale)) - deltaY)
      if (cardYLocal < 0)
      {
        cardYLocal = 0;
      }
      updateCss("#" + attachedCard, "left", cardXLocal + "px");
      updateCss("#" + attachedCard, "top", cardYLocal + "px");
    }
  }

  latestMouseY = currentYScaled
  latestMouseX = currentXScaled;
  clientController.mouseMove(currentXScaled, currentYScaled, cardX, cardY);
});

// $(".card").bind("mouseup", function(e){
//   e.preventDefault();
//   console.log("Mouseup in " + dragCardId);
//   var cardPosition = $("#" + dragCardId).position();
//   var cardX = Math.round(cardPosition.left * (1 / scale));
//   var cardY = Math.round(cardPosition.top * (1 / scale));
//   clientController.releaseCard(e.pageX * (1 / scale), e.pageY * (1 / scale), cardX, cardY);
//   // console.log("RELEASED " + dragCardId)
//   //updateCss("#" + dragCardId, "z-index", '50');
//   dragCardId = null;
//   dragCardIds = [];
// });

function cardMouseUp(e)
{
  var cardPosition = $("#" + dragCardId).position();
  var cardX = Math.round(cardPosition.left * (1 / scale));
  var cardY = Math.round(cardPosition.top * (1 / scale));
  clientController.releaseCard(e.pageX * (1 / scale), e.pageY * (1 / scale), cardX, cardY);
  // console.log("RELEASED " + dragCardId)
  //updateCss("#" + dragCardId, "z-index", '50');
  // i = dragCardIds.length;
  // while(i--) suppressNextChanges[i] = dragCardIds[i];
  dragCardId = null;
  dragCardIds = [];
}

$( document ).on( "mouseup", function( e ) {
  //console.log("Mouseup outside any card. dragCardId: " + dragCardId);
  if (inspectingCardId !== null)
  {
    updateCss("#" + inspectingCardId, "transform", "scale(" + myGameObj.projectionBoxScale + ")");
    updateCss("#" + inspectingCardId, "z-index", "100000");
    inspectingCardId = null;
  }
  if (dragCardId !== null)
  {
    // console.log("But dragCardId was not null.");
    cardMouseUp(e);
  }
  else
  {
    // i = dragCardIds.length;
    // while(i--) suppressNextChanges[i] = dragCardIds[i];
    dragCardId = null;
    dragCardIds = [];
    clientController.mouseUp();
  }
});

$(document).on ("keydown", function (event) {
  if (event.ctrlKey && event.key === "q") { 
    $('#resetModal').modal();
  }
});

window.addEventListener('devtoolschange', event => {
  clientController.devToolsState(event.detail.isOpen);
});

function adaptScale()
{
  var width = $(window).width();
  var height = $(window).height();

  var ratio = 1920 / 1080;

  var ratioWindow = width / height;

  if (ratioWindow > ratio)
  {
    scale = height / 1080;
    $(".scaleplane").css("transform", "scale(" + scale + ")")
  }
  else
  {
    scale = width / 1920;
    $(".scaleplane").css("transform", "scale(" + scale + ")")
  }
  $(".scaleplane").css("width", (100 / scale) + "vw");
  $(".scaleplane").css("height", (100 / scale) + "vh");

  $(".scaleplane").css("perspective-origin", (50 / scale) + "vw " + (50 / scale) + "vh");
  $(".scaleplane").css("perspective", (3500 / scale) + "px");
  clientController.canvasHandler.updateScale(scale);
}

function isDeck (id)
{
  for (deck of myGameObj.decks)
  {
    if (deck.id == id)
    {
      return true;
    }
  }
  return false;
}



$( window ).resize(function() {
  adaptScale();

});

$( document ).ready(function() {
  console.log(navigator.mediaDevices.getSupportedConstraints())
  $(".touchbox").css("opacity", "0");
  //$(".touchbox").css("transition", "opacity 200ms ease-in-out");
  var colorSelectionHtml = "";
  var nColorSelection = 0;
  for (color of colors)
  {
    nColorSelection++;
    colorSelectionHtml += '<div class="form-check form-check-inline" style="background-color: ' + color + '; padding: 20px; display: inline-block">';
    colorSelectionHtml += '<input class="form-check-input colorSelector" type="checkbox" id="inlineCheckbox' + nColorSelection + '" value="' + nColorSelection + '">';
    colorSelectionHtml += '<label class="form-check-label" for="inlineCheckbox' + nColorSelection + '"></label>';
    colorSelectionHtml += '</div>';
  }
  $(".colorSelectionContainer").html(colorSelectionHtml);


  adaptScale();

  $('.colorSelector').on('click', selectColor);
  $(".cursor").off();
  $('#enterGameBtn').attr('disabled',true);
  $('#enterGameBtn').on('click', enterGame);
  $('#resetGameBtn').on('click', resetGame);
  $('#takeSnapshotBtn').on('click', takeSnapshot);
  $('#recoverSnapshotBtn').on('click', recoverSnapshot);
  $(".shuffleButton").on('click', shuffleDeck);
  $(".rollButton").on('click', rollDeck);
  $(".inspectDeckButton").on('click', inspectDeck);

  $(".scoreboxButton").on('click', scoreboxButton);
  $(".scoreboxResetButton").on('click', scoreboxResetButton);
  $(".mic").on('click', toggleMic);

  $('#name').keyup(function(){
    checkEnterIsAllowed();
    clientController.typeName($('#name').val())
  })

  $(".card").on("mousedown", function(event){
    var draggable = null;
    if (isDeck(event.currentTarget.id))
    {
      draggable = myGameObj.decks.find(function(deck){
        return deck.id === event.currentTarget.id;
      });
    }
    else
    {
      draggable = myGameObj.cards.find(function(card){
        return card.id === event.currentTarget.id;
      });
    }

    if (draggable.clickedBy == -1 || draggable.clickedBy == myPlayerId)
    {
      dragCardId = event.currentTarget.id;
      dragCardIds = [dragCardId];
      var canEdit = true;
      if (isDeck(dragCardId))
      {
        var deck = myGameObj.decks.find(function(deck){
          return deck.id === dragCardId
        });
        if (!deck.immovable)
        {
          for (card of deck.attachedCards)
          {
            dragCardIds.push(card.id);
          }
          for (openbox of deck.attachedOpenboxes)
          {
            dragCardIds.push(openbox.id);
          }
        }
        else
        {
          dragCardIds = [];
        }
      }
      else
      {
        if (draggable.ownedBy !== myPlayerId && draggable.ownedBy !== -1)
        {
          inspectingCardId = event.currentTarget.id;
          updateCss("#" + inspectingCardId, 'transform', "scale(1)");
          updateCss("#" + inspectingCardId, "z-index", "1000000");
          canEdit = false;
          dragCardId = null;
          dragCardIds = [];
        }
      }

      if (canEdit)
      {
        var cardPosition = $(event.currentTarget).position();
        var cardX = Math.round(cardPosition.left * (1 / scale));
        var cardY = Math.round(cardPosition.top * (1 / scale));
        clientController.clickOnCard(event.currentTarget.id, cardX, cardY);
        // updateCss("#" + dragCardId, "z-index", highestZ + 1);
        blockCardChange = [];
      }
    }
    else
    {
      console.log("Clicked draggable " + draggable.id + " is already clicked by player " + draggable.clickedBy);
    }
  });

  $(".card").on("touchstart", function(event){
    //console.log(event);
    event.preventDefault(); 
    if(valueExistsInDict(event.target.classList, "shuffleButton"))
    {
      shuffleDeck(event);
    }
    else
    {
      blockCardChange = [];
      var posX = $(event.currentTarget).position().left;
      var posY = $(event.currentTarget).position().top;
      $(".touchindicator").css("left", posX * (1 / scale));
      $(".touchindicator").css("top", posY * (1 / scale));
      $(".touchindicator").css("display", "block");
      $(".touchbox").css("opacity", "0.35");
      clientController.touchCard(event.currentTarget.id, posX * (1 / scale), posY * (1 / scale));
      lastTouchedCardId = event.currentTarget.id;
    }

  });

  $(".touchbox").on("touchstart", function(event){
    event.preventDefault();
    //$(".touchbox").css("opacity", "0");
    var posX = $(event.currentTarget).position().left;
    var posY = $(event.currentTarget).position().top;
    $(".touchindicator").css("display", "none");
    clientController.touchTouchbox(posX * (1 / scale), posY * (1 / scale));
    //$("#" + lastTouchedCardId).css("border", "4px solid black");
    lastTouchedCardId = null;
    //console.log("touchbox", posX * (1 / scale), posY * (1 / scale))
  })
  
  $(".card").bind("mouseup", function(e){
    e.preventDefault();
    //console.log("Mouseup in " + dragCardId);
    if (dragCardId !== null)
    {
      var cardPosition = $("#" + dragCardId).position();
      var cardX = Math.round(cardPosition.left * (1 / scale));
      var cardY = Math.round(cardPosition.top * (1 / scale));
      clientController.releaseCard(e.pageX * (1 / scale), e.pageY * (1 / scale), cardX, cardY);
      // console.log("RELEASED " + dragCardId)
      //updateCss("#" + dragCardId, "z-index", '50');
      // i = dragCardIds.length;
      // while(i--) suppressNextChanges[i] = dragCardIds[i];
      dragCardId = null;
      dragCardIds = [];
    }
  });

  if ($("#drawCanvas").length) // initiate canvas if draw canvas exists
  {
    canvas = document.getElementById('drawCanvas');
    clientController.canvasHandler.init(canvas);
  }

  if($("#varTextInput").length)
  {
    $('#varTextInput').keyup(function(){
      clientController.typeVarText($('#varTextInput').val())
    })
  }

  navigator.mediaDevices.getUserMedia({video: {
                          width: {
                              max: 320,
                              ideal: 160 
                          },
                          height: {
                              max: 240,
                              ideal: 120
                          }
                      }, audio: true})
    .then(function(stream) {
      myStream = stream;
      InitWebSocket();
      $('#welcomeModal').modal({
                          show: true,
                          backdrop: 'static',
                          keyboard: false
                          });
  });
  //   navigator.mediaDevices.getUserMedia({video: true, audio: true})
  // .then(function(stream) {
  // myStream = stream;
  // InitWebSocket();
  // $('#welcomeModal').modal({
  //     show: true,
  //     backdrop: 'static',
  //     keyboard: false
  //     });
  // });
});

function toggleMic(e) {
  console.log(e)
  if (myStream != null)
  {
    var audioTracks = myStream.getAudioTracks();
    var micEnabled = true;
    for (var i = 0, l = audioTracks.length; i < l; i++) {
      audioTracks[i].enabled = !audioTracks[i].enabled;
      micEnabled = audioTracks[i].enabled;
    }
  }
  if(micEnabled)
  {
    $(".mute").css("display", "none");
  }
  else
  {
    console.log("disp")
    $(".mute").css("display", "block");
  }
}

function valueExistsInDict(dict, value)
{
  for (k in dict)
  {
    if(dict[k] === value)
    {
      return true;
    }
  }
  return false;
}

function updateCss(selector, property, value)
{
  if ($(selector).css(property) !== value)
  {
    $(selector).css(property, value);
  }
}

function updateParentCss(selector, property, value)
{
  if($(selector).parent().css(property) !== value)
  {
    $(selector).parent().css(property, value);
  }
}

// function updateCardFace(card, value)
// {
//   if(card.faceType === 'image')
//   {
//     if ($("#" + card.id).children('img').attr("src") !== value)
//     {
//       $("#" + card.id).children('img').attr("src", value);
//     }
//   }
//   else if(card.faceType === 'text')
//   {
//     if ($("#" + card.id + "_text").html() !== value.text)
//     {
//       $("#" + card.id + "_text").html(value.text);
//       $("#" + card.id).css("color", value.color);
//       $("#" + card.id).css("border", "4px solid " + value.color);
//       $("#" + card.id).css("background-color", value.backgroundcolor);
//       if(value.hasOwnProperty("secondarytext"))
//       {
//         $("#" + card.id + "_sec").html(value.secondarytext);
//       }
//       $(document).trigger("cardTextChanged", [card.id]);
//     }
//   }
// }

function updateCardFace(card, faceType)
{
  if (faceType == "frontface")
  {
    updateCss("#" + card.id + " .threeDcontainer", 'transform', 'translateX(100%) rotateY(180deg)')
    //$("#" + card.id + " .threeDcontainer").css('transform', 'translateX(100%) rotateY(180deg)');
  }
  else if(faceType == 'backface')
  {
    updateCss("#" + card.id + " .threeDcontainer", 'transform', 'rotateY(0deg)')
    //$("#" + card.id + " .threeDcontainer").css('transform', 'rotateY(0deg)');
    if ($("#" + card.id + "BFimg").attr("src") !== card.backface)
    {
      $("#" + card.id + "BFimg").attr("src", card.backface);
    }
  }
  else if(faceType == 'altFrontface')
  {
    if ($("#" + card.id + "BFimg").attr("src") !== card.altFrontface)
    {
      $("#" + card.id + "BFimg").attr("src", card.altFrontface);
    }
  }
}

function updateHtml(selector, html)
{
  if($(selector).html() !== html)
  {
    $(selector).html(html)
  }
}

function addOrRemoveAttr(selector, attrName, add)
{
  var attr = $(selector).attr(attrName);

  // For some browsers, `attr` is undefined; for others, `attr` is false. Check for both.
  if (typeof attr !== typeof undefined && attr !== false && !add) {
    // Element has this attribute
    $(selector).removeAttr(attrName);
  }
  else
  {
    if(add)
    {
      $(selector).attr(attrName, true);
    }
  }
}

function initDice(card)
{
  if (card.hasOwnProperty("rotationX") && card.hasOwnProperty("rotationY"))
  {
    updateCss("#" + card.id + " .threeDcontainer", "transform", "rotateX(" + card.rotationX + "deg) rotateY(" + card.rotationY + "deg)")      
  }
}

function init3dCard(card)
{
  if (card.faceType == "image")
  {
    $("#" + card.id).html("<div class='threeDcontainer'><div class='cardFace' style='transform:rotateY(180deg)'><img src='" + card.frontface + "'/></div><div class='cardFace'><img id='" + card.id + "BFimg' src='" + card.backface + "'/></div></div>")
    // var width = $("#" + card.id + " img").outerWidth();
    var width = $("#" + card.id + "BFimg").outerWidth();

    // var width = document.defaultView.getComputedStyle($("#" + card.id + "cardFace"), null).width;
    // var height = $("#" + card.id + "cardFace").height();
    $("#" + card.id).css("width", width);
    // $("#" + card.id).css("height", height);
  }
  else if(card.faceType === 'text')
  {
    $("#" + card.id + "_textFF").html(card.frontface.text);
    $("#" + card.id + "FF").css("color", card.frontface.color);
    $("#" + card.id + "FF").css("border", "4px solid " + card.frontface.color);
    $("#" + card.id + "FF").css("background-color", card.frontface.backgroundcolor);
    if(card.frontface.hasOwnProperty("secondarytext"))
    {
      $("#" + card.id + "_secFF").html(card.frontface.secondarytext);
    }

    $("#" + card.id + "_textBF").html(card.backface.text);
    $("#" + card.id + "BF").css("color", card.backface.color);
    $("#" + card.id + "BF").css("border", "4px solid " + card.backface.color);
    $("#" + card.id + "BF").css("background-color", card.backface.backgroundcolor);
    if(card.backface.hasOwnProperty("secondarytext"))
    {
      $("#" + card.id + "_secBF").html(card.backface.secondarytext);
    }

    var width = $("#" + card.id + " .cardFace").outerWidth();
    $("#" + card.id).css("width", width);
    $(document).trigger("cardTextChanged", [card.id]);
  }
}

function initCards(gameObj){
  adaptScale();
  for (var i = 0; i < gameObj.decks.length; i++)
  {
    updateCss("#" + gameObj.decks[i].id, "left", gameObj.decks[i].x + "px");
    updateCss("#" + gameObj.decks[i].id, "top", gameObj.decks[i].y + "px");
  }
  for (var i = 0; i < gameObj.cards.length; i++)
  {
    var additionalZ = 0;
    if (gameObj.cards[i].id == dragCardId)
    {
      additionalZ += 100000;
    }
    var projected = false;
    
    if(gameObj.cards[i].ownedBy == myPlayerId)
    {
      additionalZ += 100000;
      updateCardFace(gameObj.cards[i], "frontface");
    }
    else if (gameObj.cards[i].ownedBy !== -1)
    {
      if (gameObj.hasOwnProperty("projectionBoxScale"))
      {
        projectCardInScalebox(gameObj.cards[i], gameObj.projectionBoxScale, gameObj.sharedPlayerbox.x, gameObj.sharedPlayerbox.y);
        projected = true;
      }
    }
    updateCss("#" + gameObj.cards[i].id, "z-index", String(gameObj.cards[i].z + additionalZ));
    if (!projected)
    {
      updateCss("#" + gameObj.cards[i].id, "left", gameObj.cards[i].x + "px");
      updateCss("#" + gameObj.cards[i].id, "top", gameObj.cards[i].y + "px");
    }
    if (gameObj.cards[i].hasOwnProperty("scale") && !projected)
    {
      updateCss("#" + gameObj.cards[i].id, "transform", "scale(" + gameObj.cards[i].scale + ")");
    }
    if (gameObj.cards[i].hasOwnProperty("show"))
    {
      init3dCard(gameObj.cards[i]);
      if (gameObj.cards[i].ownedBy != myPlayerId)
      {
        if (cardIsInMyOwnBox(gameObj.cards[i]) || gameObj.cards[i].visibleFor == myPlayerId)
        {
          updateCardFace(gameObj.cards[i], "frontface");
        }
        else
        {
          if(cardIsInInspectorBox(gameObj.cards[i]))
          {
            updateCardFace(gameObj.cards[i], "altFrontface");
          }
          else
          {
            updateCardFace(gameObj.cards[i], gameObj.cards[i].show);
          }
        }
      }
    }
    initDice(gameObj.cards[i]);
  }
}

function projectCardInScalebox(card, boxScale, refX, refY)
{
  // var boxX = $("#scaledProjectionBox" + card.ownedBy).position().left * (1 / scale);
  // var boxY = $("#scaledProjectionBox" + card.ownedBy).position().top * (1 / scale);
  var boxX = myGameObj.projectionBoxes[card.ownedBy].x;// * (1 / scale);
  var boxY = myGameObj.projectionBoxes[card.ownedBy].y;// * (1 / scale);

  var newX = boxX + ((card.x - refX) * boxScale);
  var newY = boxY + ((card.y - refY) * boxScale);

  updateCss("#" + card.id, "left", newX + "px");
  updateCss("#" + card.id, "top", newY + "px");
  updateCss("#" + card.id, "transform", "scale(" + boxScale + ")");
}


function updateCards(gameObj, changedCardsBuffer)
{
  var blockedCardsInDeck = [];
  var blockedOpenboxesInDeck = [];
  for (var i = 0; i < gameObj.decks.length; i++)
  {
    if (!dragCardIds.includes(gameObj.decks[i].id ) && gameObj.decks[i].clickedBy != myPlayerId)
    {
      updateCss("#" + gameObj.decks[i].id, "left", gameObj.decks[i].x + "px");
      updateCss("#" + gameObj.decks[i].id, "top", gameObj.decks[i].y + "px");
    }
    else if (gameObj.decks[i].clickedBy == myPlayerId)
    {
      for (card of gameObj.decks[i].attachedCards)
      {
        blockedCardsInDeck.push(card.id);
      }
      for (openbox of gameObj.decks[i].attachedOpenboxes)
      {
        blockedOpenboxesInDeck.push(openbox.id);
      }
    }
  }
  var cards = gameObj.cards.filter(function(card){
    return changedCardsBuffer.includes(card.id) && !blockedCardsInDeck.includes(card.id);
  });
  //changedCardsBuffer = [];
  for (card of cards)
  {
    if (card.hasOwnProperty("varText"))
    {
      if ($("#" + card.id + "_textFF").html() !== card.frontface.text)
      {
        $("#" + card.id + "_textFF").html(card.frontface.text);
        $(document).trigger("cardTextChanged", [card.id]);
      }
    }
    if (card.hasOwnProperty("rotationX") && card.hasOwnProperty("rotationY"))
    {
      updateCss("#" + card.id + " .threeDcontainer", "transform", "rotateX(" + card.rotationX + "deg) rotateY(" + card.rotationY + "deg)")      
    }
    // if(card.id != dragCardId)
    if(!dragCardIds.includes(card.id) && card.clickedBy != myPlayerId && card.ownedBy == -1)
    {
      // updateCss("#" + card.id, "z-index", String(card.z + 60));
      updateCss("#" + card.id, "left", card.x + "px");
      updateCss("#" + card.id, "top", card.y + "px");
    }
    var additionalZ = 0;
    if(card.id == dragCardId)
    {
      additionalZ += 100000;
    }
    var projected = false;
    if (card.ownedBy == myPlayerId)
    {
      updateCardFace(card, "frontface");
      additionalZ += 100000;
    }
    else if (card.ownedBy !== -1)
    {
      if (gameObj.hasOwnProperty("projectionBoxScale"))
      {
        projectCardInScalebox(card, gameObj.projectionBoxScale, gameObj.sharedPlayerbox.x, gameObj.sharedPlayerbox.y);
        projected = true;
      }
    }
    updateCss("#" + card.id, "z-index", String(card.z + additionalZ));
    if (card.hasOwnProperty("scale") && !projected)
    {
      updateCss("#" + card.id, "transform", "scale(" + card.scale + ")");
    }

    if(!blockCardChange.includes(card.id) && card.ownedBy != myPlayerId)
    {
      if(card.hasOwnProperty("show") && card.isInAnOpenbox)
      {
        updateCardFace(card, card.show);
      }
      else
      {
        if (card.hasOwnProperty("show"))
        {
          var cardInMyBox = cardIsInMyOwnBox(card);
          if (cardInMyBox || card.visibleFor == myPlayerId)
          {
            updateCardFace(card, "frontface");
          }
          else
          {
            if(cardIsInInspectorBox(card))
            {
              updateCardFace(card, "altFrontface");
            }
            else
            {
              updateCardFace(card, card.show);
            }
          }
        }
      }
    }
  }
  for (openbox of gameObj.openboxes)
  {
    if(!dragCardIds.includes(openbox.id) && !blockedOpenboxesInDeck.includes(openbox.id))
    {
      updateCss("#" + openbox.id, "left", (openbox.x) + "px");
      updateCss("#" + openbox.id, "top", (openbox.y) + "px");
      updateCss("#" + openbox.id, "width", (openbox.width) + "px");
      updateCss("#" + openbox.id, "height", (openbox.height) + "px");
    }
  }
}

// function updateOpenboxes(gameObj)
// {

// }

function updateCursors (gameObj)
{
  playerIndex = 0;
  for (player of gameObj.players){
    updateCss("#cursor" + playerIndex, "background-color", player.color);
    updateCss("#player" + player.id + "box", "background-color", player.color);
    updateCss("#scaledProjectionBox" + player.id, "background-color", player.color);
    updateCss(".pieceFor_" + player.id + " .pieceImg", "filter", filterMap[player.color] + cssFilterBorder);
    updateHtml("#player" + player.id + "NameText", player.name)
    if(player.id != myPlayerId)
    {
      updateCss("#cursor" + playerIndex, "left", (player.pos.x - 22) + "px");
      updateCss("#cursor" + playerIndex, "top", (player.pos.y - 22) + "px");
      updateCss("#cursor" + playerIndex, "display", "block");
    }
    else
    {
      updateCss("#cursor" + playerIndex, "display", "none");
    }
    playerIndex++;
  }
  for (var i = playerIndex; i < 20; i++){
    updateCss("#cursor" + i, "left", "0px");
    updateCss("#cursor" + i, "top", "0px");
    updateCss("#cursor" + playerIndex, "display", "none");
  }
}

function updateScoreboxes (gameObj)
{
  for (scorebox of gameObj.scoreboxes)
  {
    updateHtml("#scorebox" + scorebox.id + "_text", scorebox.points);
  }
}

function updateColorSelection(gameObj)
{
  var nColorSelection = 0;
  for (color of colors)
  {
    nColorSelection++;

    if (colorIsTaken(gameObj, color))
    {

      addOrRemoveAttr("#inlineCheckbox" + nColorSelection, "disabled", true);
      updateParentCss("#inlineCheckbox" + nColorSelection, "background-image", "URL(/img/color-taken.svg)");
    }
    else
    {
      addOrRemoveAttr("#inlineCheckbox" + nColorSelection, "disabled", false);
      updateParentCss("#inlineCheckbox" + nColorSelection, "background-image", "none");
    }
    if (nColorSelection == myColor)
    {
      updateParentCss("#inlineCheckbox" + nColorSelection, "background-image", "URL(/img/color-chosen.svg)")
    }
  }
}


function cardIsInMyOwnBox(card)
{
  if ( $("#player" + myPlayerId + "box").length ) {
    if (card.lastTouchedBy == myPlayerId)
    {
      var boxX = $("#player" + myPlayerId + "box").position().left * (1 / scale);
      var boxY = $("#player" + myPlayerId + "box").position().top * (1 / scale);
      var width = $("#player" + myPlayerId + "box").width();
      var height = $("#player" + myPlayerId + "box").height();
      if (card.x > boxX && card.x < (boxX + width) && card.y > boxY && card.y < (boxY + height))
      {
        return true;
      }
      else
      {
        return false;
      }
    }
    else
    {
      return false;
    }
  }
  else
  {
    return false;
  }
}

function cardIsInInspectorBox(card)
{
  if (card.lastTouchedBy == myPlayerId && card.hasOwnProperty("altFrontface"))
  {
    var boxX = $("#inpsectorbox0").position().left * (1 / scale);
    var boxY = $("#inpsectorbox0").position().top * (1 / scale);
    var width = $("#inpsectorbox0").width();
    var height = $("#inpsectorbox0").height();
    if (card.x > boxX && card.x < (boxX + width) && card.y > boxY && card.y < (boxY + height))
    {
      return true;
    }
    else
    {
      return false;
    }
  }
  else
  {
    return false;
  }
}

function colorIsTaken(gameObj, code){
  for (player of gameObj.players)
  {
    if (player.color == code)
    {
      return true;
    }
  }
  return false;
}

function selectColor(e){
  nr = Number(e.target.value);
  myColor = nr;
  for (var i = 0; i < colors.length; i++)
  {
    if (i != nr)
    {
      $("#inlineCheckbox" + i).prop( "checked", false );
    }
    else
    {
      $("#inlineCheckbox" + i).prop( "checked", true );
    }
  }
  state.color = colors[nr - 1];
  clientController.selectColor(colors[nr - 1]);
  checkEnterIsAllowed();
}

function shuffleDeck(e){
  var deckId = e.target.parentElement.id;
  var xStackMinimum = (e.target.value === '') ? 30 : Number(e.target.value);
  clientController.shuffleDeck(deckId, xStackMinimum);
}

function rollDeck(e){
  var deckId = e.target.parentElement.id;
  clientController.rollDeck(deckId);
}

function inspectDeck(e){
  var deckId = e.target.parentElement.id;
  var tmpGameObj = JSON.parse(clientController.wsHandler.lastGameObj);
  var foundDeck = tmpGameObj.decks.find(function(deck){
    return deck.id === deckId;
  });
  blockCardChange = [];
  for (card of foundDeck.attachedCards)
  {
    // updateCardFace(card, card.frontface)
    updateCardFace(card, "frontface");
    blockCardChange.push(card.id);
  }
}

function scoreboxButton(e){
  // console.log(e.currentTarget.parentElement.attributes['value'].value)
  // console.log(e.currentTarget.value)
  var addValue = Number(e.currentTarget.value);
  if(addValue > 0)
  {
    scorePlusSound.play();
  }
  else
  {
    scoreMinSound.play();
  }
  //clientController.editScorebox(Number(e.currentTarget.parentElement.attributes['value'].value), addValue)
  clientController.editScorebox(e.currentTarget.parentElement.attributes['value'].value, addValue)
}

function scoreboxResetButton(e)
{
  clientController.resetScorebox(e.currentTarget.parentElement.attributes['value'].value);
}

function checkEnterIsAllowed()
{
  if($('#name').val().length !=0 && state.color != "#FFFFFF")
    $('#enterGameBtn').attr('disabled', false);            
  else
    $('#enterGameBtn').attr('disabled',true);
}

function enterGame()
{
  $('#welcomeModal').modal('hide');
}

function resetGame()
{
  clientController.resetGame();
  $('#resetModal').modal('hide');
}

function takeSnapshot()
{
  clientController.takeSnapshot();
  $('#resetModal').modal('hide');
}

function recoverSnapshot()
{
  clientController.recoverSnapshot();
  $('#resetModal').modal('hide');
}