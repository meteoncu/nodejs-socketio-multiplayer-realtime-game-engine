/* Bu kod jquery animate fonksiyonları tatmin edici olmadığından Mete Öncü tarafından yazılmıştır. */

function animate_scroll(theleft, thetop, time){
    let repeats = 5;

    let current_scrollTop = $(document).scrollTop();
    let current_scrollLeft = $(document).scrollLeft();

    let diftop = thetop-current_scrollTop;
    let difleft = theleft-current_scrollLeft;

    if(diftop ===0 && difleft === 0){return;}
    let incrtop_in_eachsec = diftop / (time/repeats);
    let incrleft_in_eachsec = difleft / (time/repeats);

    for(let i=1 ; i <= time/repeats; i++){
        let newtop = current_scrollTop + incrtop_in_eachsec*i;
        let newleft = current_scrollLeft + incrleft_in_eachsec*i;
        setTimeout(() => {
            $(document).scrollTop(newtop);$(document).scrollLeft(newleft);
            },i * repeats);
    }
}//end of function