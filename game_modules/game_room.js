const crypto = require('crypto');
const WebSocket = require('ws');

function GameRoom(name, pass, availableGames, turnServer)
{
  this.name = name;
  this.turnServer = turnServer;
  this.hash = crypto.createHash('md5').update(name + pass).digest("hex")
  this.availableGames = availableGames;

  this.games = []

  for (gameName in this.availableGames)
  {
    var newWsServer = new WebSocket.Server({ noServer: true });
    var newGameHandler = new this.availableGames[gameName].GameClass(newWsServer, this.turnServer);
    this.games.push({wsLocation: this.availableGames[gameName].wsLocation, wsServer: newWsServer, gameHandler: newGameHandler})
  }
  this.flagAsInactive = false;
}

GameRoom.prototype.processWs = function (hash, wsLocation, request, socket, head)
{
  if (hash == this.hash)
  {
    for (game of this.games)
    {
      if (game.wsLocation == wsLocation)
      {
        game.wsServer.handleUpgrade(request, socket, head, function done(ws) {
          game.wsServer.emit('connection', ws, request);
        });
        return true;
      }
    }
    return false;
  }
  else
  {
    return false;
  }
}

GameRoom.prototype.getNrOfPlayers = function()
{
  var totalPlayers = 0
  for (game of this.games)
  {
    totalPlayers += game.gameHandler.game.gameObj.players.length;
  }
  return totalPlayers;
}

GameRoom.prototype.hasActivePlayers = function()
{
  totalPlayers = this.getNrOfPlayers();
  if (totalPlayers == 0)
  {
    if (this.flagAsInactive)
    {
      return false;
    }
    else
    {
      this.flagAsInactive = true;
      return true;
    }
  }
  else if (totalPlayers > 0)
  {
    this.flagAsInactive = false;
    return true;
  }
}

GameRoom.prototype.close = function()
{
  for (game of this.games)
  {
    game.wsServer.close(function(){
      //console.log('closed ws for gameroom ' + this.name);
    })
  }
}

module.exports = {GameRoom: GameRoom}