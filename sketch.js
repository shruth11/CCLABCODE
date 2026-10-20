// TRACE - a creature that wanders a habitat and feeds on it. 800 x 500

let t = 0;
let cx;
let cy;
let energy = 0.5;
let dormant = false;
let idleFrames = 0;
let lastX = 0;
let lastY = 0;
let fieldOffset = 0;

// the two ends of the colour gradient, kept as plain numbers
let rA = 0;
let gA = 0;
let bA = 0;
let rB = 0;
let gB = 0;
let bB = 0;

function setup() {
  createCanvas(800, 500);
  angleMode(DEGREES);
  cx = width / 2;
  cy = height / 2;
}

function draw() {
  t = t + 1;
  mixPalette();

  // a see-through wipe instead of background(), so the old frame fades
  noStroke();
  fill(6, 11, 9, 55);
  rect(0, 0, width, height);

  drawStrata();
  drawColonies();
  drawSpores();
  watchIdle();
  moveCreature();

  push();
  translate(cx, cy);
  drawCreature();
  pop();
}

// three sines 120 degrees apart walk R, G and B around the spectrum.
// the B set runs the same walk, started 70 degrees later.
function mixPalette() {
  let a = t * 0.4;
  rA = 128 + sin(a) * 110;
  gA = 128 + sin(a + 120) * 110;
  bA = 128 + sin(a + 240) * 110;
  rB = 128 + sin(a + 70) * 110;
  gB = 128 + sin(a + 190) * 110;
  bB = 128 + sin(a + 310) * 110;
}

// amount is 0 at one end of the gradient and 1 at the other
function fillMix(amount, alpha) {
  noStroke();
  fill(rA + (rB - rA) * amount, gA + (gB - gA) * amount, bA + (bB - bA) * amount, alpha);
}

// ---------- habitat ----------

// layers of ground, bent by a sine and roughened by noise
function drawStrata() {
  noStroke();
  fill(14, 20, 15);
  rect(0, 345, width, height - 345);

  for (let y = 338; y < height + 30; y = y + 18) {
    let shade = map(y, 338, height, 95, 34);
    stroke(shade * 0.95, shade, shade * 0.72, 215);
    strokeWeight(2.2);
    let px = 0;
    let py = y;
    for (let x = 0; x <= width; x = x + 18) {
      let yy = y + sin(x * 0.011) * 16 + (noise(x * 0.005 + fieldOffset, y * 0.01) - 0.5) * 34;
      line(px, py, x, yy);
      px = x;
      py = yy;
    }
  }
  noStroke();
}

// growths that were here before the creature arrived
function drawColonies() {
  noFill();
  strokeWeight(1.4);
  for (let c = 0; c < 3; c++) {
    let colX = map(c, 0, 2, 160, width - 160) + (noise(c * 9 + fieldOffset) - 0.5) * 150;
    let colY = 100 + noise(c * 9 + 55 + fieldOffset) * 190;
    for (let ring = 1; ring < 9; ring++) {
      stroke(40, 120, 105, map(ring, 1, 8, 150, 35));
      beginShape();
      for (let a = 0; a < 360; a = a + 10) {
        let rr = ring * 11 + sin(a * 5) * 10 * (ring / 8) + noise(a * 0.012 + c * 40 + fieldOffset, ring * 0.3) * 34;
        vertex(colX + cos(a) * rr, colY + sin(a) * rr);
      }
      endShape(CLOSE);
    }
  }
  noStroke();
}

// a jittered grid. only the rich spots in the noise field grow a spore,
// and nothing is stored: every spore is worked out again each frame.
function drawSpores() {
  for (let i = 0; i < 50; i++) {
    for (let j = 0; j < 32; j++) {
      let x = i * 16 + (noise(i * 1.7, j * 1.7) - 0.5) * 30;
      let y = j * 16 + (noise(i * 1.7 + 40, j * 1.7 + 40) - 0.5) * 30;
      let n = noise(x * 0.009 + fieldOffset, y * 0.009);

      if (n > 0.505) {
        let d = (n - 0.505) * 42 * (0.4 + noise(i * 2.3 + 90, j * 2.3 + 90));

        // holding the mouse draws the ground in toward the creature
        if (mouseIsPressed === true) {
          if (dist(cx, cy, x, y) < 100) { d = d * 0.25; energy = energy + 0.00006; }
        }
        fill(50, 130 + n * 80, 80 + n * 50, 32);
        circle(x, y, d * 2.8);
        fill(80, 175 + n * 55, 120 + n * 45, 185);
        circle(x, y, d);
      }
    }
  }
}

// ---------- behaviour ----------

// if the cursor has not moved for a while, the creature settles down
function watchIdle() {
  if (mouseX === lastX && mouseY === lastY) {
    idleFrames = idleFrames + 1;
  } else {
    idleFrames = 0;
  }
  lastX = mouseX;
  lastY = mouseY;
  if (idleFrames > 150) { dormant = true; } else { dormant = false; }
}

function moveCreature() {
  cx = cx + (noise(t * 0.006) - 0.5) * 2.6;
  cy = cy + (noise(t * 0.006 + 90) - 0.5) * 2.6;

  if (dormant === false) {
    cx = cx + (mouseX - cx) * 0.016;
    cy = cy + (mouseY - cy) * 0.016;
  }

  if (cx < 40) { cx = 40; }
  if (cx > width - 40) { cx = width - 40; }
  if (cy < 40) { cy = 40; }
  if (cy > height - 40) { cy = height - 40; }

  energy = energy - 0.0012;
  if (energy < 0.15) { energy = 0.15; }
  if (energy > 1) { energy = 1; }
}

// ---------- the creature ----------

function drawCreature() {
  let reach = 0.55 + energy * 0.6;
  if (dormant === true) { reach = reach * 0.55; }

  push();
  scale((0.5 + energy * 0.6) * (1 + sin(t * 1.4) * 0.1));

  for (let i = 3; i > 0; i--) {
    fillMix(i / 3, 13);
    circle(0, 0, 260 * (i / 3));
  }

  for (let i = 0; i < 7; i++) {
    push();
    rotate(i * 51.4 + sin(t * 0.7) * 7);
    drawArm(9, 25 * reach, 18, i * 40);
    pop();
  }

  drawBody(62);
  drawCore(25);
  pop();
}

// a chain of segments. each one rotates a little further than the last,
// so a wave travels from the base out to the tip.
function drawArm(segs, segLen, baseWidth, phase) {
  push();
  translate(34, 0);

  let speed = 2.2;
  if (dormant === true) { speed = 0.6; }

  for (let s = 0; s < segs; s++) {
    rotate(sin(t * speed + phase + s * 26) * (34 / segs) + 6);
    let f = s / segs;
    let w = baseWidth * (1 - f) + 2;
    fillMix(f, 70);
    ellipse(segLen * 0.5, 0, segLen * 1.35, w * 2.2);
    fillMix(f, 225);
    ellipse(segLen * 0.5, 0, segLen, w);
    translate(segLen * 0.78, 0);
  }

  let open = map(sin(t * 1.6 + phase), -1, 1, 0.25, 1);
  if (mouseIsPressed === true) { open = 1; }
  if (dormant === true) { open = 0.15; }
  drawCap(17, open);
  pop();
}

// five petals that fold open and shut
function drawCap(size, open) {
  for (let p = 0; p < 5; p++) {
    push();
    rotate(p * 72 + 20 - 45 * (1 - open));
    noStroke();
    fill(rB + (255 - rB) * 0.55, gB + (255 - gB) * 0.55, bB + (255 - bB) * 0.55, 215);
    ellipse(size * 0.55 * open + 2, 0, size * 1.1 * open + 3, size * 0.5);
    pop();
  }
  fill(255, 255, 245);
  circle(0, 0, size * 0.45);
}

// nested lumpy shells, each a step further along the gradient
function drawBody(r) {
  for (let i = 6; i >= 0; i--) {
    let f = i / 6;
    fillMix(f, 75);
    beginShape();
    for (let a = 0; a < 360; a = a + 6) {
      let rr = r * (0.42 + f * 0.82);
      rr = rr + sin(a * 6 + t * 1.1) * rr * 0.16 + (noise(a * 0.02, t * 0.01) - 0.5) * rr * 0.28;
      vertex(cos(a) * rr, sin(a) * rr);
    }
    endShape(CLOSE);
  }
}

function drawCore(size) {
  let pulse = 1 + sin(t * 3.1) * 0.2;
  fillMix(0, 70);
  circle(0, 0, size * 2.8 * pulse);
  fill(255, 255, 240, 120 + energy * 135);
  circle(0, 0, size * pulse);
}

// a brand new habitat
function keyPressed() {
  fieldOffset = random(1000);
}
