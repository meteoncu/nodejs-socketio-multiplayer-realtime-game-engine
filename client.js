let secret_key = null;
let username;
let charId;
let lastSeconds = 0;

let maxhealth=1000;
let maxenergy=1000;

let dead = 0;
let health;
let energy;

let players_loaded = 0;

let charleft;
let chartop;

let kills;
let deaths;

let charhalfwidth = 30;
let charhalfheight = 40;

let sensitivity=100;

let attack_range;
let energy_consuming_forAttack = 300;
let energy_consuming_forTeleport = 400;
let energy_consuming_forSlowAttack = 400;
let animate_repeats=5;

let mouse_left = null;
let mouse_top = null;
let moved = false;

let player_details = {}

$(document).mousemove(function(event){
	mouse_left = event.pageX;
	mouse_top = event.pageY;
	if(!moved){new_angle();moved = true;}
});

let socket;
let score_board_open = false;

const score_board = $("#score_board");

function open_score_board(players, game_is_ready){
	if(!score_board_open){
		score_board_open = true;
		$("#game").append("<div id='score_board' style='position:fixed;width:600px;height:400px;overflow-y:scroll;overflow-x:hidden;left:"+($(window).width()/2-300)+";top:"+($(window).height()/2-250)+";background-color:rgb(240,240,240);border-radius:15px;padding-bottom:10px;'></div>");
		score_board.append("<div style='margin-top:10px;margin-left:10px;font-weight:bolder;'><div style='width:50px;float:left;'>&nbsp;</div><div style='width:150px;float:left;'>Nickname</div><div style='width:150px;float:left;'>Kills</div><div style='width:150px;float:left;'>Deaths</div><div style='clear:both;'></div></div>");
		let i = 0;
		while(players[i] !== undefined){
			let nickcolor;
			if(players[i]['id'] === charId){nickcolor="green";}else{nickcolor="#000";}
			let rank;
			if(i === 0 && players[i]["id"] > 4){rank = "<img src='./graphics/gold.png'>";}
			else if(i === 1 && players[i]["id"] > 4){rank = "<img src='./graphics/silver.png'>";}
			else if(i === 2 && players[i]["id"] > 4){rank = "<img src='./graphics/bronz.png'>";}
			else{rank = (i+1) + ".";}
			score_board.append("<div style='margin-top:10px;margin-left:10px;'><div style='width:50px;float:left;'>"+rank+"</div><div style='width:150px;float:left;color:"+nickcolor+";'>"+players[i]['name']+"</div><div style='width:150px;float:left;'>"+players[i]['kills']+"</div><div style='width:150px;float:left;'>"+players[i]['deaths']+"</div><div style='clear:both;'></div></div>");
			i++;
		}//all players on score table
		if(!game_is_ready){
			score_board.prepend("<center style='margin-top:10px;'><b style='font-size:20px;color:red;'>END OF ROUND</b></center>");
		}
		}//if score board is closed
}//end of function

function close_score_board(){
	if(score_board_open){
		score_board.remove();
		score_board_open = false;
	}
}//end of function

function countdown(){
	lastSeconds -= 1;
	let min = Math.floor(lastSeconds / 60);
	let sec = lastSeconds % 60;
	if(sec < 10){
		sec = "0" + sec;
	}
	document.getElementById('countdown').innerHTML = "Last: " + min + ":" + sec;
	if(lastSeconds !== 0){setTimeout(()=>{countdown();}, 1000);}
}//end of function

$(document).ready(function(){

	socket = io.connect("http://localhost:3000");

	socket.on("new game", function(data){
		$('#score_board').remove();
		$('#console_logs').html('');
		$('#kills_number').html('0');
		$('#deaths_number').html('0');
		socket.emit("join", {"name": username});
		players_loaded = 1;
		lastSeconds = data.gameDuration - (Math.round( new Date().getTime()/1000 ) - data.roundStart) - 10;
		countdown();
	});//end of function

	socket.on("end of the game", ranking_players => {
		$(".warrior_frame").remove();
		$(".feed").remove();
		$(".trap").remove();
		$("#playagaindiv").remove();
		dead = 1;
		open_score_board(ranking_players, 0);
	});

	socket.on("new trap", data => {
		$("#game").prepend("<img src='./graphics/honey.png' class='trap' style='position:absolute;left:"+(data.x-75)+";top:"+(data.y-75)+";' id='trap_"+data.x+"x"+data.y+"'>");
	});

	socket.on("delete trap", data => {
		$('#trap_' + data.x + 'x' + data.y).remove();
	});

	let attacki = 0;
	socket.on("attack effect", data => {
		attacki++;
		$("#game").prepend("<img src='./graphics/attack.gif' style='position:absolute;left:"+data.effectx+"px;top:"+data.effecty+"px;' id='attack"+attacki+"'>");
		$("#attack"+attacki).css({'transform': 'rotate(-'+data.attack_angle+'deg)'}).delay(450).fadeOut('normal');
	});

	let attacki2 = 0;
	socket.on("making_slow effect", data => {
		attacki2++;
		$("#game").prepend("<div style='width:"+attack_range+"px;height:2px;background-color:rgb(0,0,255);border-radius:5px;position:absolute;left:"+data.effectx+"px;top:"+data.effecty+"px;' id='attack"+attacki2+"'></div>");
		$("#attack" + attacki2).css({'transform': 'rotate(-'+data.attack_angle+'deg)'}).fadeOut('normal');
	});

	socket.on("death", data => {
		let killercolor;
		let killedcolor;
		if(data.killerid === charId){killercolor = "rgb(0,255,0)";}else{killercolor = "#fff";}
		if(data.killedid === charId){killedcolor = "rgb(0,255,0)";}else{killedcolor = "#fff";}

		$('#console_logs').prepend("<div style='margin-bottom:5px;'><a style='color:"+killercolor+";'>"+data.killernick+"</a> <img src='./graphics/kills.png' style='width:14px;height:14px;'> <a style='color:"+killedcolor+";'>"+data.killednick+"</a></div>");

		if(data.killedid === charId){
			dead = 1;
			deaths++;
			$("#deaths_number").html(deaths);
			$('#health_percentage').css({'width': 0});
			$("#game").append("<div id='playagaindiv' style='position:fixed;width:500px;height:auto;left:"+($(window).width()/2-250)+";top:"+($(window).height()/2-250)+";background-color:rgb(240,240,240);border-radius:15px;'><center style='margin-top:15px;margin-bottom:15px;font-size:19px;font-weight:bolder;'>You have been killed by <a style='color:red;'>"+data.killernick+"</a></center><center style='font-size:16px;'>We suggest you to be reborn and revenge!</center><center style='margin-top:15px;margin-bottom:15px;'><a href=\"javascript:socket.emit('play again',{'code':code});$('#playagaindiv').remove();\" style='padding-left:10px;padding-right:10px;padding-top:5px;padding-bottom:5px;background-color:#dcdcdc;border-radius:15px;font-size:16px;text-decoration:none;color:#000;font-weight:bolder;'>Play Again</a></center></div>");
		}

		if(data.killerid === charId){
			kills++;
			$("#kills_number").html(kills);
		}

		$("#player" + data.killedid).fadeOut("normal",function(){$(this).remove();});
	});

	socket.on("new health", data => {
		$("#player" + data.id).find(".player_health").css({"width":(Math.floor(data.health/maxhealth*50))+"px"});
		if(data.id === charId){$('#health_percentage').css({"width":(Math.floor(data.health/maxhealth*100))+"%"});health=data.health;}
	});

	socket.on("delete feed", data => {
		$("#feed_" + data.x + "x" + data.y).remove();
	});

	socket.on("new feed", data => {
		let half;
		if(data.n === "1" || data.n === "2"){half=12;}else if(data.n === "3" || data.n === "4"){half=25;}
		let cssleft = data.x-half;
		let csstop = data.y-half;
		$("#game").prepend("<img src='./graphics/feed"+data.n+".png' class='feed' style='position:absolute;left:"+cssleft+";top:"+csstop+";' id='feed_"+data.x+"x"+data.y+"'>");
	});

	socket.on("new energy", data => {
		if(data.id === charId){
			$("#energy_percentage").css({"width":Math.floor(data.energy/maxenergy*100)+"%"});
			energy = data.energy;
		}//if player is me
	});

	socket.on("message", data => {

		if(data.type === "all traps"){
			var traps = data.traps;
			for(let key in traps){
				let trap = traps[key];
				$("#game").prepend("<img src='./graphics/honey.png' class='trap' style='position:absolute;left:"+(trap["x"]-75)+";top:"+(trap["y"]-75)+";' id='trap_"+trap['x']+"x"+trap['y']+"'>");
			}//adding all traps

		}else if(data.type === "all feeds"){
			var allfeeds = data.data;
			for(let key in allfeeds){
				let feed = allfeeds[key];
				let half;
				if(feed["n"] === "1" || feed["n"] === "2"){half=12;}else if(feed["n"] === "3" || feed["n"] === "4"){half=25;}
				let cssleft = feed["x"] - half;
				let csstop = feed["y"] - half;
				$("#game").prepend("<img class='feed' src='./graphics/feed"+feed['n']+".png' style='position:absolute;left:"+cssleft+";top:"+csstop+";' id='feed_"+feed['x']+"x"+feed['y']+"'>");
			}

		}else if(data.type === "game details"){
			$("body").css({"width": data.width, "height": data.height});
			draw_canvas(data.width, data.height);
			attack_range = data.attack_range;
			if(!data.game_is_ready){return;}
			console.log("4");
			socket.emit("get traps", "");
			socket.emit("get feeds", "");
			socket.emit("get players", "");
			lastSeconds = data.gameDuration - Math.round( new Date().getTime()/1000 ) + data.roundStart - 10;
			countdown();

		}else if(data.type === "player list"){
			player_details = data.players;
			for(let i in player_details){
				if(player_details[i]['dead']){continue;}
				if(player_details[i]['id'] === charId){
					$('#playagaindiv').remove();
					charleft = player_details[i]['x'];
					chartop = player_details[i]['y'];

					kills = player_details[i]['kills'];
					deaths = player_details[i]['deaths'];

					$("#kills_number").html(kills);
					$("#deaths_number").html(deaths);

					health = player_details[i]['health'];
					energy = player_details[i]['energy'];

					let scrollLeft = charleft - charhalfwidth - $(window).width()/2;
					if(scrollLeft < 0){scrollLeft = 0;}
					let scrollTop = chartop - charhalfheight - $(window).height()/2 + 100;
					if(scrollTop < 0){scrollTop = 0;}
					$(document).scrollTop(scrollTop);
					$(document).scrollLeft(scrollLeft);

					$("#health_percentage").css({"width": Math.floor(health/maxhealth*100)+"%"});
					$("#energy_percentage").css({"width": Math.floor(energy/maxhealth*100)+"%"});

					dead = 0;
				}//player is this

				$("#game").append("<div class='warrior_frame' id='player"+player_details[i]['id']+"'><div class='warrior_nickname'>"+player_details[i]['name']+"<div class='player_health' style='width:"+Math.floor(player_details[i]['health']/maxhealth*50)+"px;height:3px;background-color:red;margin-bottom:3px;'>&nbsp;</div></div><div class='warrior_gif' style='background-image:url(./graphics/fly"+player_details[i]['skin']+".png);'></div></div>");
				$("#player" + player_details[i]['id']).css({'left': player_details[i]['x'] - charhalfwidth, 'top': player_details[i]['y'] - charhalfheight});
				i++;
			}//all players of associative array

			if(typeof charId === "undefined"){
				username = prompt("Enter a username");
				socket.emit("join", {"name": username});
			}else{
				$("#game").append("<div id='playagaindiv' style='position:fixed;width:500px;height:auto;left:"+($(window).width()/2-250)+";top:"+($(window).height()/2-250)+";background-color:rgb(240,240,240);border-radius:15px;'><center style='margin-top:15px;margin-bottom:15px;font-size:19px;font-weight:bolder;'>You have been killed!</center><center style='font-size:16px;'>We suggest you to be reborn and revenge!</center><center style='margin-top:15px;margin-bottom:15px;'><a href=\"javascript:socket.emit('play again', {'code':code});$('#playagaindiv').remove();\" style='padding-left:10px;padding-right:10px;padding-top:5px;padding-bottom:5px;background-color:#dcdcdc;border-radius:15px;font-size:16px;text-decoration:none;color:#000;font-weight:bolder;'>Play Again</a></center></div>");
			}//if born and died

			players_loaded = 1;

		}else if(data.type === "after attack"){

		}else if(data.type === "score board"){
			open_score_board(data.ranking_players, data.game_is_ready);

		}else if(data.type === "welcome"){
			secret_key = data.secret_key;
			charId = data.id;
			console.log(secret_key);
			console.log(charId);
		}//message TYPE
	});

	socket.on("new player",function(player_details){
		console.log("new player: " + player_details['id']);
		if(player_details['id'] === charId){

			$('#playagaindiv').remove();
			charleft = player_details['x'];
			chartop = player_details['y'];

			kills = player_details['kills'];
			deaths = player_details['deaths'];

			$("#kills_number").html(kills);
			$("#deaths_number").html(deaths);

			health = player_details['health'];
			energy = player_details['energy'];

			var scrollLeft = charleft - charhalfwidth - $(window).width()/2;
			if(scrollLeft < 0){scrollLeft = 0;}
			var scrollTop = chartop - charhalfheight-$(window).height()/2 + 100;
			if(scrollTop < 0){scrollTop = 0;}
			$(document).scrollTop(scrollTop);
			$(document).scrollLeft(scrollLeft);

			$("#health_percentage").css({"width": Math.floor(health/maxhealth*100)+"%"});
			$("#energy_percentage").css({"width": Math.floor(energy/maxenergy*100)+"%"});

			dead = 0;
		}//player is this

		$("#game").append("<div class='warrior_frame' id='player"+player_details['id']+"' style=\"left:"+(player_details['x']-charhalfwidth)+"px;top:"+(player_details['y']-charhalfheight)+"px;\"><div class='warrior_nickname'>"+player_details['name']+"<div class='player_health' style='width:"+Math.floor(player_details['health']/maxhealth*50)+"px;height:3px;background-color:red;margin-bottom:3px;'>&nbsp;</div></div><div class='warrior_gif' style='background-image:url(./graphics/fly"+player_details['skin']+".png);'></div></div>");
	});

	socket.on("new position", data => {
		if(!players_loaded){return;}
		$('#player'+data.id).find('.warrior_gif').css({'transform': 'rotate(-'+data.angle+'deg)'});

		if(data.id === charId){
			charleft = data.charleft;
			chartop = data.chartop;
			let scrollLeft = charleft - charhalfwidth - $(window).width()/2;
			if(scrollLeft < 0){scrollLeft = 0;}
			let scrollTop = chartop - charhalfheight - $(window).height()/2 + 100;
			if(scrollTop < 0){scrollTop = 0;}
			animate_scroll(scrollLeft, scrollTop, sensitivity);
		}//if new position belongs to this player

		animate_player('player' + data.id, data.charleft, data.chartop, sensitivity);
	});
});