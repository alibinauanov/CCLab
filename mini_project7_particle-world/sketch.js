let NUM_OF_PARTICLES = 3;
let MAX_OF_PARTICLES = 500;
let particles = [];
let emojis = ["🎉", "🌟", "😄", "💥", "✨", "🎈", "🔥", "🌸"];

function setup() {
  let canvas = createCanvas(800, 500);
  canvas.parent("p5-canvas-container");
  colorMode(HSB);
  textFont('Arial');
  textAlign(CENTER, CENTER);
  
  for (let i = 0; i < NUM_OF_PARTICLES; i++) {
    particles[i] = new Particle(random(width), random(height));
  }
}

function draw() {
  background(0, 0.1);

  if (frameCount % 5 === 0) {
    particles.push(new Particle(random(width), random(-10, 10)));
  }
  if (mouseIsPressed) {
    for (let i = 0; i < 5; i++) {
      particles.push(new Particle(mouseX, mouseY));
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].lifespan <= 0) {
      particles.splice(i, 1);
    }
  }
}

class Particle {
  constructor(startX, startY) {
    this.pos = createVector(startX, startY);
    this.vel = p5.Vector.random2D().mult(random(0.5, 2));
    this.acc = createVector();
    this.dia = random(15, 40);
    this.angle = random(TWO_PI);
    this.rotSpeed = random(-0.1, 0.1);
    this.hue = random(360);
    this.emoji = random(emojis);
    this.lifespan = 255;
    this.target = createVector(random(width), random(height));
    
    this.gravity = createVector(0, 0.05);
  }

  update() {
    this.acc.add(this.gravity);
    
    if (random() < 0.02) {
      this.acc.add(p5.Vector.random2D().mult(0.5));
    }
    
    let seekForce = p5.Vector.sub(this.target, this.pos);
    seekForce.setMag(0.05);
    this.acc.add(seekForce);
    
    this.vel.add(this.acc);
    this.vel.limit(3);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    if (this.pos.dist(this.target) < 50) {
      this.target = createVector(random(width), random(height));
    }
    
    this.pos.x = constrain(this.pos.x, -20, width + 20);
    this.pos.y = constrain(this.pos.y, -20, height + 20);
    
    this.angle += this.rotSpeed;
    this.lifespan -= 1.5;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    textSize(this.dia);
    fill(this.hue, 80, 100, this.lifespan);
    text(this.emoji, 0, 0);
    pop();
  }
}