let assert = require('assert');
let chai = require('chai');
let chaiHttp = require('chai-http');
let expect = require('chai').expect;
var common = require('./common')

const WebSocket = require('ws');
let ClientController = require("../game_modules/client_side/client_controller").ClientController;

chai.use(chaiHttp);

var app = require('../index');
var gameRooms = require('../index').appVariables.gameRooms;

describe('Integration Test', function() {
  this.timeout(15000);
  it('should get index', (done) =>{
    chai.request(app)
      .get('/')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }); 
  });

  it('should create a new gameRoom', (done) => {
    chai.request(app)
      .post('/api/create')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({nameCreate: "test", passCreate: "pass"})
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(gameRooms).to.have.length(1);
        done();
      });
  });

  it('should be able to join the created gameRoom', (done) => {
    chai.request(app)
    .get('/' + gameRooms[0].hash + '/lobby')
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      done();
    })
  });

  it ('should add new players to the gameroom count', function () {

    function connectAndDisconnect()
    { 
      return new Promise(async function(resolve, reject){


        function connect(clientController, wsUser){
          return new Promise(function(resolve, reject){
            clientController.on("playerId", (playerId) => {
              resolve();
            });
            clientController.initialize(wsUser, common.getMediaStream());
          });
        }

        function closeWs(clientController, wsUser){
          return new Promise(function(resolve, reject){
            clientController.on("wsClosed", () => {
              
              setTimeout(function(){
                resolve();
              }, 200);

              
            })
            wsUser.close();
          })
        }


        var testUsers = []
        for(var i = 0; i < 10; i++)
        {
          var clientController = new ClientController();
          var wsUser = new WebSocket('ws://localhost:8080/' + gameRooms[0].hash + '/lobby')
          await connect(clientController, wsUser)
          testUsers.push({cc: clientController, wsUser: wsUser});
        }
        expect(gameRooms[0].getNrOfPlayers()).to.equal(10);
        for(var i = 0; i < 10; i++)
        {
          await closeWs(testUsers[i].cc, testUsers[i].wsUser);
          //console.log("closed")
        }
        expect(gameRooms[0].getNrOfPlayers()).to.equal(0);
        resolve()
      })
    };

    return connectAndDisconnect().then(function(){

    }, function(err){
      assert.fail(err)
    }).catch(function(assertErr){
      assert.fail(assertErr)
    });
  });

  it ('users should receive each others streams', function() {
    //console.log("started")
    function testReceivingStreams(){
      return new Promise(function(resolve, reject){
        function checkResolve(){
          if (resolveObj.streamsReceivedByUser0.received.length == 2 && resolveObj.streamsReceivedByUser1.received.length == 2 && resolveObj.streamsReceivedByUser2.received.length == 2)
          {
            wsUser0.close()
            wsUser1.close()
            wsUser2.close()
            resolve(resolveObj)
          }
        }
        var clientControllerForUser0 = new ClientController();
        var clientControllerForUser1 = new ClientController();
        var clientControllerForUser2 = new ClientController();
        var resolveObj = {
          streamsReceivedByUser0: {ownPlayerId: 0, received: []},
          streamsReceivedByUser1: {ownPlayerId: 1, received: []},
          streamsReceivedByUser2: {ownPlayerId: 2, received: []},
        }
        var wsUser0 = new WebSocket('ws://localhost:8080/' + gameRooms[0].hash + '/lobby')
        clientControllerForUser0.initialize(wsUser0, common.getMediaStream());
        clientControllerForUser0.on("stream", (playerId, stream) => {
          resolveObj.streamsReceivedByUser0.received.push({playerId: playerId, stream: stream})
          checkResolve();
        });

        var wsUser1 = new WebSocket('ws://localhost:8080/' + gameRooms[0].hash + '/lobby')
        clientControllerForUser1.initialize(wsUser1, common.getMediaStream());
        clientControllerForUser1.on("stream", (playerId, stream) => {
          resolveObj.streamsReceivedByUser1.received.push({playerId: playerId, stream: stream})
          checkResolve();
        });

        var wsUser2 = new WebSocket('ws://localhost:8080/' + gameRooms[0].hash + '/lobby')
        clientControllerForUser2.initialize(wsUser2, common.getMediaStream());
        clientControllerForUser2.on("stream", (playerId, stream) => {
          resolveObj.streamsReceivedByUser2.received.push({playerId: playerId, stream: stream})
          checkResolve();
        });
      });
    };

    return testReceivingStreams().then(function(resolveObj){
      var possibleUsers = [0, 1, 2]
      for (user in resolveObj)
      {
        //console.log(resolveObj[user])
        var shouldHaveReceived = possibleUsers.filter(function(userNr){
          return userNr != resolveObj[user].ownPlayerId
        });
        //console.log(shouldHaveReceived)
        for(received of resolveObj[user].received)
        {
          if(!shouldHaveReceived.includes(received.playerId))
          {
            console.log(shouldHaveReceived);
            console.log(resolveObj[user].received);
            assert.fail("user " + resolveObj[user].ownPlayerId + " received a stream it should not have received.")
          }
        }
        var nInReceived = 0;
        for (userNr of shouldHaveReceived)
        {
          for (received of resolveObj[user].received)
          {
            if (received.playerId == userNr)
            {
              nInReceived++;
            }
            expect(received.stream).not.to.be.null;
          }
        }
        expect(nInReceived).to.equal(2);
      }
    }, function (err){
      assert.fail();
    }).catch(function(assertErr){
      assert.fail(assertErr)
    });
    
  });

  it("should process mouse move", function(done){
    var clientControllerForUser0 = new ClientController();
    var wsUser0 = new WebSocket('ws://localhost:8080/' + gameRooms[0].hash + '/lobby')
    clientControllerForUser0.initialize(wsUser0, common.getMediaStream());
    clientControllerForUser0.on("playerId", (playerId) => {
      clientControllerForUser0.mouseMove(200, 250);
      setTimeout(function(){
        for(game of gameRooms[0].games)
        {
          if(game.wsLocation == 'lobby')
          {
            expect(game.gameHandler.game.gameObj.players[0].pos.x).to.equal(200);
            expect(game.gameHandler.game.gameObj.players[0].pos.y).to.equal(250);
            done();
          }
        }
      }, 500);
    });
  });

});