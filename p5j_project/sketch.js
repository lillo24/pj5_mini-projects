let camAngle  = 0;
const camRadius = 400;      // how far out the camera orbits
const camHeight = 50;  

const stars = [];
let fragments = [];

let earthGeom, moonGeom;
let earthTex, moonTex;
let earthRadius = 110, moonRadius = 28;
let earthVisible = true;


let splitT = 0;
let earthAngle = 0, moonAngle = 0;
let slowEarthSpeed = 0.02;
let slowMoonSpeed  = 0.5;
let splitOffset = 0;

let animateMoon = false;
let animateMoon2 = false;
let moonPosition, moonTarget, moonTarget2;
let splitMoon = false;

// flash
let flashAlpha = 0;
let flashActive = false;
let flashTimer = 0;
const flashHold = 1.5;      // seconds at full white
const flashFadeDuration = 0.3; // seconds to fade out

// camera
let cameraMoving = false;
let cameraTimer = 0;
const cameraHold = 1;



function preload() {
  earthTex = loadImage('assets/8k_earth_nightmap.jpg');
  moonTex  = loadImage('assets/8k_moon.jpg');
  moonLeftTex  = loadImage('assets/8k_moon_left.png');
  moonRightTex = loadImage('assets/8k_moon_right.png');
}






function setup() {

  document.getElementById('costl').style.display = 'none';
  createCanvas(800, 600, WEBGL);
  pixelDensity(1);           
  perspective(radians(85), width / height, 1, 10000);
  noStroke();
  
  canvas = document.querySelector('canvas');
  //canvas.style.border = '4px solid white'; // 4px wide white border

  


    // stelle come punti
  for (let i = 0; i < 1000; i++) {
    stars.push(createVector(
      random(-2500, 2500),
      random(-2500, 2500),
      random(-2500, 2500)
    ));
  }




  earthGeom = buildGeometry(() => sphere(earthRadius, 30, 30));
  moonGeom  = buildGeometry(() => sphere(moonRadius, 22, 22));

  // Posi­zioni Luna
  moonPosition = createVector(100, -300, -1500);
  moonTarget   = createVector(150, -100,   -150);
  moonTarget2  = createVector(0,  0,  0);
}








function draw() { 
  const dt = deltaTime / 1000;


  if (cameraMoving) {
    camAngle += dt * 0.5;   // speed: 0.5 rad/s

    // compute position on a circle around the moon’s center
    let cx = moonPosition.x + camRadius * cos(camAngle);
    let cz = moonPosition.z + camRadius * sin(camAngle);
    let cy = moonPosition.y + camHeight;

    // point the camera at the moon’s remains
    camera(cx, cy, cz,
          moonPosition.x, moonPosition.y, moonPosition.z,
          0, 1, 0);
  } else {
    // your existing static camera when not moving
    camera(100, -100, 50,
          0, 0, -300,
          0, 1, 0);
  }

  background(1);




  // stars
  push();
    stroke(255);
    strokeWeight(2);
    beginShape(POINTS);
      stars.forEach(s => vertex(s.x, s.y, s.z));
    endShape();
  pop();


  earthAngle += dt * 0.2;
  moonAngle  += dt * 1.8;

  if (earthVisible) {
    push();
      rotateX(-earthAngle);
      rotateX(radians(90));
      noStroke();  
      texture(earthTex);
      model(earthGeom);
    pop();
  }







  /* ------------- LUNA ------------- */
  // Primo step di avvicinamento
  if (animateMoon) {
    moonPosition.lerp(moonTarget, dt *0.5);
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
      for (let i = 0; i < 60; i++) {
        fragments.push({
          x: moonPosition.x,
          y: moonPosition.y + random(-(moonRadius+40), (moonRadius+40)),
          z: moonPosition.z + random(-(moonRadius+40), (moonRadius+40)),
          r: random(2, 6),
          vx: random(-1,1),
          vy: random(-1,1),
          vz: random(-1,1)
        });
      }
      // 15 medium bits, radius 8–11, x-offset 10→20
      let medCount = 15;
      for (let i = 0; i < medCount; i++) {
        let sign = i < medCount/2 ? +1 : -1;
        fragments.push({
          x: moonPosition.x + random(40, 50) * sign,
          y: moonPosition.y + random(-(moonRadius+10), (moonRadius+10)),
          z: moonPosition.z + random(-(moonRadius+10), (moonRadius+10)),
          r: random(8, 11),
          vx: random(-1,1),
          vy: random(-1,1),
          vz: random(-1,1)
          
        });
      }

      // 5 large bits, radius 12–15, x-offset 20→40
      let largeCount = 7;
      for (let i = 0; i < largeCount; i++) {
        let sign = i < largeCount/2 ? +1 : -1;
        fragments.push({
          x: moonPosition.x + random(75, 90) * sign,
          y: moonPosition.y + random(-(moonRadius+10), (moonRadius+10)),
          z: moonPosition.z + random(-(moonRadius+10), (moonRadius+10)),
          r: random(15, 20),
          vx: random(-1,1),
          vy: random(-1,1),
          vz: random(-1,1)
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

  if (!flashActive && splitMoon && !cameraMoving) {
    cameraTimer += dt;
  if (cameraTimer > cameraHold) {
    cameraMoving = true;
    console.log('Camera now moving');
  }
}
}



function mousePressed() {
  if (!animateMoon) {
    animateMoon = true;
  } else if (!animateMoon2) {
    animateMoon2 = true;
    animateMoon = false;
  }
}
