window.addEventListener("load", () => {
  console.log("loaded gallery index.html!");

  // on load, create the event listener for the submit button at the top
  document.getElementById("submit").addEventListener("click", function (event) {
    let corpseName = document.getElementById("corpseName").value;
    console.log('Submit click event ' + corpseName);
    
    if ((corpseName == null) || (corpseName == "")) {
        return; // do nothing
    } 
    //Create an object to save the canvas content & user input
    let obj = {
      corpse_name: corpseName,
      status: "new"
    };

    //Post the object to the database
    let jsonData = JSON.stringify(obj);

    fetch("/newCorpse", {  //newCorpse function name is not accurate. If exists, sends that back
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: jsonData,
    })
      .then((response) => {
        console.log("got here in then statement")  
        let location = "/public/combined?corpseName=" + corpseName;
        window.location.href = location;
      })
      .then((data) => {
        console.log('printing data:');
        console.log(data);
      });
  });

/* this should create gallery items on the primary page
 *
 */
  fetch("/getGallery")
    .then((response) => response.json())
    .then((data) => {
      console.log('in getGallery - printing data:');
      console.log(data);
      //build the gallery item
      if ((data.data == null) || (data.data[0] == null)) {
        return;
      }
      for (let i = 0; i < data.data.length; i++) {
        let status = data.data[i].status;
        let corpseName = data.data[i].name;
        let img1 = data.data[i].image1;
        let img2 = data.data[i].image2;
        let img3 = data.data[i].image3;
       // console.log('image 3!!!!')
       // console.log(img3)

        // Create a <div> to contain Name and Title
        let galleryDiv = document.createElement("div");

        //galleryDiv.style = 'border:4';
        galleryDiv.className = "gallery-item"; // add a css clss name to control the style

        // Create a <h1> and get data from the database
        let nameElement = document.createElement("h1");
        nameElement.innerHTML = corpseName;
        galleryDiv.appendChild(nameElement);

        // Create a <img> and add a src using the base64ImageData string saved in database
        let img1Element = document.createElement("img");
        img1Element.src = img1;
        galleryDiv.appendChild(img1Element);

        let img2Element = document.createElement("img");
        img2Element.src = img2;
        galleryDiv.appendChild(img2Element);

        let img3Element = document.createElement("img");
        img3Element.src = img3;
        galleryDiv.appendChild(img3Element);

        // Create a button which allows someone to join or indicate it is complete
        let statusElement = document.createElement("button");
        statusElement.id = corpseName;

        if (status == "new") {
          statusElement.innerHTML = "JOIN";
          statusElement.onclick = "/combined?corpseName="+corpseName;
        } else {
          statusElement.innerHTML = status;
          statusElement.disabled = true;
        }
        statusElement.addEventListener("click", function (event) {
          let location = "/combined?corpseName=" + corpseName;
          window.location.href = location;
        })  
        galleryDiv.appendChild(statusElement);

        // Add the new <div> into the id="gallery"
        document.getElementById("gallery").appendChild(galleryDiv);
      }
    });
});

function disableButtons() {
  let a = ["section-1", "section-2", "section-3"];
  a.forEach((i) => (document.getElementById(i).disabled = true));
}

function createSubmitButton() {
  document.getElementById("submit").disabled = false;
}

function disableSubmitButton() {
  document.getElementById("submit").disabled = true;
}
