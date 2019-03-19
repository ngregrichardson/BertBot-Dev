/* App setup */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 3000;
var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');
var config = {
  apiKey: "AIzaSyDs6bFjGG9IqrqmR5sIvVM64K3ayKB_RtA",
  authDomain: "bertbot-1537111406006.firebaseapp.com",
  databaseURL: "https://bertbot-1537111406006.firebaseio.com",
  projectId: "bertbot-1537111406006",
  storageBucket: "bertbot-1537111406006.appspot.com",
  messagingSenderId: "310158549274"
};
firebase.initializeApp(config);
var db = firebase.firestore();
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
  console.log(req.body);
  var data = {};
  for(var i = 1; i < Object.keys(req.body).length; i++) {
    data[Object.keys(req.body)[i].split('[')[1].slice(0, -1)] = req.body[Object.keys(req.body)[i]];
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
async function getConfig(serverId) {
  if (serverId == null || serverId == undefined) return;
  var id = await getOwnerId(serverId);
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
async function getConfigs() {
  return await new Promise(resolve => {
    var configs = db.collection('configs');
    configs.get().then((snapshot) => {
      if (snapshot.exists) {
        console.log(snapshot.data());
        resolve(snapshot.data());
      } else {
        resolve(0);
      }
    });
  });
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
/* Meetings */
app.post('/updateMeetings', (req, res) => {
  db.collection('configs').doc(req.body.uid).update(req.body.data);
});
function updateMeetings(serverId, meetings) {
  getOwnerId(serverId).then((id) => {
    db.collection('configs').doc(id).update({ meetings: meetings });
  });
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
async function getOwnerId(serverId) {
  if (serverId == null || serverId == undefined) return;
  return await new Promise(resolve => {
    var server = db.collection('servers').doc(serverId);
    server.get().then((snapshot) => {
      if (snapshot.exists) {
        resolve(snapshot.data().ownerId);
      } else {
        resolve(0);
      }
    });
  });
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
  meetingNotificationChannelId: '',
  meetings: [],
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
  getUserLikes: getUserLikes,
  getLikes: getLikes,
  updateLikes: updateLikes,
  updateMeetings: updateMeetings
}
