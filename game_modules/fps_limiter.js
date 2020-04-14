var events = require('events');

function FpsLimiter(fps) {
  this.isIntervalSet = false;
  this.ms = Math.round(1000 / fps);
  this.eventEmitter = new events.EventEmitter();
}

FpsLimiter.prototype.update = function()
{
  if (this.isIntervalSet)
  {
    return;
  }
  this.isIntervalSet = true;
  //this.func(this.args);
  this.eventEmitter.emit("update");
  setTimeout(function(){
    this.isIntervalSet = false;
  }.bind(this), this.ms);
  return;
}

module.exports = {FpsLimiter: FpsLimiter}