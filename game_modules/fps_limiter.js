var EventEmitter = require('events').EventEmitter;

function FpsLimiter(fps) {
  this.isIntervalSet = false;
  this.ms = Math.round(1000 / fps);
  this.calledInTimeout = false;
  EventEmitter.call(this);
}

FpsLimiter.prototype = Object.create(EventEmitter.prototype);

FpsLimiter.prototype.update = function()
{
  if (this.isIntervalSet)
  {
    this.calledInTimeout = true;
    return;
  }
  this.isIntervalSet = true;
  this.calledInTimeout = false;
  this.emit("update");
  setTimeout(function(){
    this.isIntervalSet = false;
    if (this.calledInTimeout)
    {
      this.update();
    }
  }.bind(this), this.ms);
  return;
}

module.exports = {FpsLimiter: FpsLimiter}