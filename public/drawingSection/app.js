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

//preload images
function preload() {
  bgImages[0] = loadImage("Section1_temp.png");
  bgImages[1] = loadImage("Section2_temp.png");
  bgImages[2] = loadImage("Section3_temp.png");
}

/*
/ create p5js canvas and default view
/
/*/
function setup() {
  currentColor = color(random(255), random(255), random(255));
  const render = createCanvas(600, 300); //.parent('canvases');
  canvas = render.canvas;
  pixelDensity(1); //account for different resolutions
  background(bgImages[bgImageIndex]); //default to the first image
  //background(255);
  
  //create eventlistener for submit button. Initially disabled until section selected.
  document.getElementById("submit").addEventListener("click", function (event) {
    console.log("Submitting drawing... ");
    setBackgroundWhite = true; //Could modify this to create different backgrounds
    event.target.disabled = true; //disable submit button
    drawSection = false; //disable drawing on canvas further

    //get the canvas
    outputCanvas = select("#defaultCanvas0");
    console.log("The outputCanvas is: " + outputCanvas);



    //get the embedded element which has the actual image and created it into an encoded datastream
    let tempElt = outputCanvas.elt;
    console.log(tempElt);
    let drawingData = outputCanvas.elt.toDataURL();
    
    console.log("room is: " + currentCorpse)
    console.log("section is " + selectedSection)

    //create object to send over socket.
    // send the actual drawingData, the section that it is for, and the corpse that it is for.
    let fullObject = {
      drawingData: drawingData,
      section: selectedSection,
      corpseName: currentCorpse,
      firstname: firstname,
    };
    drawingSectionSocket.emit("submitSection", fullObject);
    setTimeout(() => {
      localStorage.removeItem("selectedSection");
      window.location.href = "/combined?corpseName=" + currentCorpse;
      }, 1500);
    });

  // Create event Listener for save button
  document.getElementById("save").addEventListener("click", function (event) {
    setBackgroundWhite = true;
    saveCanvasImage();
  });

  // Set the willReadFrequently attribute to true
  canvas.willReadFrequently = true;

  // Create a colorPicker (initial color & position)
  colorPicker = createColorPicker("#AA4922");
  colorPicker.position(30, height - 10);

  // Listen to the event of color input to the colorPicker
  colorPicker.input(changeColor);

  // Create a currentColor, set the color value of colorPicker to it
  currentColor = colorPicker.color();

  //Create a button to clear the canvas
  //let erasetool = select("#erasetool");
  //erasetool.mousePressed(eraseCanvas);
}

function changeColor() {
  //Change the paintbrush color when the colorPicker change
  currentColor = colorPicker.color();
  console.log("got here");
}

function eraseCanvas() {
  //Change the paintbrush color to white to erase
  currentColor = 125;
}

/*
/ p5js draw function 
/
/*/
function draw(datas) {
  if (!datas) return; // Exit if no data
  noStroke();
  if (setBackgroundWhite == true) {
    // this shouldn't do anything because image is overlayed
    //background(255);
  }
  if (drawSection == true) {
    // is the draw boolean true
    console.log("drawSection is true");
    if (imageChanged == true) {
      // has the desired image changed
      console.log("changing image");
      clear();
      background(bgImages[bgImageIndex]);
     // background(255);
      imageChanged = false;
    }
    fill(datas.color.levels[0], datas.color.levels[1], datas.color.levels[2]);
    let size = document.getElementById("brushSize").value;
    ellipse(datas.x, datas.y, size, size);
    //ellipse(datas.x, datas.y, 4, 4);
  }
}

/*
/
/ When mouse is dragged,send the data (mouse position, current ellipse color) to the canvas
/
*/
/*
function mouseDragged(event) {
  //Grab (x & y & color), and set these datas into the object 'clientdraw'
  let clientdraw = {
    x: mouseX,
    y: mouseY,
    color: currentColor,
  };
  //force call draw
  draw(clientdraw);
}
*/
function mouseDragged(event) {
  let steps = 10;
  for (let i = 0; i < steps; i++) {
    let x = lerp(pmouseX, mouseX, i / steps);
    let y = lerp(pmouseY, mouseY, i / steps);
    let clientdraw = { x: x, y: y, color: currentColor };
    draw(clientdraw);
  }
}

/*
/ Add event listener for when window loads
/ this prompts to get the user's name in order to join a privateDrawingRoom
*/

window.addEventListener("load", () => {
  const queryString = window.location.search;
  console.log(queryString);
  const urlParams = new URLSearchParams(queryString);


  let firstname = urlParams.get("firstName");
  if (!firstname) {
    console.log("no corpseName! this is going to break!"); // add better error handling!
  }
 
  
  document.getElementById("sectionLabel").innerHTML = "Drawing: " + selectedSection + " of " + currentCorpse;
  document.getElementById("backLink").href = "/combined?corpseName=" + currentCorpse;
  selectedSection = urlParams.get('section');
  
  currentCorpse = urlParams.get('corpseName');

  console.log("loaded!");
  //firstname = window.prompt("Enter your first name");
  console.log("Firstname: " + firstname);
  console.log("Selected Section: " + selectedSection);
  
  //update image
  if (selectedSection == "section-1") {
    bgImageIndex = 0;
  } else if (selectedSection == "section-2") {
    bgImageIndex = 1;
  } else {
    bgImageIndex = 2;
  }
  imageChanged = true;
  drawSection = true;
  currentColor = color(random(100), random(100), random(100)); //lower than 255 so that it shows on white
  enableSubmitButton();
  draw();

  drawingSectionSocket.emit("privateDrawingRoom", { 
    name: firstname, 
    corpseRoom: currentCorpse, 
    section: selectedSection 
  });
}); 

/*
/ socket.io on functions
*/

/*
/ listen for which section was selected in the corpse room
/
*/
drawingSectionSocket.on("sendSelectedSection", (data) => {
  console.log("sendSelectedSection: ");
  console.log(data);
  console.log(data.section);
  currentCorpse = data.corpseRoom; //corpseRoom was sent to this socket
  selectedSection = data.section; //selected section is from corpse

  //update image
  if (selectedSection == "section-1") {
    bgImageIndex = 0;
  } else if (selectedSection == "section-2") {
    bgImageIndex = 1;
  } else {
    bgImageIndex = 2;
  }
  imageChanged = true;
  drawSection = true;
  currentColor = color(random(200), random(200), random(200)); //lower than 255 so that it shows on white
  enableSubmitButton();
  draw();
});

// callback after submitting section to disable the Submit button
drawingSectionSocket.on("sectionSubmitted"),
  (data) => {
    console.log("sectionsubmitted. Can do more here if wanted");
    disableSubmitButton();
  };

// local save canvas
function saveCanvasImage() {
  let fileName = "MYDRAW_" + firstname + "_" + Date() + ".png";
  saveCanvas(fileName, "png");
}

// local button manipulations
function disableButtons() {
  let a = ["section-1", "section-2", "section-3"];
  a.forEach((i) => (document.getElementById(i).disabled = true));
}

function enableSubmitButton() {
  document.getElementById("submit").disabled = false;
}

function disableSubmitButton() {
  document.getElementById("submit").disabled = true;
}
