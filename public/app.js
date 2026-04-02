window.addEventListener("load", () => {
  console.log("loaded gallery index.html!");
  // on load, create the event listener for the submit button at the top
  document.getElementById("showCreate").addEventListener("click", () => {
    let form = document.getElementById("createForm");
    form.style.display = form.style.display === "none" ? "flex" : "none";
  });

/*
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
        let location = "/combined?corpseName=" + corpseName;
        window.location.href = location;
      })
      .then((data) => {
        console.log('printing data:');
        console.log(data);
      });
  }); */

document.getElementById("submit").addEventListener("click", function () {
  let corpseName = document.getElementById("corpseName").value.trim();
  let errorEl = document.getElementById("createError");
  if (!corpseName) { 
    errorEl.innerHTML = "Please enter a name.";
    errorEl.style.display = "block";
    return; 
  }
  fetch("/newCorpse", {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({ corpse_name: corpseName, status: "new" }),
  }).then((response) => response.json())
    .then((data) => {
      if (data.task === "already_exists") {
        errorEl.innerHTML = "A corpse with that name already exists — join it below or choose a different name.";
        errorEl.style.display = "block";
      } else {
        window.location.href = "/combined?corpseName=" + corpseName;
      }
    });
});

/* this should create gallery items on the primary page
 *
 
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
});*/

fetch("/getGallery")
  .then((response) => response.json())
  .then((data) => {
    if (!data.data || data.data.length === 0) {
      document.getElementById("emptyMsg").style.display = "block";
      return;
    }
    if (data.task === "rate_limited") {
      errorEl.innerHTML = "You've created too many corpses recently — try again in 15 minutes.";
      errorEl.style.display = "block";
    }
    for (let i = 0; i < data.data.length; i++) {
      let corpse = data.data[i];
      if (!corpse) continue;
      let status = corpse.status;
      let corpseName = corpse.name;

      let galleryDiv = document.createElement("div");
      galleryDiv.className = "gallery-item";

      let nameEl = document.createElement("h3");
      nameEl.innerHTML = corpseName;
      let badge = document.createElement("span");
      badge.className = "status-badge" + (status == "Complete" ? "" : " incomplete");
      badge.innerHTML = status == "Complete" ? "Complete" : "In Progress";
      nameEl.appendChild(badge);
      galleryDiv.appendChild(nameEl);

      // Show section statuses
      let sections = [
        { label: "Section 1", status: corpse.image1Status },
        { label: "Section 2", status: corpse.image2Status },
        { label: "Section 3", status: corpse.image3Status },
      ];
     [1,2,3].forEach(n => {
       let img = document.createElement("img");
       img.src = corpse["image" + n] || "drawingSection/Section" + n + "_temp.png";
       img.style.width = "100%";
       img.style.marginTop = "6px";
       img.style.borderRadius = "6px";
       galleryDiv.appendChild(img);
     });

   
      sections.forEach(s => {
        let p = document.createElement("p");
        p.className = "section-status" + (s.status === true ? " done" : "");
        p.innerHTML = s.label + ": " + (s.status === true ? "✓ Submitted" : "Available");
        galleryDiv.appendChild(p);
      });

      let btn = document.createElement("button");
      btn.className = "btn-join";
      btn.innerHTML = status == "Complete" ? "View" : "Join";
      btn.disabled = status == "Complete";
      btn.addEventListener("click", () => {
        window.location.href = "/combined?corpseName=" + corpseName;
      });
      galleryDiv.appendChild(btn);

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
