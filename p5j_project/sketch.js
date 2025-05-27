// Objects
const stars = [];
let fragments = [];
let balloons = [];

let earthGeom, moonGeom;
let earthTex, moonTex;
let earthRadius = 110, moonRadius = 28;
let earthVisible = true;


// Variables Object Moving
let splitT = 0;
let earthAngle = 0, earthAngleY = 0.8; 
let earthSpeed = 0.25;
let speedUpEarth = false;
let slowEarthSpeed = 0.02;
let splitOffset = 0;

let moonAngle = 0;
let slowMoonSpeed  = 0.5;
let animateMoon = false;
let animateMoon2 = false;
let moonPosition, moonTarget, moonTarget2, moonSpeed =0;
let splitMoon = false;

let starActive = false;   // “should we be spinning the stars?”
let starDone   = false;   // “have we turned them off again?”
let starRotationSpeed = 0.2;
let slowIntox = 0;
let deIntox = 0;


// Baloon moving
let balloonArcCenter;
let balloonArcAngle = 0;
const balloonArcRadius = 100;
let balloonArcMoving = false;
let balloonPos;


// flash
let flashAlpha = 0;
let flashActive = false;
let flashTimer = 0;
const flashHold = 1.5;      // seconds at full white
const flashFadeDuration = 0.3; // seconds to fade out


// camera
let coolIntroduction = true;
let introCamX = 100;
let introCamY = -100;
let introCamZ = 400;
let introCamTargetZ = 140;
let introCamSpeed = 10; // units per second


let cameraTimer = 0;
const cameraHold = 1;

let camAngle  = 0;
const camRadius = 400;
const camHeight = 50;  

let freeMovement = false;

// Extra
let clickCount = 0;






function preload() {
  earthTex = loadImage('assets/8k_earth_nightmap.jpg');
  moonTex  = loadImage('assets/8k_moon.jpg');
  moonLeftTex  = loadImage('assets/8k_moon_left.png');
  moonRightTex = loadImage('assets/8k_moon_right.png');
  air_baloon  = loadImage('assets/balloon_texture.jpg');
  basket = loadImage('assets/basket.png');
}






function setup() {

  // CINEMA LAYOUT
  canvas = document.querySelector('canvas');
  //canvas.style.border = '4px solid white'; // 4px wide white border
  document.getElementById('costl').style.display = 'none';




  // Set up the canvas
  createCanvas(800, 600, WEBGL);
  pixelDensity(1);           
  perspective(radians(85), width / height, 1, 10000);
  noStroke();


  // Creating stars background
  for (let i = 0; i < 1000; i++) {
    let R = random(550, 2500);
    let dir = p5.Vector.random3D();
    let pos = dir.mult(R); 

    // create your star vector
    let star = createVector(pos.x, pos.y, pos.z);
    star.initialPosition = star.copy();

    stars.push(star);
  }


  // Settinp up planets
  earthGeom = buildGeometry(() => sphere(earthRadius, 30, 30));
  moonGeom  = buildGeometry(() => sphere(moonRadius, 22, 22));


  // Future moon positions
  moonPosition = createVector(100, -300, -1500);
  moonTarget   = createVector(200, -100,   -100);
  moonTarget2  = createVector(0,  0,  0);

  for (let i = 0; i < 1; i++) {
    balloons.push({
      pos: createVector(
        random(-50, 50),    // x jitter
        random(-20,  20),   // y jitter
        -150                // all start at z=-300 behind earth
      ),
      moving: false
    });
  }

}








function draw() { 
  const dt = deltaTime / 1000;

  if(!freeMovement) {
    background(1);
    camera(100, introCamY, introCamZ,
          0, 0, -300,
          0, 1, 0);

    introCamZ = max(introCamZ - dt * introCamSpeed, introCamTargetZ);
    if (introCamZ <= introCamTargetZ) {
      coolIntroduction = false;
    }
  }else{
    orbitControl();
  }




  if (freeMovement) {

    stars.length = 0;
    const NEW_STAR_COUNT = 300;           // far fewer than before
    for (let i = 0; i < NEW_STAR_COUNT; i++) {
      let R   = random(550, 2500);
      let dir = p5.Vector.random3D().mult(R);
      let star = createVector(dir.x, dir.y, dir.z);
      star.initialPosition = star.copy();
      // give each star its own random rotation direction (+1 or -1)
      star.rotDir = random() < 0.5 ? 1 : -1;
      stars.push(star);
    }

    let baseRot = starRotationSpeed * dt;
    for (let p of stars) {
      // each star gets its own direction
      let rot = baseRot * p.rotDir;
      let c   = cos(rot),
          s   = sin(rot);

      // rotate Y→Z or whatever axis you like
      let x = p.y * c - p.z * s;
      let z = p.y * s + p.z * c;

      // blend back toward their “initial” spot by deIntox factor
      p.y = lerp(x, p.initialPosition.x, deIntox);
      p.z = lerp(z, p.initialPosition.z, deIntox);
    }
  }else{
    if (starActive && !starDone){
      deIntox += dt*0.01;
    }else if (starDone){
      if (deIntox < 2) {
        deIntox += dt*1;
      }else {
        deIntox += dt*0.000000001;
      }
    }

    if (starActive) {
      let rot = starRotationSpeed * dt;
      let c = cos(rot),
          s = sin(rot);

      for (let i = 0; i < stars.length; i++) {
        let p = stars[i];
        // rotate around the Y axis (up):
        let x = p.y * c - p.z * s;
        let z = p.y * s + p.z * c;
        p.y = x * (1-deIntox) + (deIntox)*p.initialPosition.x; // de-intoxicate Y
        p.z = z * (1-deIntox) + (deIntox)*p.initialPosition.z; // de-intoxicate Z
      }
    }

  }

  
    // stars
    push();
      stroke(255);
      strokeWeight(2);
      beginShape(POINTS);
        stars.forEach(s => vertex(s.x, s.y, s.z));
      endShape();
    pop();




  if(speedUpEarth){
    earthSpeed = min(earthSpeed + dt * 1.2, 11);
    //earthAngleY = earthAngleY + dt - 0.1;
  }
  earthAngle += dt * earthSpeed;
  moonAngle  += dt * 1.8;


  if (earthVisible) {
    push();
      rotateX(-earthAngle - 2.8);
      rotateZ(earthAngleY);
      noStroke();  
      texture(earthTex);
      model(earthGeom);
    pop();
  }







  /* ------------- LUNA ------------- */
  // Primo step di avvicinamento
  if (animateMoon) {
    moonSpeed = lerp(moonSpeed, 1, (dt *2)*(dt *2));
    moonPosition.lerp(moonTarget, dt *moonSpeed);
  }

  // Secondo step + slow-motion
  if (animateMoon2) {
    moonPosition.lerp(moonTarget2, dt *  0.4);

    // gradually slow down:
    earthAngle = lerp(earthAngle, slowEarthSpeed, dt * 1.5);
    moonAngle  = lerp(moonAngle,  slowMoonSpeed,  dt * 1.5);
  }
  

  if (!splitMoon) {
    push();
      noStroke();
      translate(moonPosition.x, moonPosition.y, moonPosition.z);
      rotateY(moonAngle);
      texture(moonTex);
      model(moonGeom);
    pop();
  } else {

    splitT = min(splitT + dt * 0.02, 0.5);
    splitOffset = lerp(0, 100, splitT);

    push();
      texture(moonTex);
      fragments.forEach(f => {

        f.x += f.vx * dt * 100;
        f.y += f.vy * dt * 100;
        f.z += f.vz * dt * 100;
        // damp velocity so they slow to a stop
        let damp = 0.98;
        f.vx *= damp;
        f.vy *= damp;
        f.vz *= damp;

        push();
          translate(f.x, f.y, f.z);
          sphere(f.r, 6, 6);
        pop();
      });
    pop();
  }

  


  
  

  if (balloonArcMoving) {
    earthSpeed = min(earthSpeed + dt * 0.1, 0.5);
    balloonPos.lerp(moonTarget, dt * 0.1);
  }

  for (let b of balloons) {
    if (b.moving) {
      // lerp each one toward the moon’s first stop (moonTarget)
      b.pos.lerp(moonTarget, dt * 0.1);
    }
    // draw it smaller:
    drawHotAirBalloon(b.pos.x, b.pos.y, b.pos.z, 0.1);
  }











  if (animateMoon2 && !flashActive && !splitMoon) {
    // distanza fra i due centri
    let d_centers = p5.Vector.dist(moonPosition, createVector(0,0,0));
    // quando i bordi si toccano
    if (d_centers <= earthRadius + moonRadius && !splitMoon) {
      flashActive = true;
      flashAlpha  = 255;
      flashTimer  = 0;


      splitMoon   = true;
      earthVisible = false;
      animateMoon2  = false;


      // clear out any old fragments
      fragments = [];

      // 30 small bits, radius 2–6
      for (let i = 0; i < 100; i++) {
        fragments.push({
          x: moonPosition.x,
          y: moonPosition.y + random(-(moonRadius+60), (moonRadius+60)),
          z: moonPosition.z + random(-(moonRadius+60), (moonRadius+60)),
          r: random(2, 6),
          vx: random(-0.25,0.25),
          vy: random(-0.25,0.25),
          vz: random(-0.25,0.25)
        });
      }
      // 15 medium bits, radius 8–11, x-offset 10→20
      let medCount = 18;
      for (let i = 0; i < medCount; i++) {
        let sign = i < medCount/2 ? +1 : -1;
        fragments.push({
          x: moonPosition.x + random(35, 45) * sign,
          y: moonPosition.y + random(-(moonRadius+10), (moonRadius+10)),
          z: moonPosition.z + random(-(moonRadius+10), (moonRadius+10)),
          r: random(8, 11),
          vx: random(0,0.5) * sign,
          vy: random(0,0.5) * sign,
          vz: random(0,0.5) * sign
        });
      }

      // 5 large bits, radius 12–15, x-offset 20→40
      let largeCount = 8;
      for (let i = 0; i < largeCount; i++) {
        let sign = i < largeCount/2 ? +1 : -1;
        fragments.push({
          x: moonPosition.x + random(75, 90) * sign,
          y: moonPosition.y + random(-(moonRadius+10), (moonRadius+10)),
          z: moonPosition.z + random(-(moonRadius+10), (moonRadius+10)),
          r: random(15, 20),
          vx: random(0,1) * sign,
          vy: random(0,1) * sign,
          vz: random(0,1) * sign
        });
      }
    }
  }

  // se flash attivo, sovrapponi un bianco che svanisce
  if (flashActive) {
    flashTimer += dt;
    drawingContext.disable(drawingContext.DEPTH_TEST);
 
    // porta a schermo 2D
    push();
      resetMatrix();
      noLights();
      fill(255, flashAlpha);
      rect(-width/2, -height/2, width, height);
    pop();

    camAngle += dt * 0.2;

    // compute a point on the circle around (0,0,0) or your moon center
    let cx = moonPosition.x + camRadius * cos(camAngle);
    let cz = moonPosition.z + camRadius * sin(camAngle);
    let cy = moonPosition.y + camHeight;

    // look back at the moon’s center
    camera(cx, cy, cz,
          moonPosition.x, moonPosition.y, moonPosition.z,
          0, 1, 0);

    // hold at 255 for flashHold seconds, then fade over flashFadeDuration
    if (flashTimer > flashHold) {
      // time since fade started
      let t = flashTimer - flashHold;
      // linear fade 255→0 over flashFadeDuration
      flashAlpha = max(255 * (1 - t/flashFadeDuration), 0);

      if (flashAlpha <= 0) {
        flashActive = false;
        flashAlpha  = 0;
      }
    }
    drawingContext.enable(drawingContext.DEPTH_TEST);
  }

  if (!flashActive && splitMoon) {
    console.log(cameraTimer)
    cameraTimer += dt;
    if (cameraTimer > cameraHold) {
      freeMovement = true;
    }
  }
}





// Call this from draw() wherever you need the balloon
function drawHotAirBalloon(x, y, z, scaleFactor = 1) {
  push();
    // position & overall scale
    translate(x, y, z);
    scale(scaleFactor);

    // ► Balloon envelope (a slightly stretched sphere)
    noStroke();
    //fill(220, 60, 60);
    push();
      texture(air_baloon);
      scale(1, 1.4, 1);      // stretch vertically
      rotateX(-PI+0.1);
      sphere(50, 32, 32);    // radius, detailX, detailY
    pop();

    // ► Basket
    push();
      texture(basket);
      translate(0, 100, 0);
      box(30, 20, 20);
    pop();

    // ► Cables connecting basket to envelope
    stroke(80);
    strokeWeight(1);
    // front-left
    line(10, 100,  10,  20, 0, 20);
    // front-right
    line(-10, 100,  10,  -20, 0, 20);
    // back-left
    line(10, 100,  -10,  20, 0, -20);
    // back-right
    line(-10, 100,  -10,  -20, 0, -20);

  pop();
}





/*function startBalloonArc() {
  // compute midpoint between Earth (0,0,0) and Moon’s first target
  balloonArcCenter = p5.Vector.add(
    createVector(0,0,0),
    moonTarget
  ).div(2);


  balloonArcAngle = atan2(
    balloonPos.z - balloonArcCenter.z,
    balloonPos.x - balloonArcCenter.x
  );
  balloonArcMoving = true;
}*/





function mousePressed() {
  clickCount++;

  switch (clickCount) {
    case 1:
      starActive = true;
      break;
    case 2:
      speedUpEarth = true;
      break;  
    case 3:
      //deIntox = 0.5;
      starDone = true;
      break;
    case 4:
      animateMoon = true;
      break;
    case 5:
      //startBalloonArc();
      balloons.forEach(b => b.moving = true);
      break;
    case 6:
      animateMoon2 = true;
      animateMoon  = false;
      // slow-mo factors
      slowEarthSpeed = 0.02;
      slowMoonSpeed  = 0.5;

      break;
    default:
      console.log('Nothing to do');
  }
}

