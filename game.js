const Player = require("./player");
const Trap = require("./trap");
const Feed = require("./feed");
const {random, TRAP_HEIGHT, FEED_HEIGHT} = require("./config");

class Game {
  constructor(config, io) {
    this.config = config;
    this.io = io;

    this.players = {};
    this.traps = {};
    this.feeds = {};
    this.ranking_players = {};

    this.isReady = false;
    this.lastPlayerId = 0;

    this.roundStart = null;
  }

  playerJoin(socket, name) {
    console.log(socket);
    // Generating a token to use as a secret key
    let secret = Math.random().toString(36).slice(2);
    while(this.players[secret] !== null){secret = Math.random().toString(36).slice(2);}

    // Creating the new player object and placing it in the players dict of the game
    let player = new Player(this, secret, this.lastPlayerId, name);
    this.lastPlayerId++;
    this.players[secret] = player;

    // Letting the player knows his secret key
    socket.send({"type": "welcome", "secret_key": secret, "id": player.id});

    // Letting all players know about the new player
    this.io.sockets.emit("new player", player.toJson());

    return true;
  }

  playerBorn(secret) {
    let player = this.players[secret];
    if(player === null){return false;}
    return player.born(this);
  }

  playerTeleport(secret) {
    let player = this.players[secret];
    if(player === null){return false;}
    // Calling regular move function of the player object with differently teleport_mode=true
    return player.move(this, true);
  }

  playerAttack(secret, x, y, type) {
    if(!this.isReady){return false;}
    let player = this.players[secret];
    if(player === null){return false;}
    return player.attack(this, x, y, type);
  }

  playerSetDestination(secret, x, y) {
    let player = this.players[secret];
    if(player === null){return false;}
    return player.setDestinationXY(x, y);
  }

  setTraps() {
    let trap_interval = this.config.TRAP_INTERVAL;
    for(let l=0; l < Math.floor(this.config.WIDTH/trap_interval); l++){
        for(let t=0; t < Math.floor(this.config.HEIGHT/trap_interval); t++){
            if(random(1, 2) === 1 || this.traps[l+"x"+t] !== undefined){continue;}

            let x = l*trap_interval+random( Math.floor(trap_interval/6) , Math.floor(trap_interval/6*5) );
            let y = t * trap_interval+random( Math.floor(trap_interval/6) , Math.floor(trap_interval/6*5) );

            this.traps[l+"x"+t] = new Trap(1, x, y, this.config.TRAP_WIDTH, TRAP_HEIGHT);

            this.io.sockets.emit("new trap",{"x": x, "y": y});
        }//loop t
    }//loop l

    return true;
  }

  setFeeds() {
    let feed_interval = this.config.FEED_INTERVAL;
    for(let l=0; l < Math.floor(this.config.WIDTH/feed_interval); l++){
        for(let t=0; t < Math.floor(this.config.HEIGHT/feed_interval); t++){

			if(this.feeds[l+" "+t] !== undefined || random(1, 3) === 1){continue;}

			let n = random(1, 16);
			if(n >= 1 && n <= 9){n = 1;}else if(n > 9 && n <= 12){n = 2;}else if(n > 12 && n <= 15){n = 3;}else if(n > 15){n = 4;}

            let x = l*feed_interval+random( Math.floor(feed_interval/6) , Math.floor(feed_interval/6*5) );
            let y = t * feed_interval+random( Math.floor(feed_interval/6) , Math.floor(feed_interval/6*5) );

            this.feeds[l+"x"+t] = new Feed(n, x, y, this.config.FEED_WIDTH, FEED_HEIGHT);

            this.io.sockets.emit("new feed",{"x": x, "y": y, "n": n});
        }//loop t
    }//loop l

    return true;
  }

  doRanking() {
    this.ranking_players = {};
    let i = 0;
	for(let key in this.players) {
    let player = this.players[key];
		i++;
		let thiskills = players[key]["kills"];
		let thisorder = 0;
		for(let key2 in this.players) {
      let player2 = this.players[key2];
			if(player2.kills > player.kills){
				thisorder++;
			}else if(player2.kills === thiskills && player.deaths > player2.deaths){
				thisorder++;
			}else if(player2.kills === thiskills && player.deaths === player2.deaths && player.id < player2.id){
				thisorder++;
			}
		}; // finding order of this

		this.ranking_players[thisorder] = {
			"id": player.id,
			"nickname": player.name,
			"kills": thiskills,
			"deaths": player.deaths
		};
	}; // all players
    return true;
  }

  begin() {
    this.feeds = {};
    this.traps = {};
    this.players = {};
    this.ranking_players = {};
    this.lastPlayerId = 0;
	  this.isReady = true;
	  this.roundStart = Math.round( new Date().getTime() / 1000 );

    this.setTraps();

    this.io.sockets.emit("new game", {"roundStart": this.roundStart, "gameDuration": this.config.GAME_DURATION});
  }

  end() {
    this.isReady = false;
	  this.io.sockets.emit("end of the game", this.ranking_players);
  }

  begin_and_end_loop() {
    this.begin();
    setTimeout(() => {
        this.end();
    }, this.config.GAME_DURATION * 1000);
  }

  loops() {
    // Moving players
    setInterval(() => {
        for(key in this.players) {
          let player = this.players[key];
          player.move(this);
        };
    }, 1000 / this.config.FPS);

    // Doing rankings
    setInterval(() => {
        if(!this.isReady){return;}
        this.doRanking();
    }, this.config.RANKING_DELAY * 1000);

    // New feeds
    setInterval(() => {
        if(!this.isReady){return;}
        this.setFeeds();
    }, this.config.FEED_DURATION * 1000);

    // New games
    this.begin_and_end_loop();
    setInterval(() => {
      this.begin_and_end_loop();
    }, (this.config.GAME_DURATION + this.config.ENDING_DURATION) * 1000);

  }

  get_players() {
    let all_players_list = [];
    for(let i in this.players) {
      all_players_list.push(this.players[i].toJson());
    }
    return all_players_list;
  }

  get_feeds() {
    let all_feeds_list = [];
    for(let i in this.players) {
      all_feeds_list.push(this.feeds[i].toJson());
    }
    return all_feeds_list;
  }

  get_traps() {
    let all_traps_list = [];
    for(let i in this.players) {
      all_traps_list.push(this.traps[i].toJson());
    }
    return all_traps_list;
  }
}

module.exports = Game;