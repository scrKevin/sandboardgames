function Player(){
  this.id = "";
  this.name = "";
  this.color = "#FFFFFF";
  this.pos = {
    x: 0,
    y: 0
  };
  this.drawArray = [];
  //this.newCoords = [];
}

Player.prototype.setId = function(playerNumbers){
  var nextAvailableId = -1
  for (var i = 0; i < playerNumbers.length; i++)
  {
    if (playerNumbers[i])
    {
      this.id = i;
      playerNumbers[i] = false
      break;
    }
  }
  return this.id;
}

Player.prototype.getId = function(){
  return this.id;
}

Player.prototype.updatePos = function(pos){
  var deltaY = this.pos.y - pos.y;
  var deltaX = this.pos.x - pos.x;
  this.pos.x = pos.x;
  this.pos.y = pos.y;
  return {deltaX: deltaX, deltaY: deltaY}
}

Player.prototype.updateColor = function(color){
  this.color = color;
}

Player.prototype.updateName = function(name){
  this.name = name;
}

Player.prototype.addDrawCoordinates = function(newCoords)
{
  for(coord of newCoords)
  {
    this.drawArray.push(coord);
    //this.newCoords.push(coord);
  }
}

Player.prototype.resetBroadcastedDrawArray = function()
{
  //this.newCoords = [];
}

module.exports = {Player: Player}