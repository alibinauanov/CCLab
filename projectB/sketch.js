const NUM_IMAGES = 60;
const TARGET_VISIBLE = 60;

const HELP_BAR = 26;                // pixel height of the help bar
const MARGIN   = 10;                // outer + inner spacing for the grid

let shanghaiImgs = [], abuImgs = [];
let currentSet = "shanghai";

let tiles = [];
let hoverTile = null;
let activeTile = null;

let transitionAlpha = 0, isTransitioning = false;
let rippleEffect = null;
let lastInteractionTime = 0, idleTimer = 0, idleAnimation = false;
let autoRotateAngle = 0;

/* -------- clamp helpers: keep a tile inside the canvas ------------------ */
const clampX = (x, w) => constrain(x, MARGIN, width  - MARGIN - w);
const clampY = (y, h) => constrain(y, MARGIN, height - MARGIN - h - HELP_BAR);

/* ------------------------------------------------------------------------ */
function preload() {
  for (let i = 1; i <= NUM_IMAGES; i++) {
    shanghaiImgs.push(loadImage(`assets/shanghai-${nf(i, 2)}.jpg`));
    abuImgs.push(loadImage(`assets/abudhabi-${nf(i, 2)}.jpg`));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  noStroke();
  textFont('Helvetica');
  createImageGrid();
}

/* ====================== GRID LAYOUT ===================================== */
function createImageGrid() {
  tiles.length = 0;
  const imgs = currentSet === "shanghai" ? shanghaiImgs : abuImgs;

  // ensure we have ≥ TARGET_VISIBLE images
  const allImgs = [];
  const repeat = ceil(TARGET_VISIBLE / imgs.length);
  for (let i = 0; i < repeat; i++) allImgs.push(...imgs);

  const cols = 10, rows = 6;

  // largest tile that fits width & height (4:3 ratio)
  const maxW = (width  - MARGIN * (cols + 1)) / cols;
  const maxH = (height - MARGIN * (rows + 1) - HELP_BAR) / rows;
  const tileW = min(maxW, maxH / 0.75);
  const tileH = tileW * 0.75;

  /* grid starts at margin (no blank bands) */
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let x = MARGIN + c * (tileW + MARGIN) + random(-4, 4);
      let y = MARGIN + r * (tileH + MARGIN) + random(-4, 4);
      x = clampX(x, tileW);
      y = clampY(y, tileH);

      tiles.push(new MemoryTile(
        x, y, tileW, tileH,
        allImgs[idx % TARGET_VISIBLE], idx++
      ));
    }
  }
}

/* ====================== DRAW LOOP ======================================= */
function draw() {
  background(0);
  drawBackgroundPattern();

  tiles.forEach(t => {
    t.update();
    t.display();
  });

  // fade for set‑switch
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

  // ripple
  if (rippleEffect) {
    rippleEffect.update();
    rippleEffect.display();
    if (rippleEffect.isDone()) rippleEffect = null;
  }

  // idle orbit
  if (millis() - lastInteractionTime > 10000 && !idleAnimation) {
    idleAnimation = true;
    idleTimer = millis();
  }
  if (idleAnimation) idleOrbit();
  else if (hoverTile === null) resetTileTargets();

  drawHelpBar();
}

/* ====================== IDLE ORBIT ====================================== */
function idleOrbit() {
  autoRotateAngle += 0.002;
  const cx = width / 2, cy = height / 2, radius = min(width, height) * 0.4;

  tiles.forEach((t, i) => {
    const ang = autoRotateAngle + i * TWO_PI / tiles.length;
    t.setTarget(cx + cos(ang) * radius,
              cy + sin(ang) * radius,
              0.6, ang);

    if (i === floor((millis() - idleTimer) / 3000) % tiles.length)
      t.targetScale = 1.2;
  });

  if (millis() - lastInteractionTime < 10000) {
    idleAnimation = false;
    resetTileTargets();
  }
}

/* ====================== INPUT HANDLERS ================================== */
function mouseMoved() {
  lastInteractionTime = millis();

  hoverTile = null;
  let bestDist = 150;

  tiles.forEach(t => {
    const d = dist(mouseX, mouseY, t.cx, t.cy);
    t.isHovered = false;
    if (d < bestDist) {
      bestDist = d;
      hoverTile = t;
    }
  });

  if (hoverTile) {
    hoverTile.isHovered = true;

    // subtle push‑away
    tiles.forEach(t => {
      if (t === hoverTile) {
        t.setTarget(t.originalX, t.originalY);
      } else {
        const ang = atan2(t.cy - hoverTile.cy, t.cx - hoverTile.cx);
        const f = map(bestDist, 0, 150, 30, 0);
        t.setTarget(t.originalX + cos(ang) * f,
                    t.originalY + sin(ang) * f);
      }
    });
  }
}

function mousePressed() {
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

function keyPressed() {
  lastInteractionTime = millis();

  if (key === 's' || key === 'S') switchSet("shanghai");
  else if (key === 'a' || key === 'A') switchSet("abu");
  else if (key === ' ')               resetTileTargets();
  else if (key === 'r' || key === 'R') shuffleImages();
}

/* ====================== HELPERS ========================================= */
function switchSet(name) {
  if (currentSet === name) return;
  currentSet = name;
  isTransitioning = true;
}

function shuffleImages() {
  const src = currentSet === "shanghai" ? shanghaiImgs : abuImgs;
  const shuffled = shuffle(src.slice());
  tiles.forEach((t, i) => {
    t.img = shuffled[i % shuffled.length];
    t.setTarget(t.originalX, t.originalY, 1, 0);
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createImageGrid();
}

function closeActive() {
  if (activeTile) activeTile.isActive = false;
  activeTile = null;
  rippleEffect = null;
  resetTileTargets();
}

function resetTileTargets() {
  tiles.forEach(t => t.setTarget(t.originalX, t.originalY, 1, 0));
}

/* ====================== VISUAL HELPERS ================================== */
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
  const msg =
    "[A] Abu Dhabi   [S] Shanghai   [R] Shuffle   [Space] Reset   Click = open/close";
  textSize(14);
  textAlign(CENTER, BOTTOM);
  fill(0, 0, 90, 0.8);
  rectMode(CORNERS);
  noStroke();
  rect(0, height - HELP_BAR, width, height);
  fill(0, 0, 0);
  text(msg, width / 2, height - 6);
}

/* ====================== CLASSES ========================================= */
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
    this.targetRot   = r;
  }

  update() {
    this.x = lerp(this.x, this.targetX, 0.1);
    this.y = lerp(this.y, this.targetY, 0.1);
    this.cx = this.x + this.w / 2;
    this.cy = this.y + this.h / 2;

    this.scale = lerp(this.scale, this.targetScale, 0.1);
    this.rot   = lerp(this.rot,   this.targetRot,   0.05);
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
    if (this.aspect > 1) { dW = this.w; dH = this.w / this.aspect; }
    else                 { dH = this.h; dW = this.h * this.aspect; }

    if (this.isActive) {
      tint(this.hue, 40, 100);
      image(this.img, 0, 0, dW * 1.3, dH * 1.3);
      noFill();
      strokeWeight(3 + sin(frameCount * 0.1) * 2);
      stroke(this.hue, 80, 100);
      rect(-dW * 0.65, -dH * 0.65, dW * 1.3, dH * 1.3, 5);
    } else {
      tint(this.hue, this.isHovered ? 30 : 20, 100, 0.9);
      image(this.img, 0, 0, dW, dH);
      noFill();
      strokeWeight(1);
      stroke(0, 0, 100, 0.2);
      rect(-dW / 2, -dH / 2, dW, dH, 2);
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