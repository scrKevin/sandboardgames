let FpsLimiter = require('../fps_limiter').FpsLimiter;

function MouseHandler(wsHandler)
{
  this.wsHandler = wsHandler;

  this.mouseFpsLimiter = new FpsLimiter(20);
  this.mouseFpsLimiter.eventEmitter.on("update", () => {
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
  this.wsHandler.sendToWs(sendData);
}

module.exports = {MouseHandler: MouseHandler}