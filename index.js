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

var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.post('/', urlencodedParser, (req, res) => {
    // what this should do: create a new corpse below with a new room.
    // it should redirect the person who created it, to combined but within that room
  // others can select the same corpse to keep that same room. should be persistent somehow
    console.log('Got create corpse post:', req.body.corpse_name);
    // should the below be a fetch request?
    res.redirect('/combined?corpseName=' + req.body.corpse_name);
});


/*
// POST route for saving data
app.post('/save', async (req, res) => {
    try {
        const result = await collection.insertOne(req.body);
        res.status(201).send(`Document inserted with _id: ${result.insertedId}`);
    } catch (e) {
        res.status(500).send("Error saving data: " + e.message);
    }
});
*/

//called from initial page when create new is called
app.post('/newCorpse',(req,res)=>{
 // console.log(req.body);
  console.log('got to post: newCorpse');  
  
  // check if corpse exists:
  db.get("pTracker").then(documents => {
    console.log('in get corpse all')
    console.log(documents);
    let specificDocument = null;
    if (documents != null && documents.data != null ) {
     specificDocument = documents.find(doc => doc.name == req.body.corpse_name);
    }
   // console.log(specificDocument);
    if (specificDocument != null) {
      console.log('already exists!');
      res.json({task:"already_exists", 
                'corpseName': req.body.corpse_name
               });
    } else {
            //otherwise continue
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
      res.json({task:"sucess", 
                'corpseName': req.body.corpse_name, 
               });
    }
  }).catch(error => {
    // Handle error
    console.error(error);
  });
  
});

 //get all corpses in the db
app.get('/getGallery',(req,res)=>{
//  collection.findAll
  db.get("pTracker").then(pData =>{
    let obj = {data: pData};
    res.json(obj);
    })
  //db.*deleteAll("pTracker");  Do NOT UNCOMMENT!!! THIS DELETES THE DB!! 
})


app.get('/getCorpse',  (req, res)=> {
  console.log('in get corpse')
  console.log(req.query);
  let corpseName = req.query.corpseName;
  db.get("pTracker").then(documents => {
    console.log('in get corpse all')
   // console.log(documents);
   // console.log(req);
    const specificDocument = documents.find(doc => doc.name == corpseName);
    let obj = {data: specificDocument}
    res.json(obj);
    console.log(specificDocument);
  }
    ).catch(error => {
    // Handle error
    console.error(error);
  });
});

app.get('/clearDB', (req, res) => {
    db.deleteAll("pTracker").then(() => res.send('cleared'));
});

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
    } else if (data.section == 'section-2') {
      specificDocument.image2 = data.drawingData;
      specificDocument.image2Status = true;
    } else if (data.section == 'section-3') {
      specificDocument.image3 = data.drawingData;
      specificDocument.image3Status = true;
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

/*
 function updateCorpseInDB(data) {
  console.log('update here')
  console.log(data);
  let docsToUpdate;
  db.get("pTracker").then(documents => {
    console.log(documents);
    const specificDocument = documents.find(doc => doc.name == data.corpseName);
    let index = documents.find(doc=> doc.name == data.corpseName);
   // let obj = {data: specificDocument}
   // res.json(obj);
    if ((specificDocument.image1Status==true)&&(specificDocument.image2Status==true)&&(specificDocument.image3Status==true))
    {
      console.log('do nothing'); // someone beat them -- long run fix the race condition
      return;
    }
    
    if (data.section == 'section-1') {
      specificDocument.image1=data.drawingData;
    specificDocument.image1Status = true;
    } else if (data.section == 'section-2') {
      specificDocument.image2=data.drawingData;
    specificDocument.image2Status = true;
    } else if (data.section == 'section-3') {
      specificDocument.image3=data.drawingData;
      specificDocument.image3Status = true;
    }
    
    if ((specificDocument.image1Status==true)&&(specificDocument.image2Status==true)&&(specificDocument.image3Status==true))
    {
      specificDocument.status='Complete'
    }
    console.log('specificDocument: ')
    console.log(specificDocument);
    documents[index] = specificDocument;
    docsToUpdate = documents;


  }
    ).catch(error => {
    // Handle error
    console.error(error);
  });
    console.log('gonna update');
    console.log(docsToUpdate)
    db.deleteAll("pTracker").then(res => {// delete it
      db.push('pTracker', docsToUpdate) })
                                  
  
}

*/


// socket.io on Connection setups
gallery.on('connection', (socket) => {
  console.log('gallery socket connected !!!! : ' + socket.id)
  
  socket.on('testEmit', (socket) => {
    console.log('got testEmit');
    combined.emit('updateCorpse', 'I got here via gallery');
    socket.join('corpse1')
    
  });

});


/////////combined (corpse) socket
//based on socket id on combined page
combined.on('connection', (socket) => {
    
  console.log('combined socket connected !!!!!!! : ' + socket.id);
  
  socket.on('privateDrawingRoom', (data) => {
    console.log('Combined: received room: ' + data.name);
    console.log('Combined: received corpseRoom via room: ' + data.corpseRoom)
    socket.join(data.name);
    socket.join(data.corpseRoom);
    socket.roomName = data.name;

  });
  
  socket.on('corpseRoom', (data) => {
    console.log('Combined: received corpseRoom: ' + data.name);
    socket.join(data.name);
    socket.corpseName = data.name;

  });
  
  socket.on('selectedCanvas', (data) => {
    console.log('combined client is sending the selected section');
    console.log('Combined: selectedCanvas: ');
    console.log(data);
    combined.emit('updateCombinedCanvas', data);
    //drawingSection.join(data)
    console.log('Combined: selectedCanvas:RoomName: ' + socket.roomName);
    console.log('Combined: selectedCanvas:CorpseName: ' + socket.corpseName);
    //send only to the individual's Room
    drawingSection.to(socket.roomName).emit('sendSelectedSection', {'section':data.section,'corpseRoom':socket.corpseName}); 
    // input.emit('dataAll', data);
  })
    
  socket.on('data', (data) => {
      //Data can be numbers, strings, objects
      console.log("Received 'data' msg");
      console.log('Combined: data: ' + data);
  
      //Send the data back to the clients using .emit()
      //Send data to ALL clients, including this one
      drawingSection.emit('dataAll', data);

  })
  
})

// individual drawing sections. only based on socket id -- 
drawingSection.on('connection', (socket) => {
    console.log('input socket connected : ' + socket.id);
  // implicitly create a room right away -- so that all following interactions are in a room? 
  // but user's first interaction is on combined page - that is a unique socket id for each person. 
  // Maybe ask for their name? or make 'selecting' redirect them 
  // need to figure out: when they select a section, just they are notified on drawingSection, but combined is updated for everyone.
  
  socket.on('privateDrawingRoom', (data) => {
    console.log('DrawingSection: ReceivedRoom: ' + data.name);
    console.log(data);
    socket.join(data.name);
    socket.roomName = data.name;
    if (!socket.corpseRoom) {
      console.log('do nothing');
    } else {
      console.log('corpseNAme!! : ' + socket.corpseName);
   //   if (data.name.startsWith('rr')) {
     //   socket.corpseName = 'corpse2';
    //  } else {
    //    socket.corpseName = 'corpse1';
   //   }
    }

  });
  
    
  // dont think data on is needed.
  //Listen for messages from the client or socket events
  drawingSection.on('data', (data) => {
    //Data can be numbers, strings, objects
    console.log("Received 'data' msg");
    console.log('DrawingSectiong:data: ' + data);

    //Send the data back to the clients using .emit()
    //Send data to ALL clients, including this one
    drawingSection.emit('dataAll', data);

  })
  
  socket.on('submitSection', (data) => {
    console.log('input client has sent their completed canvas');
    console.log(data);
    console.log('DrawingSection: SubmitSection: roomName: '+ socket.roomName);
    console.log('DrawingSection: SubmitSection: corpseName: '+ data.corpseName);
    console.log('DrawingSection: SubmitSection: section: ' + data.section);
    updateCorpseInDB(data);
    combined.to(data.corpseName).emit('updateCombinedCanvas', data);
    drawingSection.emit('sectionSubmitted', data);
      // input.emit('dataAll', data);
    
    // add to database here! first check if exists, then update as necessary.
  //  db.get("pTracker").then(pData =>{
 //     let obj = {data: pData};
 //     if (pData.)
 //     res.json(obj);
 //   })
    /*let obj = {
    status:'new',
    name: req.body.corpse_name,
    image1: req.body.img1,
    image1Status: 'unsubmitted',
    image2: req.body.img2,
    image2Status: 'unsubmitted',
    image3: req.body.img3,
    image3Status: 'unsubmitted'
  };
  db.push("pTracker",obj);
  res.json({task:"sucess", 'corpseName': req.body.corpse_name});
    */
  })
  
  //Listen for this client to disconnect
  drawingSection.on("disconnect", () => {
    console.log("A client has disconnected: " + socket.id);
  });

})
