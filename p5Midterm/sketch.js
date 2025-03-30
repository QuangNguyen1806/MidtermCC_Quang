// Anxious
// Cracks aggressively spread across the screen. At max stage, the screen fully cracks before shattering.
// this doesn't need to be...interactive...?
// shapes can change its shape
// cracks needs to be less dense
// the last part is kinda calming...? Instead of it breaks and falls down it ( could ) explode
// maybe use the shapes in the background it could span and burst
// after this it could pause before it goes down
// have it be automatic and make it go back to the beginning
// the last one can be more agressive

let stage = 0;          
let maxStage = 10;      
let darkness = 0;       
let shakeFactor = 0;    
let marks = [];         
let cracks = [];        
let shattered = false;  
let shards = [];        

function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();
  strokeWeight(2);
}

function draw() {
  if (shattered) {
    drawShatteredEffect();
    return;
  }

  // Update shake intensity based on the current stage
  shakeFactor = stage * 2;
  let offsetX = random(-shakeFactor, shakeFactor);
  let offsetY = random(-shakeFactor, shakeFactor);
  
  push();
    // Apply scene shake
    translate(offsetX, offsetY);
    background(255, 200, 100);
    
    // Draw all anxious marks
    for (let i = 0; i < marks.length; i++) {
      marks[i].update();
      marks[i].display();
    }

    // Overlay a darkening rectangle; as darkness increases, the world darkens.
    noStroke();
    fill(0, darkness);
    rect(0, 0, width, height);

    // Draw cracks only after stage 5
    if (stage >= 5) {
      for (let i = 0; i < cracks.length; i++) {
        cracks[i].expand();
        cracks[i].display();
      }
    }
  pop();
}

// Red anxious marks
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
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i].radius += random(-0.5, 0.5);
      
      if (this.vertices[i].radius < this.size * 0.7) {
        this.vertices[i].radius = this.size * 0.7;
      } else if (this.vertices[i].radius > this.size * 1.3) {
        this.vertices[i].radius = this.size * 1.3;
      }
    }
  }
  
  display() {
    push();
      translate(this.baseX, this.baseY);
      stroke(255, 0, 0, 200);
      beginShape();
      for (let i = 0; i < this.vertices.length; i++) {
        let jitterX = random(-3, 3);
        let jitterY = random(-3, 3);
        let x = this.vertices[i].radius * cos(this.vertices[i].angle) + jitterX;
        let y = this.vertices[i].radius * sin(this.vertices[i].angle) + jitterY;
        vertex(x, y);
      }
      endShape(CLOSE);
    pop();
  }
}

// Cracks
class Crack {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.points = [{ x: x, y: y }];
    this.growthSpeed = random(10, 20);  // Increased speed for longer, spread-out cracks
    this.maxLength = random(200, 500);
    this.expanding = true;
    // No branching; one continuous line per crack
  }

  expand() {
    if (this.expanding && this.points.length < this.maxLength) {
      let lastPoint = this.points[this.points.length - 1];
      let angle = random(TWO_PI); // Random direction for a natural, glass-breaking effect
      let newX = lastPoint.x + cos(angle) * this.growthSpeed;
      let newY = lastPoint.y + sin(angle) * this.growthSpeed;
      
      if (newX > 0 && newX < width && newY > 0 && newY < height) {
        this.points.push({ x: newX, y: newY });
      }
    }
  }

  display() {
    stroke(255); // White cracks
    strokeWeight(3);
    noFill();
    beginShape();
    for (let i = 0; i < this.points.length; i++) {
      vertex(this.points[i].x, this.points[i].y);
    }
    endShape();
  }
}

// Falling glass shards
class Shard {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(3, 7);
    this.size = random(20, 80);
  }

  update() {
    this.y += this.speed;
  }

  display() {
    stroke(0);
    fill(200);
    beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = map(i, 0, 5, 0, TWO_PI);
      let r = this.size * random(0.8, 1.2);
      let x = this.x + r * cos(angle);
      let y = this.y + r * sin(angle);
      vertex(x, y);
    }
    endShape(CLOSE);
  }
}

// Final shattered screen effect
function drawShatteredEffect() {
  background(255);
  
  // Update and display falling shards
  for (let i = 0; i < shards.length; i++) {
    shards[i].update();
    
    // Only display shards that are still visible (above the screen's bottom)
    if (shards[i].y <= height) {
      shards[i].display();
    }
  }

  // If all shards have fallen, the screen becomes completely empty
  if (shards.length === 0 && shards.every(shard => shard.y > height)) {
    noLoop();
  }
}

function mouseClicked() {
  if (darkness >= 255) return;
  
  stage++;
  darkness = map(stage, 0, maxStage, 0, 255);

  let numNewMarks = stage * 2;
  for (let i = 0; i < numNewMarks; i++) {
    marks.push(new AnxietyMark(random(width), random(height), random(20, 80)));
  }

  let numNewCracks = floor(stage * 2); // Fewer cracks (stage * 2)
  if (stage >= 4) {  // Add cracks only after stage 4
    for (let i = 0; i < numNewCracks; i++) {
      cracks.push(new Crack(random(width), random(height)));
    }
  }

  if (stage >= maxStage) {
    shattered = true;
    generateShards();
  }
}

// Generate glass shards for the final shattering effect
function generateShards() {
  for (let i = 0; i < 60; i++) {
    shards.push(new Shard(random(width), random(height / 2)));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
