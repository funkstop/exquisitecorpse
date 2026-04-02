let combinedSocket = io("/combined");
let corpseName;
let firstname;

window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);
  corpseName = urlParams.get("corpseName");

  if (!corpseName) {
    window.location.href = "/";
    return;
  }

  document.getElementById("cName").innerHTML = corpseName;

  // Check if corpse exists, redirect if not
  fetch("/getCorpse?" + new URLSearchParams({ corpseName }))
    .then(res => res.json())
    .then(data => {
      if (!data.data) {
        window.location.href = "/";
        return;
      }

      // Disable sections that are already submitted
      if (data.data.image1Status === true) {
         setSectionDone(1);
         document.getElementById("img-1").src = data.data.image1;
      }
      if (data.data.image2Status === true) {
         setSectionDone(2);
         document.getElementById("img-2").src = data.data.image2;
      }
      if (data.data.image3Status === true) {
         setSectionDone(3);
         document.getElementById("img-3").src = data.data.image3;
      }
      // Show completed corpse if all done
      if (data.data.status === "Complete") {
        showCompleted(data.data);
      }
   //   ["1","2","3"].forEach(n => {
   //     if (data.data["image" + n]) {
   //       let img = document.createElement("img");
   //       img.src = data.data["image" + n];
   //       img.style.width = "100%";
   //       img.style.marginTop = "8px";
   //       img.style.borderRadius = "6px";
   //       document.getElementById("final" + n).appendChild(img);
   //     }
   //   });
    });

  // Check localStorage for already-selected section
  const sessionDataString = localStorage.getItem("selectedSection");
  if (sessionDataString) {
    let sessionData = JSON.parse(sessionDataString);
    if (sessionData.corpseName === corpseName) {
      firstname = sessionData.firstname;
      setSectionTaken(parseInt(sessionData.section.replace("section-", "")), "You");
    }
  }

  // Prompt for name if not stored
//  if (!firstname) {
  //  firstname = window.prompt("Enter your first name");
 // }

  firstname = localStorage.getItem("firstname");
  if (!firstname) {
    firstname = window.prompt("Enter your first name");
    localStorage.setItem("firstname", firstname);
  }

  combinedSocket.corpseName = corpseName;
  combinedSocket.emit("privateDrawingRoom", { name: firstname, corpseRoom: corpseName });
  combinedSocket.emit("corpseRoom", { name: corpseName });

  // Section button listeners
  [1, 2, 3].forEach(n => {
    document.getElementById("section-" + n).addEventListener("click", () => {
      let section = "section-" + n;
      localStorage.setItem("selectedSection", JSON.stringify({ corpseName, section, firstname }));
      combinedSocket.emit("selectedCanvas", { corpseName, section });
      window.location.href = `/drawingSection?corpseName=${corpseName}&section=${section}&firstName=${firstname}`;
    });
  });

  // Someone else selected a section
  combinedSocket.on("canvasSelected", (data) => {
    let n = parseInt(data.section.replace("section-", ""));
    setSectionTaken(n, data.name || "Someone");
  });
});

function setSectionDone(n) {
  let btn = document.getElementById("section-" + n);
  let meta = document.getElementById("meta-" + n);
  btn.disabled = true;
  btn.innerHTML = "Submitted";
  meta.innerHTML = "✓ Complete";
  meta.className = "section-meta done";
}

function setSectionTaken(n, who) {
  let btn = document.getElementById("section-" + n);
  let meta = document.getElementById("meta-" + n);
  btn.disabled = true;
  btn.innerHTML = "In Progress";
  meta.innerHTML = who + " is drawing this";
  meta.className = "section-meta taken";
}

function showCompleted(data) {
  document.getElementById("completedResult").style.display = "block";
  ["1","2","3"].forEach(n => {
    let img = document.createElement("img");
    img.src = data["image" + n];
    document.getElementById("final" + n).appendChild(img);
  });
}

function disableSection(section) {
  let n = parseInt(section.replace("section-", ""));
  setSectionTaken(n, "You");
}

