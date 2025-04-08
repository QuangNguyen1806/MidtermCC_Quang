// Global variables and settings
let stage = 0;
let maxStage = 10;
let darkness = 0;
let shakeFactor = 0;
let marks = [];
let cracks = [];
let shards = [];
let thoughts = []; // New array for Thought objects

let animationStarted = false;
let stageTimer = 0;       // Frames counter for stage progression
const stageInterval = 120; // Frames between stage advances (~2 sec at 60fps)

let explosionStarted = false;
let explosionTimer = 0;

let finalSequence = false;
let finalSequenceTimer = 0;
const finalSequenceDelay = 180;
const finalFadeDuration = 150;

let person;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();
  strokeWeight(2);
  // Instantiate the person near the bottom center.
  person = new Person(width / 2, height - 150);
}

function draw() {
  if (!finalSequence) {
    drawRoom();

    // If animation hasn't started, show the flashing button.
    if (!animationStarted) {
      displayStartButton();
      return;
    }
    
    // Advance stage automatically (before final explosion)
    if (stage < maxStage) {
      stageTimer++;
      if (stageTimer >= stageInterval) {
        stageTimer = 0;
        advanceStage();
      }
    }
    
    // Smooth darkness transition without using lerp.
    let targetDarkness = map(stage, 0, maxStage, 0, 255);
    if (darkness < targetDarkness) {
      darkness += 0.5;
    } else if (darkness > targetDarkness) {
      darkness -= 0.5;
    }
    
    // Update the shake factor and global shake
    shakeFactor = stage * 2;
    let globalShakeX = random(-shakeFactor, shakeFactor);
    let globalShakeY = random(-shakeFactor, shakeFactor);
    
    push();
      translate(globalShakeX, globalShakeY);
      
      // Update and display anxiety marks.
      for (let mark of marks) {
        mark.update();
        mark.display();
      }
      
      // Update and display racing thoughts.
      for (let t of thoughts) {
        t.update();
        t.display();
      }
      
      // Draw an overlay with evolving darkness.
      noStroke();
      fill(0, darkness);
      rect(0, 0, width, height);
      
      // Expand and display cracks with oscillatory movement.
      if (stage >= 5) {
        for (let crack of cracks) {
          crack.expand();
          crack.display();
        }
      }
    pop();
    
    // Update and display the person with micro-twitches.
    person.update(stage, maxStage, shakeFactor);
    person.display();
    
    // Trigger explosion effect when max stage is reached.
    if (stage >= maxStage) {
      if (!explosionStarted) {
        generateShards();
        explosionStarted = true;
      }
      if (!finalSequence) {
        drawExplosionEffect();
      }
      if (finalSequence) {
        background(255);
        person.fallDown();
      }
    }
  } else {
    // Final sequence: white screen with fallen figure, then fade to black.
    background(255);
    person.displayFallen();
    
    finalSequenceTimer++;
    if (finalSequenceTimer > finalSequenceDelay) {
      let fadeAlpha = map(finalSequenceTimer, finalSequenceDelay, finalSequenceDelay + finalFadeDuration, 0, 255);
      noStroke();
      fill(0, fadeAlpha);
      rect(0, 0, width, height);
      if (fadeAlpha >= 255) {
        resetAnimation();
      }
    }
  }
}

// Draw a simple room interior.
function drawRoom() {
  background(200, 220, 255);
  noStroke();
  fill(180, 160, 120);
  rect(0, height * 0.75, width, height * 0.25);
  fill(255);
  stroke(150);
  rect(width * 0.1, height * 0.2, width * 0.3, height * 0.3);
  line(width * 0.1, height * 0.35, width * 0.4, height * 0.35);
  line(width * 0.25, height * 0.2, width * 0.25, height * 0.5);
  noStroke();
  fill(120, 80, 60);
  rect(width * 0.75, height * 0.55, width * 0.15, height * 0.4);
}

// Display a flashing start button that changes color on hover.
function displayStartButton() {
  let pulse = map(sin(frameCount * 0.2), -1, 1, 20, 40);
  let centerX = width / 2;
  let centerY = height / 2;
  let halfPulse = pulse / 2;
  // Calculate distance using manual computation: sqrt((dx)^2+(dy)^2)
  let dx = mouseX - centerX;
  let dy = mouseY - centerY;
  let d = sqrt(dx * dx + dy * dy);
  if (d < halfPulse) {
    fill(255, 150, 0, 200);
  } else {
    fill(255, 0, 0, 200);
  }
  noStroke();
  ellipse(centerX, centerY, pulse, pulse);
}

// Advance the stage and add new marks, cracks, and thoughts.
function advanceStage() {
  stage++;
  let numNewMarks = stage * 2;
  for (let i = 0; i < numNewMarks; i++) {
    marks.push(new AnxietyMark(random(width), random(height), random(20, 80)));
  }
  if (stage >= 4) {
    let numNewCracks = floor(stage * 1);
    for (let i = 0; i < numNewCracks; i++) {
      cracks.push(new Crack(random(width), random(height)));
    }
  }
  // Create a few Thought objects to simulate racing internal thoughts.
  let numNewThoughts = floor(random(1, 4));
  for (let i = 0; i < numNewThoughts; i++) {
    thoughts.push(new Thought(random(width), random(height), random(20, 50)));
  }
}

// AnxietyMark class with an age property and Perlin noise-based distortions.
class AnxietyMark {
  constructor(x, y, size) {
    this.baseX = x;
    this.baseY = y;
    this.size = size;
    this.vertices = [];
    this.numVertices = floor(random(5, 10));
    this.age = 0; // New age variable to control distortion over time.
    for (let i = 0; i < this.numVertices; i++) {
      let angle = map(i, 0, this.numVertices, 0, TWO_PI);
      let r = this.size * random(0.8, 1.2);
      this.vertices.push({ angle: angle, radius: r });
    }
  }
  
  update() {
    this.age += 0.05;
    let distortion = 0.5 + stage * 0.1;
    for (let v of this.vertices) {
      // Smooth randomness via Perlin noise.
      let noiseFactor = noise(v.angle, this.age);
      let change = map(noiseFactor, 0, 1, -distortion, distortion);
      v.radius += change;
      v.radius = constrain(v.radius, this.size * 0.7, this.size * 1.3);
    }
  }
  
  display() {
    push();
      translate(this.baseX, this.baseY);
      stroke(255, 0, 0, 200);
      beginShape();
      for (let v of this.vertices) {
        let jitterX = sin(frameCount * 0.1 + v.angle) * 2;
        let jitterY = cos(frameCount * 0.1 + v.angle) * 2;
        vertex(v.radius * cos(v.angle) + jitterX, v.radius * sin(v.angle) + jitterY);
      }
      endShape(CLOSE);
    pop();
  }
}

// Crack class with an added oscillation effect on the drawn points.
class Crack {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.points = [{ x: x, y: y }];
    this.growthSpeed = random(10, 20);
    this.maxLength = random(200, 500);
  }
  
  expand() {
    if (this.points.length < this.maxLength) {
      let lastPoint = this.points[this.points.length - 1];
      let angle = random(TWO_PI);
      let newX = lastPoint.x + cos(angle) * this.growthSpeed;
      let newY = lastPoint.y + sin(angle) * this.growthSpeed;
      if (newX > 0 && newX < width && newY > 0 && newY < height) {
        this.points.push({ x: newX, y: newY });
      }
    }
  }
  
  display() {
    stroke(255);
    strokeWeight(3);
    noFill();
    beginShape();
    // Adding a wave-like oscillation to each point.
    for (let i = 0; i < this.points.length; i++) {
      let offsetX = sin(frameCount * 0.05 + i) * 2;
      let offsetY = cos(frameCount * 0.05 + i) * 2;
      vertex(this.points[i].x + offsetX, this.points[i].y + offsetY);
    }
    endShape();
  }
}

// Shard class remains much the same.
class Shard {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    let angle = random(TWO_PI);
    let speed = random(5, 15);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.size = random(20, 80);
    this.alpha = 255;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.alpha -= 2;
  }
  
  display() {
    stroke(0, this.alpha);
    fill(200, this.alpha);
    beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = map(i, 0, 5, 0, TWO_PI);
      let r = this.size * random(0.8, 1.2);
      vertex(this.x + r * cos(angle), this.y + r * sin(angle));
    }
    endShape(CLOSE);
  }
}

// Generate shards for the explosion effect.
function generateShards() {
  for (let i = 0; i < 60; i++) {
    shards.push(new Shard(random(width), random(height / 2)));
  }
}

// Draw the explosion effect and trigger the final sequence when shards fade.
function drawExplosionEffect() {
  background(255);
  let activeShards = false;
  for (let s of shards) {
    s.update();
    if (s.alpha > 0) {
      s.display();
      activeShards = true;
    }
  }
  if (!activeShards) {
    finalSequence = true;
    finalSequenceTimer = 0;
  }
}

// Reset the entire animation for a new cycle.
function resetAnimation() {
  stage = 0;
  darkness = 0;
  marks = [];
  cracks = [];
  shards = [];
  thoughts = [];
  explosionStarted = false;
  finalSequence = false;
  finalSequenceTimer = 0;
  stageTimer = 0;
  animationStarted = false;
  person.reset();
}

// Person class with micro-twitches and easing movement.
class Person {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.collapseProgress = 0;
    this.fallProgress = 0;
    this.twitchOffset = { x: 0, y: 0 };
    this.twitchTimer = 0;
  }
  
  update(stage, maxStage, shakeAmount) {
    this.collapseProgress = constrain(stage / maxStage, 0, 1);
    // Add micro-twitches using sine oscillation combined with random displacements.
    this.twitchTimer += 0.1;
    let twitchMagnitude = map(this.collapseProgress, 0, 1, 0, 5);
    this.twitchOffset.x = sin(this.twitchTimer) * twitchMagnitude + random(-1, 1);
    this.twitchOffset.y = cos(this.twitchTimer) * twitchMagnitude + random(-1, 1);
  }
  
  display() {
    push();
      translate(this.x + this.twitchOffset.x, this.y + this.twitchOffset.y);
      let collapseAngle = map(this.collapseProgress, 0, 1, 0, PI / 2);
      rotate(collapseAngle);
      
      stroke(0);
      fill(255);
      ellipse(0, -60, 30, 30);
      line(0, -45, 0, 0);
      if (this.collapseProgress < 0.7) {
        let armAngle = map(this.collapseProgress, 0, 1, PI / 4, PI / 2);
        line(0, -35, -30 * cos(armAngle), -35 + 30 * sin(armAngle));
        line(0, -35, 30 * cos(armAngle), -35 + 30 * sin(armAngle));
      } else {
        line(0, -35, -15, -60);
        line(0, -35, 15, -60);
        line(-15, -60, 15, -60);
      }
      let legAngle = map(this.collapseProgress, 0, 1, PI / 8, PI / 2);
      line(0, 0, -20 * cos(legAngle), 40 * sin(legAngle));
      line(0, 0, 20 * cos(legAngle), 40 * sin(legAngle));
    pop();
  }
  
  // Gradually increase the fall progress.
  fallDown() {
    if (this.fallProgress < 1) {
      this.fallProgress += 0.005;
    }
  }
  
  // Display the collapsed (fallen) stickman.
  displayFallen() {
    push();
      translate(this.x, this.y);
      let startAngle = map(this.collapseProgress, 0, 1, 0, PI / 2);
      let finalAngle = map(this.fallProgress, 0, 1, startAngle, PI / 2);
      rotate(finalAngle);
      translate(0, 20 * this.fallProgress);
      
      stroke(0);
      fill(255);
      ellipse(0, -60, 30, 30);
      line(0, -45, 0, 0);
      line(0, -35, -15, -50);
      line(0, -35, 15, -50);
      line(0, 0, -20, 10);
      line(0, 0, 20, 10);
    pop();
  }
  
  reset() {
    this.x = width / 2;
    this.y = height - 150;
    this.collapseProgress = 0;
    this.fallProgress = 0;
    this.twitchTimer = 0;
  }
}

// New Thought class to represent transient, racing thoughts.
class Thought {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.alpha = 200;
    this.life = random(100, 200);
    this.age = 0;
    // Initial movement parameters using polar coordinates.
    this.angle = random(TWO_PI);
    this.speed = random(0.5, 2);
  }
  
  update() {
    this.age++;
    // Move using a slow radial motion.
    this.x += cos(this.angle) * this.speed;
    this.y += sin(this.angle) * this.speed;
    // Fade out gradually.
    this.alpha = map(this.age, 0, this.life, 200, 0);
  }
  
  display() {
    push();
      noStroke();
      fill(100, 100, 255, this.alpha);
      // Oscillate the size slightly to enhance the pulsating effect.
      let currentSize = this.size + sin(frameCount * 0.2) * 5;
      ellipse(this.x, this.y, currentSize, currentSize);
    pop();
  }
}

function mouseClicked() {
  let pulse = map(sin(frameCount * 0.2), -1, 1, 20, 40);
  let centerX = width / 2;
  let centerY = height / 2;
  //mouse click place
  let dx = mouseX - centerX;
  let dy = mouseY - centerY;
  let d = sqrt(dx * dx + dy * dy);
  // Start animation only if the button is clicked.
  if (!animationStarted && d < pulse / 2) {
    animationStarted = true;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
