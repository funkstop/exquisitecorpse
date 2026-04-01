let socket = io("/drawingSection");

let currentColor;
let drawSection1 = false;
let imageChanged = false;

let myp5c1;
let myp5c2;
let myp5c3;
let bgImageIndex;
let bgImages = [];
let setBackgroundWhite = false;
let myR;
let myG;
let myB;

let outputCanvas;

function preload() {
  bgImages[0] = loadImage("Section1_temp.png");
  bgImages[1] = loadImage("Section2_temp.png");
  bgImages[2] = loadImage("Section3_temp.png"); 
}

function setup() {
  currentColor = color(random(255), random(255), random(255));
  createCanvas(windowWidth * 0.5, windowHeight * 0.3); //.parent('canvases');
  background(bgImages[0]);

  document.getElementById("submit").addEventListener("click", function (event) {
    console.log("do something upon submit - add drawing to main collaboration");
    setBackgroundWhite = true;
    event.target.disabled = true;
    drawSection1 = false;
    
        
  //needs fix-------------------
    
    // outputCanvas = select('#defaultCanvas0'); //defaultCanvas0 is id of working drawing-- didn't work
    outputCanvas = select('#testImg');

    //copy(srcImage, sx, sy, sw, sh, dx, dy, dw, dh)
    // copy(sx, sy, sw, sh, dx, dy, dw, dh)
    copy(0, 0, width, height, 0, 0, outputCanvas.width, outputCanvas.height);
    
    let drawingData = {
      imageData: outputCanvas.elt.toDataURL(),
    };
    socket.emit("sendCanvasx", drawingData);
  });
  
  //--------------needs fix

  document.getElementById("save").addEventListener("click", function (event) {
    setBackgroundWhite = true;
    saveCanvasImage();
  });
      socket.on('dataAll', (obj) => {
        console.log(obj);
        drawPos(obj);
    });
}

//Expects an object with x and y properties
function drawPos(pos) {
  
  if (setBackgroundWhite == true) {
    background(255);
  }
  if (drawSection1 == true) {
    if (imageChanged == true) {
      console.log('changing image')
      clear();
      background(bgImages[bgImageIndex]);
      imageChanged = false;
    }
    line(pos.x1, pos.y1, pos.x2, pos.y2);
    stroke(pos.r, pos.g, pos.b);
    strokeWeight(4);
  }
}


function mouseDragged() {
    let mousePos = { x1: pmouseX, y1: pmouseY, x2: mouseX, y2: mouseY, r: myR, g: myG, b: myB };
    socket.emit('data', mousePos);
    drawPos(mousePos); // draw locally immediately
}


window.addEventListener("load", () => {
  console.log("loaded!");
});

// todo; need a way to retrieve final collaborative version.
//listen for output selection
socket.on("sendCanvasx", (data) => {
  console.log(data);
  if (data == "section-1") {
    drawSection1 = true;
  } else if (data == "section-2") {
    bgImageIndex = 1;
    imageChanged = true;
    drawSection1 = true;
  } else {
    bgImageIndex = 2;
    imageChanged = true;
    drawSection1 = true;
  }
  currentColor = color(random(255), random(255), random(255));

  createSubmitButton();
});

function disableButtons() {
  let a = ["section-1", "section-2", "section-3"];
  a.forEach((i) => (document.getElementById(i).disabled = true));
}

function createSubmitButton() {
  document.getElementById("submit").disabled = false;
}

function saveCanvasImage() {
  let fileName = "MYDRAW_" + Date() + ".png";
  saveCanvas(fileName, "png");
}