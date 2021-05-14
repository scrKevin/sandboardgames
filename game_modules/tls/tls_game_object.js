function TlsGameObject()
{
  this.subjects = [];
  this.turnOrder = {};
  this.gameState = 0;
  this.timer = null;
}

module.exports = {TlsGameObject: TlsGameObject}