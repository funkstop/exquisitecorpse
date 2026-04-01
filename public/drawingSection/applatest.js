let drawingSectionSocket = io("/drawingSection");

let currentColor;
let drawSection = false;
let imageChanged = false;

let myp5c1;
let myp5c2;
let myp5c3;
let bgImageIndex;
let bgImages = [];
let setBackgroundWhite = false;
let selectedSection;

let colorSelector;
let erasemode;
let canvas;

let currentCorpse;

let firstname;

let outputCanvas;

function preload() {
  bgImages[0] = loadImage("Section1_temp.png");
  bgImages[1] = loadImage("Section2_temp.png");
  bgImages[2] = loadImage("Section3_temp.png");
}

function setup() {
  currentColor = color(random(255), random(255), random(255));
  const render = createCanvas(600, 300);
  canvas = render.canvas;
  pixelDensity(1);

  document.getElementById("submit").addEventListener("click", function (event) {
    console.log("Submitting drawing... ");
    setBackgroundWhite = true;
    event.target.disabled = true;
    drawSection = false;

    outputCanvas = select("#defaultCanvas0");
    let drawingData = outputCanvas.elt.toDataURL();

    console.log("room is: " + currentCorpse);
    console.log("section is " + selectedSection);

    let fullObject = {
      drawingData: drawingData,
      section: selectedSection,
      corpseName: currentCorpse,
    };
    drawingSectionSocket.emit("submitSection", fullObject);
    setTimeout(() => {
      localStorage.removeItem("selectedSection");
      window.location.href = "/combined?corpseName=" + currentCorpse;
    }, 1500);
  });

  document.getElementById("save").addEventListener("click", function (event) {
    saveCanvasImage();
  });

  canvas.willReadFrequently = true;

  colorPicker = createColorPicker("#AA4922");
  colorPicker.position(30, height - 10);
  colorPicker.input(changeColor);
  currentColor = colorPicker.color();
}

function changeColor() {
  currentColor = colorPicker.color();
}

function eraseCanvas() {
  currentColor = 255;
}

function draw(datas) {
  if (!datas) return;
  noStroke();
  if (setBackgroundWhite == true) {
    background(255);
  }
  if (drawSection == true) {
    if (imageChanged == true) {
      clear();
      background(bgImages[bgImageIndex]);
      imageChanged = false;
    }
    fill(datas.color.levels[0], datas.color.levels[1], datas.color.levels[2]);
    ellipse(datas.x, datas.y, 4, 4);
  }
}

function mouseDragged(event) {
  let clientdraw = {
    x: mouseX,
    y: mouseY,
    color: currentColor,
  };
  draw(clientdraw);
}

window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);

  firstname = urlParams.get("firstName");
  selectedSection = urlParams.get("section");
  currentCorpse = urlParams.get("corpseName");

  document.getElementById("sectionLabel").innerHTML = "Drawing: " + selectedSection + " of " + currentCorpse;
  document.getElementById("backLink").href = "/combined?corpseName=" + currentCorpse;

  if (selectedSection == "section-1") {
    bgImageIndex = 0;
  } else if (selectedSection == "section-2") {
    bgImageIndex = 1;
  } else {
    bgImageIndex = 2;
  }

  imageChanged = true;
  drawSection = true;
  currentColor = color(random(200), random(200), random(200));
  enableSubmitButton();

  // force draw with background image
  draw({ color: { levels: [0, 0, 0] }, x: 0, y: 0 });

  drawingSectionSocket.emit("privateDrawingRoom", { name: firstname });
});

drawingSectionSocket.on("sendSelectedSection", (data) => {
  currentCorpse = data.corpseRoom;
  selectedSection = data.section;

  if (selectedSection == "section-1") {
    bgImageIndex = 0;
  } else if (selectedSection == "section-2") {
    bgImageIndex = 1;
  } else {
    bgImageIndex = 2;
  }
  imageChanged = true;
  drawSection = true;
  currentColor = color(random(200), random(200), random(200));
  enableSubmitButton();
  draw({ color: { levels: [0, 0, 0] }, x: 0, y: 0 });
});

drawingSectionSocket.on("sectionSubmitted", (data) => {
  console.log("sectionsubmitted.");
  disableSubmitButton();
});

function saveCanvasImage() {
  let fileName = "MYDRAW_" + firstname + "_" + Date() + ".png";
  saveCanvas(fileName, "png");
}

function enableSubmitButton() {
  document.getElementById("submit").disabled = false;
}

function disableSubmitButton() {
  document.getElementById("submit").disabled = true;
}
