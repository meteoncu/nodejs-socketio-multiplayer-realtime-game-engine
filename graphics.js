function draw_canvas(width, height) {
  const canvas = document.getElementById('gameCanvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Use requestAnimationFrame for better performance and smoother animation
  //requestAnimationFrame(animate);
}

$(document).ready(function(){

  function animate() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background
    //drawBackground();

    // Draw the characters
    //drawPlayers();

    // Draw the feeds
    //drawFeeds();

    // Draw the traps
    //drawTraps();

  }

  /*
  function drawCharacterWithAccessory(baseCharacter, accessory, frameIndex, x, y) {
    // Draw the base character frame
    ctx.drawImage(
      baseCharacter.image,
      baseCharacter.frameWidth * frameIndex,
      0,
      baseCharacter.frameWidth,
      baseCharacter.frameHeight,
      x,
      y,
      baseCharacter.frameWidth,
      baseCharacter.frameHeight
    );

    // Draw the accessory frame
    ctx.drawImage(
      accessory.image,
      accessory.frameWidth * frameIndex,
      0,
      accessory.frameWidth,
      accessory.frameHeight,
      x,
      y,
      accessory.frameWidth,
      accessory.frameHeight
    );
  }
  */
});