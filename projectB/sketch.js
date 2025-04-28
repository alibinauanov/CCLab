let tiles = [];
let ripples = [];
let artworks = [];   // Louvre images
let snapshots = [];   // Abu Dhabi pics
let soundscape;
let inactivityTimer = 0;        // ms since last interaction
const INACTIVITY_RESET = 60000; // 60 s

function preload() {
  // --- load 3 Louvre pieces (public domain) ---
  artworks.push(loadImage("assets/louvre-01.jpg"));
  artworks.push(loadImage("assets/louvre-02.jpeg"));
  artworks.push(loadImage("assets/louvre-03.jpg"));

  // --- load 3 personal photos ---
  snapshots.push(loadImage("assets/snap-01.jpg"));
  snapshots.push(loadImage("assets/snap-02.jpg"));
  snapshots.push(loadImage("assets/snap-03.jpg"));
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);

  // build mosaic grid (hex-ish spacing for dome vibe)
  const tileSize = 80;
  const xStep = tileSize * 0.87; // cos(30°) for hex packing
  const yStep = tileSize * 0.75;

  for (let y = -tileSize; y < height + tileSize; y += yStep) {
    for (let x = -tileSize; x < width + tileSize; x += xStep) {
      // offset every other row like honeycomb
      const xPos = (floor(y / yStep) % 2 === 0) ? x : x + tileSize * 0.43;
      const artImg = random(artworks);
      const snapImg = random(snapshots);
      tiles.push(new ArtworkTile(xPos, y, tileSize, artImg, snapImg));
    }
  }

  soundscape = new Soundscape();
}

function draw() {
  background(0);

  // update & display tiles
  for (const t of tiles) t.display();

  // update ripples (iterate backwards if we delete)
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.update();
    r.display();

    if (r.isDone) ripples.splice(i, 1);
  }

  // inactivity check – reassemble after 60 s
  if (millis() - inactivityTimer > INACTIVITY_RESET) {
    for (const t of tiles) t.resetOverlay();
  }
}

function mouseMoved() { spawnRipple(mouseX, mouseY); }
function mouseDragged() { spawnRipple(mouseX, mouseY); }
function touchMoved() { spawnRipple(mouseX, mouseY); return false; }

function spawnRipple(x, y) {
  inactivityTimer = millis();
  ripples.push(new Ripple(x, y));
}

/* ----------  Classes  ---------- */

class ArtworkTile {
  constructor(x, y, size, artImg, snapImg) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.artImg = artImg;
    this.snapImg = snapImg;
    this.overlayAlpha = 0;     // 0-255
    this.lastReveal = 0;       // millis of last overlay hit
  }

  display() {
    push();
    translate(this.x, this.y);
    
    // Check if images are loaded
    if (this.artImg && this.artImg.width > 0) {
      tint(255);
      image(this.artImg, 0, 0, this.size, this.size);
    } else {
      // Fallback rectangle if image fails to load
      fill(50);
      rect(-this.size/2, -this.size/2, this.size, this.size);
    }

    // overlay personal snapshot
    if (this.overlayAlpha > 0 && this.snapImg && this.snapImg.width > 0) {
      tint(255, this.overlayAlpha);
      image(this.snapImg, 0, 0);
      // fade out slowly
      this.overlayAlpha = max(0, this.overlayAlpha - 2);
    }
    pop();
  }

  reveal() {
    this.overlayAlpha = 200;   // quick flash of memory
    this.lastReveal = millis();
  }

  resetOverlay() {
    this.overlayAlpha = 0;
  }
}

class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startTime = millis();
    this.duration = 1500;   // ms
    this.maxRadius = 250;
    this.isDone = false;
  }

  update() {
    const t = millis() - this.startTime;
    const pct = t / this.duration;
    if (pct > 1) {
      this.isDone = true;
      return;
    }

    // hit tiles inside current radius
    const radius = pct * this.maxRadius;
    for (const tile of tiles) {
      const d = dist(this.x, this.y, tile.x, tile.y);
      if (d < radius && millis() - tile.lastReveal > 200) {
        tile.reveal();
      }
    }
  }

  display() {
    const t = millis() - this.startTime;
    const pct = t / this.duration;
    if (pct > 1) return;

    const radius = pct * this.maxRadius;
    noFill();
    stroke(255, 100 - pct * 100);
    strokeWeight(2);
    circle(this.x, this.y, radius * 2);
  }
}

class Soundscape {
  constructor() {
    // Simplified without sound for now
    // Sound would require proper setup and user interaction
    this.baseVolume = 0.15;
  }

  fadeIn() {
    // Placeholder for sound functionality
  }

  bump() {
    // Placeholder for sound functionality
  }
}

/* ----------  window helpers  ---------- */
function windowResized() { 
  resizeCanvas(windowWidth, windowHeight); 
}