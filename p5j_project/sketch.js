let earthTex, moonTex;
const stars = [];
let earthAngle = 0, moonAngle = 0;
let slowEarthSpeed = 0.02;
let slowMoonSpeed  = 0.5;

let earthVisible = true;
let earthRadius = 110, moonRadius = 28;

let animateMoon = false;
let animateMoon2 = false;

let moonPosition, moonTarget, moonTarget2;

// flash
let flashAlpha = 0;
let flashActive = false;




function preload() {
  earthTex = loadImage('assets/8k_earth_nightmap.jpg');
  moonTex  = loadImage('assets/8k_moon.jpg');
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
  moonTarget   = createVector(150, -100,   -50);
  moonTarget2  = createVector(0,  0,  0);

}

function draw() { 
  
  // camera
  camera(100, -100, 50,   0, 0, -300,    0, 1, 0);
  //directionalLight(100, 100, 100, -1, 0, 1);
  //ambientLight(1000, 1000,1000);
  //specularMaterial(50, 50, 50);

  background(1);

  const dt = deltaTime / 1000;
  earthAngle += dt * 0.1;
  moonAngle  += dt * 2.0;



  // stars
  push();
    stroke(255);
    strokeWeight(2);
    beginShape(POINTS);
      stars.forEach(s => vertex(s.x, s.y, s.z));
    endShape();
  pop();


  if (earthVisible) {
    push();
      rotateX(-earthAngle);
      rotateZ(radians(23.5));
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
    moonPosition.lerp(moonTarget2, dt * 0.72 /*0.5*/);

    let d_centers = p5.Vector.dist(moonPosition, createVector(0,0,0));
    console.log(
    'pos', nf(moonPosition.x,2,1),
          nf(moonPosition.y,2,1),
          nf(moonPosition.z,2,1),
    'dist to center', nf(d_centers,2,1)
);

    // gradually slow down:
    earthAngle = lerp(earthAngle, slowEarthSpeed, dt * 1.5);
    moonAngle  = lerp(moonAngle,  slowMoonSpeed,  dt * 1.5);
  }
  

  push();
    noStroke();
    translate(moonPosition.x, moonPosition.y, moonPosition.z);
    rotateY(moonAngle);
    texture(moonTex);
    model(moonGeom);
  pop();









  if (animateMoon2 && !flashActive) {
    // distanza fra i due centri
    let d_centers = p5.Vector.dist(moonPosition, createVector(0,0,0));
    // quando i bordi si toccano
    if (d_centers <= earthRadius + moonRadius) {
      flashActive = true;
      flashAlpha  = 255;
      // per evitare ri-scatenare il flash, puoi disabilitare animateMoon2
      animateMoon2 = false;
    }
  }

  // se flash attivo, sovrapponi un bianco che svanisce
  if (flashActive) {
    drawingContext.disable(drawingContext.DEPTH_TEST);
 
    // porta a schermo 2D
    push();
      resetMatrix();
      noLights();
      fill(255, flashAlpha);
      rect(-width/2, -height/2, width, height);
    pop();

    earthVisible = false;
    flashAlpha -= 0.1;

    if (flashAlpha <= 0) {
      flashActive = false;
      flashAlpha  = -1;
    }
    drawingContext.enable(drawingContext.DEPTH_TEST);
  }
}



function mousePressed() {
  if (!animateMoon) {
    animateMoon = true;
  } else if (!animateMoon2) {
    animateMoon2 = true;
  }
}
