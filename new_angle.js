function new_angle(){

	if(!dead){
		socket.emit("new angle",{"secret": secret_key, "mouse_left": mouse_left, "mouse_top": mouse_top});
	}//if player details are loaded

	setTimeout(() => {new_angle();},sensitivity);
}//end of function