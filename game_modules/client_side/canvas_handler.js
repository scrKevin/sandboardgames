let FpsLimiter = require('../fps_limiter').FpsLimiter;

function CanvasHandler() {
  this.canvas = null;
  this.ctx = null;
  this.w = 0;
  this.h = 0;
  this.scale = 1;

  this.currX = 0;
  this.currY = 0;
  this.prevX = 0;
  this.prevY = 0;

  this.flag = false;
  this.dot_flag = false;

  this.wsHandler = null;

  this.lastDrawCoordinates = [];

  this.canvasFpsLimiter = new FpsLimiter(20);
  this.canvasFpsLimiter.on("update", () => {
    this.sendDrawCoordinates()
  });
  this.initialized = false;
  this.myPlayerId = -1;
  this.myColor = "#000000";
}

CanvasHandler.prototype.init = function(canvas)
{
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.w = canvas.width;
  this.h = canvas.height;

  this.canvas.addEventListener("mousemove", (e) => {
    this.processMouse('move', e)
  }, false);
  this.canvas.addEventListener("mousedown", (e) => {
    this.processMouse('down', e)
  }, false);
  this.canvas.addEventListener("mouseup", (e) => {
    this.processMouse('up', e)
  }, false);
  this.canvas.addEventListener("mouseout", (e) => {
    this.processMouse('out', e)
  }, false);
}

CanvasHandler.prototype.updateScale = function(scale)
{
  this.scale = scale;
}

CanvasHandler.prototype.processMouse = function(res, e)
{
  if (res == 'down') {
    this.prevX = this.currX;
    this.prevY = this.currY;
    this.currX = Math.round(e.clientX * (1 / this.scale)) - this.canvas.offsetLeft;
    this.currY = Math.round(e.clientY * (1 / this.scale)) - this.canvas.offsetTop;

    this.flag = true;
    this.dot_flag = true;
    if (this.dot_flag) {
      this.ctx.beginPath();
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(this.currX, this.currY, 2, 2);
      this.ctx.closePath();
      this.dot_flag = false;
    }
  }
  if (res == 'up' || res == "out") {
    this.flag = false;
    this.canvasFpsLimiter.update();
  }
  if (res == 'move') {
    if (this.flag) {
      this.prevX = this.currX;
      this.prevY = this.currY;
      this.currX = Math.round(e.clientX * (1 / this.scale)) - this.canvas.offsetLeft;
      this.currY = Math.round(e.clientY * (1 / this.scale)) - this.canvas.offsetTop;
      this.draw();
    }
  }
}

CanvasHandler.prototype.draw = function()
{
  this.lastDrawCoordinates.push({x0: this.prevX, y0: this.prevY, x1: this.currX, y1: this.currY});
  this.canvasFpsLimiter.update();
  this.ctx.beginPath();
  this.ctx.moveTo(this.prevX, this.prevY);
  this.ctx.lineTo(this.currX, this.currY);
  this.ctx.strokeStyle = this.myColor;
  this.ctx.lineWidth = 2;
  this.ctx.stroke();
  this.ctx.closePath();
}

CanvasHandler.prototype.initWsHandler = function(wsHandler)
{
  this.wsHandler = wsHandler;
  this.wsHandler.eventEmitter.on("playerId", (playerId) => {
    this.myPlayerId = playerId;
  });
  this.wsHandler.eventEmitter.on("updateGame", (gameObj, changedCards, wsIsInitialized) => {
    if(this.initialized)
    {
      for (player of gameObj.players)
      {
        if(player.id == this.myPlayerId)
        {
          this.myColor = player.color;
        }
        else
        {
          if (player.newCoords.length > 0)
          {
            this.drawOtherPlayer(player.newCoords, player.color);
          }
        }
      }
    }
    else
    {
      for (player of gameObj.players)
      {
        if(player.id == this.myPlayerId)
        {
          this.myColor = player.color;
        }
        else
        {
          if (player.drawArray.length > 0)
          {
            this.drawOtherPlayer(player.drawArray, player.color);
          }
        }
      }
      this.initialized = true;
    }
  });

  this.wsHandler.eventEmitter.on("reset", () => {
    this.erase();
  });
}

CanvasHandler.prototype.drawOtherPlayer = function(coords, color)
{
  for (line of coords)
  {
    this.ctx.beginPath();
    this.ctx.moveTo(line.x0, line.y0);
    this.ctx.lineTo(line.x1, line.y1);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.closePath();
  }
}

CanvasHandler.prototype.erase = function() {
  if (this.canvas != null)
  {
    this.ctx.clearRect(0, 0, this.w, this.h);
  }
}

CanvasHandler.prototype.sendDrawCoordinates = function(){
  if (this.wsHandler != null && this.lastDrawCoordinates.length > 0)
  {
    var sendData = {
      type: "draw",
      coords: this.lastDrawCoordinates
    }
    this.lastDrawCoordinates = [];
    this.wsHandler.sendToWs(sendData);
  }
}

module.exports = {CanvasHandler: CanvasHandler}