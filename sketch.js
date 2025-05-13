// Game variables
let canvasWidth = 800; // Default width
let canvasHeight = 450; // Default height
let ball, playerMal, playerEvie;
let paddleSound;
let scoreSound;
let gameOver = false;
let winner = '';
let fireworks = [];

// Add a character selection screen
let characterSelection = true;
let characters = [
  { name: 'Mal', color: '#7731A0' },
  { name: 'Evie', color: '#4169E1' },
  { name: 'Jay', color: '#FFD700' },
  { name: 'Uma', color: '#00008B' },
  { name: 'Gil', color: '#FFA500' },
  { name: 'Carlos', color: '#FFFFFF' } // Added Carlos (white)
];
let selectedCharacters = { player1: null, player2: null };

function Firework(x, y, color) {
  this.x = x;
  this.y = y;
  this.color = color;
  this.particles = [];
  for (let i = 0; i < 50; i++) {
    this.particles.push({
      x: this.x,
      y: this.y,
      speedX: random(-2, 2),
      speedY: random(-2, 2),
      alpha: 255
    });
  }

  this.update = function () {
    for (let p of this.particles) {
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha -= 5;
    }
    this.particles = this.particles.filter(p => p.alpha > 0);
  };

  this.show = function () {
    noStroke();
    for (let p of this.particles) {
      fill(red(this.color), green(this.color), blue(this.color), p.alpha);
      circle(p.x, p.y, 5);
    }
  };
}

function drawFireworks() {
  for (let firework of fireworks) {
    firework.update();
    firework.show();
  }
  fireworks = fireworks.filter(f => f.particles.length > 0);
}

function preload() {
  soundFormats('mp3');
  paddleSound = loadSound('sounds/539437__lord-imperor__table-whack.mp3');
  scoreSound = loadSound('sounds/546163__sieuamthanh__wa-dealio-12.wav');
}

function drawCharacterSelection() {
  background('#143025');
  textSize(32);
  fill('#FFFFFF');
  textAlign(CENTER, CENTER);
  text('Player 1: Select Your Character', canvasWidth / 2, canvasHeight * 0.2);

  let xOffset = canvasWidth / (characters.length + 1);
  for (let i = 0; i < characters.length; i++) {
    let char = characters[i];
    fill(char.color);
    rect(xOffset * (i + 1) - 50, canvasHeight * 0.4 - 50, 100, 100, 10);
    fill('#FFFFFF');
    textSize(16);
    text(char.name, xOffset * (i + 1), canvasHeight * 0.4 + 70);
  }

  if (selectedCharacters.player1) {
    text('Player 2: Select Your Character', canvasWidth / 2, canvasHeight * 0.6);
    for (let i = 0; i < characters.length; i++) {
      let char = characters[i];
      fill(char.color);
      rect(xOffset * (i + 1) - 50, canvasHeight * 0.8 - 50, 100, 100, 10);
      fill('#FFFFFF');
      textSize(16);
      text(char.name, xOffset * (i + 1), canvasHeight * 0.8 + 70);
    }
  }
}

function mousePressed() {
  if (characterSelection) {
    let xOffset = canvasWidth / (characters.length + 1);
    for (let i = 0; i < characters.length; i++) {
      let char = characters[i];
      let x = xOffset * (i + 1) - 50;
      let y = selectedCharacters.player1 ? canvasHeight * 0.8 - 50 : canvasHeight * 0.4 - 50;
      if (
        mouseX > x && mouseX < x + 100 &&
        mouseY > y && mouseY < y + 100
      ) {
        if (!selectedCharacters.player1) {
          selectedCharacters.player1 = char;
        } else if (!selectedCharacters.player2) {
          selectedCharacters.player2 = char;
          characterSelection = false;
          setupGameElements();
        }
      }
    }
  }
}

function setupGameElements() {
  canvasWidth = windowWidth * 0.8;
  canvasHeight = windowHeight * 0.56; // 20% less than 0.7
  if (canvasWidth < 500) canvasWidth = 500;
  if (canvasHeight < 320) canvasHeight = 320;

  ball = {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    size: Math.min(canvasWidth, canvasHeight) * 0.07, // 7% of smaller dimension
    speedX: canvasWidth * 0.004,
    speedY: canvasHeight * 0.003,
    color: '#B026FF'
  };

  let paddleWidth = canvasWidth * 0.035;
  let paddleHeight = canvasHeight * 0.27;
  let paddleSpeed = canvasHeight * 0.012;

  playerMal = {
    x: paddleWidth + 10,
    y: canvasHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: paddleSpeed,
    color: selectedCharacters.player1 ? selectedCharacters.player1.color : '#FFFFFF',
    score: 0
  };

  playerEvie = {
    x: canvasWidth - paddleWidth - 10,
    y: canvasHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: paddleSpeed,
    color: selectedCharacters.player2 ? selectedCharacters.player2.color : '#FFFFFF',
    score: 0
  };
}

// Modify ball color based on its position
function updateBallColor() {
  if (ball.x < canvasWidth / 2) {
    ball.color = playerMal.color; // Player 1's color
  } else {
    ball.color = playerEvie.color; // Player 2's color
  }
}

// Adjust paddle size after each point
function adjustPaddleSize() {
  let minHeight = canvasHeight * 0.135; // 50% of initial height
  let decrement = (playerMal.height - minHeight) / 5; // Decrease size over 5 points

  playerMal.height = Math.max(minHeight, playerMal.height - decrement);
  playerEvie.height = Math.max(minHeight, playerEvie.height - decrement);
}

// Slow down ball after a point is scored
function slowDownBall() {
  ball.speedX *= 0.5;
  ball.speedY *= 0.5;
}

// Add spin to the ball based on collision angle
function calculateBounceAngle(ballY, paddleY, paddleHeight) {
  let relativeIntersectY = paddleY - ballY;
  let normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
  let bounceAngle = normalizedIntersectY * canvasHeight * 0.01;

  // Add spin effect
  ball.speedY += normalizedIntersectY * canvasHeight * 0.002;

  return bounceAngle;
}

// Add touch controls for mobile devices
function setupTouchControls() {
  const canvas = document.querySelector('canvas');

  let touchStartY = null;
  canvas.addEventListener('touchstart', (event) => {
    touchStartY = event.touches[0].clientY;
  });

  canvas.addEventListener('touchmove', (event) => {
    const touchCurrentY = event.touches[0].clientY;
    const deltaY = touchCurrentY - touchStartY;

    if (deltaY > 0) {
      // Move paddle down
      if (playerMal.y < canvasHeight - playerMal.height / 2) {
        playerMal.y += playerMal.speed;
      }
    } else {
      // Move paddle up
      if (playerMal.y > playerMal.height / 2) {
        playerMal.y -= playerMal.speed;
      }
    }

    touchStartY = touchCurrentY;
  });
}

// p5.js setup function - runs once at the beginning
function setup() {
  setupGameElements(); // Ensure canvas dimensions are set
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('game-container');
  setupTouchControls();
}

// p5.js draw function - loops continuously for animation
function draw() {
  if (characterSelection) {
    drawCharacterSelection();
    return;
  }

  if (gameOver) {
    background('#143025');
    textSize(48);
    fill('#FFD700');
    textAlign(CENTER, CENTER);
    text(winner + ' wins!', canvasWidth / 2, canvasHeight / 2);
    textSize(24);
    fill('#FFFFFF');
    text('Press Z to restart', canvasWidth / 2, canvasHeight / 2 + 60);

    // Trigger fireworks
    if (fireworks.length === 0) {
      for (let i = 0; i < 5; i++) {
        fireworks.push(new Firework(random(canvasWidth), random(canvasHeight / 2), color(winner === selectedCharacters.player1.name ? playerMal.color : playerEvie.color)));
      }
    }

    drawFireworks();
    return;
  }

  // Draw enchanted forest background
  background('#143025'); // Dark forest green
  
  // Draw magical sparkles
  for (let i = 0; i < 20; i++) {
    fill(255, 255, 255, 100);
    circle(random(canvasWidth), random(canvasHeight), random(2, 4));
  }
  
  // Draw the scoreboard
  textSize(24);
  fill(playerMal.color); // Player 1's color
  text(selectedCharacters.player1.name + ': ' + playerMal.score, canvasWidth * 0.15, canvasHeight * 0.08);
  fill(playerEvie.color); // Player 2's color
  text(selectedCharacters.player2.name + ': ' + playerEvie.score, canvasWidth * 0.6, canvasHeight * 0.08);
  
  // Draw the middle line
  stroke(255, 255, 255, 100);
  strokeWeight(2);
  line(canvasWidth / 2, 0, canvasWidth / 2, canvasHeight);
  noStroke();
  
  // Draw the magical ball
  fill(ball.color);
  circle(ball.x, ball.y, ball.size);
  
  // Add a magical glow effect to the ball
  fill(255, 255, 255, 50);
  circle(ball.x, ball.y, ball.size + 10);
  
  // Move the ball
  ball.x += ball.speedX;
  ball.y += ball.speedY;
  
  // Ball bounces off top and bottom
  if (ball.y <= ball.size / 2 || ball.y >= canvasHeight - ball.size / 2) {
    ball.speedY *= -1;
    playBounceSound();
  }
  
  // Check if player scored
  if (ball.x < 0) {
    // Player 2 scores
    playerEvie.score += 1;
    playScoreSound();
    adjustPaddleSize();
    slowDownBall();
    if (playerEvie.score >= 5) {
      gameOver = true;
      winner = selectedCharacters.player2.name;
    } else {
      resetBall("evie");
    }
  } else if (ball.x > canvasWidth) {
    // Player 1 scores
    playerMal.score += 1;
    playScoreSound();
    adjustPaddleSize();
    slowDownBall();
    if (playerMal.score >= 5) {
      gameOver = true;
      winner = selectedCharacters.player1.name;
    } else {
      resetBall("mal");
    }
  }
  
  // Draw Player 1's paddle (left player)
  fill(playerMal.color);
  rect(playerMal.x, playerMal.y - playerMal.height / 2, playerMal.width, playerMal.height, 10);
  
  // Draw Player 2's paddle (right player)
  fill(playerEvie.color);
  rect(playerEvie.x - playerEvie.width, playerEvie.y - playerEvie.height / 2, playerEvie.width, playerEvie.height, 10);
  
  // Move Player 1's paddle with W and S keys
  if (keyIsDown(87) && playerMal.y > playerMal.height / 2) { // W key
    playerMal.y -= playerMal.speed;
  }
  
  if (keyIsDown(83) && playerMal.y < canvasHeight - playerMal.height / 2) { // S key
    playerMal.y += playerMal.speed;
  }
  
  // Move Player 2's paddle with UP and DOWN arrow keys
  if (keyIsDown(UP_ARROW) && playerEvie.y > playerEvie.height / 2) {
    playerEvie.y -= playerEvie.speed;
  }
  
  if (keyIsDown(DOWN_ARROW) && playerEvie.y < canvasHeight - playerEvie.height / 2) {
    playerEvie.y += playerEvie.speed;
  }
  
  // Check for ball hitting Player 1's paddle (left)
  if (ball.x - ball.size / 2 <= playerMal.x + playerMal.width && 
      ball.y >= playerMal.y - playerMal.height / 2 && 
      ball.y <= playerMal.y + playerMal.height / 2 &&
      ball.x > playerMal.x) {
    
    ball.speedX = Math.abs(ball.speedX) + canvasWidth * 0.0005; // Make it go right and slightly faster
    ball.x = playerMal.x + playerMal.width + ball.size / 2; // Prevent sticking
    
    // Change the angle based on where it hit the paddle
    let angle = calculateBounceAngle(ball.y, playerMal.y, playerMal.height);
    ball.speedY = angle;
    
    // Add magical effect
    showMagicEffect(ball.x, ball.y, playerMal.color);
    playBounceSound();
  }
  
  // Check for ball hitting Player 2's paddle (right)
  if (ball.x + ball.size / 2 >= playerEvie.x - playerEvie.width && 
      ball.y >= playerEvie.y - playerEvie.height / 2 && 
      ball.y <= playerEvie.y + playerEvie.height / 2 &&
      ball.x < playerEvie.x) {
    
    ball.speedX = -Math.abs(ball.speedX) - canvasWidth * 0.0005; // Make it go left and slightly faster
    ball.x = playerEvie.x - playerEvie.width - ball.size / 2; // Prevent sticking
    
    // Change the angle based on where it hit the paddle
    let angle = calculateBounceAngle(ball.y, playerEvie.y, playerEvie.height);
    ball.speedY = angle;
    
    // Add magical effect
    showMagicEffect(ball.x, ball.y, playerEvie.color);
    playBounceSound();
  }

  updateBallColor();
  drawFireworks();
}

// Reset the ball after scoring
function resetBall(lastScorer) {
  ball.x = canvasWidth / 2;
  ball.y = canvasHeight / 2;
  
  // Give the ball a random angle but ensure it goes toward the player who just lost
  ball.speedY = random(-canvasHeight * 0.007, canvasHeight * 0.007);
  
  if (lastScorer === "mal") {
    ball.speedX = canvasWidth * 0.004; // Move toward Player 2
  } else {
    ball.speedX = -canvasWidth * 0.004; // Move toward Player 1
  }
}

// Show magical effect when ball hits paddle
function showMagicEffect(x, y, color) {
  // This is a placeholder - in a full game you might add particle effects here
  // For now we'll rely on the ball's glow effect
}

// Placeholder for sound effects
function playBounceSound() {
  if (paddleSound && paddleSound.isLoaded()) {
    paddleSound.play();
  }
}

function playScoreSound() {
  if (scoreSound && scoreSound.isLoaded()) {
    scoreSound.play();
  }
}

function keyPressed() {
  if (gameOver && (key === 'z' || key === 'Z')) {
    playerMal.score = 0;
    playerEvie.score = 0;
    gameOver = false;
    winner = '';
    characterSelection = true;
    selectedCharacters = { player1: null, player2: null };
  }
}

function windowResized() {
  setupGameElements();
  resizeCanvas(canvasWidth, canvasHeight);
}