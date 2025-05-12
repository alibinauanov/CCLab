const TARGET_VISIBLE = 60;
const EXPLORE_THRESHOLD = 0.5; // 50% of images need to be viewed

const HELP_BAR = 26;
const MARGIN = 10;

const SHANGHAI_COUNTS = {
  friends: 31,
  me: 12,
  places: 23
};
const ABU_DHABI_COUNTS = {
  campus: 20,
  friends: 22,
  outside: 24
};

let shanghaiImgs = { friends: [], me: [], places: [] };
let abuImgs = { campus: [], friends: [], outside: [] };
let currentSet = null;
let currentPart = null;
let parts = [];
let exploredCount = 0;

let tiles = [];
let hoverTile = null;
let activeTile = null;

let transitionAlpha = 0, isTransitioning = false;
let rippleEffect = null;
let lastInteractionTime = 0, idleTimer = 0, idleAnimation = false;
let autoRotateAngle = 0;

let state = "intro";
let airplaneProgress = 0;
let viewedImages = new Set();

// Clamp helpers
const clampX = (x, w) => constrain(x, MARGIN, width - MARGIN - w);
const clampY = (y, h) => constrain(y, MARGIN, height - MARGIN - h - HELP_BAR);

function preload() {
  for (let i = 1; i <= SHANGHAI_COUNTS.friends; i++) {
    const num = nf(i, 2);
    shanghaiImgs.friends.push(loadImage(`assets/adfriends-${num}.jpg`));
  }
  for (let i = 1; i <= SHANGHAI_COUNTS.me; i++) {
    const num = nf(i, 2);
    shanghaiImgs.me.push(loadImage(`assets/me-${num}.jpg`));
  }
  for (let i = 1; i <= SHANGHAI_COUNTS.places; i++) {
    const num = nf(i, 2);
    shanghaiImgs.places.push(loadImage(`assets/places-${num}.jpg`));
  }
  
  for (let i = 1; i <= ABU_DHABI_COUNTS.campus; i++) {
    const num = nf(i, 2);
    abuImgs.campus.push(loadImage(`assets/campus-${num}.jpg`));
  }
  for (let i = 1; i <= ABU_DHABI_COUNTS.friends; i++) {
    const num = nf(i, 2);
    abuImgs.friends.push(loadImage(`assets/friends-${num}.jpg`));
  }
  for (let i = 1; i <= ABU_DHABI_COUNTS.outside; i++) {
    const num = nf(i, 2);
    abuImgs.outside.push(loadImage(`assets/outside-${num}.jpg`));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  noStroke();
  textFont('Helvetica');
  
  parts = {
    shanghai: [
      { name: "Friends", key: "friends", explored: false },
      { name: "Places", key: "places", explored: false },
      { name: "Me", key: "me", explored: false }
    ],
    abu: [
      { name: "Campus", key: "campus", explored: false },
      { name: "Friends", key: "friends", explored: false },
      { name: "Outside", key: "outside", explored: false }
    ]
  };
}

function draw() {
  background(0);
  
  if (state === "intro") {
    drawIntro();
  } else if (state === "transition") {
    drawAirplaneTransition();
  } else {
    drawGallery();
  }
}

function drawIntro() {
  background(0);
  fill(0, 0, 100);
  textAlign(CENTER, CENTER);

  textSize(48);
  text("Memories Across Cities", width / 2, height * 0.2);

  textSize(20);
  text("by Alibi Nauanov — Spring 2025", width / 2, height * 0.28);

  textAlign(LEFT, TOP);
  let margin = 485;
  let y = height * 0.35;
  let description = 
    "This is an interactive memory journal of my time in Shanghai and Abu Dhabi.\n\n" +
    "These two cities shaped my journey during a year abroad, and this project\n" +
    "aims to capture the essence of that experience through photographs and interaction.\n\n" +
    "The navigation instruction is in the next page.";

  textSize(16);
  textLeading(22);
  text(description, margin, y, width - 2 * margin, height - y - 100);

  // Buttons
  drawButton("Shanghai", width / 2 - 280, height * 0.65, 200, 60, 10);
  drawButton("Abu Dhabi", width / 2 + 80, height * 0.65, 200, 60, 200);
}

function drawGallery() {
  drawBackgroundPattern();

  drawPartNavigation();

  tiles.forEach(t => {
    t.update();
    t.display();
  });

  // transition effect
  if (isTransitioning) {
    transitionAlpha += 5;
    fill(0, 0, 100, transitionAlpha / 255);
    rect(0, 0, width, height);
    if (transitionAlpha >= 255) {
      isTransitioning = false;
      transitionAlpha = 0;
      createImageGrid();
    }
  }

  // Ripple effect
  if (rippleEffect) {
    rippleEffect.update();
    rippleEffect.display();
    if (rippleEffect.isDone()) rippleEffect = null;
  }

  // idle orbit
  if (idleAnimation) {
    idleOrbit();
  } else if (hoverTile === null) {
    resetTileTargets();
  }

  drawHelpBar();
  
  // continue button if enough images viewed
  if (exploredCount >= TARGET_VISIBLE * EXPLORE_THRESHOLD && !parts[currentSet].every(p => p.explored)) {
    drawContinueButton();
  }
}

function drawPartNavigation() {
  if (!currentSet) return;
  
  const currentParts = parts[currentSet];
  const buttonWidth = 120;
  const buttonHeight = 30;
  const startX = width/2 - (currentParts.length * buttonWidth + (currentParts.length-1)*10)/2;
  
  currentParts.forEach((part, i) => {
    const x = startX + i * (buttonWidth + 10);
    const y = 20;
    const isCurrent = currentPart.key === part.key;
    
    // button text
    fill(0, 0, 100);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(part.name, x + buttonWidth/2, y + buttonHeight/2);
    
    if (part.explored) {
      noFill();
      stroke(currentSet === "shanghai" ? 10 : 200, 80, 100);
      strokeWeight(2);
      rect(x, y, buttonWidth, buttonHeight, 5);
    }
  });
}

function drawAirplaneTransition() {
  background(0, 0, 20);

  // smooth fade in effect
  fill(0, 0, 0, map(airplaneProgress, 0, 1, 255, 0));
  rect(0, 0, width, height);

  drawClouds();
  drawAirplane();

  airplaneProgress += 0.01;
  if (airplaneProgress >= 1) {
    state = "gallery";
    airplaneProgress = 0;
    createImageGrid();
    return;
  }

  fill(0, 0, 100);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(`Flying to ${currentSet === "shanghai" ? "Shanghai" : "Abu Dhabi"}...`, width / 2, height - 100);
}

function drawContinueButton() {
  let nextPart = parts[currentSet].find(p => !p.explored);
  if (!nextPart) return;
  
  let btnText = `Continue to ${nextPart.name}`;
  let btnWidth = textWidth(btnText) + 40;
  
  // button background
  fill(0, 0, 100, 0.8);
  rect(width/2 - btnWidth/2, height - HELP_BAR - 50, btnWidth, 40, 5);
  
  // button text
  fill(0, 0, 0);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(btnText, width/2, height - HELP_BAR - 30);
}

function mousePressed() {
  if (state === "intro") {
    const btnY = height * 2/3;
    const btnW = 200;
    const btnH = 60;

    const shanghaiX = width / 2 - 280;
    const abuX = width / 2 + 81;

    // check if Shanghai button clicked
    if (mouseX > shanghaiX && mouseX < shanghaiX + btnW &&
        mouseY > btnY && mouseY < btnY + btnH) {
      currentSet = "shanghai";
      currentPart = parts.shanghai[0];
      state = "transition";
    }
    else if (mouseX > abuX && mouseX < abuX + btnW &&
            mouseY > btnY && mouseY < btnY + btnH) {
      currentSet = "abu";
      currentPart = parts.abu[0];
      state = "transition";
    }
  } 
  else if (state === "gallery") {
    // check if part navigation button clicked
    if (mouseY >= 20 && mouseY <= 50) {
      const currentParts = parts[currentSet];
      const buttonWidth = 120;
      const startX = width/2 - (currentParts.length * buttonWidth + (currentParts.length-1)*10)/2;
      
      currentParts.forEach((part, i) => {
        const x = startX + i * (buttonWidth + 10);
        if (mouseX >= x && mouseX <= x + buttonWidth && !part.explored) {
          currentPart = part;
          exploredCount = 0;
          viewedImages.clear();
          createImageGrid();
          return;
        }
      });
    }
    
    // check if continue button clicked
    if (exploredCount >= TARGET_VISIBLE * EXPLORE_THRESHOLD && 
        mouseX > width/2 - 100 && mouseX < width/2 + 100 &&
        mouseY > height - HELP_BAR - 50 && mouseY < height - HELP_BAR - 10) {
      goToNextPart();
      return;
    }
    
    lastInteractionTime = millis();
    let clickedTile = tiles.find(t =>
      mouseX > t.x && mouseX < t.x + t.w &&
      mouseY > t.y && mouseY < t.y + t.h
    );

    if (!clickedTile) { closeActive(); return; }
    if (clickedTile === activeTile) { closeActive(); return; }

    closeActive();
    activeTile = clickedTile;
    activeTile.isActive = true;
    activeTile.pulse();
    rippleEffect = new RippleEffect(activeTile.cx, activeTile.cy, activeTile.img);
  }
}

function createImageGrid() {
  tiles.length = 0;
  if (!currentPart) return;

  const imgs = currentSet === "shanghai" ? shanghaiImgs[currentPart.key] : abuImgs[currentPart.key];

  const allImgs = shuffle(imgs.slice()).slice(0, TARGET_VISIBLE);

  const cols = 8;
  const rows = 5;

  const maxW = (width - MARGIN * (cols + 1)) / cols;
  const maxH = (height - MARGIN * (rows + 1) - HELP_BAR) / rows;
  const tileSize = min(maxW, maxH);
  const tileW = tileSize;
  const tileH = tileSize;

  const gridW = cols * tileW + (cols - 1) * MARGIN;
  const gridH = rows * tileH + (rows - 1) * MARGIN;
  const startX = (width - gridW) / 2 - 50;
  const startY = (height - gridH - HELP_BAR) / 2 + 40;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= allImgs.length) break;

      let x = startX + c * (tileW + MARGIN);
      let y = startY + r * (tileH + MARGIN);
      tiles.push(new MemoryTile(x, y, tileW, tileH, allImgs[idx], idx));
    }
  }
}

function drawBackgroundPattern() {
  fill(0, 0, 20);
  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 20) {
    const y = height - 50 - noise(x * 0.01, frameCount * 0.01) * 150;
    vertex(x, y);
  }
  vertex(width, height);
  endShape(CLOSE);
}

function drawHelpBar() {
  const msg = currentPart ? 
    `[A] Abu Dhabi   [S] Shanghai   [R] Shuffle   [C] Circle View   Click = open/close | Current: ${currentPart.name}` :
    "[A] Abu Dhabi   [S] Shanghai   [R] Shuffle   [C] Circle View   Click = open/close";
  
  textSize(14);
  textAlign(CENTER, BOTTOM);
  fill(0, 0, 90, 0.8);
  rectMode(CORNERS);
  noStroke();
  rect(0, height - HELP_BAR, width, height);
  fill(0, 0, 0);
  text(msg, width / 2, height - 6);
}

function idleOrbit() {
  autoRotateAngle += 0.002;

  const cx = width / 2;
  const cy = height / 2 + 20;
  const radius = min(width, height) * 0.35;

  tiles.forEach((t, i) => {
    const ang = autoRotateAngle + i * TWO_PI / tiles.length;
    const x = cx + cos(ang) * radius - t.w / 2;
    const y = cy + sin(ang) * radius - t.h / 2;

    t.setTarget(x, y, 0.8, ang);
  });
}

function resetTileTargets() {
  tiles.forEach(t => t.setTarget(t.originalX, t.originalY, 1, 0));
}

function closeActive() {
  if (activeTile) activeTile.isActive = false;
  activeTile = null;
  rippleEffect = null;
  resetTileTargets();
}

function keyPressed() {
  lastInteractionTime = millis();

  if (key === 's' || key === 'S') {
    if (currentSet !== "shanghai") {
      currentSet = "shanghai";
      currentPart = parts.shanghai[0];
      state = "transition";
      airplaneProgress = 0;
      exploredCount = 0;
      viewedImages.clear();
    }
  }
  else if (key === 'a' || key === 'A') {
    if (currentSet !== "abu") {
      currentSet = "abu";
      currentPart = parts.abu[0];
      state = "transition";
      airplaneProgress = 0;
      exploredCount = 0;
      viewedImages.clear();
    }
  }
  else if (key === 'r' || key === 'R') {
    shuffleImages();
  }
  else if (key === 'c' || key === 'C') {
    idleAnimation = !idleAnimation;
    idleTimer = millis();
    if (!idleAnimation) resetTileTargets();
  }
}

function shuffleImages() {
  const src = currentSet === "shanghai" ? shanghaiImgs[currentPart.key] : abuImgs[currentPart.key];
  const shuffled = shuffle(src.slice());
  tiles.forEach((t, i) => {
    t.img = shuffled[i % shuffled.length];
    t.setTarget(t.originalX, t.originalY, 1, 0);
  });
}

function drawButton(label, x, y, w, h, hue) {
  fill(hue, 80, 100);
  rect(x, y, w, h, 5);
  
  fill(0, 0, 100);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(label, x + w/2, y + h/2);
}

function drawClouds() {
  textSize(48);
  textAlign(CENTER, CENTER);

  for (let i = 0; i < 5; i++) {
    let x = (frameCount * 0.5 + i * 200) % (width + 200) - 100;
    let y = height / 4 + sin(frameCount * 0.02 + i) * 20;
    text("☁️", x, y);
  }
}

function drawAirplane() {
  push();
  textSize(100);
  textAlign(CENTER, CENTER);
  text("🛫", width * airplaneProgress, height / 2);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (state === "gallery") createImageGrid();
}

class MemoryTile {
  constructor(x, y, w, h, img, index) {
    this.originalX = x; this.originalY = y;
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.cx = x + w / 2; this.cy = y + h / 2;
    this.img = img; this.index = index;

    this.targetX = x; this.targetY = y;
    this.targetScale = 1; this.targetRot = 0;
    this.scale = 1; this.rot = 0;

    this.isActive = false;
    this.isHovered = false;
    this.pulseAmount = 0;
    this.hue = currentSet === "shanghai" ? 10 : 200;
    this.aspect = img.width / img.height;
  }

  setTarget(x, y, s = this.targetScale, r = this.targetRot) {
    this.targetX = clampX(x, this.w);
    this.targetY = clampY(y, this.h);
    this.targetScale = s;
    this.targetRot = r;
  }

  update() {
    this.x = lerp(this.x, this.targetX, 0.1);
    this.y = lerp(this.y, this.targetY, 0.1);
    this.cx = this.x + this.w / 2;
    this.cy = this.y + this.h / 2;

    this.scale = lerp(this.scale, this.targetScale, 0.1);
    this.rot = lerp(this.rot, this.targetRot, 0.05);
    if (this.pulseAmount > 0)
      this.pulseAmount = max(0, this.pulseAmount - 0.05);
  }

  display() {
    push();
    translate(this.cx, this.cy);
    let sc = this.scale + this.pulseAmount * 0.2;
    if (this.isHovered && !this.isActive) sc *= 1.15;
    scale(sc);
    rotate(this.rot);

    // fit image
    let dW, dH;
    if (this.aspect > 1) {
      dH = this.h;
      dW = this.h * this.aspect;
    } else {
      dW = this.w;
      dH = this.w / this.aspect;
    }

    if (this.isActive) {
      tint(this.hue, 40, 100);
      image(this.img, -dW * 1.3 / 2, -dH * 1.3 / 2, dW * 1.3, dH * 1.3);
      noFill();
      strokeWeight(3 + sin(frameCount * 0.1) * 2);
      stroke(this.hue, 80, 100);
      rect(-dW * 0.65, -dH * 0.65, dW * 1.3, dH * 1.3, 5);
    } else {
      tint(this.hue, this.isHovered ? 30 : 20, 100, 0.9);
      image(this.img, -dW / 2, -dH / 2, dW, dH);
    }
    pop();
  }

  pulse() { this.pulseAmount = 1; }
}

class RippleEffect {
  constructor(x, y, img) {
    this.x = x; this.y = y; this.img = img;
    this.r = 5; this.maxR = min(width, height) * 0.7;
    this.alpha = 255; this.speed = 5;
    this.aspect = img.width / img.height;
  }
  
  update() {
    this.r += this.speed;
    this.alpha = map(this.r, 5, this.maxR, 255, 0);
    if (this.r > this.maxR) this.r = this.maxR;
  }
  
  display() {
    push();
    translate(this.x, this.y);
    noFill();
    strokeWeight(2);
    stroke(0, 0, 100, this.alpha / 255);
    circle(0, 0, this.r * 2);
    circle(0, 0, this.r * 1.5);
    circle(0, 0, this.r);

    imageMode(CENTER);
    tint(255, this.alpha);
    let s;
    if (this.aspect > 1) {
      s = min(width * 0.4, this.img.width * 0.5);
      image(this.img, 0, 0, s, s / this.aspect);
    } else {
      s = min(height * 0.4, this.img.height * 0.5);
      image(this.img, 0, 0, s * this.aspect, s);
    }
    pop();
  }
  
  isDone() { return this.r >= this.maxR; }
}