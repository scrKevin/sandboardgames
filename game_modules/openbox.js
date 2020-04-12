function Openbox(id, x, y, width, height){
  this.id = id;
  this.attachedCards = [];
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.attachedToDeck = false;
}

Openbox.prototype.isInOpenBox = function(x, y){
  if (x > this.x && x < (this.x + this.width) && y > this.y && y < (this.y + this.height))
  {
    return true;
  }
  else
  {
    return false;
  }
}

module.exports = {Openbox: Openbox}