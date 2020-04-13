/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function Deck(id, x, y, width, height){
  this.id = id;
  this.attachedCards = [];
  this.attachedOpenboxes = [];
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.immovable = false;
}

Deck.prototype.shuffleDeck = function()
{
  var numberArray = []
  for (var i = 0; i < this.attachedCards.length; i++)
  {
    numberArray.push(i);
  }
  shuffle(numberArray);
  var incrementForStackEffect = 30 / this.attachedCards.length;
  for(var i = 0; i < this.attachedCards.length; i++)
  {
    this.attachedCards[i].setZ(numberArray[i]);
    this.attachedCards[i].setX(this.x + 5 + Math.round(numberArray[i] * incrementForStackEffect));
    this.attachedCards[i].setY(this.y + 80 - Math.round(numberArray[i] * incrementForStackEffect));
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

module.exports = {Deck: Deck}