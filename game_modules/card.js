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
  this.visibleFor = -1;
  this.fixedZ = false;
  this.ownedBy = -1;
}

Card.prototype.setLastTouchedBy = function(playerId)
{
	this.lastTouchedBy = playerId;
}

Card.prototype.setCardValue = function(cardValue)
{
  this.cardValue = cardValue;
}

Card.prototype.setZ = function(z)
{
  if (!this.fixedZ)
  {
	  this.z = z;
  }
}

Card.prototype.setX = function(x)
{
	this.x = x;
}

Card.prototype.setY = function(y)
{
	this.y = y;
}

Card.prototype.setRotationX = function(rotationX)
{
  this.rotationX = rotationX;
}

Card.prototype.setRotationY = function(rotationY)
{
  this.rotationY = rotationY;
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

Card.prototype.updatePos = function(pos)
{
  this.x = pos.x;
  if (this.x < 0)
  {
    this.x = 0;
  }
  this.y = pos.y;
  if (this.y < 0)
  {
    this.y = 0;
  }
}

Card.prototype.isValidReplacement = function(x, y, requestedById)
{
  if ((this.x - x > -20 && this.x - x < 20) && (this.y - y > -20 && this.y - y < 20) && this.clickedBy == -1 && (this.ownedBy == -1 || this.ownedBy == requestedById))
  {
    return true;
  }
  return false;
}

module.exports = {Card: Card}