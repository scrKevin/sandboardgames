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
}

MouseHandler.prototype.mouseMove = function(x, y)
{
  this.latestMouseY = y;
  this.latestMouseX = x;
  this.mouseFpsLimiter.update();
}

MouseHandler.prototype.mouseUp = function()
{
  this.dragCardId = null;
  this.mouseclicked = false;
  this.mouseFpsLimiter.update();
}

MouseHandler.prototype.clickOnCard = function(id)
{
  this.dragCardId = id;
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

MouseHandler.prototype.releaseCard = function(x, y)
{
  this.mouseclicked = false;

  this.latestMouseY = y;
  this.latestMouseX = x;
  var sendData = {
    type: "mouse",
    mouseclicked: this.mouseclicked,
    pos: {x: this.latestMouseX, y: this.latestMouseY},
    card: this.dragCardId
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
    card: this.dragCardId
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
  
  this.mouseFpsLimiter.setMs(latency)
}

module.exports = {MouseHandler: MouseHandler}