const WebSocket = require('ws');
let Player = require('./player').Player
let diff_match_patch = require('./diff-match-patch').diff_match_patch
var pako = require('pako');


function WS_distributor(wss, resetGameFunction)
{
	this.transmittedBytes = 0;
	this.dmp = new diff_match_patch();

	this.resetGame = resetGameFunction;
	this.wss = wss;
	this.playerNumbers = []
	for (var i = 0; i < 20; i++)
	{
		this.playerNumbers.push(true);
	}
	this.clients = [];

	this.gameObj = {
		players:[],
		cards: [],
		decks: [],
		openboxes: []
	}
	this.lastSentGameObj = JSON.stringify(this.gameObj);

	this.timer = null;
	this.isIntervalSet = false;
	this.wss.on('connection', (ws) => {

		var player = new Player();

		var id = player.setId(this.playerNumbers);
		var client = {playerId: id, ws: ws};

		this.clients.push(client);
		this.gameObj.players.push(player);


		ws.on('message', (message) => {
			var json = JSON.parse(pako.inflate(message, { to: 'string' }));
			if (json.type == "name")
			{
				player.updateName(json.name)
				this.broadcast();
			}
			else if (json.type == "mouse")
			{
				var moved = player.updatePos(json.pos)
				if (json.card !== null)
				{
					if (this.isDeck(json.card))
					{
						for (deck of this.gameObj.decks)
						{
							if (deck.id == json.card)
							{
								deck.x -= moved.deltaX;
								deck.y -= moved.deltaY;
								for (card of deck.attachedCards)
								{
									card.x -= moved.deltaX;
									card.y -= moved.deltaY;
								}
								for (openbox of deck.attachedOpenboxes)
								{
									openbox.x -= moved.deltaX;
									openbox.y -= moved.deltaY;
								}
							}
						}
					}
					else
					{
						for (card of this.gameObj.cards)
						{
							if (card.id == json.card)
							{
								card.setLastTouchedBy(id);
								card.x -= moved.deltaX;
								card.y -= moved.deltaY;
								for (deck of this.gameObj.decks)
								{
									if(deck.isInDeck(json.pos.x, json.pos.y))
									{
										deck.addToDeck(card);
									}
									else
									{
										deck.removeFromDeck(card);
									}
								}
								if (card.hasOwnProperty("show"))
								{
									var isInAnOpenbox = false;
									for (openbox of this.gameObj.openboxes)
									{
										if (openbox.isInOpenBox(json.pos.x, json.pos.y))
										{
											isInAnOpenbox = true;
											break;
										}
									}
									if (isInAnOpenbox && !json.mouseclicked)
									{
										card.show = 'frontface'
									}
									else
									{
										card.show = 'backface'
									}
								}
							}
						}
					}
				}
				this.broadcast();
			}
			else if (json.type == "shuffleDeck")
			{
				for (deck of this.gameObj.decks)
				{
					if (deck.id == json.deckId)
					{
						deck.shuffleDeck();
						break;
					}
				}
			}
			else if (json.type == "color")
			{
				player.updateColor(json.color)
				this.broadcast();
			}
			else if (json.type == "initiatorReady")
			{
				for (clientI of this.clients)
				{
					if (clientI.playerId == json.playerId)
					{
						var sendData = {
							type: "peerConnect",
							fromPlayerId: id,
							stp: json.stp
						}
						var strToSend = JSON.stringify(sendData);
						var binaryString = pako.deflate(strToSend, { to: 'string' });
						clientI.ws.send(binaryString);
						break;
					}
				}
			}
			else if (json.type == "acceptPeer")
			{
				for (clientI of this.clients)
				{
					if (clientI.playerId == json.fromPlayerId)
					{
						var sendData = {
							type: "peerAccepted",
							fromPlayerId: id,
							stp: json.stp
						}
						var strToSend = JSON.stringify(sendData);
						var binaryString = pako.deflate(strToSend, { to: 'string' });
						clientI.ws.send(binaryString)
						break;
					}
				}
			}
			else if (json.type == "requestId")
			{
				var sendData = {
					type: "playerId",
					playerId: id,
					gameObj: this.lastSentGameObj
				}
				var strToSend = JSON.stringify(sendData);
				var binaryString = pako.deflate(strToSend, { to: 'string' });
				ws.send(binaryString);
			}
			else if (json.type == "reset")
			{
				this.resetGame(this);
			}
			
		});
		
		ws.on('close', () => {
			var removeIndexClients = this.clients.map(function(item) { return item.playerId; }).indexOf(id);
			this.clients.splice(removeIndexClients, 1);

			var removeIndexGameObj = this.gameObj.players.map(function(item){ return item.id;}).indexOf(id);
			this.gameObj.players.splice(removeIndexGameObj, 1);

			this.playerNumbers[id] = true;
			this.broadcastLeftPeer(id);

		});

		this.broadcastNewPeer(id, ws);
		
	});

	this.resetGame(this);
	this.lastSentGameObj = JSON.stringify(this.gameObj);
}



WS_distributor.prototype.isDeck = function (id)
{
	for (deck of this.gameObj.decks)
	{
		if (deck.id == id)
		{
			return true;
		}
	}
	return false;
}


WS_distributor.prototype.broadcastLeftPeer = function (playerId)
{
	console.log("broadcasting left player " + playerId)
	var sendData = {
		type: "leftPeer",
		playerId: playerId
	}
	var strToSend = JSON.stringify(sendData);
	var binaryString = pako.deflate(strToSend, { to: 'string' });
	this.wss.clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(binaryString);
		}
	});
}

WS_distributor.prototype.broadcastNewPeer = function (playerId, newWs){
	console.log("broadcasting new peer " + playerId)
	var sendData = {
		type: "newPeer",
		playerId: playerId
	}
	var strToSend = JSON.stringify(sendData);
	var binaryString = pako.deflate(strToSend, { to: 'string' });
	this.wss.clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN && client != newWs) {
			client.send(binaryString);
		}
	});
}

WS_distributor.prototype.broadcast = function(){
	if (this.isIntervalSet)
	{
		return;
	}
	this.isIntervalSet = true;
	this.timer = setTimeout(() => {
		var currentGameObj = JSON.stringify(this.gameObj)
		var diffs = this.dmp.diff_main(this.lastSentGameObj, currentGameObj);
		this.dmp.diff_cleanupEfficiency(diffs);
		var patches = this.dmp.patch_make(this.lastSentGameObj, diffs);
		this.lastSentGameObj = currentGameObj;
		var patchToSend = this.dmp.patch_toText(patches)

		var sendData = {
			type: "patches",
			patches: patchToSend
		}
		var strToSend = JSON.stringify(sendData);
		var binaryString = pako.deflate(strToSend, { to: 'string' });
		this.wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(binaryString);
			}
		});
		this.isIntervalSet = false;
		
	}, 33);
}


module.exports = {Game: WS_distributor}