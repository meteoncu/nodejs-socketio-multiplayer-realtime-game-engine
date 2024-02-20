const {random} = require("./config");

class Player {
  constructor(game, secret, id, name) {
    this.id = id;
    this.secret = secret;
    this.name = name;

    this.x = random(0, game.config.WIDTH);
    this.y = random(0, game.config.HEIGHT);

    this.health = game.config.DEFAULT_HEALTH;
    this.energy = game.config.DEFAULT_ENERGY;
    this.speed = game.config.DEFAULT_SPEED;

    this.destinationX = null;
    this.destinationY = null;
    this.angle = null;

    this.isDead = false;

    this.kills = 0;
    this.deaths = 0;

    this.slownessDuration = 0;
  }

  move(game, teleport_mode=false) {
    if(this.isDead || this.destinationX === null){return false;}

    if(!teleport_mode){
        let current_speed = this.speed;

        if(this.slownessDuration > 0){
            current_speed /= 2;
            this.slownessDuration--;
        }

        this.feed(game);

        if(this.onTrap(game)){
          current_speed /= 4;
          if(this.energy >= 10){this.energy -= 10;}
        }
    }else{
        let current_speed = game.config.TELEPORT_SPEED;
        if(this.name !== "admin"){
          this.energy -= game.config.TELEPORT_ENERGY_CONSUMPTION;
          game.io.sockets.emit("new energy", {"id": this.id, "energy": this.energy});
        }
    }

    // SIN ve COS yerine this.angle ile projected distance'ları hesaplarsan aşağıdaki 3 satır silinebilir
    let distance = Math.sqrt( (this.destinationY-this.y)**2 + (this.destinationX-this.x)**2);
	let sin = (this.destinationY-this.y ) /distance;
	let cos = (this.destinationX-this.x) / distance;

    let projected_distance_x = Math.floor( current_speed * cos * game.config.FPS / 60 );
    let projected_distance_y = Math.floor( current_speed * sin * game.config.FPS / 60 );

    if( this.x+projected_distance_x > 0 && this.x+projected_distance_x < game.config.WIDTH){this.x += projected_distance_x;}
    if( this.y+projected_distance_y > 0 && this.y+projected_distance_y < game.config.HEIGHT ){this.y += projected_distance_y;}
    this.last_move = Math.round( new Date().getTime() / 1000 );

    return true;
  }

  onTrap(game) {
    let l = Math.floor(this.x/game.TRAP_INTERVAL);
    let t = Math.floor(this.y/game.TRAP_INTERVAL);
    let trap = traps[l+"x"+t];

    if(trap === undefined){return false;}

    let startx = this.x-trap.width/2;
    let endx = this.x+trap.width/2;
    let starty = this.y-trap.height/2;
    let endy = this.y+trap.height/2

    return (trap.x > startx && trap.x < endx && trap.y > starty && trap.y < endy)
  }

  feed(game) {
    if(this.isDead){return false;}

    let l = Math.floor(this.x / game.config.FEED_INTERVAL);
    let t = Math.floor(this.y / game.config.FEED_INTERVAL);
    let feed = game.feeds[l+"x"+t];

    if(this.energy >= game.config.MAX_ENERGY || feed === undefined){return false;}

    let startx = this.x - feed.width/2;
    let endx = this.x + feed.width/2;
    let starty = this.y - feed.height/2;
    let endy = this.y + feed.height/2;

    if(feed.x > startx && feed.x < endx && feed.y > starty && feed.y < endy){
        if(feed.type === "1"){
            this.energy += 100;
        }else if(feed.type === "2"){
            this.energy += 150;
        }else if(feed.type === "3"){
            this.energy += 200;
        }else if(feed.type === "4"){
            this.energy += 250;
        }//end of feed type

        game.io.sockets.emit("delete feed", {"x": feed.x, "y": feed.y});
        delete game.feeds[lsi+" "+tsi];
        return true;
    }//feed is under of fly

    return false;
  }

  setDestinationXY(x, y) {
    if(this.isDead){return false;}
    this.destinationX = x;
    this.destinationY = y;

    let angle = (-1)*Math.atan2(y - this.y, x - this.x) * 180 / Math.PI;
	if(angle < 0){angle += 360;}
    this.angle = angle;

    return true;
  }

  die(game, killer=null) {
    if(this.isDead){return false;}
    this.isDead = true;
    this.deaths++;

    if(killer !== null){
        killer.kills++;
        game.io.sockets.emit("death", {"killerid": killer.id, "killernick": killer.name, "killedid": this.id, "killednick": this.name});
    }

    return true;
  }

  born(game) {
    if(!this.isDead){return false;}
    this.isDead = false;
    this.x = random(0, game.config.WIDTH);
    this.y = random(0, game.config.HEIGHT);
    this.slownessDuration = 0;
    this.health = game.config.DEFAULT_HEALTH;
    this.energy = game.config.DEFAULT_ENERGY;
    game.io.sockets.emit("new player", this.toJson());
    return true;
  }

  attack(game, x, y, type) {
    if(this.isDead){return false;}
    let range = game.config.ATTACK_RANGE;
    let startx = this.x - range;
	let endx = this.x + range;
	let starty = this.y - range;
	let endy = this.y + range;

	let mouse_distance = Math.sqrt( (x-this.x)*(x-this.x) + (y-this.y)*(y-this.y) );
	if(mouse_distance < range){mouse_distance = range;}
	let effectx = Math.floor( (this.x+ ((x-this.x)*(range/mouse_distance)+this.x) )/2-range/2 );
	let effecty = Math.floor( (this.y+ ((y-this.y)*(range/mouse_distance)+this.y) )/2-1 );
	let angle = (-1)*Math.atan2(y-this.y,x-this.x) * 180 / Math.PI;
	if(angle < 0){angle += 360;}
	game.io.sockets.emit("attack effect", {"effectx": effectx, "effecty": effecty, "angle": angle});

	for(let key in game.players) {
    let player = game.players[key];
		if(player.secret === this.secret || player.dead === 1 || player.x <= startx || player.x >= endx
            || player.y <= starty || player.y >= endy){return;}

		let players_distance = Math.sqrt( (player.x-this.x)**2 + (player.y-this.y)**2 );
		if(players_distance > range){return;}

		let thisAngle = (-1)*Math.atan2(player.y-this.y, player.x-this.x) * 180 / Math.PI;
		if(thisAngle < 0){thisAngle += 360;}

		let attackAngle = (-1)*Math.atan2(y - this.y, x - this.x) * 180 / Math.PI;
		if(attackAngle < 0){attackAngle += 360;}
		if( thisAngle <= (attackAngle-30) || thisAngle >= (attackAngle+30) ){return;}

        // CONSEQUENCES TO THE VICTIM WRT TYPE
        if(type === "damage"){
          player.health -= game.config.ATTACK_DAMAGE*(1-(players_distance/range));
          if(player.health <= 0){
              player.die(game, this);

          }else{
              game.io.sockets.emit("new health", {"id": player.id, "health": player.health});
          } // if player is alive after attack

        }else if(type === "slowness"){
			player.slowness_duration = 20;
            game.io.sockets.emit("new energy", {"id": this.id, "energy": this.energy});
        }
	}; // players loop

    // CONSEQUENCES TO THE MAKER WRT TYPE
    if(type === "damage") {
      this.energy -= game.config.ATTACK_ENERGY_CONSUMPTION;
      game.io.sockets.emit("attack effect", {
        "effectx": effectx,
        "effecty": effecty,
        "attack_angle": angle
      });

    }else if(type === "slowness"){
      this.energy -= game.config.ATTACK_ENERGY_CONSUMPTION;
      game.io.sockets.emit("making_slow effect", {
        "effectx": effectx,
        "effecty": effecty,
        "angle": angle
      });
    }

    game.io.sockets.emit("new energy", {"id": this.id, "energy": this.energy});

    return true;
  }

  toJson() {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      angle: this.angle,
      energy: this.energy,
      health: this.health,
      dead: this.dead,
      skin: 1
    };
  }

}

module.exports = Player;