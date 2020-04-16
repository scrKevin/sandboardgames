var EventEmitter = require('events').EventEmitter;

function FpsLimiter(fps) {
  this.isIntervalSet = false;
  this.ms = Math.round(1000 / fps);
  EventEmitter.call(this);
}

FpsLimiter.prototype = Object.create(EventEmitter.prototype);

FpsLimiter.prototype.update = function()
{
  if (this.isIntervalSet)
  {
    return;
  }
  this.isIntervalSet = true;
  //this.func(this.args);
  this.emit("update");
  setTimeout(function(){
    this.isIntervalSet = false;
  }.bind(this), this.ms);
  return;
}

module.exports = {FpsLimiter: FpsLimiter}