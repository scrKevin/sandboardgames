function Client(playerId, ws)
{
  this.peerStatus = {};
  this.playerId = playerId;
  this.ws = ws;
  this.isAlive = true;
  this.ws.on("pong", () => {
    this.isAlive = true;
  });
  const interval = setInterval(() => {
    if (this.isAlive === false) return this.ws.terminate();

    this.isAlive = false;
    this.ws.ping(noop);
  }, 16000);

  this.ws.on("close", function(){
    clearInterval(interval);
  });
}

function noop() {}

module.exports = {Client: Client}