/*
  Check our the GOAL and the RULES of this exercise at the bottom of this file.
  
  After that, follow these steps before you start coding:

  1. rename the dancer class to reflect your name (line 35).
  2. adjust line 20 to reflect your dancer's name, too.
  3. run the code and see if a square (your dancer) appears on the canvas.
  4. start coding your dancer inside the class that has been prepared for you.
  5. have fun.
*/

let dancer;

function setup() {
  // no adjustments in the setup function needed...
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");

  // ...except to adjust the dancer's name on the next line:
  dancer = new AlibiDancer(width / 2, height / 2);
}

function draw() {
  // you don't need to make any adjustments inside the draw loop
  background(0);
  drawFloor(); // for reference only

  dancer.update();
  dancer.display();
}

// You only code inside this class.
// Start by giving the dancer your name, e.g. LeonDancer.
class AlibiDancer {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;
    // Properties for my dancer
    this.size = 150;
    this.angle = 0;
    this.speed = 0.05;
    this.armAngle = 0;
    this.armDirection = 1;
    this.color = color(255, 105, 180); // Pink color
    this.armColor = color(255, 165, 0); // Orange arms
    this.handColor = color(255, 255, 0); // Yellow hands
    this.eyeSize = 20;
    this.pupilSize = 8;
    this.mouthWidth = 40;
    this.mouthHeight = 10;
    this.bounceOffset = 0;
    this.bounceSpeed = 0.1;
    this.armLength = 60;
    this.armWidth = 20;
    this.handSize = 15;
  }
  
  update() {
    // Update properties for animation
    this.angle += this.speed;
    this.armAngle += 0.05 * this.armDirection;
    
    // Change arm direction when reaching limits
    if (this.armAngle > PI/3 || this.armAngle < -PI/3) {
      this.armDirection *= -1;
    }
    
    // Bouncing effect
    this.bounceOffset = sin(frameCount * this.bounceSpeed) * 10;
  }
  
  display() {
    push();
    translate(this.x, this.y);
    
    // Body (bouncing)
    translate(0, this.bounceOffset);
    
    // Head
    fill(this.color);
    noStroke();
    ellipse(0, -this.size/3, this.size/2, this.size/2);
    
    // Eyes
    fill(255);
    ellipse(-15, -this.size/3 - 5, this.eyeSize, this.eyeSize);
    ellipse(15, -this.size/3 - 5, this.eyeSize, this.eyeSize);
    
    // Pupils
    fill(0);
    ellipse(-15 + cos(this.angle) * 3, -this.size/3 - 5 + sin(this.angle) * 3, this.pupilSize, this.pupilSize);
    ellipse(15 + cos(this.angle) * 3, -this.size/3 - 5 + sin(this.angle) * 3, this.pupilSize, this.pupilSize);
    
    // Mouth
    fill(255, 0, 0);
    arc(0, -this.size/3 + 10, this.mouthWidth, this.mouthHeight, 0, PI, CHORD);
    
    // Body
    fill(this.color);
    rect(-this.size/4, -this.size/6, this.size/2, this.size/2, 20);
    
    // Left Arm
    push();
    translate(-this.size/4, 0); // Shoulder position
    rotate(this.armAngle);
    fill(this.armColor);
    // Upper arm
    rect(0, -this.armWidth/2, this.armLength/2, this.armWidth, 5);
    // Lower arm
    translate(this.armLength/2, 0);
    rotate(sin(frameCount * 0.1) * 0.3); // Wrist movement
    rect(0, -this.armWidth/2, this.armLength/2, this.armWidth, 5);
    // Hand
    fill(this.handColor);
    ellipse(this.armLength/2, 0, this.handSize, this.handSize);
    pop();
    
    // Right Arm
    push();
    translate(this.size/4, 0); // Shoulder position
    rotate(-this.armAngle);
    fill(this.armColor);
    // Upper arm
    rect(-this.armLength/2, -this.armWidth/2, this.armLength/2, this.armWidth, 5);
    // Lower arm
    translate(-this.armLength/2, 0);
    rotate(sin(frameCount * 0.1) * -0.3); // Wrist movement
    rect(-this.armLength/2, -this.armWidth/2, this.armLength/2, this.armWidth, 5);
    // Hand
    fill(this.handColor);
    ellipse(-this.armLength/2, 0, this.handSize, this.handSize);
    pop();
    
    // Legs
    fill(this.color);
    rect(-this.size/6, this.size/2 - this.size/6, this.size/8, this.size/3, 5);
    rect(this.size/6 - this.size/8, this.size/2 - this.size/6, this.size/8, this.size/3, 5);
    
    pop();
  }
}



/*
GOAL:
The goal is for you to write a class that produces a dancing being/creature/object/thing. In the next class, your dancer along with your peers' dancers will all dance in the same sketch that your instructor will put together. 

RULES:
For this to work you need to follow one rule: 
  - Only put relevant code into your dancer class; your dancer cannot depend on code outside of itself (like global variables or functions defined outside)
  - Your dancer must perform by means of the two essential methods: update and display. Don't add more methods that require to be called from outside (e.g. in the draw loop).
  - Your dancer will always be initialized receiving two arguments: 
    - startX (currently the horizontal center of the canvas)
    - startY (currently the vertical center of the canvas)
  beside these, please don't add more parameters into the constructor function 
  - lastly, to make sure our dancers will harmonize once on the same canvas, please don't make your dancer bigger than 200x200 pixels. 
*/