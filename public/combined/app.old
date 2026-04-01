let combinedSocket = io("/combined");
let corpseName;
let firstname;
//could 'auto open' pages
//window.open('https://experienced-gleaming-telephone.glitch.me/drawingSection','_blank');

/*
 * Add eventlistener on window load
 * extract corpsename from url parameters
 *
 */
window.addEventListener("load", () => {
  const queryString = window.location.search;
  console.log(queryString);
  const urlParams = new URLSearchParams(queryString);

  corpseName = urlParams.get("corpseName");
  if (!corpseName) {
    console.log("no corpseName! this is going to break!"); // add better error handling!
  }
  
  const endpoint='/getCorpse';
  const params = { corpseName: corpseName}
  const queryStringInit = new URLSearchParams(params).toString();

  let url = `${endpoint}?${queryStringInit}`;

  fetch(url)
  .then(res => res.json()) // todo: redirect to drawingSection here. Extract json?
  .then(data => {
    console.log(data); // if want to show images here, we could
    if (data.data.image1 != null) {
      let elt = document.getElementById("section-1")
      elt.innerHTML = "Completed";
      elt.disabled = true;
    }
    if (data.data.image2 != null) {
      let elt = document.getElementById("section-2")
      elt.innerHTML = "Completed";
      elt.disabled = true;
      
    }
    if (data.data.image3 != null) {
      let elt = document.getElementById("section-3")
      elt.innerHTML = "Completed";
      elt.disabled = true;
      
    }
  })

  
  
  const sessionDataString = localStorage.getItem("selectedSection"); //update this to be associated with corpsename as well.
  console.log(sessionDataString);

  if (sessionDataString) {
    let sessionData = JSON.parse(sessionDataString);
    console.log(sessionData.corpseName);
    console.log(corpseName);
    if (
      sessionData.corpseName != null &&
      sessionData.corpseName == corpseName
    ) {
      console.log("corpseName and session in local storage already");
      firstname = corpseName;
      disableSection(sessionData.section);
    }
  } else {
    console.log("corpseName and session not in local storage already");
    firstname = window.prompt("Enter your first name");
  }

  console.log(firstname);

  let dispCname = document.getElementById("cName");
  dispCname.innerHTML = corpseName;

  combinedSocket.corpseName = corpseName;
  combinedSocket.emit("privateDrawingRoom", {
    name: firstname,
    corpseRoom: corpseName,
  });
  combinedSocket.emit("corpseRoom", { name: corpseName });

  document.getElementById("section-1").addEventListener("click", (event) => {
    // todo: add details from the canvas (points, section, etc). Can be hard coded initially?
    // todo: disable selected canvas and associate with socket id that selected it?
    event.target.innerHTML = "Disabled!";
    event.target.disabled = true;
    let fullObject = { corpseName: corpseName, section: "section-1" };
    const endpoint='/getCorpse';
    const params = { corpseName: corpseName}
    const queryString = new URLSearchParams(params).toString();

    let url = `${endpoint}?${queryString}`;

    fetch(url)
    .then(res => res.json()) // todo: redirect to drawingSection here. Extract json?
    .then(data => {
      console.log(data.corpseName);
      let location = "/drawingSection?corpseName=" + corpseName + '&section=section-1&firstname='+firstname;
      console.log(location)
       window.location.href = location;
    })
    
    
    combinedSocket.emit("selectedCanvas", fullObject);
    selectSection("section-1");
  });
  document.getElementById("section-2").addEventListener("click", (event) => {
    // todo: add details from the canvas (points, section, etc). Can be hard coded initially?
    // todo: disable selected canvas and associate with socket id that selected it?
    event.target.innerHTML = "Disable Selection!";
    event.target.disabled = true;
    let fullObject = { corpseName: corpseName, section: "section-2" };
    const endpoint='/getCorpse';
    const params = { corpseName: corpseName}
    const queryString = new URLSearchParams(params).toString();

    let url = `${endpoint}?${queryString}`;

    fetch(url)
    .then(res => res.json()) // todo: redirect to drawingSection here. Extract json?
    .then(data => {
      console.log(data.corpseName);
      let location = "/drawingSection?corpseName=" + corpseName + '&section=section-2&firstname='+firstname;
      console.log(location)
       window.location.href = location;
    })
    
    
    
    combinedSocket.emit("selectedCanvas", fullObject);
    selectSection("section-2");
  });
  document.getElementById("section-3").addEventListener("click", (event) => {
    // todo: add details from the canvas (points, section, etc). Can be hard coded initially?
    // todo: disable selected canvas and associate with socket id that selected it?
    event.target.innerHTML = "Disable Selection!";
    event.target.disabled = true;
    let fullObject = { corpseName: corpseName, section: "section-3" };
    const endpoint='/getCorpse';
    const params = { corpseName: corpseName}
    const queryString = new URLSearchParams(params).toString();

    let url = `${endpoint}?${queryString}`;

    fetch(url)
    .then(res => res.json()) // todo: redirect to drawingSection here. Extract json?
    .then(data => {
      console.log(data.corpseName);
      let location = "/drawingSection?corpseName=" + corpseName + '&section=section-3&firstname='+firstname;
      console.log(location)
       window.location.href = location;
    })
    
    
    combinedSocket.emit("selectedCanvas", fullObject);
    selectSection("section-3");
    //window.location.href='/drawingSection';
    // to do the above, would need to send section and room.
  });

  //set eventlistener for reset Corpse -- not really 'exiting'
  document.getElementById("resetCorpse").addEventListener("click", function () {
    localStorage.removeItem("selectedSection");
    // Reset the UI
    const buttons = document.querySelectorAll(".button");

    buttons.forEach((button) => {
      button.innerHTML = "Click for " + button.id.charAt(button.id.length - 1);
      button.disabled = false;
    });

    document.getElementById("canvas1").style.opacity = 100;
    document.getElementById("canvas2").style.opacity = 100;
    document.getElementById("canvas3").style.opacity = 100;
  });

  /*
  let saveAll = document.getElementById('saveCompleted');
    saveAll.addEventListener('click', function(){
  
    let canvas = document.getElementById('allDrawing'); 
    let fileName = "exquisiteCorpse_" + Date() + ".png";
    saveCanvas(canvas, fileName, "png");
  
    });
*/
});

/*
 * set up p5js canvas. Doesn't do anything at present but still required.
 *
 */
function setup() {}

//socket.io on functions

/*
 * placeholder for a callback potentially to update the common corpse page, kept separate
 *
 */
combinedSocket.on("updateCorpse", (data) => {
  console.log(data);
});

/*
 * updates the corpse page when drawing is submitted.
 * received the png of the file and then reconstructs it and places it in the desired canvas
 *
 */
combinedSocket.on("updateCombinedCanvas", (data) => {
  console.log(data);
  var newImage = new Image();
  newImage.onload = function () {
    console.log("newImage.onload");
    // Assuming 'myCanvas' is the ID of your canvas element
    var finalLocation = document.getElementById("finalResult");
    console.log(finalLocation);

    let newSection;
    var canvas = document.createElement("canvas");
    canvas.id = "myCanvas";
    if (data.section == "section-1") {
      newSection = "final1";
    } else if (data.section == "section-2") {
      newSection = "final2";
    } else {
      newSection = "final3";
    }

    document.getElementById(newSection).appendChild(canvas);
    var context = canvas.getContext("2d");
    context.drawImage(newImage, 0, 0);
  };
  console.log("Combined:updateCombinedCanvas: got here");

  newImage.onerror = function () {
    console.error("The image could not be loaded.");
  };

  console.log("Combined:updateCombinedCanvas: got here2");
  let drawingImage = data.drawingData;
  if (drawingImage != null) {
    console.log("Found a drawing Image");
    newImage.src = drawingImage.toString();
  } //else find some sort of funny image to show instead?

  console.log(data);
});

/*
 * this is called by the button event listener.
 * stores selected section and corpse in localstorage and calls disableSection as well
 *
 */
function selectSection(section) {
  let sessionData = { corpseName, section };
  localStorage.setItem("selectedSection", JSON.stringify(sessionData)); // Save the selected section to localStorage
  console.log("calling disable");
  disableSection(section);
}

/*
 * this is called by the select Section via button listener.
 * disables buttons and covers up other sections.
 *
 */
function disableSection(section) {
  console.log("called disabled");
  // Get all buttons and disable the selected one
  const buttons = document.querySelectorAll(".button");
  buttons.forEach((button) => {
    if (button.id === section) {
      button.innerHTML = "Disabled!";
      button.disabled = true;
    }
  });

  if (section == "section-1") {
    document.getElementById("canvas2").style.opacity = 0.1;
    document.getElementById("canvas3").style.opacity = 0.1;
  } else if (section == "section-2") {
    document.getElementById("canvas1").style.opacity = 0.1;
    document.getElementById("canvas3").style.opacity = 0.1;
  } else if (section == "section-3") {
    document.getElementById("canvas1").style.opacity = 0.1;
    document.getElementById("canvas2").style.opacity = 0.1;
  }
}
