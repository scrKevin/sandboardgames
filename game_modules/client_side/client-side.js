let WsHandler = require("./ws_handler").WsHandler;
let MouseHandler = require("./mouse_handler").MouseHandler;

var wsHandler = null;
var mouseHandler = null;

var scale = 1;

var myStream = null;
var peers = {};


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

var ws = null;

var doorbell = new Audio('/wav/doorbell.wav');

var latestMouseX = -1;
var latestMouseY = -1;
var dragCardId = null;

function addWebcam(stream, playerId, mirrored, muted)
{
  var video = document.createElement('video');
  $("#webcam" + playerId).html(video)
  if (mirrored)
  {
    $("#webcam" + playerId).css("transform", "rotateY(180deg)")
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
}

function initGamePeer(playerId)
{
  console.log("initiating peer for player " + playerId)
  
  peers[playerId] = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: myStream
  });

  peers[playerId].on('signal', data => {
    //console.log("signal ")
    sendData = {
      type: "initiatorReady",
      playerId: playerId,
      stp: data
    }
    sendToWs(sendData)
  });

  peers[playerId].on('stream', stream => {
    addWebcam(stream, playerId, false, false);
  });
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
     wsHandler = new WsHandler(ws);

     wsHandler.eventEmitter.on("playerId", (playerId) => {
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
     });

     wsHandler.eventEmitter.on("updateGame", (gameObj, changedCardsBuffer, init) => {
        if(init)
        {
          initCards(gameObj)
        }
        else
        {
          updateCards(gameObj, changedCardsBuffer);
        }

        updateOpenboxes(gameObj);
        updateCursors(gameObj);
        updateColorSelection(gameObj);


        $(document).trigger("gameObj", [gameObj, myPlayerId, scale]);
     });

     mouseHandler = new MouseHandler(wsHandler);
  }
  else
  {
     // The browser doesn't support WebSocket
     //alert("WebSocket NOT supported by your Browser!");
  }
}


$(document).bind('touchmove mousemove', function (e) {
  e.preventDefault();
  var currentY = e.originalEvent.touches ?  e.originalEvent.touches[0].pageY : e.pageY;
  var currentX = e.originalEvent.touches ?  e.originalEvent.touches[0].pageX : e.pageX;

  var currentXScaled = Math.round(currentX * (1 / scale));
  var currentYScaled = Math.round(currentY * (1 / scale));

  if (latestMouseX != -1)
  {
    var deltaX = latestMouseX - currentXScaled;
    var deltaY = latestMouseY - currentYScaled;


    if (dragCardId != null)
    {
      updateCss("#" + dragCardId, "left", (($("#" + dragCardId).position().left * (1 / scale)) - deltaX) + "px");
      updateCss("#" + dragCardId, "top", (($("#" + dragCardId).position().top * (1 / scale)) - deltaY) + "px");
    }
  }

  latestMouseY = currentYScaled
  latestMouseX = currentXScaled;
  if (mouseHandler != null)
  {
    mouseHandler.mouseMove(currentXScaled, currentYScaled);
  }
});


$( document ).on( "mouseup", function( e ) {
  dragCardId = null;
  if(mouseHandler != null)
  {
    mouseHandler.mouseUp();
  }
});

$(document).on ("keydown", function (event) {
    if (event.ctrlKey  && event.key === "q") { 
        $('#resetModal').modal();
    }
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
}

$( window ).resize(function() {
  adaptScale();

});

$( document ).ready(function() {
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
  $(".shuffleButton").on('click', shuffleDeck);
  $('#name').keyup(function(){
      checkEnterIsAllowed();
      sendData = {
        type: "name",
        name: $('#name').val()
      }
      sendToWs(sendData);
  })

  $(".card").on("mousedown", function(event){
    dragCardId = event.currentTarget.id;
    mouseHandler.clickOnCard(event.currentTarget.id);
  });

  $(".card").on("touchstart", function(event){
    mouseclicked = true;
    var currentY = event.originalEvent.touches[0].pageY;
    var currentX = event.originalEvent.touches[0].pageX;
    latestMouseY = currentY * (1 / scale);
    latestMouseX = currentX * (1 / scale);
    sendData = {
      type: "mouse",
      mouseclicked: mouseclicked,
      pos: {x: Math.round(latestMouseX), y: Math.round(latestMouseY)},
      card: dragCardId
    }
    sendToWs(sendData);
    dragCardId = event.currentTarget.id;
    event.preventDefault();
    
  });
   $(".card").bind("mouseup touchend", function(e){
    e.preventDefault();
    var currentY = e.originalEvent.touches ?  e.originalEvent.touches[0].pageY : e.pageY;
    var currentX = e.originalEvent.touches ?  e.originalEvent.touches[0].pageX : e.pageX;

    mouseHandler.releaseCard(currentX * (1 / scale), currentY * (1 / scale));
    dragCardId = null;
  });

  navigator.mediaDevices.getUserMedia({video: {
                          width: {
                              max: 640,
                              ideal: 320 
                          },
                          height: {
                              max: 480,
                              ideal: 240
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
});

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

function updateCardFace(card, value)
{
  if(card.faceType === 'image')
  {
    if ($("#" + card.id).children('img').attr("src") !== value)
    {
      $("#" + card.id).children('img').attr("src", value);
    }
  }
  else if(card.faceType === 'text')
  {
    if ($("#" + card.id + " span").html() !== value.text)
    {
      $("#" + card.id + " span").html(value.text);
      $("#" + card.id).css("color", value.color);
      $("#" + card.id).css("border", "4px solid " + value.color);
      $("#" + card.id).css("background-color", value.backgroundcolor);
      if(value.hasOwnProperty("secondarytext"))
      {
        $("#" + card.id + "_sec").html(value.secondarytext);
      }
      $(document).trigger("cardTextChanged", [card.id]);
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

function initCards(gameObj){
  for (var i = 0; i < gameObj.decks.length; i++)
  {
    updateCss("#" + gameObj.decks[i].id, "left", gameObj.decks[i].x + "px");
    updateCss("#" + gameObj.decks[i].id, "top", gameObj.decks[i].y + "px");
  }
  for (var i = 0; i < gameObj.cards.length; i++)
  {
    updateCss("#" + gameObj.cards[i].id, "z-index", String(gameObj.cards[i].z + 60));
    updateCss("#" + gameObj.cards[i].id, "left", gameObj.cards[i].x + "px");
    updateCss("#" + gameObj.cards[i].id, "top", gameObj.cards[i].y + "px");
    if (gameObj.cards[i].hasOwnProperty("show"))
    {
      if (cardIsInMyOwnBox(gameObj.cards[i]))
      {
        updateCardFace(gameObj.cards[i], gameObj.cards[i].frontface);
      }
      else
      {
        if(cardIsInInspectorBox(gameObj.cards[i]))
        {
          updateCardFace(gameObj.cards[i], gameObj.cards[i].altFrontface);
        }
        else
        {
          if (gameObj.cards[i].show == "backface")
          {
            updateCardFace(gameObj.cards[i], gameObj.cards[i].backface);
          }
          else if (gameObj.cards[i].show == "frontface")
          {
            updateCardFace(gameObj.cards[i], gameObj.cards[i].frontface);
          }
        }
      }
    }
  }
}

function updateCards(gameObj, changedCardsBuffer)
{
  for (var i = 0; i < gameObj.decks.length; i++)
  {
    updateCss("#" + gameObj.decks[i].id, "left", gameObj.decks[i].x + "px");
    updateCss("#" + gameObj.decks[i].id, "top", gameObj.decks[i].y + "px");
  }
  var cards = gameObj.cards.filter(function(card){
    return changedCardsBuffer.includes(card.id);
  });
  changedCardsBuffer = [];
  for (card of cards)
  {
    if(card.id != dragCardId)
    {
      updateCss("#" + card.id, "z-index", String(card.z + 60));
      updateCss("#" + card.id, "left", card.x + "px");
      updateCss("#" + card.id, "top", card.y + "px");
    }

    
    if(card.hasOwnProperty("show") && card.isInAnOpenbox)
    {
      if (card.show == "backface")
      {
        updateCardFace(card, card.backface);
      }
      else if (card.show == "frontface")
      {
        updateCardFace(card, card.frontface);
      }
    }
    else
    {
      var cardInMyBox = cardIsInMyOwnBox(card);

      if (card.hasOwnProperty("show") && (!card.attachedToDeck || cardInMyBox))
      {
        if (cardInMyBox)
        {
          updateCardFace(card, card.frontface);
        }
        else
        {
          if(cardIsInInspectorBox(card))
          {
            updateCardFace(card, card.altFrontface);
          }
          else
          {
            if (card.show == "backface")
            {
              updateCardFace(card, card.backface);
            }
            else if (card.show == "frontface")
            {
              updateCardFace(card, card.frontface);
            }
          }
        }
      }
    }
  }
}

function updateOpenboxes(gameObj)
{
  for (openbox of gameObj.openboxes)
  {
    updateCss("#" + openbox.id, "left", (openbox.x) + "px");
    updateCss("#" + openbox.id, "top", (openbox.y) + "px");
    updateCss("#" + openbox.id, "width", (openbox.width) + "px");
    updateCss("#" + openbox.id, "height", (openbox.height) + "px");
  }
}

function updateCursors (gameObj)
{
  playerIndex = 0;
  for (player of gameObj.players){
    updateCss("#cursor" + playerIndex, "background-color", player.color);
    updateCss("#player" + player.id + "box", "background-color", player.color);
    updateHtml("#player" + player.id + "NameText", player.name)
    updateCss("#cursor" + playerIndex, "left", (player.pos.x - 22) + "px");
    updateCss("#cursor" + playerIndex, "top", (player.pos.y - 22) + "px");
    updateCss("#cursor" + playerIndex, "display", "block");
    playerIndex++;
  }
  for (var i = playerIndex; i < 20; i++){
    updateCss("#cursor" + i, "left", "20000px");
    updateCss("#cursor" + i, "top", "0px");
    updateCss("#cursor" + playerIndex, "display", "none");
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
  sendData = {
    type: "color",
    color: colors[nr - 1]
  }
  sendToWs(sendData);
  checkEnterIsAllowed();
}

function shuffleDeck(e){
  var deckId = e.target.parentElement.id;
  sendData = {
    type: "shuffleDeck",
    deckId: deckId
  }
  sendToWs(sendData);
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
  var sendData = {
    type: "reset"
  }
  sendToWs(sendData)
}