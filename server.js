const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config');
const Game = require('./game');
const cors = require('cors');
const Player = require('./player');
const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Replace '*' with your actual origin or an array of origins
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  allowEIO3: true
});

const game = new Game(config, io);


io.on('connection', socket => {

	console.log("Connected");

	socket.send({"type": "game details", "width": game.config.WIDTH, "height": game.config.HEIGHT, 
	"game_is_ready": game.isReady, "roundStart": game.roundStart, "gameDuration": game.config.GAME_DURATION,
	"attack_range": game.config.ATTACK_RANGE});
	if(game.isReady === 0){socket.send({"type": "score board", "ranking_players": game.ranking_players, "game_is_ready": 0});}

	socket.on("join", function(data){
		game.playerJoin(socket, data.name);
	});

	socket.on("play again", function(data){
		game.playerBorn(data.secret);
	});

	socket.on("get players", function(){
		socket.send({"type": "player list", "players": game.get_players()});
	});

	socket.on("get feeds", function(){
		socket.send({"type": "feed list", "data": game.get_feeds()});
	});

	socket.on("get traps", function(){
		socket.send({"type": "trap list", "traps": game.get_traps()});
	});

	socket.on("set destination", function(data){
		game.playerSetDestination(data.secret, data.mouseX, data.mouseY);
	});

	socket.on("score board", function(data){
		socket.send({"type": "score board", "ranking_players": game.ranking_players, "game_is_ready": game.isReady});
	});

	socket.on("attack damage", function(data){
		game.playerAttack(data.key, data.mouseX, data.mouseY, "damage");
	});

	socket.on("attack slowness", function(data){
		game.playerAttack(data.key, data.mouseX, data.mouseY, "slowness");
	});

	socket.on("teleport", function(data){
		game.playerTeleport(data.secret);
	});
});

server.listen(config.PORT, () => {
  	console.log(`Server running on port ${config.PORT}`);

	game.loops();
});