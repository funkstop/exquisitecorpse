let express = require('express');
var bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { MongoClient } = require('mongodb');
require('dotenv').config();

let app = express();

const { TextEncoder } = require('util');
global.TextEncoder = TextEncoder;

const { TextDecoder } = require('util');
global.TextDecoder = TextDecoder;

app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database and Collection references
let database;
let collection;

// MongoDB Connection URI
const uri = process.env.MONGODB_URL;

//Connect to the mongo DB
const { Database } = require("quickmongo");
const db = new Database(uri);
db.on("ready", () => {
    console.log("Connected to the database");
});
db.connect(); 

app.use('/', express.static('public'));

//Initialize the actual HTTP server
let http = require('http');
let server = http.createServer(app);
let port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Server listening at port: " + port);
});

//Initialize socket.io
let io = require('socket.io');
io = new io.Server(server);

let combined = io.of('/combined');
let drawingSection = io.of('/drawingSection');
let gallery = io.of('');

// Section locks: { "corpseName::section-1": socketId or 'done' }
const locks = {};
const ipCreations = {}; // { ip: [timestamps] }

function isRateLimited(ip) {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  if (!ipCreations[ip]) ipCreations[ip] = [];
  ipCreations[ip] = ipCreations[ip].filter(t => now - t < window);
  if (ipCreations[ip].length >= 5) return true;
  ipCreations[ip].push(now);
  return false;
}

var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.post('/', urlencodedParser, (req, res) => {
    console.log('Got create corpse post:', req.body.corpse_name);
    res.redirect('/combined?corpseName=' + req.body.corpse_name);
});

app.post('/newCorpse',(req,res)=>{
  console.log('got to post: newCorpse');  
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (isRateLimited(ip)) {
    return res.json({ task: "rate_limited" });
  }
  db.get("pTracker").then(documents => {
    console.log('in get corpse all')
    console.log(documents);
    let specificDocument = null;
    if (documents != null && documents.data != null ) {
     specificDocument = documents.find(doc => doc.name == req.body.corpse_name);
    }
    if (specificDocument != null) {
      console.log('already exists!');
      res.json({task:"already_exists", 'corpseName': req.body.corpse_name});
    } else {
      console.log('still getting here...');
      let obj = {
        status:'new',
        name: req.body.corpse_name,
        image1: req.body.img1,
        image1Status: 'unsubmitted',
        image2: req.body.img2,
        image2Status: 'unsubmitted',
        image3: req.body.img3,
        image3Status: 'unsubmitted'
      };
      if (documents == null) {
        db.push("pTracker",[obj])
      } else {
        db.push("pTracker",obj);
      }
      res.json({task:"sucess", 'corpseName': req.body.corpse_name});
    }
  }).catch(error => {
    console.error(error);
  });
});

app.get('/getGallery',(req,res)=>{
  db.get("pTracker").then(pData =>{
    let obj = {data: pData};
    res.json(obj);
  })
})

app.get('/getCorpse', (req, res)=> {
  console.log('in get corpse')
  let corpseName = req.query.corpseName;
  db.get("pTracker").then(documents => {
    const specificDocument = documents.find(doc => doc.name == corpseName);
    let obj = {data: specificDocument}
    res.json(obj);
  }).catch(error => {
    console.error(error);
  });
});

/*
app.get('/clearDB', (req, res) => {
    db.deleteAll("pTracker").then(() => res.send('cleared'));
});
*/

function updateCorpseInDB(data) {
  db.get("pTracker").then(documents => {
    const index = documents.findIndex(doc => doc && doc.name == data.corpseName);
    if (index === -1) { console.log('corpse not found!'); return; }
    
    const specificDocument = documents[index];
    
    if (specificDocument.image1Status==true && specificDocument.image2Status==true && specificDocument.image3Status==true) {
      console.log('do nothing - already complete');
      return;
    }
    
    if (data.section == 'section-1') {
      specificDocument.image1 = data.drawingData;
      specificDocument.image1Status = true;
      specificDocument.image1Artist = data.firstname;
    } else if (data.section == 'section-2') {
      specificDocument.image2 = data.drawingData;
      specificDocument.image2Status = true;
      specificDocument.image2Artist = data.firstname;
    } else if (data.section == 'section-3') {
      specificDocument.image3 = data.drawingData;
      specificDocument.image3Status = true;
      specificDocument.image3Artist = data.firstname;
    }
    
    if (specificDocument.image1Status==true && specificDocument.image2Status==true && specificDocument.image3Status==true) {
      specificDocument.status = 'Complete';
    }
    
    documents[index] = specificDocument;
    
    db.deleteAll("pTracker").then(() => {
      db.push('pTracker', documents);
    });
  }).catch(error => console.error(error));
}

// gallery socket
gallery.on('connection', (socket) => {
  console.log('gallery socket connected: ' + socket.id)
  socket.on('testEmit', (socket) => {
    console.log('got testEmit');
    combined.emit('updateCorpse', 'I got here via gallery');
    socket.join('corpse1')
  });
});

// combined socket
combined.on('connection', (socket) => {
  console.log('combined socket connected: ' + socket.id);
  
  socket.on('privateDrawingRoom', (data) => {
    console.log('Combined: received room: ' + data.name);
    socket.join(data.name);
    socket.join(data.corpseRoom);
    socket.roomName = data.name;
  });
  
  socket.on('corpseRoom', (data) => {
    console.log('Combined: received corpseRoom: ' + data.name);
    socket.join(data.name);
    socket.corpseName = data.name;

    // send current lock state for this corpse
    const currentLocks = [];
    for (const key in locks) {
      const [corpseName, section] = key.split('::');
      if (corpseName === data.name) {
        currentLocks.push({ section, status: locks[key] === 'done' ? 'done' : 'locked' });
      }
    }
    socket.emit('currentLocks', { locks: currentLocks });
  });
  
  socket.on('selectedCanvas', (data) => {
  console.log('selectedCanvas - socket.corpseName:', socket.corpseName, 'socket.roomName:', socket.roomName);
  console.log('data:', data);
    console.log('Combined: selectedCanvas: ', data);
    const key = data.corpseName + '::' + data.section;

    // if already locked or done, deny
    if (locks[key]) {
      socket.emit('lockDenied', { section: data.section });
      return;
    }

    // grant the lock
    locks[key] = socket.id;
    socket.emit('lockGranted', { section: data.section });

    combined.to(socket.corpseName).emit('sectionLocked', { section: data.section });
    drawingSection.to(socket.roomName).emit('sendSelectedSection', { section: data.section, corpseRoom: socket.corpseName });
  });
    
  socket.on('data', (data) => {
    console.log("Received 'data' msg: " + data);
    drawingSection.emit('dataAll', data);
  });

  /*socket.on('disconnect', () => {
    console.log('combined socket disconnected: ' + socket.id);
    for (const key in locks) {
      if (locks[key] === socket.id) {
        const [corpseName, section] = key.split('::');
        delete locks[key];
        combined.to(corpseName).emit('sectionUnlocked', { section });
      }
    }
  });*/
});

// drawing section socket
drawingSection.on('connection', (socket) => {
  console.log('drawingSection socket connected: ' + socket.id);

  socket.on('privateDrawingRoom', (data) => {
    console.log('DrawingSection: ReceivedRoom: ' + data.name);
    socket.join(data.name);
    socket.roomName = data.name;
    socket.corpseName = data.corpseRoom;
    socket.section = data.section;

    // transfer lock ownership to this socket
    const key = data.corpseRoom + '::' + data.section;
    if (locks[key]) {
      locks[key] = socket.id;
    }
  });
  
  socket.on('submitSection', (data) => {
    console.log('DrawingSection: submitSection: ', data.section, data.corpseName);
    
    // mark lock as done so disconnect won't release it
    const key = data.corpseName + '::' + data.section;
    locks[key] = 'done';

    updateCorpseInDB(data);
    combined.to(data.corpseName).emit('updateCombinedCanvas', data);
    drawingSection.emit('sectionSubmitted', data);
  });

  socket.on('disconnect', () => {
    console.log('drawingSection socket disconnected: ' + socket.id);
    for (const key in locks) {
      if (locks[key] === socket.id) {
        const [corpseName, section] = key.split('::');
        delete locks[key];
        combined.to(corpseName).emit('sectionUnlocked', { section });
      }
    }
  });
});
