/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
// function shuffle(a) {
//   var j, x, i;
//   for (i = a.length - 1; i > 0; i--) {
//     j = Math.floor(Math.random() * (i + 1));
//     x = a[i];
//     a[i] = a[j];
//     a[j] = x;
//   }
//   return a;
// }

function Deck(id, x, y, width, height){
  this.id = id;
  this.attachedCards = [];
  this.attachedOpenboxes = [];
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.immovable = false;
  this.clickedBy = -1;
  this.fairMatrix = [
    {x: 1, y: 1, r: 3},
    {x: 1, y: 3, r: 3},
    {x: 2, y: 1, r: 2},
    {x: 2, y: 2, r: 1},
    {x: 2, y: 3, r: 5},
    {x: 2, y: 4, r: 6},
    {x: 3, y: 1, r: 4},
    {x: 3, y: 3, r: 4},
    {x: 4, y: 1, r: 5},
    {x: 4, y: 2, r: 6},
    {x: 4, y: 3, r: 2},
    {x: 4, y: 4, r: 1},
  ];
}

Deck.prototype.getRandomFace = function(max, min){
  return (Math.floor(Math.random() * (max-min)) + min) * 90;
}

Deck.prototype.getRandomIntInclusive = function (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

Deck.prototype.shuffle = function(a){
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

Deck.prototype.shuffleDeck = function(xStackMinimum)
{

  var numberArray = []
  for (var i = 0; i < this.attachedCards.length; i++)
  {
    numberArray.push(i);
  }
  this.shuffle(numberArray);
  var incrementXForStackEffect = xStackMinimum / this.attachedCards.length;
  var incrementYForStackEffect = 30 / this.attachedCards.length;
  for(var i = 0; i < this.attachedCards.length; i++)
  {
    this.attachedCards[i].setZ(numberArray[i]);
    this.attachedCards[i].setX(this.x + 5 + Math.round(numberArray[i] * incrementXForStackEffect));
    this.attachedCards[i].setY(this.y + 80 - Math.round(numberArray[i] * incrementYForStackEffect));
  }
}

Deck.prototype.rollDeck = function()
{
  for(var i = 0; i < this.attachedCards.length; i++)
  {
    var r1 = this.getRandomIntInclusive(0, 11);
    //console.log("D" + i + " - R1:" + r1, " face: " + this.fairMatrix[r1].r);
    var r2 = this.getRandomIntInclusive(0, 5);
    var r3 = this.getRandomIntInclusive(0, 5);
    var rx = this.fairMatrix[r1].x;
    var ry = this.fairMatrix[r1].y;
    this.attachedCards[i].setRotationX((rx * 90) + (360 * r2));
    this.attachedCards[i].setRotationY((ry * 90) + (360 * r3));

    // this.attachedCards[i].setRotationX((rx * 90));
    // this.attachedCards[i].setRotationY((ry * 90));
  }
}

Deck.prototype.isInDeck = function(x, y){
  if (x > this.x && x < (this.x + this.width) && y > this.y && y < (this.y + this.height))
  {
    return true;
  }
  else
  {
    return false;
  }
}

Deck.prototype.removeFromDeck = function(card){
  
  var removeIndexCard = this.attachedCards.map(function(item) { return item.id }).indexOf(card.id);
  if (removeIndexCard != -1)
  {
    //console.log("remove " + card.id + " from " + this.id)
    this.attachedCards.splice(removeIndexCard, 1);
    card.attachedToDeck = false;
  }
}

Deck.prototype.addToDeck = function(card){
  
  var allowedToAdd = this.attachedCards.map(function(item) { return item.id }).indexOf(card.id);
  if (allowedToAdd == -1)
  {
    //console.log("add " + card.id + " to " + this.id)
    this.attachedCards.push(card);
    card.attachedToDeck = true;
  }
}

Deck.prototype.setImmovable = function()
{
  this.immovable = true;
}

Deck.prototype.isMyDeck = function(playerId, mouseClicked)
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

Deck.prototype.updatePos = function(pos)
{
  var deltaY = this.y - pos.y;
  var deltaX = this.x - pos.x;
  var xCorrection = 0;
  var yCorrection = 0;
  this.x = pos.x;
  if (this.x < 0)
  {
    xCorrection = 0 - this.x;
    this.x = 0;
  }
  this.y = pos.y;
  if (this.y < 0)
  {
    yCorrection = 0 - this.y;
    this.y = 0;
  }
  return {deltaX: deltaX, deltaY: deltaY, xCorrection: xCorrection, yCorrection: yCorrection}
}

module.exports = {Deck: Deck}