// Global variables and settings
let stage = 0;
let maxStage = 10;
let darkness = 0;
let shakeFactor = 0;
let marks = [];
let cracks = [];
let shards = [];

let animationStarted = false;
let stageTimer = 0;       // Frames counter for stage progression
const stageInterval = 120; // Frames between stage advances (~2 sec at 60fps)

let explosionStarted = false;
let explosionTimer = 0;
const explosionDelay = 180; // Not used but kept for reference

// Variables for the final sequence
let finalSequence = false;
let finalSequenceTimer = 0;
const finalSequenceDelay = 180; // Frames to show white screen with fallen figure before darkening
const finalFadeDuration = 150;  // Frames over which fade-to-black occurs

let person;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();
  strokeWeight(2);
  // Instantiate the person near the bottom center.
  person = new Person(width / 2, height - 150);
}

function draw() {
  // If not in final sequence, draw the room background and anxious effects.
  if (!finalSequence) {
    drawRoom();
  
    // If animation hasn't started, show the flashing button.
    if (!animationStarted) {
      displayStartButton();
      return;
    }
    
    // Automatic stage progression (before final explosion)
    if (stage < maxStage) {
      stageTimer++;
      if (stageTimer >= stageInterval) {
        stageTimer = 0;
        advanceStage();
      }
    }
    
    // Slowly update darkness.
    let targetDarkness = map(stage, 0, maxStage, 0, 255);
    if (darkness < targetDarkness) {
      darkness += 0.5;
    }
    
    // Update shake factor.
    shakeFactor = stage * 2;
    let globalShakeX = random(-shakeFactor, shakeFactor);
    let globalShakeY = random(-shakeFactor, shakeFactor);
    
    // Draw anxious effects over the room.
    if (stage < maxStage) {
      push();
        translate(globalShakeX, globalShakeY);
        for (let mark of marks) {
          mark.update();
          mark.display();
        }
        noStroke();
        fill(0, darkness);
        rect(0, 0, width, height);
        if (stage >= 5) {
          for (let crack of cracks) {
            crack.expand();
            crack.display();
          }
        }
      pop();
    }
    
    // Update and display the person (falling hasn't started yet).
    person.update(stage, maxStage, shakeFactor);
    person.display();
    
    // When max stage is reached, trigger explosion effect.
    if (stage >= maxStage) {
      if (!explosionStarted) {
        generateShards();
        explosionStarted = true;
      }
      if (!finalSequence) {
        drawExplosionEffect();
      }
      if (finalSequence) {
        // Switch to white background; let the figure fall.
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

// Display a flashing button that changes color on hover.
function displayStartButton() {
  let pulse = map(sin(frameCount * 0.2), -1, 1, 20, 40);
  let d = dist(mouseX, mouseY, width/2, height/2);
  // If mouse is over the button, change its color.
  if (d < pulse/2) {
    fill(255, 150, 0, 200);
  } else {
    fill(255, 0, 0, 200);
  }
  noStroke();
  ellipse(width/2, height/2, pulse, pulse);
}

// Advance stage and add anxiety marks/cracks.
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
}

// AnxietyMark class.
class AnxietyMark {
  constructor(x, y, size) {
    this.baseX = x;
    this.baseY = y;
    this.size = size;
    this.vertices = [];
    this.numVertices = floor(random(5, 10));
    for (let i = 0; i < this.numVertices; i++) {
      let angle = map(i, 0, this.numVertices, 0, TWO_PI);
      let r = this.size * random(0.8, 1.2);
      this.vertices.push({ angle: angle, radius: r });
    }
  }
  
  update() {
    let distortion = 0.5 + stage * 0.1;
    for (let v of this.vertices) {
      v.radius += random(-distortion, distortion);
      v.radius = constrain(v.radius, this.size * 0.7, this.size * 1.3);
    }
  }
  
  display() {
    push();
      translate(this.baseX, this.baseY);
      stroke(255, 0, 0, 200);
      beginShape();
      for (let v of this.vertices) {
        let jitterX = random(-3, 3);
        let jitterY = random(-3, 3);
        vertex(v.radius * cos(v.angle) + jitterX, v.radius * sin(v.angle) + jitterY);
      }
      endShape(CLOSE);
    pop();
  }
}

// Crack class.
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
    for (let p of this.points) {
      vertex(p.x, p.y);
    }
    endShape();
  }
}

// Shard class.
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

// Generate shards.
function generateShards() {
  for (let i = 0; i < 60; i++) {
    shards.push(new Shard(random(width), random(height / 2)));
  }
}

// Draw explosion effect; when shards fade, start final sequence.
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

// Final sequence: white screen with fallen figure, then fade to black.
function drawFinalSequence() {
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

// Reset the animation.
function resetAnimation() {
  stage = 0;
  darkness = 0;
  marks = [];
  cracks = [];
  shards = [];
  explosionStarted = false;
  finalSequence = false;
  finalSequenceTimer = 0;
  stageTimer = 0;
  animationStarted = false;
  person.reset();
}

// Start the animation only when clicking on the button.
function mouseClicked() {
  let pulse = map(sin(frameCount * 0.2), -1, 1, 20, 40);
  let d = dist(mouseX, mouseY, width/2, height/2);
  // Only start if click is on the button.
  if (!animationStarted && d < pulse/2) {
    animationStarted = true;
  }
}

// Adjust canvas size.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/* ----------------------------------
   Person class
   ---------------------------------- */
class Person {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.collapseProgress = 0; // 0 = standing, 1 = fully collapsed
    this.shakeX = 0;
    this.shakeY = 0;
    this.fallProgress = 0; // 0 = not fallen, 1 = fully fallen (horizontal)
  }
  
  update(stage, maxStage, shakeAmount) {
    this.collapseProgress = constrain(stage / maxStage, 0, 1);
    this.shakeX = random(-shakeAmount, shakeAmount);
    this.shakeY = random(-shakeAmount, shakeAmount);
  }
  
  // Display stickman during anxious/collapsing phase.
  display() {
    push();
      translate(this.x + this.shakeX, this.y + this.shakeY);
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
  
  // Gradually increase fallProgress.
  fallDown() {
    if (this.fallProgress < 1) {
      this.fallProgress += 0.005;
    }
  }
  
  // Display the fallen stickman.
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
  }
}
