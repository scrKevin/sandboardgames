let assert = require('assert');
let chai = require('chai');
let chaiHttp = require('chai-http');
let expect = require('chai').expect;

const WebSocket = require('ws');
let WsClientProtocol = require("../game_modules/client_side/ws_client_protocol").WsClientProtocol

chai.use(chaiHttp);

var app = require('../index');
var gameRooms = require('../index').appVariables.gameRooms;

var ws = null;
var wsClientProtocol = null;


describe('Test reqests on server', () => {
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
      .end((err, res) =>{
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(gameRooms).to.have.length(1);
        done();
      });
  });

  it ('should be able to connect to websocket server', (done) => {
    ws = new WebSocket('ws://localhost:8080/179ad45c6ce2cb97cf1029e212046e81/lobby')
    wsClientProtocol = new WsClientProtocol(ws);
    done();
  });

  it ('should have added the connected player', (done) => {
    expect(gameRooms[0].getNrOfPlayers()).to.equal(1);
    done();
  })

});