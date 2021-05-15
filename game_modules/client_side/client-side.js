let ClientController = require("./client_controller").ClientController;
var getPreferredMs = require('../fps_limiter').getPreferredMs;
require("./devtools-detect");
var userAgent = window.navigator.userAgent.toLowerCase()
var ios = /iphone|ipod|ipad/.test( userAgent );

console.log(userAgent);
if (ios) {
  console.log("is ios")
}
else {
  console.log("not ios")
}

var clientController = new ClientController()
var welcomeModalshown = false;
var myGameObj = null;
var scale = 1;

var myStream = null;
var captureStream = null;
var audioTrack = null;
var myLatency = 5000;

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
var dragCardDeltaX = 0;
var dragCardDeltaY = 0;
var dragCardId = null;
var dragCardIds = [];
var dragCardOwnedByMe = false;
var inspectingCardId = null;
var formerInspectingCardZ = "1";
var lastTouchedCardId = null;

var highestZ;

var blockCardChange = [];

var devToolsOpenedTimes = {};
var listeningToRadio = -1;

function addRadio(stream)
{
  var video = document.createElement('video');
  $("#radio").html(video);
  $("#radioVolumeControl").val(100);
  video.srcObject = stream;
  video.play();
}

function setRadioVolume(e)
{
  console.log($("#radioVolumeControl").val());
  $("#radio video").prop('volume', $("#radioVolumeControl").val() / 100);
}

function removeRadio()
{
  console.log('removed radio.')
  $("#radio").html("");
}

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
  $("#webcam" + playerId + " video").attr('autoplay',"");
  $("#webcam" + playerId + " video").attr('playsinline',"");
  if (playerId != myPlayerId) {
    $("#webcam" + playerId + " video").attr('controls',"");
  }
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
    if (playerId != myPlayerId) {
      clientController.reportPlaying(playerId)
    }
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

function replaceCard(replacementCardId, oldCardId)
{
  if (replacementCardId !== -1)
  {
    updateCss("#" + oldCardId, "z-index", String(myGameObj.cards[oldCardId].z));
    if (myLatency < 150)
    {
      for (dci of dragCardIds)
      {
        updateCss("#" + dci, "transition-property", "top, left");
      }
    }
    dragCardId = replacementCardId;
    dragCardIds = [replacementCardId];
    updateCss("#" + dragCardId, "z-index", "10000000");
    for (dci of dragCardIds)
    {
      updateCss("#" + dci, "transition-property", "none");
    }          
  }
  else
  {
    for (dci of dragCardIds)
    {
      if (myLatency < 150) {
        updateCss("#" + dci, "transition-property", "top, left");
      }
    }
    dragCardId = null;
    dragCardIds = [];
  }
}

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
      $(document).trigger("playerId", myPlayerId);
    });

    clientController.on("updateGame", (gameObj, changedCardsBuffer, newDrawCoords, init) => {
      myGameObj = gameObj;
      highestZ = gameObj.highestZ;
      if(init)
      {
        initCards(gameObj)
        console.log("reset or init");
        $(document).trigger("reset", myPlayerId);
      }
      else
      {
        updateCards(gameObj, changedCardsBuffer);
      }

      updateCursors(gameObj);
      updateScoreboxes(gameObj);
      updateColorSelection(gameObj);
      if (!welcomeModalshown)
      {
        clientController.reportPatched();
        welcomeModalshown = true;
        setTimeout(() => {
          $('#welcomeModal').modal({
            show: true,
            backdrop: 'static',
            keyboard: false
            });
        }, 5000);
        
      }

      $(document).trigger("gameObj", [gameObj, myPlayerId, scale]);
    });

    clientController.on("cardConflict", (cardId, replacementCardId) => {
      if (dragCardId == cardId)
      {
        console.log("Card conflict detected for " + cardId + " replace with " + replacementCardId);
        replaceCard(replacementCardId, dragCardId);
      }
    });

    clientController.on("newPeer", (playerId, wasReset, peerType) => {
      if (!wasReset && peerType == "webcam")
      {
        doorbell.play();
      }
    });

    clientController.on("leftPeer", (playerId, peerType) => {
      if (peerType == "webcam")
      {
        removePlayer(playerId);
      }
    });

    clientController.on("relayLeft", (playerId, relayFor) => {
      removeWebcam(relayFor)
    });

    clientController.on("stream", (playerId, stream, peerType, relayFor) => {
      if(peerType == "webcam")
      {
        addWebcam(stream, playerId, false, false);
      }
      else if(peerType == "capture")
      {
        if (stream != null)
        {
          addRadio(stream);
        }
      }
      else if (peerType == 'relay')
      {
        console.log("got stream for " + relayFor + " via relay from " + playerId);
        addWebcam(stream, relayFor, false, false);
      }
    });

    clientController.on("peerClosed", (playerId, peerType, optionalRelayFor) => {
      if(peerType == "webcam")
      {
        removeWebcam(playerId)
      }
      else if(peerType == "capture")
      {
        removeRadio();
        if (playerId == listeningToRadio)
        {
          $(".radioControls").css("display", "none")
          listeningToRadio = -1;
        }
      }
      else if (peerType == "relay")
      {
        console.log("clear webcam " + optionalRelayFor + " relayed from " + playerId)
        removeWebcam(optionalRelayFor);
      }
    });

    clientController.on("wsClosed", () => {
      myGameObj = null;
      myPlayerId = -1;
      gameInitialized = false;
      for (var i = 0; i < 20; i++)
      {
        removePlayer(i);
      }
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
      console.log("my current latency: " + latency);

      myLatency = latency;
      $("#latency" + playerId).html("Latency: " + latency + "ms");
      if (latency < 150)
      {
        updateCss(".cursor", "transition", "all " + getPreferredMs(latency) * 2.5 + "ms linear");
        updateCss(".cursor", "transition-property", "top, left");
        updateCss(".card", "transition", "all " + getPreferredMs(latency) * 2.5 + "ms linear");
        updateCss(".card", "transition-property", "top, left");
        updateCss(".moveable", "transition", "all " + getPreferredMs(latency) * 2.5 + "ms linear");
        updateCss(".moveable", "transition-property", "top, left");
      }
      else
      {
        updateCss(".cursor", "transition", "none");
        updateCss(".cursor", "transition-property", "none");
        updateCss(".card", "transition", "none");
        updateCss(".card", "transition-property", "none");
        updateCss(".moveable", "transition", "none");
        updateCss(".moveable", "transition-property", "none");
      }
      updateCss("#" + dragCardId, "transition-property", "none");
      for (dci of dragCardIds)
      {
        updateCss("#" + dci, "transition-property", "none");
      }
    });
  }
  else
  {
     // The browser doesn't support WebSocket
     alert("WebSocket NOT supported by your Browser!");
  }
}

function removePlayer(playerId)
{
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
}

function removeWebcam(playerId)
{
  $("#webcam" + playerId).html("");
  updateCss("#webcam" + playerId, "display", "none");
}

function isInDeck(x, y, deck)
{
  if (x > deck.x && x < (deck.x + deck.width) && y > deck.y && y < (deck.y + deck.height))
  {
    return true;
  }
  else
  {
    return false;
  }
}

$(document).bind('mousemove', function (e) {
  if (!gameInitialized) return;
  //e.preventDefault();

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
      //cardX = (($("#" + dragCardId).position().left * (1 / scale)) - deltaX)
      cardX = (((e.pageX - dragCardDeltaX) * (1 / scale)) - deltaX)
      if (cardX < 0)
      {
        cardX = 0;
      }
      //cardY = (($("#" + dragCardId).position().top * (1 / scale)) - deltaY)
      cardY = (((e.pageY - dragCardDeltaY) * (1 / scale)) - deltaY)
      if (cardY < 0)
      {
        cardY = 0;
      }
      if (!isDeck(dragCardId))
      {
        var isInADeck = false;
        for (let deck of Object.values(myGameObj.decks))
        {
          if (isInDeck(currentXScaled, currentYScaled, deck))
          {
            isInADeck = true;
            updateCss("#" + dragCardId, "transform", "scale(" + deck.scale + ")")
            continue;
          }
        }
        if (!isInADeck)
        {
          updateCss("#" + dragCardId, "transform", "scale(1)");
          if (myGameObj.hasOwnProperty("sharedPlayerbox") && myGameObj.cards[dragCardId].hasOwnProperty('show'))
          {
            if(isInOpenBox(cardX, cardY, myGameObj.sharedPlayerbox))
            {
              updateCardFaceId(dragCardId, "frontface");
              updateCss("#" + dragCardId, "transform", "scale(1)")
            }
            else
            {
              updateCardFaceId(dragCardId, "backface");
            }
            
          }
        }
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

function isInAnOpenBox(x, y)
{
  for (let openbox of Object.values(myGameObj.openboxes))
  {
    if (isInOpenBox(x, y, openbox)){
      return true;
    }
  }
  return false;
}


function cardMouseUp(e)
{
  e.preventDefault();
  if (!gameInitialized) return;
  if (dragCardId !== null)
  {
    // var cardPosition = $("#" + dragCardId).position();
    // var cardX = Math.round(cardPosition.left * (1 / scale));
    // var cardY = Math.round(cardPosition.top * (1 / scale));
    var cardX = Math.round((e.pageX - dragCardDeltaX) * (1 / scale));
    var cardY = Math.round((e.pageY - dragCardDeltaY) * (1 / scale));
    if (cardX < 0) cardX = 0;
    if (cardY < 0) cardY = 0;
    var mouseX = e.pageX * (1 / scale);
    var mouseY = e.pageY * (1 / scale)

    clientController.releaseCard(mouseX, mouseY, cardX, cardY);
    if(myGameObj.hasOwnProperty("sharedPlayerbox"))
    {
      if (isInOpenBox(cardX, cardY, myGameObj.sharedPlayerbox) && !ios)
      {
        dragCardOwnedByMe = true;
      }
      else
      {
        dragCardOwnedByMe = false;
      }
    }
    if(!dragCardOwnedByMe && !isDeck(dragCardId))
    {
      updateCss("#" + dragCardId, "z-index", String(myGameObj.cards[dragCardId].z));
    }
    dragCardOwnedByMe = false;
    if (myLatency < 150)
    {
      updateCss("#" + dragCardId, "transition-property", "top, left");
    }
    for (dci of dragCardIds)
    {
      if(myLatency < 150)
      {
        updateCss("#" + dci, "transition-property", "top, left");
      }
    }
    if (!isDeck(dragCardId) && myGameObj.cards[dragCardId].hasOwnProperty("show"))
    {
      if (isInAnOpenBox(mouseX, mouseY))
      {
        updateCardFaceId(dragCardId, "frontface");
      }
    }
    dragCardId = null;
    dragCardIds = [];
  }
}

$( document ).on( "mouseup", function( e ) {
  if (!gameInitialized) return;
  if (inspectingCardId !== null)
  {
    updateCss("#" + inspectingCardId, "transform", "scale(" + myGameObj.projectionBoxScale + ")");
    updateCss("#" + inspectingCardId, "z-index", formerInspectingCardZ);
    inspectingCardId = null;
    formerInspectingCardZ = "1";
  }
  if (dragCardId !== null)
  {
    cardMouseUp(e);
    
  }
  else
  {
    dragCardId = null;
    dragCardIds = [];
    clientController.mouseUp();
  }
});

$(document).on ("keydown", function (event) {
  if (event.ctrlKey && event.key === "q") { 
    $('#resetModal').modal();
  }
  else if (event.ctrlKey && event.key === "z") { 
  event.preventDefault();
    $('#resetWebcamModal').modal();
  }
});

$(document).on("initCardFunctions", (e) => {
  initCardFunctions()
  initCards(myGameObj)
})

function initCardFunctions()
{
  $(".card").on("mousedown", function(event){
    if(!gameInitialized) return;
    //console.log(event)
    var draggable = null;
    var draggableIsDeck = isDeck(event.currentTarget.id);
    if (draggableIsDeck)
    {
      draggable = myGameObj.decks[event.currentTarget.id]
    }
    else
    {
      draggable = myGameObj.cards[event.currentTarget.id];
    }

    if (draggable.clickedBy == -1 || draggable.clickedBy == myPlayerId)
    {
      dragCardId = event.currentTarget.id;
      dragCardIds = [dragCardId];
      var canEdit = true;
      if (draggableIsDeck)
      {
        var deck = myGameObj.decks[dragCardId];
        if (!deck.immovable)
        {
          for (let card of Object.values(deck.attachedCards))
          {
            dragCardIds.push(card.id);
          }
          for (let openbox of Object.values(deck.attachedOpenboxes))
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
          formerInspectingCardZ = $("#" + inspectingCardId).css("z-index");
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
        dragCardDeltaX = event.pageX - cardPosition.left;
        dragCardDeltaY = event.pageY - cardPosition.top;
        var cardX = Math.round(cardPosition.left * (1 / scale));
        var cardY = Math.round(cardPosition.top * (1 / scale));
        if(!draggableIsDeck)
        {
          updateCss("#" + dragCardId, "z-index", "10000000");
        }
        clientController.clickOnCard(event.currentTarget.id, cardX, cardY, dragCardDeltaX, dragCardDeltaY);
        updateCss("#" + dragCardId, "transition-property", "none");
        for (dci of dragCardIds)
        {
          updateCss("#" + dci, "transition-property", "none");
        }
        blockCardChange = [];
      }
    }
    else
    {
      console.log("Clicked draggable " + draggable.id + " is already clicked by player " + draggable.clickedBy);
      validReplacements = {}
      for (let replacementCard of Object.values(myGameObj.cards))
      {
        if (replacementCard.id != draggable.id)
        {
          if (cardIsValidReplacement(replacementCard, draggable))
          {
            validReplacements[replacementCard.z] = replacementCard;
          }
        }
      }
      var orderedByZ = Object.keys(validReplacements).sort().reduce(
        (obj, key) => { 
          obj[key] = validReplacements[key]; 
          return obj;
        }, 
        {}
      );
      var replacementCardId = -1;
      if (Object.keys(orderedByZ).length > 0)
      {
        var replacementCard = orderedByZ[Object.keys(orderedByZ)[Object.keys(orderedByZ).length - 1]]
        //myGameObj.cards[replacementCard.id].clickedBy = id;
        console.log("found replacement card for " + draggable.id + ": " + replacementCard.id)
        replacementCardId = replacementCard.id;
      }
      replaceCard(replacementCardId, draggable.id);
      if (replacementCardId !== -1) {
        var cardPosition = $("#" + replacementCardId).position();
        dragCardDeltaX = event.pageX - cardPosition.left;
        dragCardDeltaY = event.pageY - cardPosition.top;
        var cardX = Math.round(cardPosition.left * (1 / scale));
        var cardY = Math.round(cardPosition.top * (1 / scale));
        clientController.clickOnCard(replacementCardId, cardX, cardY, dragCardDeltaX, dragCardDeltaY);
      }
    }
  });

  $(".card").on("touchstart", function(event){
    if (!gameInitialized) return;
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
    if (!gameInitialized) return;
    event.preventDefault();
    var posX = $(event.currentTarget).position().left;
    var posY = $(event.currentTarget).position().top;
    $(".touchindicator").css("display", "none");
    clientController.touchTouchbox(posX * (1 / scale), posY * (1 / scale));
    lastTouchedCardId = null;
  })
  
  $(".card").bind("mouseup", function(e){
    cardMouseUp(e);
    // e.preventDefault();
    // if (!gameInitialized) return;
    // if (dragCardId !== null)
    // {
    //   var cardPosition = $("#" + dragCardId).position();
    //   var cardX = Math.round(cardPosition.left * (1 / scale));
    //   var cardY = Math.round(cardPosition.top * (1 / scale));
    //   clientController.releaseCard(e.pageX * (1 / scale), e.pageY * (1 / scale), cardX, cardY);
    //   if (myLatency < 100)
    //   {
    //     updateCss("#" + dragCardId, "transition-property", "top, left");
    //   }
    //   for (dci of dragCardIds)
    //   {
    //     if(myLatency < 100)
    //     {
    //       updateCss("#" + dci, "transition-property", "top, left");
    //     }
    //   }
    //   dragCardId = null;
    //   dragCardIds = [];
    // }
  });
}

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
  $(document).trigger("scale", scale);
}

function isDeck (id)
{
  if (id in myGameObj.decks)
  {
    return true;
  }
  else
  {
    return false;
  }
}

function cardIsValidReplacement (card, conflictingCard)
{
  if ((card.x - conflictingCard.x > -20 && card.x - conflictingCard.x < 20) && (card.y - conflictingCard.y > -20 && card.y - conflictingCard.y < 20) && card.clickedBy == -1 && card.id != conflictingCard.id && (card.ownedBy == -1 || card.ownedBy == myPlayerId))
  {
    return true;
  }
  return false;
}


$( window ).resize(function() {
  adaptScale();

});

$( document ).ready(function() {
  console.log(navigator.mediaDevices.getSupportedConstraints())
  $(".touchbox").css("opacity", "0");
  $('img').attr('draggable', false);
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
  $("#resetWebcamBtn").on('click', resetWebcam);
  $('#resetGameBtn').on('click', resetGame);
  $('#startCaptureBtn').on('click', startCapture);
  $('#takeSnapshotBtn').on('click', takeSnapshot);
  $('#recoverSnapshotBtn').on('click', recoverSnapshot);
  $(".shuffleButton").on('click', shuffleDeck);
  $(".rollButton").on('click', rollDeck);
  $(".inspectDeckButton").on('click', inspectDeck);

  $(".scoreboxButton").on('click', scoreboxButton);
  $(".scoreboxResetButton").on('click', scoreboxResetButton);
  $(".mic").on('click', toggleMic);
  $(".playerRadio").on('click', toggleRadio);
  $("#radioStop").on("click", stopRadio);
  $("#radioVolumeControl").on('input', setRadioVolume);

  $('#name').keyup(function(){
    checkEnterIsAllowed();
    clientController.typeName($('#name').val())
  })

  initCardFunctions()

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

  console.log("Starting local webcam.")

  navigator.mediaDevices.getUserMedia({video: {
                          width: {
                              max: 320,
                              ideal: 160 
                          },
                          height: {
                              max: 240,
                              ideal: 120
                          }
                      }, audio: {
                        echoCancellation: true
                      }})
    .then(function(stream) {
      console.log("Started local webcam.")
      myStream = stream;
      InitWebSocket();
  });

  $(document).trigger("clientControllerReady", clientController);
});

async function startCapture(){
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia({video:{ frameRate: { ideal: 5, max: 15 }}, audio:{sampleRate: 44100}});
    captureStream.getVideoTracks()[0].onended = function () {
      console.log("captureStream ended.")
      clientController.removeCaptureStream();
      captureStream = null;
    }
    clientController.addCaptureStream(captureStream);
  } catch(err) {
    console.error("Error: " + err);
  }
  
}

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

function toggleRadio(e) {
  listeningToRadio = Number($(e.target).attr('player'));
  updateCss("#radioContainer" + listeningToRadio, "display", "none");
  //$(e.target).css("display", "none");
  clientController.requestRadioFromPlayer(listeningToRadio);
  $(".radioControls").css("display", "block")
}

function stopRadio(e){
  $(".radioControls").css("display", "none")
  clientController.stopRadio(listeningToRadio);
  removeRadio();
  listeningToRadio = -1;
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

function updateCardFaceId(id, faceType)
{
  updateCardFace(myGameObj.cards[id], faceType);
}


function updateCardFace(card, faceType)
{
  //console.log("updating " + card.id + " to " + faceType)
  if (faceType == "frontface")
  {
    updateCss("#" + card.id + " .threeDcontainer", 'transform', 'translateX(100%) rotateY(180deg)')
  }
  else if(faceType == 'backface')
  {
    updateCss("#" + card.id + " .threeDcontainer", 'transform', 'rotateY(0deg)')
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
    var width = $("#" + card.id + "BFimg").outerWidth();

    $("#" + card.id).css("width", width);
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
  for (let deck of Object.values(gameObj.decks))
  {
    updateCss("#" + deck.id, "left", deck.x + "px");
    updateCss("#" + deck.id, "top", deck.y + "px");
  }
  for (let card of Object.values(gameObj.cards))
  {
    var additionalZ = 0;
    if (card.id == dragCardId)
    {
      additionalZ += 100000;
    }
    var projected = false;
    
    if(card.ownedBy == myPlayerId)
    {
      additionalZ += 100000;
      updateCardFace(card, "frontface");
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
    if (!projected)
    {
      updateCss("#" + card.id, "left", card.x + "px");
      updateCss("#" + card.id, "top", card.y + "px");
    }
    if (card.hasOwnProperty("scale") && !projected)
    {
      updateCss("#" + card.id, "transform", "scale(" + card.scale + ")");
    }
    else if(!projected)
    {
      updateCss("#" + card.id, "transform", "scale(1)");
    }
    if (card.hasOwnProperty("show"))
    {
      init3dCard(card);
      if (card.ownedBy != myPlayerId)
      {
        if (cardIsInMyOwnBox(card) || card.visibleFor == myPlayerId)
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
    initDice(card);
  }
}

function projectCardInScalebox(card, boxScale, refX, refY)
{
  var boxX = myGameObj.projectionBoxes[card.ownedBy].x;
  var boxY = myGameObj.projectionBoxes[card.ownedBy].y;

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
  for (let deck of Object.values(gameObj.decks))
  for (deckId of changedCardsBuffer)
  {
    if (!(deckId in gameObj.decks))
    {
      continue;
    }
    if (deck.wallet)
    {
      updateHtml("#walletScorebox" + deck.ownedBy + "_text", deck.walletValue);
    }
    if (!dragCardIds.includes(deck.id ) && deck.clickedBy != myPlayerId)
    {
      updateCss("#" + deck.id, "left", deck.x + "px");
      updateCss("#" + deck.id, "top", deck.y + "px");
    }
    else if (deck.clickedBy == myPlayerId)
    {
      for (let card of Object.values(deck.attachedCards))
      {
        blockedCardsInDeck.push(card.id);
      }
      for (let openbox of Object.values(deck.attachedOpenboxes))
      {
        blockedOpenboxesInDeck.push(openbox.id);
      }
    }
  }
  for (cardId of changedCardsBuffer)
  {
    if (!(cardId in gameObj.cards))
    {
      continue;
    }
    let card = gameObj.cards[cardId];
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
    if((!dragCardIds.includes(card.id) && card.clickedBy != myPlayerId && card.ownedBy == -1) || ios)
    {
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
    else if(!projected)
    {
      updateCss("#" + card.id, "transform", "scale(1)");
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
  for (let openbox of Object.values(gameObj.openboxes))
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

function updateCursors (gameObj)
{
  var ids = [];
  for (let player of Object.values(gameObj.players)){
    ids.push(player.id);
    updateCss("#cursor" + player.id, "background-color", player.color);
    updateCss("#player" + player.id + "box", "background-color", player.color);
    updateCss("#scaledProjectionBox" + player.id, "background-color", player.color);
    updateCss(".pieceFor_" + player.id + " .pieceImg", "filter", filterMap[player.color] + cssFilterBorder);
    $(document).trigger("pieceColor", [player.id, filterMap[player.color]]);
    updateHtml("#player" + player.id + "NameText", player.name)
    if(player.id != myPlayerId)
    {
      var radioDisplay = 'none';
      if (player.isHostingCapture && listeningToRadio == -1)
      {
        radioDisplay = 'block';
      }
      updateCss("#radioContainer" + player.id, "display", radioDisplay);
      updateCss("#cursor" + player.id, "left", (player.pos.x - 11) + "px");
      updateCss("#cursor" + player.id, "top", (player.pos.y - 11) + "px");
      updateCss("#cursor" + player.id, "display", "block");
    }
    else
    {
      updateCss("#cursor" + player.id, "display", "none");
    }
  }

  for (var i = 0; i < 20; i++)
  {
    if (!(i in ids))
    {
      updateCss("#cursor" + i, "left", "0px");
      updateCss("#cursor" + i, "top", "0px");
      updateCss("#cursor" + i, "display", "none");
    }
  }

  // playerIndex = 0;
  // console.log(gameObj);
  // for (player of gameObj.players){
  //   updateCss("#cursor" + playerIndex, "background-color", player.color);
  //   updateCss("#player" + player.id + "box", "background-color", player.color);
  //   updateCss("#scaledProjectionBox" + player.id, "background-color", player.color);
  //   updateCss(".pieceFor_" + player.id + " .pieceImg", "filter", filterMap[player.color] + cssFilterBorder);
  //   $(document).trigger("pieceColor", [player.id, filterMap[player.color]]);
  //   updateHtml("#player" + player.id + "NameText", player.name)
  //   if(player.id != myPlayerId)
  //   {
  //     var radioDisplay = 'none';
  //     if (player.isHostingCapture && listeningToRadio == -1)
  //     {
  //       radioDisplay = 'block';
  //     }
  //     updateCss("#radioContainer" + player.id, "display", radioDisplay);
  //     updateCss("#cursor" + playerIndex, "left", (player.pos.x - 22) + "px");
  //     updateCss("#cursor" + playerIndex, "top", (player.pos.y - 22) + "px");
  //     updateCss("#cursor" + playerIndex, "display", "block");
  //     console.log(playerIndex)
  //   }
  //   else
  //   {
  //     updateCss("#cursor" + playerIndex, "display", "none");
  //   }
  //   playerIndex++;
  // }
  // console.log("final playerindex: " + playerIndex)
  // for (var i = playerIndex; i < 20; i++){
  //   updateCss("#cursor" + i, "left", "0px");
  //   updateCss("#cursor" + i, "top", "0px");
  //   updateCss("#cursor" + playerIndex, "display", "none");
  // }
  // console.log(" ");
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
  for (let player of Object.values(gameObj.players))
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
  var foundDeck = tmpGameObj.decks[deckId];
  blockCardChange = [];
  for (let card of Object.values(foundDeck.attachedCards))
  {
    updateCardFace(card, "frontface");
    blockCardChange.push(card.id);
  }
}

function scoreboxButton(e){
  var addValue = Number(e.currentTarget.value);
  if(addValue > 0)
  {
    scorePlusSound.play();
  }
  else
  {
    scoreMinSound.play();
  }
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

function resetWebcam()
{
  clientController.resetWebcam();
  $('#resetWebcamModal').modal('hide');
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

function isInOpenBox(x, y, openbox)
{
  if (x >= openbox.x && x <= (openbox.x + openbox.width) && y >= openbox.y && y <= (openbox.y + openbox.height))
  {
    return true;
  }
  else
  {
    return false;
  }
}