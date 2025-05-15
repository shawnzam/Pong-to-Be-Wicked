/**
 * Descendants Magic Pong - Main Game Script
 * @fileoverview Main logic for Descendants Magic Pong, a p5.js game.
 * @author Shawn
 */

// Game variables
let canvasWidth = 800; // Default width
let canvasHeight = 450; // Default height
/** @type {Object} ball - The ball object */
let ball;
/** @type {Array<Object>} players - Array of player paddle objects */
let players;
let paddleSound;
let scoreSound;
let gameOver = false;
let winner = '';
let fireworks = [];

// Game mode and character selection
let modeSelection = true;
let onePlayerMode = false;
let characterSelection = false;
/**
 * List of available characters
 * @type {Array<{name: string, color: string}>}
 */
let characters = [
  { name: 'Mal', color: '#7731A0' },
  { name: 'Evie', color: '#4169E1' },
  { name: 'Jay', color: '#FFD700' },
  { name: 'Uma', color: '#00008B' },
  { name: 'Gil', color: '#FFA500' },
  { name: 'Carlos', color: '#FFFFFF' } // Added Carlos (white)
];
/**
 * Selected characters for each player
 * @type {{player1: Object|null, player2: Object|null}}
 */
let selectedCharacters = { player1: null, player2: null };

/**
 * Firework effect for win screen
 * @constructor
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} color - Color string
 */
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

/**
 * Draw all fireworks and update their state
 */
function drawFireworks() {
  for (let firework of fireworks) {
    firework.update();
    firework.show();
  }
  fireworks = fireworks.filter(f => f.particles.length > 0);
}

/**
 * Preload sound assets
 */
function preload() {
  soundFormats('mp3');
  paddleSound = loadSound('sounds/539437__lord-imperor__table-whack.mp3');
  scoreSound = loadSound('sounds/546163__sieuamthanh__wa-dealio-12.wav');
}

/**
 * Draw a unique icon for each character.
 * @param {string} name - Character name
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - Icon size
 */
function drawCharacterIcon(name, x, y, size) {
  push();
  translate(x, y);
  noStroke();
  switch (name) {
    case 'Mal':
      // Mal: purple star
      fill('#7731A0');
      beginShape();
      for (let i = 0; i < 10; i++) {
        let angle = i * PI / 5;
        let r = i % 2 === 0 ? size * 0.5 : size * 0.2;
        vertex(r * cos(angle), r * sin(angle));
      }
      endShape(CLOSE);
      break;
    case 'Evie':
      // Evie: blue crown
      fill('#4169E1');
      beginShape();
      vertex(-size * 0.3, size * 0.2);
      vertex(-size * 0.2, -size * 0.2);
      vertex(0, size * 0.1 - size * 0.3);
      vertex(size * 0.2, -size * 0.2);
      vertex(size * 0.3, size * 0.2);
      vertex(0, size * 0.3);
      endShape(CLOSE);
      break;
    case 'Jay':
      // Jay: gold lightning bolt
      fill('#FFD700');
      beginShape();
      vertex(-size * 0.15, -size * 0.2);
      vertex(size * 0.05, 0);
      vertex(-size * 0.05, 0);
      vertex(size * 0.15, size * 0.2);
      vertex(0, 0.05 * size);
      vertex(size * 0.1, -size * 0.1);
      vertex(-size * 0.1, -size * 0.1);
      endShape(CLOSE);
      break;
    case 'Uma':
      // Uma: dark blue trident
      fill('#00008B');
      rect(-size * 0.05, -size * 0.2, size * 0.1, size * 0.4, 3);
      rect(-size * 0.18, -size * 0.18, size * 0.08, size * 0.18, 2);
      rect(size * 0.1, -size * 0.18, size * 0.08, size * 0.18, 2);
      rect(-size * 0.04, -size * 0.3, size * 0.08, size * 0.1, 2);
      break;
    case 'Gil':
      // Gil: orange shield
      fill('#FFA500');
      beginShape();
      vertex(0, -size * 0.2);
      bezierVertex(size * 0.2, -size * 0.1, size * 0.2, size * 0.2, 0, size * 0.3);
      bezierVertex(-size * 0.2, size * 0.2, -size * 0.2, -size * 0.1, 0, -size * 0.2);
      endShape(CLOSE);
      break;
    case 'Carlos':
      // Carlos: white paw print
      fill(255);
      ellipse(0, 0, size * 0.35, size * 0.28);
      ellipse(-size * 0.13, -size * 0.13, size * 0.12, size * 0.12);
      ellipse(size * 0.13, -size * 0.13, size * 0.12, size * 0.12);
      ellipse(-size * 0.08, size * 0.1, size * 0.09, size * 0.09);
      ellipse(size * 0.08, size * 0.1, size * 0.09, size * 0.09);
      break;
    default:
      // Default: colored circle
      fill(200);
      ellipse(0, 0, size * 0.7, size * 0.7);
  }
  pop();
}

/**
 * Draw the character selection screen
 */
function drawCharacterSelection() {
  background('#143025');
  textSize(windowWidth < 700 ? 22 : 32);
  fill('#FFFFFF');
  textAlign(CENTER, CENTER);
  let isMobile = windowWidth < 700;
  let iconSize = isMobile ? 48 : 100;
  let labelOffset = isMobile ? 32 : 70;
  let xOffset = canvasWidth / (characters.length + 1);

  // Always keep selection grid at the top for both players
  let selectionTitleY = canvasHeight * 0.08;
  let gridStartY = canvasHeight * 0.15;

  if (!selectedCharacters.player1) {
    text('Player 1: Tap your favorite Descendant!', canvasWidth / 2, selectionTitleY);
    if (isMobile) {
      let cols = 3;
      let rows = Math.ceil(characters.length / cols);
      let gridW = canvasWidth * 0.92;
      let gridH = canvasHeight * 0.38;
      let cellW = gridW / cols;
      let cellH = gridH / rows;
      let startX = (canvasWidth - gridW) / 2;
      let startY = gridStartY;
      for (let i = 0; i < characters.length; i++) {
        let col = i % cols;
        let row = Math.floor(i / cols);
        let x = startX + col * cellW + cellW / 2;
        let y = startY + row * cellH + cellH / 2;
        let char = characters[i];
        fill(char.color);
        rect(x - iconSize / 2, y - iconSize / 2, iconSize, iconSize, 10);
        drawCharacterIcon(char.name, x, y, iconSize * 0.6);
        fill('#FFFFFF');
        textSize(11);
        text(char.name, x, y + labelOffset * 0.6);
      }
    } else {
      for (let i = 0; i < characters.length; i++) {
        let char = characters[i];
        fill(char.color);
        rect(xOffset * (i + 1) - iconSize / 2, gridStartY + iconSize / 2 - iconSize / 2, iconSize, iconSize, 10);
        drawCharacterIcon(char.name, xOffset * (i + 1), gridStartY + iconSize / 2, iconSize * 0.6);
        fill('#FFFFFF');
        textSize(16);
        text(char.name, xOffset * (i + 1), gridStartY + iconSize / 2 + labelOffset);
      }
    }
  } else {
    text('Player 2: Tap your favorite Descendant!', canvasWidth / 2, selectionTitleY);
    if (isMobile) {
      let cols = 3;
      let rows = Math.ceil(characters.length / cols);
      let gridW = canvasWidth * 0.92;
      let gridH = canvasHeight * 0.38;
      let cellW = gridW / cols;
      let cellH = gridH / rows;
      let startX = (canvasWidth - gridW) / 2;
      let startY = gridStartY;
      for (let i = 0; i < characters.length; i++) {
        let col = i % cols;
        let row = Math.floor(i / cols);
        let x = startX + col * cellW + cellW / 2;
        let y = startY + row * cellH + cellH / 2;
        let char = characters[i];
        fill(char.color);
        rect(x - iconSize / 2, y - iconSize / 2, iconSize, iconSize, 10);
        drawCharacterIcon(char.name, x, y, iconSize * 0.6);
        fill('#FFFFFF');
        textSize(11);
        text(char.name, x, y + labelOffset * 0.6);
      }
    } else {
      for (let i = 0; i < characters.length; i++) {
        let char = characters[i];
        fill(char.color);
        rect(xOffset * (i + 1) - iconSize / 2, gridStartY + iconSize / 2 - iconSize / 2, iconSize, iconSize, 10);
        drawCharacterIcon(char.name, xOffset * (i + 1), gridStartY + iconSize / 2, iconSize * 0.6);
        fill('#FFFFFF');
        textSize(16);
        text(char.name, xOffset * (i + 1), gridStartY + iconSize / 2 + labelOffset);
      }
    }
  }
}

/**
 * Handle mouse presses for mode/character selection
 */
function mousePressed() {
  if (modeSelection) {
    let btnW = canvasWidth * 0.5;
    let btnH = canvasHeight * 0.12;
    let btnY1 = canvasHeight * 0.38;
    let btnY2 = canvasHeight * 0.55;
    if (
      mouseX > (canvasWidth - btnW) / 2 && mouseX < (canvasWidth + btnW) / 2 &&
      mouseY > btnY1 && mouseY < btnY1 + btnH
    ) {
      onePlayerMode = true;
      modeSelection = false;
      characterSelection = true;
      selectedCharacters = { player1: null, player2: null };
      return;
    }
    if (
      mouseX > (canvasWidth - btnW) / 2 && mouseX < (canvasWidth + btnW) / 2 &&
      mouseY > btnY2 && mouseY < btnY2 + btnH
    ) {
      onePlayerMode = false;
      modeSelection = false;
      characterSelection = true;
      selectedCharacters = { player1: null, player2: null };
      return;
    }
    return;
  }

  if (characterSelection) {
    let isMobile = windowWidth < 700;
    if (isMobile) {
      // Mobile: grid selection
      let cols = 3;
      let rows = Math.ceil(characters.length / cols);
      let gridW = canvasWidth * 0.92;
      let gridH = canvasHeight * 0.38;
      let cellW = gridW / cols;
      let cellH = gridH / rows;
      let startX = (canvasWidth - gridW) / 2;
      let startY = canvasHeight * 0.22;
      let yOffset = startY;
      for (let i = 0; i < characters.length; i++) {
        let col = i % cols;
        let row = Math.floor(i / cols);
        let x = startX + col * cellW + cellW / 2;
        let y = yOffset + row * cellH + cellH / 2;
        if (
          mouseX > x - cellW / 2 && mouseX < x + cellW / 2 &&
          mouseY > y - cellH / 2 && mouseY < y + cellH / 2
        ) {
          if (!selectedCharacters.player1) {
            selectedCharacters.player1 = characters[i];
          } else if (!selectedCharacters.player2) {
            selectedCharacters.player2 = characters[i];
            characterSelection = false;
            setupGameElements();
          }
        }
      }
    } else {
      // Desktop: single row at the top
      let xOffset = canvasWidth / (characters.length + 1);
      let iconSize = 100;
      let gridStartY = canvasHeight * 0.15;
      let y = gridStartY + iconSize / 2 - iconSize / 2;
      for (let i = 0; i < characters.length; i++) {
        let x = xOffset * (i + 1) - iconSize / 2;
        if (
          mouseX > x && mouseX < x + iconSize &&
          mouseY > y && mouseY < y + iconSize
        ) {
          if (!selectedCharacters.player1) {
            selectedCharacters.player1 = characters[i];
          } else if (!selectedCharacters.player2) {
            selectedCharacters.player2 = characters[i];
            characterSelection = false;
            setupGameElements();
          }
        }
      }
    }
  }
}

/**
 * Set up all game elements and paddles
 */
function setupGameElements() {
  const maxW = 900;
  const maxH = 540; // Reduce vertical height for desktop to avoid scrolling
  let w = window.innerWidth;
  let h = window.innerHeight;
  let aspect = 3 / 2;

  // Prefer landscape, but handle portrait gracefully
  if (w / h > aspect) {
    canvasHeight = Math.min(h * 0.98, maxH);
    canvasWidth = canvasHeight * aspect;
  } else {
    canvasWidth = Math.min(w * 0.98, maxW);
    canvasHeight = canvasWidth / aspect;
  }

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

  players = [
    {
      x: paddleWidth + 10,
      y: canvasHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: paddleSpeed,
      color: selectedCharacters.player1 ? selectedCharacters.player1.color : '#FFFFFF',
      score: 0
    },
    {
      x: canvasWidth - paddleWidth - 10,
      y: canvasHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: paddleSpeed,
      color: selectedCharacters.player2 ? selectedCharacters.player2.color : '#FFFFFF',
      score: 0
    }
  ];
}

/**
 * Update the ball's color based on its position
 */
function updateBallColor() {
  if (ball.x < canvasWidth / 2) {
    ball.color = players[0].color; // Player 1's color
  } else {
    ball.color = players[1].color; // Player 2's color
  }
}

/**
 * Adjust paddle size after each point
 */
function adjustPaddleSize() {
  let minHeight = canvasHeight * 0.135; // 50% of initial height
  let decrement = (players[0].height - minHeight) / 5; // Decrease size over 5 points

  players[0].height = Math.max(minHeight, players[0].height - decrement);
  players[1].height = Math.max(minHeight, players[1].height - decrement);
}

/**
 * Slow down the ball after a point is scored
 */
function slowDownBall() {
  ball.speedX *= 0.5;
  ball.speedY *= 0.5;
}

/**
 * Calculate the bounce angle for the ball
 * @param {number} ballY
 * @param {number} paddleY
 * @param {number} paddleHeight
 * @returns {number}
 */
function calculateBounceAngle(ballY, paddleY, paddleHeight) {
  let relativeIntersectY = paddleY - ballY;
  let normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
  let bounceAngle = normalizedIntersectY * canvasHeight * 0.01;

  ball.speedY += normalizedIntersectY * canvasHeight * 0.002;

  return bounceAngle;
}

/**
 * Set up touch controls for mobile
 */
function setupTouchControls() {
  let touchStartX = null;
  let touchStartY = null;
  let activePlayer = null;

  window.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = document.querySelector('canvas').getBoundingClientRect();
      touchStartX = touch.clientX - rect.left;
      touchStartY = touch.clientY - rect.top;
      activePlayer = (touchStartX < canvasWidth / 2) ? 0 : 1;
    }
    event.preventDefault();
  }, { passive: false });

  window.addEventListener('touchmove', (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = document.querySelector('canvas').getBoundingClientRect();
      const touchCurrentY = touch.clientY - rect.top;
      const deltaY = touchCurrentY - touchStartY;
      if (activePlayer === 0) {
        if (deltaY > 0 && players[0].y < canvasHeight - players[0].height / 2) {
          players[0].y += players[0].speed;
        } else if (deltaY < 0 && players[0].y > players[0].height / 2) {
          players[0].y -= players[0].speed;
        }
      } else if (activePlayer === 1) {
        if (deltaY > 0 && players[1].y < canvasHeight - players[1].height / 2) {
          players[1].y += players[1].speed;
        } else if (deltaY < 0 && players[1].y > players[1].height / 2) {
          players[1].y -= players[1].speed;
        }
      }
      touchStartY = touchCurrentY;
    }
    event.preventDefault();
  }, { passive: false });
}

/**
 * p5.js setup function - runs once at the beginning
 */
function setup() {
  setupGameElements();
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('game-container');
  setupTouchControls();
}

/**
 * p5.js draw function - main game loop
 */
function draw() {
  if (modeSelection) {
    background('#143025');
    textSize(windowWidth < 700 ? 28 : 40);
    fill('#FFFFFF');
    textAlign(CENTER, CENTER);
    text('Select Game Mode', canvasWidth / 2, canvasHeight * 0.22);
    textSize(windowWidth < 700 ? 22 : 32);
    let btnW = canvasWidth * 0.5;
    let btnH = canvasHeight * 0.12;
    let btnY1 = canvasHeight * 0.38;
    let btnY2 = canvasHeight * 0.55;
    fill('#4169E1');
    rect((canvasWidth - btnW) / 2, btnY1, btnW, btnH, 18);
    fill('#FFFFFF');
    text('1 Player', canvasWidth / 2, btnY1 + btnH / 2);
    fill('#7731A0');
    rect((canvasWidth - btnW) / 2, btnY2, btnW, btnH, 18);
    fill('#FFFFFF');
    text('2 Player', canvasWidth / 2, btnY2 + btnH / 2);
    return;
  }

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

    if (fireworks.length === 0) {
      for (let i = 0; i < 5; i++) {
        fireworks.push(new Firework(random(canvasWidth), random(canvasHeight / 2), color(winner === selectedCharacters.player1.name ? players[0].color : players[1].color)));
      }
    }

    drawFireworks();
    return;
  }

  background('#143025'); // Dark forest green
  
  for (let i = 0; i < 20; i++) {
    fill(255, 255, 255, 100);
    circle(random(canvasWidth), random(canvasHeight), random(2, 4));
  }
  
  textSize(24);
  fill(players[0].color);
  text(selectedCharacters.player1.name + ': ' + players[0].score, canvasWidth * 0.15, canvasHeight * 0.08);
  fill(players[1].color);
  text(selectedCharacters.player2.name + ': ' + players[1].score, canvasWidth * 0.6, canvasHeight * 0.08);

  textSize(16);
  fill('#FFFFFF');
  textAlign(LEFT, BOTTOM);
  text(selectedCharacters.player1.name + '\nW key: Move Up\nS key: Move Down', 16, canvasHeight - 60);
  textAlign(RIGHT, BOTTOM);
  text(selectedCharacters.player2.name + '\nUP: Move Up\nDOWN: Move Down', canvasWidth - 16, canvasHeight - 60);
  
  stroke(255, 255, 255, 100);
  strokeWeight(2);
  line(canvasWidth / 2, 0, canvasWidth / 2, canvasHeight);
  noStroke();
  
  fill(ball.color);
  circle(ball.x, ball.y, ball.size);
  
  fill(255, 255, 255, 50);
  circle(ball.x, ball.y, ball.size + 10);
  
  ball.x += ball.speedX;
  ball.y += ball.speedY;
  
  if (ball.y <= ball.size / 2 || ball.y >= canvasHeight - ball.size / 2) {
    ball.speedY *= -1;
    playBounceSound();
  }
  
  if (ball.x < 0) {
    players[1].score += 1;
    playScoreSound();
    adjustPaddleSize();
    slowDownBall();
    if (players[1].score >= 5) {
      gameOver = true;
      winner = selectedCharacters.player2.name;
    } else {
      resetBall("evie");
    }
  } else if (ball.x > canvasWidth) {
    players[0].score += 1;
    playScoreSound();
    adjustPaddleSize();
    slowDownBall();
    if (players[0].score >= 5) {
      gameOver = true;
      winner = selectedCharacters.player1.name;
    } else {
      resetBall("mal");
    }
  }
  
  fill(players[0].color);
  rect(players[0].x, players[0].y - players[0].height / 2, players[0].width, players[0].height, 10);
  
  fill(players[1].color);
  rect(players[1].x - players[1].width, players[1].y - players[1].height / 2, players[1].width, players[1].height, 10);
  
  if (keyIsDown(87) && players[0].y > players[0].height / 2) { // W key
    players[0].y -= players[0].speed;
  }
  if (keyIsDown(83) && players[0].y < canvasHeight - players[0].height / 2) { // S key
    players[0].y += players[0].speed;
  }

  if (!onePlayerMode && keyIsDown(UP_ARROW) && players[1].y > players[1].height / 2) {
    players[1].y -= players[1].speed;
  }
  if (!onePlayerMode && keyIsDown(DOWN_ARROW) && players[1].y < canvasHeight - players[1].height / 2) {
    players[1].y += players[1].speed;
  }

  if (onePlayerMode && !gameOver) {
    let aiTarget = ball.y;
    let aiSpeed = players[1].speed * 0.55; // slower AI
    let aiDelay = 32; // only move if ball is far enough away
    if (Math.abs(players[1].y - aiTarget) > aiDelay) {
      if (players[1].y < aiTarget && players[1].y < canvasHeight - players[1].height / 2) {
        players[1].y += aiSpeed;
      } else if (players[1].y > aiTarget && players[1].y > players[1].height / 2) {
        players[1].y -= aiSpeed;
      }
    }
  }
  
  if (ball.x - ball.size / 2 <= players[0].x + players[0].width && 
      ball.y >= players[0].y - players[0].height / 2 && 
      ball.y <= players[0].y + players[0].height / 2 &&
      ball.x > players[0].x) {
    
    ball.speedX = Math.abs(ball.speedX) + canvasWidth * 0.0005; // Make it go right and slightly faster
    ball.x = players[0].x + players[0].width + ball.size / 2; // Prevent sticking
    
    let angle = calculateBounceAngle(ball.y, players[0].y, players[0].height);
    ball.speedY = angle;
    
    showMagicEffect(ball.x, ball.y, players[0].color);
    playBounceSound();
  }
  
  if (ball.x + ball.size / 2 >= players[1].x - players[1].width && 
      ball.y >= players[1].y - players[1].height / 2 && 
      ball.y <= players[1].y + players[1].height / 2 &&
      ball.x < players[1].x) {
    
    ball.speedX = -Math.abs(ball.speedX) - canvasWidth * 0.0005; // Make it go left and slightly faster
    ball.x = players[1].x - players[1].width - ball.size / 2; // Prevent sticking
    
    let angle = calculateBounceAngle(ball.y, players[1].y, players[1].height);
    ball.speedY = angle;
    
    showMagicEffect(ball.x, ball.y, players[1].color);
    playBounceSound();
  }

  updateBallColor();
  drawFireworks();
}

/**
 * Reset the ball after scoring
 * @param {string} lastScorer - 'mal' or 'evie'
 */
function resetBall(lastScorer) {
  ball.x = canvasWidth / 2;
  ball.y = canvasHeight / 2;
  
  ball.speedY = random(-canvasHeight * 0.007, canvasHeight * 0.007);
  
  if (lastScorer === "mal") {
    ball.speedX = canvasWidth * 0.004; // Move toward Player 2
  } else {
    ball.speedX = -canvasWidth * 0.004; // Move toward Player 1
  }
}

/**
 * Show magical effect when ball hits paddle
 * @param {number} x
 * @param {number} y
 * @param {string} color
 */
function showMagicEffect(x, y, color) {
  // Placeholder for magical effect
}

/**
 * Play paddle bounce sound
 */
function playBounceSound() {
  if (paddleSound && paddleSound.isLoaded()) {
    paddleSound.play();
  }
}

/**
 * Play score sound
 */
function playScoreSound() {
  if (scoreSound && scoreSound.isLoaded()) {
    scoreSound.play();
  }
}

/**
 * Handle key presses (restart, etc)
 */
function keyPressed() {
  if (gameOver && (key === 'z' || key === 'Z')) {
    players[0].score = 0;
    players[1].score = 0;
    gameOver = false;
    winner = '';
    modeSelection = true;
    characterSelection = false;
    selectedCharacters = { player1: null, player2: null };
  }
}

/**
 * Handle window resize events
 */
function windowResized() {
  setupGameElements();
  resizeCanvas(canvasWidth, canvasHeight);
}