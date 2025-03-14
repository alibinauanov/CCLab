let bacteria = {
    x: 400,
    y: 250,
    angle: 0,
    size: 0.5,
    hue: 150,
    speed: 2,
    radius: 50,
    particlesEaten: 0
};

let particles = [];

function setup() {
    let canvas = createCanvas(800, 500);
    canvas.id("p5-canvas");
    canvas.parent("p5-canvas-container");
    colorMode(HSB);

    // initialize particles with random motion properties and colors
    for (let i = 0; i < 100; i++) {
        particles.push({
        x: random(width),
        y: random(height),
        speedX: random(-0.5, 0.5),
        speedY: random(-0.5, 0.5),
        size: random(5, 10),
        hue: random(0, 360),
        active: true
        });
    }
}

function draw() {
    background(220, 100, 30);
    updateBacteria();  
    updateParticles();  
    drawBacteria(bacteria.x, bacteria.y);
}

function updateBacteria() {
    // move bacteria towards mouse
    let targetX = mouseX;
    let targetY = mouseY;
    bacteria.x = lerp(bacteria.x, targetX, 0.1);
    bacteria.y = lerp(bacteria.y, targetY, 0.1);

    // rotate bacteria towards mouse
    let targetAngle = atan2(mouseY - bacteria.y, mouseX - bacteria.x); 
    bacteria.angle = lerp(bacteria.angle, targetAngle, 0.5);

    // pulsing size using sine wave
    bacteria.size = 0.5 + sin(frameCount * 0.1) * 0.1 + bacteria.particlesEaten * 0.025;
}

function drawBacteria(x, y) {
    push();
    translate(x, y);
    rotate(bacteria.angle);

    // main cell body with dynamic size
    noStroke();
    fill(bacteria.hue, 70, 220, 0.8);

    beginShape();
    for (let angle = 0; angle < 360; angle += 10) {
        // animated shape using noise and sine
        let radius = 50 * bacteria.size + sin(radians(angle * 3 + frameCount * 5)) * 10;
        let px = radius * cos(radians(angle));
        let py = radius * sin(radians(angle));
        vertex(px, py);
    }
    endShape(CLOSE);

    // cell membrane with dynamic stroke
    stroke(map(y, 0, height, 80, 160), 100, 160);
    strokeWeight(2);
    noFill();
    ellipse(0, 0, 100 * bacteria.size, 60 * bacteria.size);

    // nucleoid with subtle movement
    fill(50, 50, 200, 150);
    noStroke();
    ellipse(10 * bacteria.size, -5 * bacteria.size, 30 * bacteria.size, 20 * bacteria.size);

    // animated flagella
    stroke(200, 50);
    for (let i = 0; i < 8; i++) {
        let angle = map(i, 0, 8, 0, TWO_PI);
        let fx = 50 * cos(angle) * bacteria.size;
        let fy = 30 * sin(angle) * bacteria.size;
        drawFlagellum(fx, fy, angle + frameCount * 0.05);
    }

    // surface proteins with random motion
    fill(0, 80, 200);
    for (let i = 0; i < 20; i++) {
        let radius = 45 * bacteria.size + sin(frameCount * 0.2 + i) * 5;
        let px = radius * cos(radians(i * 18 + frameCount * 2));
        let py = radius * sin(radians(i * 18 + frameCount * 2));
        ellipse(px, py, 3, 6);
    }
    pop();
}

function drawFlagellum(x, y, baseAngle) {
    push();
    translate(x, y);
    rotate(baseAngle);

    noFill();
    beginShape();
    for (let i = 0; i < 10; i++) {
        // sine wave flagellum
        let sway = sin(frameCount * 0.1 + i * 0.5) * 20 * bacteria.size;
        vertex(i * 15, sway);
    }
    endShape();
    pop();
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];

        if (!p.active) continue;

        // random walk motion
        p.x += p.speedX + random(-0.3, 0.3);
        p.y += p.speedY + random(-0.3, 0.3);

        // wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // check for collision with bacteria
        let d = dist(p.x, p.y, bacteria.x, bacteria.y);
        if (d < bacteria.radius + p.size / 2) {
        p.active = false;
        bacteria.particlesEaten++;
        // blend the bacteria's hue with the particle's hue
        bacteria.hue = lerp(bacteria.hue, p.hue, 0.1);
        }

        // draw active particles
        if (p.active) {
        // size change based on position
        let particleSize = map(p.x, 0, width, 5, 10);
        fill(p.hue, 100, 100);
        ellipse(p.x, p.y, particleSize, particleSize);
        }
    }

    particles = particles.filter(p => p.active);
}