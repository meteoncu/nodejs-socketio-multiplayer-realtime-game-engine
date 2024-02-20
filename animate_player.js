/* Bu kod jquery animate fonksiyonları tatmin edici olmadığından Mete Öncü tarafından yazılmıştır. */

let animations = [];
let animate_number = 0;
function animate_player(divid,theleft,thetop,time){

animate_number = animate_number+1;
animations[divid] = animate_number;

let position = $("#"+divid).offset();

let diftop = thetop-(position.top+charhalfheight);
let difleft = theleft-(position.left+charhalfwidth);

let topmark;
let leftmark;
if(diftop<0){topmark = "-=";diftop = diftop*(-1);}else{topmark = "+=";}
if(difleft<0){leftmark = "-=";difleft = difleft*(-1);}else{leftmark = "+=";}

let incrtop_in_eachsec = diftop / (time/animate_repeats);
let incrleft_in_eachsec = difleft / (time/animate_repeats);

for(i=1;i<=time/animate_repeats;i++){
    setTimeout(() => {
        if(animations['"+divid+"'] !== "+animate_number+"){return;}
        $('#'+divid).css({top:topmark+incrtop_in_eachsec+'px', 'left': leftmark+incrleft_in_eachsec+'px'});
    },i*animate_repeats);
}

}//end of function

function stop_animation(divid){
    animations[divid] = 0;
}//end of function