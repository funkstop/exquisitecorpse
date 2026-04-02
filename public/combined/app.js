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

  fetch("/getCorpse?" + new URLSearchParams({ corpseName }))
    .then(res => res.json())
    .then(data => {
      if (!data.data) {
        window.location.href = "/";
        return;
      }
      if (data.data.image1Status === true) {
        setSectionDone(1, data.data.image1Artist);
        document.getElementById("img-1").src = data.data.image1;
      }
      if (data.data.image2Status === true) {
        setSectionDone(2, data.data.image2Artist);
        document.getElementById("img-2").src = data.data.image2;
      }
      if (data.data.image3Status === true) {
        setSectionDone(3, data.data.image3Artist);
        document.getElementById("img-3").src = data.data.image3;
      }
      if (data.data.status === "Complete") {
        showCompleted(data.data);
      }
    });

  firstname = localStorage.getItem("firstname");
  if (!firstname) {
    firstname = window.prompt("Enter your artist name");
    localStorage.setItem("firstname", firstname);
  }

  combinedSocket.emit("privateDrawingRoom", { name: firstname, corpseRoom: corpseName });
  combinedSocket.emit("corpseRoom", { name: corpseName });

  // Section button listeners — wait for server lock grant before redirecting
  [1, 2, 3].forEach(n => {
    document.getElementById("section-" + n).addEventListener("click", () => {
      console.log('selectCanvas emitting');
      let section = "section-" + n;
      console.log('about to select ' + section + ' ' + corpseName);
      combinedSocket.emit("selectedCanvas", { corpseName, section });
    });
  });

  console.log('after for each');
  // Server granted the lock — now redirect
  combinedSocket.on("lockGranted", (data) => {
    console.log('about to grant');
    let section = data.section;
    localStorage.setItem("selectedSection", JSON.stringify({ corpseName, section, firstname }));
    window.location.href = `/drawingSection?corpseName=${corpseName}&section=${section}&firstName=${firstname}`;
  });

  // Server denied the lock — someone else has it
  combinedSocket.on("lockDenied", (data) => {
    console.log('lockDenied');
    let n = parseInt(data.section.replace("section-", ""));
    setSectionTaken(n, "Someone");
    alert("Sorry, someone else just grabbed that section!");
  });

  // Another user locked a section
  combinedSocket.on("sectionLocked", (data) => {
    console.log('sectionLocked');
    let n = parseInt(data.section.replace("section-", ""));
    setSectionTaken(n, "Someone");
  });

  // A user disconnected — section is available again
  combinedSocket.on("sectionUnlocked", (data) => {
    let n = parseInt(data.section.replace("section-", ""));
    setSectionAvailable(n);
  });

  // Someone submitted — mark as done
  combinedSocket.on("updateCombinedCanvas", (data) => {
    let n = parseInt(data.section.replace("section-", ""));
    setSectionDone(n);
    document.getElementById("img-" + n).src = data.drawingData;
  });

  combinedSocket.on("currentLocks", (data) => {
    data.locks.forEach(lock => {
      let n = parseInt(lock.section.replace("section-", ""));
      if (lock.status === 'done') {
        // already handled by DB fetch, but just in case
        setSectionDone(n);
      } else {
        setSectionTaken(n, "Someone");
      }
    });
  });
});

function setSectionDone(n) {
  let btn = document.getElementById("section-" + n);
  let meta = document.getElementById("meta-" + n);
  btn.disabled = true;
  btn.innerHTML = "Submitted";
  meta.innerHTML = "✓ " + (artist ? "drawn by " + artist: "Complete");
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

function setSectionAvailable(n) {
  let btn = document.getElementById("section-" + n);
  let meta = document.getElementById("meta-" + n);
  btn.disabled = false;
  btn.innerHTML = "Draw Section " + n;
  meta.innerHTML = "Available";
  meta.className = "section-meta";
}

function showCompleted(data) {
  document.getElementById("completedResult").style.display = "block";
  ["1","2","3"].forEach(n => {
    let img = document.createElement("img");
    img.src = data["image" + n];
    document.getElementById("final" + n).appendChild(img);
  });
}
