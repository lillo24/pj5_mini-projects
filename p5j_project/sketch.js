let started = false;


// Oggetti
const stars = [];
let fragments = [];
let final_baloons_vector = [];

let earthGeom, moonGeom;
let earthTex, moonTex;
let earthRadius = 110, moonRadius = 28;
let earthVisible = true;


// Variabili per il movimento degli oggetti
let earthAngle = 0, earthAngleY = 0.8;
let earthSpeed = 0.25;
let speedUpEarth = false;
let slowEarthSpeed = 0.02;

let moonAngle = 0;
let slowMoonSpeed  = 0.5;
let animateMoon = false;
let animateMoon2 = false;
let moonPosition, moonTarget, moonTarget2, moonSpeed = 0;
let moonExploded = false;

let squishStars = false;
let starExplosion   = false;
let starRotationSpeed = 0.2;
let deIntox = 0;


// Flash
let flashWhiteTransparency = 0;
let flashActive = false;
let flashTimer = 0;
const flashDuration = 1.5;      // flash durata
const flashFadeDuration = 0.3; // secondi per svanire


// Telecamera
let introCamX = 100;
let introCamY = -100;
let introCamZ = 400;
let introCamTargetZ = 140;
let introCamSpeed = 10; // unità al secondo

let cameraTimer = 0;
const cameraHold = 1;
let freeMovement = false;

// Variabili extra
let clickCount = 0;
let soundtrack;
let finalBaloons = false;
let cleanBackground = false;




function preload() {
  earthTex = loadImage('assets/8k_earth_nightmap.jpg');
  moonTex  = loadImage('assets/8k_moon.jpg');
  moonLeftTex  = loadImage('assets/8k_moon_left.png');
  moonRightTex = loadImage('assets/8k_moon_right.png');
  air_baloon  = loadImage('assets/balloon_texture.jpg');
  basket = loadImage('assets/basket.png');
  soundtrack = loadSound('assets/soundtrack.mp3');
}




function setup() {

  // Layout “cinema”
  canvas = document.querySelector('canvas');
  //canvas.style.border = '4px solid white'; // bordo bianco di 4px
  document.getElementById('costl').style.display = 'none';

  frameRate(60);

  // Configura il canva
  createCanvas(760, 600, WEBGL);
  pixelDensity(1);
  perspective(radians(85), width / height, 1, 10000);
  noStroke();

  // Crea vettore stelle
  for (let i = 0; i < 1000; i++) {
    let R = random(550, 2500);
    let dir = p5.Vector.random3D();
    let pos = dir.mult(R);

    // Salva posizione iniziale per ricrearli dopo la collisione
    let star = createVector(pos.x, pos.y, pos.z);
    star.initialPosition = star.copy();

    stars.push(star);
  }

  // Pianeti creazione
  earthGeom = buildGeometry(() => sphere(earthRadius, 30, 30));
  moonGeom  = buildGeometry(() => sphere(moonRadius, 22, 22));


  // Posizioni della Luna
  moonPosition = createVector(100, -300, -1500);
  moonTarget   = createVector(200, -100, -100);
  moonTarget2  = createVector(0, 0, 0);

  // Mongolfiera singolo
  soloBaloon = {
    pos: createVector(0, 0, -150),
    moving: false
  };

  // Vettore di mongolfiere finali
  const N = 25;               // numero di palloncini
  const minDist = 50;         // distanza minima tra loro
  const center = createVector(0, 0, 0);

  final_baloons_vector.length = 0;

  while (final_baloons_vector.length < N) {
    // raggio casuale tra 75 e 200
    let r = random(75, 200);

    // punto casuale sulla sfera unitaria:
    let u = random(-1, 1);
    let θ = random(0, TWO_PI);
    // scala fino al raggio r:
    let x = r * sqrt(1 - u * u) * cos(θ);
    let y = r * sqrt(1 - u * u) * sin(θ);
    let z = r * u;

    let candidate = p5.Vector.add(center, createVector(x, y, z));

    // controlla la distanza minima:
    let tooClose = false;
    for (let b of final_baloons_vector) {
      if (p5.Vector.dist(candidate, b.pos) < minDist) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      final_baloons_vector.push({
        pos: candidate.copy()
      });
    }
  }


  // eventi musicali
  soundtrack.play();

  // Le stelle ruotano
  soundtrack.addCue(7.8, () => activateEvents());
  // Rotazione della Terra
  soundtrack.addCue(23, () => activateEvents());
  // Esplosione delle stelle
  soundtrack.addCue(31, () => activateEvents());
  // Avvicinamento della Luna
  soundtrack.addCue(36, () => activateEvents());
  // mongolfiera verso la Luna
  soundtrack.addCue(44, () => activateEvents());
  // Esplosione della Luna
  soundtrack.addCue(53.5, () => activateEvents());
}




function draw() {

  if (!started) return;

  const dt = deltaTime / 1000;

  // TELECAMERA
  if (!freeMovement) {
    background(1);
    camera(100, introCamY, introCamZ,
           0, 0, -300,
           0, 1, 0);

    introCamZ = lerp(introCamZ, introCamTargetZ, dt * introCamSpeed / 150);
  } else {
    orbitControl(5, 5);
  }

  // Pulisci sfondo se necessario
  if (cleanBackground) {
    background(1);
    cleanBackground = false;
  }





  // Stelle movimento
  if (freeMovement) {
    // Stelle dopo la collisione
    stars.length = 0;
    const NEW_STAR_COUNT = 50;
    for (let i = 0; i < NEW_STAR_COUNT; i++) {
      let R   = random(550, 2500);
      let dir = p5.Vector.random3D().mult(R);
      let star = createVector(dir.x, dir.y, dir.z);
      star.initialPosition = star.copy();

      star.rotDir = random() < 0.5 ? 1 : -1;
      stars.push(star);
    }
  } else {

    // Schiaccia stelle
    if (squishStars) {
      let rot = starRotationSpeed * dt;
      let c = cos(rot),
          s = sin(rot);

      // Boh
      for (let i = 0; i < stars.length; i++) {
        let p = stars[i];
        let x = p.y * c - p.z * s;
        let z = p.y * s + p.z * c;
        p.y = x * (1 - deIntox) + deIntox * p.initialPosition.x; // “de-intossica” Y
        p.z = z * (1 - deIntox) + deIntox * p.initialPosition.z; // “de-intossica” Z
      }
    }

    // Esplosione stelle
    if (squishStars && !starExplosion) {
      // Boh ma lento
      deIntox += dt * 0.01;
    } else {
      if (starExplosion) {
        if (deIntox < 2) {
          // Boh ma veloce
          deIntox += dt * 1;
        } else {
          // Boh ma molto lento
          deIntox += dt * 0.000000001;
        }
      }
    }
  }

  // Disegna stelle
  push();
    stroke(255);
    strokeWeight(2);
    beginShape(POINTS);
      stars.forEach(stair => vertex(stair.x, stair.y, stair.z));
    endShape();
  pop();







  // Accelerazione della rotazione Terra
  if (speedUpEarth) {
    earthSpeed = min(earthSpeed + dt * 1.2, 11);
  }

  // Normale rotazione
  earthAngle += dt * earthSpeed;

  // Creazione terra (prima collisione)
  if (earthVisible) {
    push();
      rotateX(-earthAngle - 2.8);
      rotateZ(earthAngleY);
      noStroke();
      texture(earthTex);
      model(earthGeom);
    pop();
  }



  //Movimenti luna
  // Primo step di avvicinamento, slow start perchè sennò brutto
  if (animateMoon) {
    moonSpeed = lerp(moonSpeed, 1, (dt * 2) * (dt * 2));
    moonPosition.lerp(moonTarget, dt * moonSpeed);
  }

  // Collisione con la Terra
  if (animateMoon2) {
    moonPosition.lerp(moonTarget2, dt * 0.4);

    // rallenta la rotazione della Terra e della Luna prima della collisione
    earthAngle = lerp(earthAngle, slowEarthSpeed, dt * 1.5);
    moonAngle  = lerp(moonAngle,  slowMoonSpeed,  dt * 1.5);
  }


  // Rotazione normale della Luna
  moonAngle += dt * 1.8;

  // Creazione luna (prima collisione)
  if (!moonExploded) {
    push();
      noStroke();
      translate(moonPosition.x, moonPosition.y, moonPosition.z);
      rotateY(moonAngle);
      texture(moonTex);
      model(moonGeom);
    pop();
  }





  // Disegna mongolfiera singola o multiple dopo collisione
  if (!finalBaloons) {
    drawHotAirBalloon(soloBaloon.pos.x, soloBaloon.pos.y, soloBaloon.pos.z, 0.1);
    
    if (soloBaloon.moving) {
      soloBaloon.pos.lerp(moonTarget, dt * 0.1);
    }

  } else {
    for (let b of final_baloons_vector) {
      drawHotAirBalloon(b.pos.x, b.pos.y, b.pos.z, 0.13);
    }
  }






  // Esplosione della luna e flash
  if (animateMoon2 && !flashActive && !moonExploded) {

    // distanza fra i due centri luna e terra
    let d_centers = p5.Vector.dist(moonPosition, createVector(0, 0, 0));


    // quando i bordi si toccano
    if (d_centers <= earthRadius + moonRadius && !moonExploded) {
      flashActive = true;
      flashWhiteTransparency = 255;
      flashTimer = 0;

      moonExploded = true;
      earthVisible = false;
      animateMoon2 = false;
    }
  }

  // Se flash si è attivato crea effetivamente il flash nella scena
  if (flashActive) {
    drawingContext.disable(drawingContext.DEPTH_TEST); // 2D

    // Crea flash bianco
    push();
      resetMatrix();
      noLights();
      fill(255, flashWhiteTransparency);
      rect(-width / 2, -height / 2, width, height);
    pop();

    // Crea le mongolfiere e muovi la telecamera in centro
    finalBaloons = true;
    camera(0, 0, 0,
           0, 0, -300,
           0, 1, 0);


    flashTimer += dt;
    // mantieni a 255 per flashDuration secondi, poi svanisce in flashFadeDuration
    if (flashTimer > flashDuration) {
      // tempo trascorso dallo start del fade
      let t = flashTimer - flashDuration;
      // fade lineare da 255 a 0 su flashFadeDuration
      flashWhiteTransparency = max(255 * (1 - t / flashFadeDuration), 0);

      if (flashWhiteTransparency <= 0) {
        drawingContext.enable(drawingContext.DEPTH_TEST);
        flashActive = false;
        flashWhiteTransparency = 0;
      }
    }
  }

  // Dopo il flash, abilita freeMovement
  if (!flashActive && moonExploded) {
    cameraTimer += dt;
    if (cameraTimer > cameraHold) {
      freeMovement = true;
    }
  }
}





// Funzione per disegnare il pallone aerostatico
function drawHotAirBalloon(x, y, z, scaleFactor = 1) {
  push();
    // posizione nel 3D e grandezza
    translate(x, y, z);
    scale(scaleFactor);

    // Involucro del pallone (una sfera leggermente ovale)
    noStroke();
    push();
      texture(air_baloon);
      scale(1, 1.4, 1);      // allunga sull'asse Y
      rotateX(-PI + 0.1);     // ruota per fixare la texture
      sphere(50, 32, 32);
    pop();

    // Cestino sotto
    push();
      texture(basket);
      translate(0, 100, 0);
      box(30, 20, 20);
    pop();

    // Cavi che collegano il cestino all’involucro
    stroke(80);
    strokeWeight(1);
    // anteriore-sinistra
    line(10, 100,  10,  20, 0, 20);
    // anteriore-destra
    line(-10, 100,  10,  -20, 0, 20);
    // posteriore-sinistra
    line(10, 100,  -10,  20, 0, -20);
    // posteriore-destra
    line(-10, 100,  -10,  -20, 0, -20);

  pop();
}


// Gestione eventi musicali
function activateEvents() {
  clickCount++;
  switch (clickCount) {
    case 1:
      squishStars = true;
      break;
    case 2:
      speedUpEarth = true;
      break;
    case 3:
      starExplosion = true;
      break;
    case 4:
      animateMoon = true;
      break;
    case 5:
      soloBaloon.moving = true;
      break;
    case 6:
      animateMoon2 = true;
      animateMoon = false;
      slowEarthSpeed = 0.02;
      slowMoonSpeed  = 0.5;
      break;
    default:
      console.log('Niente da fare');
  }
}


// Gestione del click per iniziare e per pulire la scena/sfondo dopo collisione
function mousePressed() {
  if (!started) {
    document.getElementById('clickHere').style.display = 'none';
    started = true;
    userStartAudio();
    loop();
  }

  if (freeMovement) {
    cleanBackground = true;
  }
}
