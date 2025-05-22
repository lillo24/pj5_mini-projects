let earthTex, moonTex;
const stars = [];
let earthAngle = 0, moonAngle = 0;
let earthSpeed = 0.1, moonSpeed = 2.0;

let animateMoon = false;
let animateMoon2 = false;

let moonPosition, moonTarget, moonTarget2;

// flash
let flashAlpha = 0;
let flashActive = false;




function preload() {
  earthTex = loadImage('assets/8k_earth_nightmap.jpg');
  moonTex  = loadImage('assets/moon.jpg');
}

function setup() {

  document.getElementById('costl').style.display = 'none';
  createCanvas(600, 400, WEBGL);
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




  earthGeom = buildGeometry(() => sphere(110, 24, 16));
  moonGeom  = buildGeometry(() => sphere(28, 16, 12));




  // Posi­zioni Luna
  moonPosition = createVector(100, -300, -1500);
  moonTarget   = createVector(150, -100,   -50);
  moonTarget2  = createVector(100,  -15,    15);
}

function draw() { 
  
  // camera
  camera(100, -100, 100,   0, 0, -300,    0, 1, 0);

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






  push();
    rotateX(-earthAngle);
    rotateZ(radians(23.5));
    noStroke();  
    texture(earthTex);
    model(earthGeom);  // ② dettaglio ridotto (24×18)
  pop();



  /* ------------- LUNA ------------- */
  // Primo step di avvicinamento
  if (animateMoon) {
    moonPosition.lerp(moonTarget, dt * 0.5);
  }
  // Secondo step + slow-motion
  if (animateMoon2) {
    moonPosition.lerp(moonTarget2, dt * 1);
  }
  

  push();
    noStroke();
    translate(moonPosition.x, moonPosition.y, moonPosition.z);
    rotateY(moonAngle);
    texture(moonTex);
    model(moonGeom);
  pop();

  if (animateMoon2 && !flashActive) {
    let d = p5.Vector.dist(moonPosition, moonTarget2);
            console.log(d);
    if (d < 5) {
        console.log(d);
      flashActive = true;
      flashAlpha  = 255;
    }
  }

  // se flash attivo, sovrapponi un bianco che svanisce
  if (flashActive) {
    // porta a schermo 2D
    push();
      resetMatrix();
      noLights();
      fill(255, flashAlpha);
      rect(0, 0, width, height);
    pop();

    // svanimento rapido
    flashAlpha -= 10;
    if (flashAlpha <= 0) {
      flashActive = false;
      flashAlpha  = 0;
    }
  }


}



function mousePressed() {
  if (!animateMoon) {
    animateMoon = true;
  } else if (!animateMoon2) {
    animateMoon2 = true;

    // Rallenta Terra e Luna per effetto slow-motion
    for (let i = 0; i < 5; i++) {
      earthSpeed *= 0.1; 
      moonSpeed  *= 0.1;
    }
  }
}