function FpsLimiter(fps, func, args) {
  this.isIntervalSet = false;
  this.ms = Math.round(1000 / fps);
  this.func = func;
  this.args = args;
}

FpsLimiter.prototype.update = function()
{
  if (this.isIntervalSet)
  {
    return;
  }
  this.isIntervalSet = true;
  this.func(this.args);
  setTimeout(function(){
    this.isIntervalSet = false;
  }.bind(this), this.ms);
  return;
}

module.exports = {FpsLimiter: FpsLimiter}