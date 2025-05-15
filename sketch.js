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
let selectionTransition = false;
let transitionTimer = 0;
let transitionDuration = 3; // 3 second transition
let gameStartCountdown = false;
let countdownTimer = 0;
let countdownDuration = 3; // 3 second countdown
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
 * @param {string} colorStr - Color string
 */
function Firework(x, y, colorStr) {
  this.x = x;
  this.y = y;
  
  // Handle color safely - ensure we have a valid color string
  if (typeof colorStr !== 'string' || !colorStr.startsWith('#')) {
    // Default color if invalid
    this.colorStr = '#FFFFFF';  
  } else {
    this.colorStr = colorStr;
  }
  
  // Convert string to p5.js color object
  this.colorObj = color(this.colorStr); 
  
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
      p.alpha -= 10; // Faster fade-out (increased from 5 to 10)
    }
    this.particles = this.particles.filter(p => p.alpha > 0);
  };
  this.show = function () {
    noStroke();
    for (let p of this.particles) {
      // Create a safe color string with appropriate alpha
      if (this.colorStr && this.colorStr.startsWith('#')) {
        // For hex colors, append the alpha value
        fill(this.colorStr + hexAlpha(p.alpha));
      } else {
        // Fallback to white with alpha if colorStr is invalid
        fill('#FFFFFF' + hexAlpha(p.alpha));
      }
      // Smaller particles for reduced effect
      circle(p.x, p.y, 3);  // Reduced from 5 to 3
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
 * Convert alpha value (0-255) to a two-digit hex string
 * @param {number} alpha - Alpha value 0-255
 * @returns {string} - Hex representation
 */
function hexAlpha(alpha) {
  // Ensure alpha is between 0-255
  alpha = constrain(Math.floor(alpha), 0, 255);
  let hex = alpha.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
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
  
  // Add stroke to all icons for better visibility
  strokeWeight(2);
  stroke('#FFFFFF'); // White stroke for better visibility
  
  switch (name) {
    case 'Mal':
      // Mal: purple star
      fill('#7731A0');
      // Draw a star using a simpler approach
      let angle = TWO_PI / 10;
      beginShape();
      for (let a = 0; a < TWO_PI; a += angle) {
        let sx = cos(a) * size * 0.4;
        let sy = sin(a) * size * 0.4;
        vertex(sx, sy);
        sx = cos(a + angle/2) * size * 0.2;
        sy = sin(a + angle/2) * size * 0.2;
        vertex(sx, sy);
      }
      endShape(CLOSE);
      break;
    case 'Evie':
      // Evie: blue crown
      fill('#4169E1');
      // Simplified crown
      beginShape();
      vertex(-size * 0.35, size * 0.2);
      vertex(-size * 0.25, -size * 0.2);
      vertex(-size * 0.1, size * 0.05);
      vertex(0, -size * 0.25);
      vertex(size * 0.1, size * 0.05);
      vertex(size * 0.25, -size * 0.2);
      vertex(size * 0.35, size * 0.2);
      endShape(CLOSE);
      break;
    case 'Jay':
      // Jay: gold lightning bolt
      fill('#FFD700');
      // More pronounced lightning bolt
      beginShape();
      vertex(-size * 0.1, -size * 0.3);
      vertex(size * 0.1, -size * 0.05);
      vertex(0, -size * 0.05);
      vertex(size * 0.2, size * 0.3);
      vertex(0, size * 0.05);
      vertex(-size * 0.1, size * 0.05);
      endShape(CLOSE);
      break;
    case 'Uma':
      // Uma: dark blue trident
      fill('#00008B');
      // Draw handle
      rect(-size * 0.05, -size * 0.3, size * 0.1, size * 0.5, 3);
      // Draw prongs
      beginShape();
      vertex(-size * 0.25, -size * 0.3);
      vertex(-size * 0.25, -size * 0.1);
      vertex(-size * 0.15, -size * 0.1);
      vertex(-size * 0.15, -size * 0.3);
      endShape(CLOSE);
      
      beginShape();
      vertex(0, -size * 0.4);
      vertex(0, -size * 0.2);
      vertex(size * 0.1, -size * 0.2);
      vertex(size * 0.1, -size * 0.4);
      endShape(CLOSE);
      
      beginShape();
      vertex(size * 0.25, -size * 0.3);
      vertex(size * 0.25, -size * 0.1);
      vertex(size * 0.15, -size * 0.1);
      vertex(size * 0.15, -size * 0.3);
      endShape(CLOSE);
      break;
    case 'Gil':
      // Gil: orange shield
      fill('#FFA500');
      // Clearer shield shape
      beginShape();
      vertex(0, -size * 0.3);
      vertex(size * 0.25, -size * 0.1);
      vertex(size * 0.2, size * 0.2);
      vertex(0, size * 0.3);
      vertex(-size * 0.2, size * 0.2);
      vertex(-size * 0.25, -size * 0.1);
      endShape(CLOSE);
      // Add shield detail
      noStroke();
      fill('#FFA500'); // Simplified - removed alpha
      ellipse(0, 0, size * 0.2, size * 0.3);
      stroke('#FFFFFF'); // Restore stroke
      break;
    case 'Carlos':
      // Carlos: white paw print with black stroke for contrast
      strokeWeight(2);
      stroke('#000000'); // Use hex for black stroke
      fill('#FFFFFF'); // Use hex for white fill
      
      // Make the paw print more prominent for Carlos
      // Main paw pad
      ellipse(0, 0, size * 0.45, size * 0.4);
      
      // Toe beans - larger and more distinct
      ellipse(-size * 0.18, -size * 0.18, size * 0.18, size * 0.18);
      ellipse(0, -size * 0.22, size * 0.18, size * 0.18);
      ellipse(size * 0.18, -size * 0.18, size * 0.18, size * 0.18);
      
      // Bottom pads - larger and more distinct
      ellipse(-size * 0.1, size * 0.15, size * 0.15, size * 0.15);
      ellipse(size * 0.1, size * 0.15, size * 0.15, size * 0.15);
      break;
    default:
      // Default: colored circle
      fill('#C0C0C0');
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
        
        // Draw background box
        fill(characters[i].color);
        rect(x - iconSize / 2, y - iconSize / 2, iconSize, iconSize, 10);
        
        // Draw character icon slightly larger for mobile
        drawCharacterIcon(characters[i].name, x, y, iconSize * 0.8); 
        
        // Draw character name
        fill('#FFFFFF');
        textSize(11);
        text(characters[i].name, x, y + labelOffset * 0.6);
      }
    } else {
      for (let i = 0; i < characters.length; i++) {
        let x = xOffset * (i + 1);
        let y = gridStartY + iconSize / 2;
        
        // Draw background box
        fill(characters[i].color);
        rect(x - iconSize / 2, y - iconSize / 2, iconSize, iconSize, 10);
        
        // Draw character icon
        drawCharacterIcon(characters[i].name, x, y, iconSize * 0.8); 
        
        // Draw character name
        fill('#FFFFFF');
        textSize(16);
        text(characters[i].name, x, y + labelOffset);
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
        
        // Draw background box
        fill(characters[i].color);
        rect(x - iconSize / 2, y - iconSize / 2, iconSize, iconSize, 10);
        
        // Draw character icon slightly larger for mobile
        drawCharacterIcon(characters[i].name, x, y, iconSize * 0.8);
        
        // Draw character name
        fill('#FFFFFF');
        textSize(11);
        text(characters[i].name, x, y + labelOffset * 0.6);
      }
    } else {
      for (let i = 0; i < characters.length; i++) {
        let x = xOffset * (i + 1);
        let y = gridStartY + iconSize / 2;
        
        // Draw background box
        fill(characters[i].color);
        rect(x - iconSize / 2, y - iconSize / 2, iconSize, iconSize, 10);
        
        // Draw character icon
        drawCharacterIcon(characters[i].name, x, y, iconSize * 0.8);
        
        // Draw character name
        fill('#FFFFFF');
        textSize(16);
        text(characters[i].name, x, y + labelOffset);
      }
    }
  }
}

/**
 * Handle mouse presses for mode/character selection and transition skipping
 */
function mousePressed() {
  // Skip character selection transition on tap/click
  if (selectionTransition) {
    selectionTransition = false;
    return;
  }
  
  // Skip game start countdown on tap/click
  if (gameStartCountdown) {
    gameStartCountdown = false;
    return;
  }

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
            // Start transition between character selections
            selectionTransition = true;
            transitionTimer = millis();
            // Play sound to indicate successful selection
            if (scoreSound && scoreSound.isLoaded()) {
              scoreSound.play();
            }
          } else if (!selectedCharacters.player2) {
            selectedCharacters.player2 = characters[i];
            characterSelection = false;
            selectionTransition = false;
            // Setup game elements but start countdown before actual gameplay
            gameStartCountdown = true;
            countdownTimer = millis();
            setupGameElements();
            // Play sound for player 2 selection
            if (scoreSound && scoreSound.isLoaded()) {
              scoreSound.play();
            }
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
            // Start transition between character selections
            selectionTransition = true;
            transitionTimer = millis();
            // Play sound to indicate successful selection
            if (scoreSound && scoreSound.isLoaded()) {
              scoreSound.play();
            }
          } else if (!selectedCharacters.player2) {
            selectedCharacters.player2 = characters[i];
            characterSelection = false;
            selectionTransition = false;
            // Setup game elements but start countdown before actual gameplay
            gameStartCountdown = true;
            countdownTimer = millis();
            setupGameElements();
            // Play sound for player 2 selection
            if (scoreSound && scoreSound.isLoaded()) {
              scoreSound.play();
            }
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
    // Ensure player 1's color is valid
    if (typeof players[0].color === 'string' && players[0].color.startsWith('#')) {
      ball.color = players[0].color;
    } else {
      ball.color = '#7731A0'; // Default purple color
    }
  } else {
    // Ensure player 2's color is valid
    if (typeof players[1].color === 'string' && players[1].color.startsWith('#')) {
      ball.color = players[1].color;
    } else {
      ball.color = '#4169E1'; // Default blue color 
    }
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

  if (gameStartCountdown) {
    // Show countdown before game starts
    background('#143025');
    textSize(36);
    fill('#FFFFFF');
    textAlign(CENTER, CENTER);
    
    // Calculate remaining time
    let elapsedSeconds = (millis() - countdownTimer) / 1000;
    let remainingTime = Math.ceil(countdownDuration - elapsedSeconds);
    
    // Show VS screen with both players
    text(selectedCharacters.player1.name + ' vs ' + selectedCharacters.player2.name, canvasWidth / 2, canvasHeight * 0.2);
    
    // Draw both character icons
    let iconSize = 90;
    let spacing = canvasWidth * 0.25;
    
    // Player 1 character
    fill(selectedCharacters.player1.color);
    rect(canvasWidth/2 - spacing - iconSize/2, canvasHeight * 0.4 - iconSize/2, iconSize, iconSize, 15);
    drawCharacterIcon(selectedCharacters.player1.name, canvasWidth/2 - spacing, canvasHeight * 0.4, iconSize * 0.8);
    
    // VS text in the middle
    textSize(48);
    fill('#FFD700'); // Gold color
    text('VS', canvasWidth/2, canvasHeight * 0.4);
    
    // Player 2 character
    fill(selectedCharacters.player2.color);
    rect(canvasWidth/2 + spacing - iconSize/2, canvasHeight * 0.4 - iconSize/2, iconSize, iconSize, 15);
    drawCharacterIcon(selectedCharacters.player2.name, canvasWidth/2 + spacing, canvasHeight * 0.4, iconSize * 0.8);
    
    // Show countdown number
    textSize(100);
    fill('#FFD700'); // Gold color
    text(remainingTime, canvasWidth / 2, canvasHeight * 0.7);
    
    // Game instructions
    textSize(24);
    fill('#FFFFFF');
    text('Get Ready!', canvasWidth / 2, canvasHeight * 0.85);
    
    // Create firework effects
    if (random() < 0.2) {
      // Random position across the screen
      let x = random(canvasWidth * 0.2, canvasWidth * 0.8);
      let y = random(canvasHeight * 0.2, canvasHeight * 0.6);
      
      // Alternate between player colors
      let fwColor = random() > 0.5 ? 
          selectedCharacters.player1.color : 
          selectedCharacters.player2.color;
          
      fireworks.push(new Firework(x, y, fwColor));
    }
    
    drawFireworks();
    
    // If countdown finished, start the game
    if (elapsedSeconds >= countdownDuration) {
      gameStartCountdown = false;
    }
    
    return;
  }

  if (characterSelection) {
    if (selectionTransition) {
      // Display character 1 selection and transition countdown
      background('#143025');
      textSize(36);
      fill('#FFFFFF');
      textAlign(CENTER, CENTER);
      
      // Calculate remaining time
      let elapsedSeconds = (millis() - transitionTimer) / 1000;
      let remainingTime = Math.ceil(transitionDuration - elapsedSeconds);
      
      // Show title
      text('Player 1 selected ' + selectedCharacters.player1.name + '!', canvasWidth / 2, canvasHeight * 0.22);
      
      // Draw selected character icon with animation
      fill(selectedCharacters.player1.color);
      let iconSize = 120;
      // Add subtle pulsing animation to the icon
      let pulseAmount = sin(millis() * 0.005) * 10; // Subtle pulse effect
      let animatedSize = iconSize + pulseAmount;
      
      // Background rectangle with rounded corners
      rect(canvasWidth/2 - animatedSize/2, canvasHeight * 0.35 - animatedSize/2, 
           animatedSize, animatedSize, 15);
           
      // Draw the character icon with slight rotation
      push();
      translate(canvasWidth/2, canvasHeight * 0.35);
      rotate(sin(millis() * 0.001) * 0.05); // Very subtle rotation
      drawCharacterIcon(selectedCharacters.player1.name, 0, 0, animatedSize * 0.8);
      pop();
      
      // Show countdown
      textSize(48);
      fill('#FFD700'); // Gold color
      text('Player 2 get ready!', canvasWidth / 2, canvasHeight * 0.6);
      text(remainingTime, canvasWidth / 2, canvasHeight * 0.75);
      
      // Show skip instruction for both desktop and mobile users
      textSize(16);
      fill('#FFFFFF');
      if (windowWidth < 700) {
        text('Tap screen to continue', canvasWidth / 2, canvasHeight * 0.85);
      } else {
        text('Press SPACE or ENTER to continue', canvasWidth / 2, canvasHeight * 0.85);
      }
      
      // Create sparkle effects around the character in a more interesting pattern
      if (random() < 0.35) { // Slightly increased chance
        // Create multiple sparkles in a circular pattern
        let baseAngle = frameCount * 0.05; // Slowly rotating base angle
        let sparkleCount = 1 + int(random(2)); // 1-2 sparkles per frame
        
        for (let i = 0; i < sparkleCount; i++) {
          let angle = baseAngle + i * (TWO_PI / 8) + random(-0.2, 0.2);
          let distance = random(iconSize/2, iconSize * 1.2);
          let x = canvasWidth/2 + cos(angle) * distance;
          let y = canvasHeight * 0.35 + sin(angle) * distance;
          
          // Alternate between character color and gold
          let sparkleColor = (i % 2 === 0) ? 
              selectedCharacters.player1.color : 
              '#FFD700'; // Gold color
              
          fireworks.push(new Firework(x, y, sparkleColor));
        }
      }
      
      drawFireworks();
      
      // Transition to player 2 selection after countdown
      if (elapsedSeconds >= transitionDuration) {
        selectionTransition = false;
      }
      
      return;
    }
    
    drawCharacterSelection();
    return;
  }

  if (gameOver) {
    background('#143025');
    
    // Get winner color and character info
    let winnerIndex = winner === selectedCharacters.player1.name ? 0 : 1;
    let winnerCharacter = winner === selectedCharacters.player1.name ? selectedCharacters.player1 : selectedCharacters.player2;
    let winnerColor = winnerCharacter && winnerCharacter.color ? winnerCharacter.color : '#FFFFFF';
    
    // Draw winner icon above text
    fill(winnerColor);
    drawCharacterIcon(winner, canvasWidth / 2, canvasHeight * 0.35, 70);
    
    // Draw victory text
    textSize(48);
    fill('#FFD700');
    textAlign(CENTER, CENTER);
    text(winner + ' wins!', canvasWidth / 2, canvasHeight / 2);
    
    // Draw restart instruction
    textSize(24);
    fill('#FFFFFF');
    text('Press Z to restart', canvasWidth / 2, canvasHeight / 2 + 60);

    // Create firework effects if none exist
    if (fireworks.length === 0) {
      for (let i = 0; i < 5; i++) {
        fireworks.push(new Firework(random(canvasWidth), random(canvasHeight / 2), winnerColor));
      }
    }

    drawFireworks();
    return;
  }

  background('#143025'); // Dark forest green
  
  // Draw starry background using hex color format
  for (let i = 0; i < 20; i++) {
    fill('#FFFFFF' + hexAlpha(100)); // White with semi-transparency
    circle(random(canvasWidth), random(canvasHeight), random(2, 4));
  }
  
  // Display score with character icons - perfectly symmetrical alignment
  textSize(24);
  
  // Player 1 score with icon - left aligned
  fill(players[0].color);
  textAlign(LEFT, CENTER);
  const iconSize = 30;
  const iconMargin = canvasWidth * 0.04;
  const textMargin = canvasWidth * 0.02;
  
  // Draw Player 1 icon and name on left side
  drawCharacterIcon(selectedCharacters.player1.name, iconMargin, canvasHeight * 0.08, iconSize);
  text(selectedCharacters.player1.name + ': ' + players[0].score, iconMargin + iconSize + textMargin, canvasHeight * 0.08);
  
  // Player 2 score with icon - right aligned mirror of player 1
  fill(players[1].color);
  textAlign(RIGHT, CENTER);
  
  // Draw Player 2 icon and name on right side
  drawCharacterIcon(selectedCharacters.player2.name, canvasWidth - iconMargin, canvasHeight * 0.08, iconSize);
  text(selectedCharacters.player2.name + ': ' + players[1].score, canvasWidth - iconMargin - iconSize - textMargin, canvasHeight * 0.08);
  
  textAlign(CENTER, CENTER);

  textSize(16);
  fill('#FFFFFF');
  textAlign(LEFT, BOTTOM);
  text(selectedCharacters.player1.name + '\nW key: Move Up\nS key: Move Down', 16, canvasHeight - 60);
  textAlign(RIGHT, BOTTOM);
  text(selectedCharacters.player2.name + '\nUP: Move Up\nDOWN: Move Down', canvasWidth - 16, canvasHeight - 60);
  
  // Draw center line with hex color format
  stroke('#FFFFFF' + hexAlpha(100));  // White with semi-transparency
  strokeWeight(2);
  line(canvasWidth / 2, 0, canvasWidth / 2, canvasHeight);
  noStroke();
  
  // Draw ball with magical trail effect
  for (let i = 3; i > 0; i--) {
    // Handle trail fading by using a safe color approach
    let fadeAlpha = Math.floor(60 / i);
    noStroke();
    
    if (typeof ball.color === 'string' && ball.color.startsWith('#')) {
      // We have a hex color, safely create a faded version
      fill(ball.color + hexAlpha(fadeAlpha));
    } else {
      // Fallback to a default color if the ball color is invalid
      fill('#B026FF' + hexAlpha(fadeAlpha));
    }
    
    circle(ball.x - ball.speedX * (i * 2), ball.y - ball.speedY * (i * 2), ball.size * (1 + i * 0.1));
  }
  
  // Main ball
  fill(ball.color);
  circle(ball.x, ball.y, ball.size);
  
  // Ball glow - using hex format for safety
  fill('#FFFFFF' + hexAlpha(50)); // White with 50 alpha
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
  
  // Draw player 1 paddle with character icon
  fill(players[0].color);
  rect(players[0].x, players[0].y - players[0].height / 2, players[0].width, players[0].height, 10);
  drawCharacterIcon(selectedCharacters.player1.name, 
                   players[0].x + players[0].width / 2, 
                   players[0].y, 
                   players[0].width * 1.5);
  
  // Draw player 2 paddle with character icon
  fill(players[1].color);
  rect(players[1].x - players[1].width, players[1].y - players[1].height / 2, players[1].width, players[1].height, 10);
  drawCharacterIcon(selectedCharacters.player2.name, 
                   players[1].x - players[1].width / 2, 
                   players[1].y, 
                   players[1].width * 1.5);
  
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
 * @param {number} x - X position of the effect
 * @param {number} y - Y position of the effect
 * @param {string|object} colorValue - Color of the effect
 */
function showMagicEffect(x, y, colorValue) {
  // Ensure we have a valid color string
  let safeColor;
  
  // If it's a string and starts with #, it's likely a valid hex color
  if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
    safeColor = colorValue;
  } else {
    // Default to white if color is invalid
    safeColor = '#FFFFFF';
  }
  
  // Create particles for magical effect - reduced number of particles
  for (let i = 0; i < 5; i++) {  // Reduced from 15 to 5 particles
    fireworks.push(new Firework(
      x + random(-20, 20),  // Reduced spread area
      y + random(-20, 20),  // Reduced spread area
      safeColor
    ));
  }
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
  // Skip transition if space/enter key is pressed
  if (selectionTransition && (key === ' ' || keyCode === ENTER || keyCode === 13)) {
    selectionTransition = false;
    return;
  }
  
  // Skip countdown if space/enter key is pressed
  if (gameStartCountdown && (key === ' ' || keyCode === ENTER || keyCode === 13)) {
    gameStartCountdown = false;
    return;
  }
  
  // Reset game when Z is pressed after game over
  if (gameOver && (key === 'z' || key === 'Z')) {
    players[0].score = 0;
    players[1].score = 0;
    gameOver = false;
    winner = '';
    modeSelection = true;
    characterSelection = false;
    selectionTransition = false;
    gameStartCountdown = false;
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