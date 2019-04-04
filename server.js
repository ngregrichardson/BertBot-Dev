/* App setup */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 3000;
var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');
var fb = {
  apiKey: "AIzaSyDs6bFjGG9IqrqmR5sIvVM64K3ayKB_RtA",
  authDomain: "bertbot-1537111406006.firebaseapp.com",
  databaseURL: "https://bertbot-1537111406006.firebaseio.com",
  projectId: "bertbot-1537111406006",
  storageBucket: "bertbot-1537111406006.appspot.com",
  messagingSenderId: "310158549274"
};
firebase.initializeApp(fb);
var db = firebase.firestore();
var configs;
var servers;
getCollection('configs').then((data) => {
  configs = data;
    db.collection('configs').onSnapshot(function (snapshot){
      snapshot.docChanges().forEach(function(change){
        configs[change.doc.id] = change.doc.data();
        //if(configs[change.doc.id].trelloNotificationsEnabled == true || configs[change.doc.id].trelloNotificationsEnabled == 'true') bot.updateTrello(configs[change.doc.id]);
        //if(configs[change.doc.id].orderSystemEnabled == true || configs[change.doc.id].orderSystemEnabled == 'true') bot.updateOrder(configs[change.doc.id]);
      });
  });
}).catch((err) => {
  console.log(err);
});
getCollection('servers').then((data) => {
servers = data;
  db.collection('servers').onSnapshot(function (snapshot){
    snapshot.docChanges().forEach(function(change){
      servers[change.doc.id] = change.doc.data();
    });
  });
}).catch((err) => {
  console.log(err);
});
/* App configuration */
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(express.static('public'));
/* Pages */
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/views/login.html`);
});
app.get('/settings', (req, res) => {
  res.sendFile(`${__dirname}/views/settings.html`);
});
app.get('/signup', (req, res) => {
  res.sendFile(`${__dirname}/views/signup.html`);
});
/* Styles */
app.get('/getStyles', (req, res) => {
  res.sendFile(`${__dirname}/views/styles.css`);
});
/* Scripts */
app.get('/getLoginJs', (req, res) => {
  res.sendFile(`${__dirname}/views/login.js`);
});
app.get('/getSettingsJs', (req, res) => {
  res.sendFile(`${__dirname}/views/settings.js`);
});
app.get('/getSignupJs', (req, res) => {
  res.sendFile(`${__dirname}/views/signup.js`);
});
/* Configs */
app.get('/getConfig', (req, res) => {
  loadConfig(req._parsedUrl.query).then(data => {
    res.send(data);
  }).catch(err => {
    console.log(`There was an error getting the data: ${err}`);
  });
});
app.post('/updateConfig', (req, res) => {
  if(req.body.uid == null || req.body.uid == undefined || req.body.uid == '') return;
  var data = {};
  for(var i = 1; i < Object.keys(req.body).length; i++) {
    if(!Object.keys(req.body)[i].includes('data[meetings]')) {
       data[Object.keys(req.body)[i].split('[')[1].slice(0, -1)] = req.body[Object.keys(req.body)[i]];
    }else {
      if(Object.keys(req.body)[i].includes('hasMeetings')) {
        data['meetings'] = {};
        continue;
      }
      if(!data['meetings']) data['meetings'] = {};
      if(!data['meetings'][Object.keys(req.body)[i].split('[')[2].slice(0, -1)]) data['meetings'][Object.keys(req.body)[i].split('[')[2].slice(0, -1)] = {};
      data['meetings'][Object.keys(req.body)[i].split('[')[2].slice(0, -1)][Object.keys(req.body)[i].split('[')[3].slice(0, -1)] = isNaN(req.body[Object.keys(req.body)[i]]) ? req.body[Object.keys(req.body)[i]] : parseInt(req.body[Object.keys(req.body)[i]]);
    }
  }
  db.collection('configs').doc(req.body.uid).update(data);
});
async function loadConfig(id) {
  if (id == null || id == undefined) return;
  return await new Promise(resolve => {
    var config = db.collection('configs').doc(id);
    config.get().then((snapshot) => {
      if (snapshot.exists) {
        resolve(snapshot.data());
      } else {
        resolve(0);
      }
    });
  });
}
function getConfig(serverId) {
  if (serverId == null || serverId == undefined) return;
  return configs[getOwnerId(serverId)];
}
async function getCollection(name) {
  return await new Promise(resolve => {
    var configs = db.collection(name);
    configs.get().then((snapshot) => {
      var coll = {};
      snapshot.docs.forEach((doc) => {
        coll[doc.id] = doc.data();
      });
      resolve(coll);
    });
  });
}
function getConfigs() {
  return configs;
}
async function createConfig(id, serverId) {
  if (id == null || id == undefined) return;
  return await new Promise(resolve => {
    var config = db.collection('configs').doc(id);
    var newConfig = defaultConfig;
    newConfig['serverId'] = serverId;
    config.set(newConfig);
    var config = db.collection('servers').doc(serverId);
    config.set({ ownerId: id });
    resolve(true);
  });
}
/* Trello */
function updateActivityId(newId, boardId) {
  for(var i = 0; i < Object.keys(configs).length; i++) {
    if(configs[Object.keys(configs)[i]].watchedTrelloBoardIds.includes(boardId)) {
      if(configs[Object.keys(configs)[i]].latestActivityId == newId) return
      db.collection('configs').doc(Object.keys(configs)[i]).update({ latestActivityId: newId });
    }
  }
}
/* Meetings */
function updateMeetings(serverId, meetings) {
  db.collection('configs').doc(getOwnerId(serverId)).update({ meetings: meetings });
}
/* Likes */
async function getLikes() {
  return await new Promise( resolve => {
    var likes = db.collection('likes');
    likes.get().then((snapshot) => {
      if (snapshot.exists) {
        resolve(snapshot.data());
      } else {
        resolve(0);
      }
    });
  });
}
async function getUserLikes(user) {
  if (user.id == null || user.id == undefined) return;
  return await new Promise(resolve => {
    var likes = db.collection('likes').doc(user.id);
    likes.get().then((snapshot) => {
      if (snapshot.exists) {
        resolve(snapshot.data());
      } else {
        resolve(0);
      }
    });
  });
}
function updateLikes(user, val) {
  db.collection('likes').doc(user.id).update({ likes: val });
}
/* Users */
app.post('/loginUser', (req, res) => {
  firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.password).then(function (user) {
    return res.send(user.user.uid);
  }).catch(function (error) {
    res.status(499).send(error.message);
  });
});
app.post('/createUser', (req, res) => {
  firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password).then(function (user) {
    createConfig(user.user.uid, req.body.serverId).then(success => {
      if (success) return res.send(user.user.uid);
    });
  }).catch(function (error) {
    res.status(499).send(error.message);
  });
});
function getOwnerId(serverId) {
  if (serverId == null || serverId == undefined) return;
  return servers[serverId].ownerId;
}
app.listen(port, () => console.log(`== Server started on port ${port} ==`));
var defaultConfig = {
  botName: '',
  teamNumber: '',
  serverId: '',
  trelloNotificationsEnabled: false,
  trelloKey: '',
  trelloToken: '',
  trelloNotificationsChannelId: '',
  watchedTrelloBoardIds: [],
  watchedTrelloNotifications: [],
  latestActivityId: 0,
  orderSystemEnabled: false,
  orderRequestBoardId: '',
  orderPlacedChecklistItemName: '',
  orderPlacedListName: '',
  orderRequestedListName: '',
  orderFrom: '',
  orderFromPassword: '',
  orderTo: '',
  swearFilterEnabled: false,
  swearFilterWhitelistedChannelNames: [],
  modSystemEnabled: false,
  modCommandRoles: [
    'owner'
  ],
  meetingNotificationsEnabled: false,
  meetingNotificationsChannelId: '',
  meetings: {},
  likeCounterEnabled: false,
  blaiseWhitelistedChannelNames: [
    ''
  ],
  restrictedCommandRoles: [
    'owner',
    'leader'
  ]
};
module.exports = {
  getConfig: getConfig,
  getConfigs: getConfigs,
  getOwnerId: getOwnerId,
  updateMeetings: updateMeetings,
  getUserLikes: getUserLikes,
  getLikes: getLikes,
  updateLikes: updateLikes,
  updateActivityId: updateActivityId
}
