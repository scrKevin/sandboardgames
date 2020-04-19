function Card(id, x, y){
	this.id = id;
	this.x = x;
	this.y = y;
	this.z = 0;
	this.lastTouchedBy = -1;
  this.faceType = 'image';
  this.attachedToDeck = false;
  this.isInAnOpenbox = false;
  this.clickedBy = -1;
}

Card.prototype.setLastTouchedBy = function(playerId)
{
	this.lastTouchedBy = playerId
}

Card.prototype.setZ = function(z)
{
	this.z = z
}

Card.prototype.setX = function(x)
{
	this.x = x
}

Card.prototype.setY = function(y)
{
	this.y = y
}

Card.prototype.isMyCard = function(playerId, mouseClicked)
{
  if ((this.clickedBy == playerId || this.clickedBy == -1) && mouseClicked)
  {
    this.clickedBy = playerId
    return true;
  }
  else
  {
    return false;
  }
}

module.exports = {Card: Card}