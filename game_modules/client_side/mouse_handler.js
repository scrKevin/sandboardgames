let FpsLimiter = require('../fps_limiter').FpsLimiter;

function MouseHandler(wsHandler)
{
  this.wsHandler = wsHandler;

  this.mouseFpsLimiter = new FpsLimiter(5);
  this.mouseFpsLimiter.on("update", () => {
    this.sendMouseMove()
  });

  this.latestMouseX = 0;
  this.latestMouseY = 0;

  this.mouseclicked = false;
  this.dragCardId = null;
  this.dragCardX = 0;
  this.dragCardY = 0;
}

MouseHandler.prototype.mouseMove = function(x, y, cardX, cardY)
{
  this.latestMouseY = y;
  this.latestMouseX = x;
  this.dragCardX = cardX;
  this.dragCardY = cardY;
  this.mouseFpsLimiter.update();
}

MouseHandler.prototype.mouseUp = function()
{
  this.dragCardId = null;
  this.mouseclicked = false;
  this.mouseFpsLimiter.update();
}

MouseHandler.prototype.clickOnCard = function(id, cardX, cardY)
{
  this.dragCardId = id;
  this.dragCardX = cardX;
  this.dragCardY = cardY;
  this.mouseclicked = true;
  this.mouseFpsLimiter.update();
}

MouseHandler.prototype.touchCard = function(id, x, y)
{
  this.dragCardId = id;
  var sendData = {
    type: "touchcard",
    pos: {x: x, y: y},
    card: id
  }
  this.wsHandler.sendToWs(sendData);
}

MouseHandler.prototype.releaseCard = function(x, y, cardX, cardY)
{
  this.mouseclicked = false;

  this.latestMouseY = y;
  this.latestMouseX = x;
  var sendData = {
    type: "mouse",
    mouseclicked: this.mouseclicked,
    pos: {x: Math.round(this.latestMouseX), y: Math.round(this.latestMouseY)},
    card: {
      id: this.dragCardId, 
      pos: {x: cardX, y: cardY},
      release: true
    }
  }
  this.wsHandler.sendToWs(sendData);
  this.dragCardId = null;
}

MouseHandler.prototype.sendMouseMove = function()
{
  var sendData = {
    type: "mouse",
    mouseclicked: this.mouseclicked,
    pos: {x: this.latestMouseX, y: this.latestMouseY},
    card: {
      id: this.dragCardId,
      pos: {x: this.dragCardX, y: this.dragCardY },
      release: false
    }
  }
  //console.log(this.dragCardId)
  this.wsHandler.sendToWs(sendData);
}

MouseHandler.prototype.touchTouchbox = function(x, y)
{
  var sendData = {
    type: "touchbox",
    pos: {x: x, y: y},
    card: this.dragCardId
  }
  this.wsHandler.sendToWs(sendData);
  this.dragCardId = null;
}

MouseHandler.prototype.adjustLatency = function(latency)
{
  
  this.mouseFpsLimiter.setMs(latency * 1.5)
}

module.exports = {MouseHandler: MouseHandler}