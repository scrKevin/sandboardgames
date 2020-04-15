let assert = require('assert');
let chai = require('chai');
let chaiHttp = require('chai-http');
let expect = require('chai').expect;
var common = require('./common')

const WebSocket = require('ws');
let ClientController = require("../game_modules/client_side/client_controller").ClientController;
clientControllerForUser1 = new ClientController();
clientControllerForUser2 = new ClientController();

chai.use(chaiHttp);

var app = require('../index');
var gameRooms = require('../index').appVariables.gameRooms;

var wsUser1 = null;
var wsUser2 = null;

describe('Test reqests on server', function() {
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

  it ('users should receive each others streams', function(done) {
    this.timeout(15000);
    return new Promise(function(resolve, reject){
      resolveObj = {
        playerIdReceivedByUser1: -1,
        playerIdReceivedByUser2: -1,
        streamReceivedByUser1: null,
        streamReceivedByUser2: null
      }
      wsUser1 = new WebSocket('ws://localhost:8080/' + gameRooms[0].hash + '/lobby')
      clientControllerForUser1.initialize(wsUser1, common.getMediaStream());
      clientControllerForUser1.on("playerId", (playerId) => {
        expect(playerId).to.equal(0)
      });
      clientControllerForUser1.on("stream", (playerId, stream) => {
        expect(playerId).to.equal(2)
      });

      wsUser2 = new WebSocket('ws://localhost:8080/' + gameRooms[0].hash + '/lobby')
      clientControllerForUser2.initialize(wsUser2, common.getMediaStream());
      clientControllerForUser2.on("playerId", (playerId) => {
        expect(playerId).to.equal(1)
      });
      clientControllerForUser2.on("stream", (playerId, stream) => {
        expect(playerId).to.equal(0)
      });
    }).then(function(data){
      done()
    })
    
  });

});