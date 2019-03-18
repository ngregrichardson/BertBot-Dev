/* eslint-disable */
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
$.get('/getConfig', getUrlParam('id', null)).then(function (data) {
  if (data != null && data != undefined && data != '') {
    load(data);
  } else {
    error('You are not logged in. This page will now redirect you.');
    window.location.href = '/';
  }
});
var app = angular.module('app', ['ngMaterial', 'ngMessages', 'material.svgAssetsCache']).config(function ($mdThemingProvider) {
  $mdThemingProvider.theme('default').primaryPalette('red').accentPalette('red').dark();
});
app.controller('serverSettingsController', function ($scope) {
  $scope.saved = {};
  $scope.save = function (id, val) {
    $scope.saved[id] = val;
    output(`Saving ${id} as ${val}`);
  };
  $scope.getSaved = function () {
    return $scope.saved;
  }
  $scope.resetSaved = function () {
    $scope.saved = {};
  }
  $scope.load = function (data) {
    $scope.botName = data.botName;
    $scope.teamNumber = parseInt(data.teamNumber);
    $scope.serverId = data.serverId;
  };
});
app.controller('trelloSettingsController', function ($scope) {
  $scope.saved = {};
  $scope.save = function (id, val) {
    if (id == 'trelloNotificationsEnabled' || id == 'trelloNotificationsChannelId') {
      $scope.saved[id] = val;
    } else if (id == 'watchedTrelloBoardIds') {
      val = formatSaveArray(val);
      $scope.saved[id] = val;
    } else {
      if (val == true) {
        console.log($scope.saved);
        if($scope.saved['watchedTrelloNotifications'] == undefined || $scope.saved['watchedTrelloNotifications'] == null) $scope.saved['watchedTrelloNotifications'] = [];
        $scope.saved['watchedTrelloNotifications'].push(id);
        console.log($scope.saved);
      }
    }
    output(`Saving ${id} as ${val}`);
  };
  $scope.getSaved = function () {
    return $scope.saved;
  }
  $scope.resetSaved = function () {
    $scope.saved = {};
  }
  $scope.load = function (data) {
    $scope.trelloNotificationsEnabled = data.trelloNotificationsEnabled == 'true' || data.trelloNotificationsEnabled == true;
    $scope.trelloKey = data.trelloKey;
    $scope.trelloToken = data.trelloToken;
    $scope.trelloNotificationsChannelId = data.trelloNotificationsChannelId;
    $scope.watchedTrelloBoardIds = formatLoadArray(data.watchedTrelloBoardIds);
    if(data.watchedTrelloNotifications == null || data.watchedTrelloNotifications == undefined) return;
    $scope.cardCreated = data.watchedTrelloNotifications.includes('cardCreated');
    $scope.cardDescriptionChanged = data.watchedTrelloNotifications.includes('cardDescriptionChanged');
    $scope.cardDueDateChanged = data.watchedTrelloNotifications.includes('cardDueDateChanged');
    $scope.cardPositionChanged = data.watchedTrelloNotifications.includes('cardPositionChanged');
    $scope.cardListChanged = data.watchedTrelloNotifications.includes('cardListChanged');
    $scope.cardNameChanged = data.watchedTrelloNotifications.includes('cardNameChanged');
    $scope.cardMemberAdded = data.watchedTrelloNotifications.includes('cardMemberAdded');
    $scope.cardMemberRemoved = data.watchedTrelloNotifications.includes('cardMemberRemoved');
    $scope.cardChecklistAdded = data.watchedTrelloNotifications.includes('cardChecklistAdded');
    $scope.cardChecklistRemoved = data.watchedTrelloNotifications.includes('cardChecklistRemoved');
    $scope.cardDeleted = data.watchedTrelloNotifications.includes('cardDeleted');
    $scope.cardUnarchived = data.watchedTrelloNotifications.includes('cardUnarchived');
    $scope.cardArchived = data.watchedTrelloNotifications.includes('cardArchived');
    $scope.cardAttachmentAdded = data.watchedTrelloNotifications.includes('cardAttachmentAdded');
    $scope.cardAttachmentRemoved = data.watchedTrelloNotifications.includes('cardAttachmentRemoved');
    $scope.commentAdded = data.watchedTrelloNotifications.includes('commentAdded');
    $scope.commentEdited = data.watchedTrelloNotifications.includes('commentEdited');
    $scope.listCreated = data.watchedTrelloNotifications.includes('listCreated');
    $scope.listNameChanged = data.watchedTrelloNotifications.includes('listNameChanged');
    $scope.listPositionChanged = data.watchedTrelloNotifications.includes('listPositionChanged');
    $scope.listArchived = data.watchedTrelloNotifications.includes('listArchived');
    $scope.listUnarchived = data.watchedTrelloNotifications.includes('listUnarchived');
    $scope.checklistItemMarkedComplete = data.watchedTrelloNotifications.includes('checklistItemMarkedComplete');
    $scope.checklistItemMarkedIncomplete = data.watchedTrelloNotifications.includes('checklistItemMarkedIncomplete');
  };
});
app.controller('orderSystemController', function ($scope) {
  $scope.saved = {};
  $scope.save = function (id, val) {
    $scope.saved[id] = val;
    output(`Saving ${id} as ${val}`);
  };
  $scope.getSaved = function () {
    return $scope.saved;
  }
  $scope.resetSaved = function () {
    $scope.saved = {};
  }
  $scope.load = function (data) {
    $scope.orderSystemEnabled = data.orderSystemEnabled == 'true' || data.orderSystemEnabled == true;
    $scope.orderRequestBoardId = data.orderRequestBoardId;
    $scope.orderPlacedChecklistItemName = data.orderPlacedChecklistItemName;
    $scope.orderPlacedListName = data.orderPlacedListName;
    $scope.orderRequestedListName = data.orderRequestedListName;
    $scope.orderFrom = data.orderFrom;
    $scope.orderFromPassword = data.orderFromPassword;
    $scope.orderTo = data.orderTo;
  };
});
app.controller('swearFilterController', function ($scope) {
  $scope.saved = {};
  $scope.save = function (id, val) {
    if (id == 'swearFilterWhitelistedChannelNames') {
      val = formatSaveArray(val);
    }
    $scope.saved[id] = val;
    output(`Saving ${id} as ${val}`);
  };
  $scope.getSaved = function () {
    return $scope.saved;
  }
  $scope.resetSaved = function () {
    $scope.saved = {};
  }
  $scope.load = function (data) {
    $scope.swearFilterEnabled = data.swearFilterEnabled == 'true' || data.swearFilterEnabled == true;
    $scope.swearFilterWhitelistedChannelNames = formatLoadArray(data.swearFilterWhitelistedChannelNames);
  };
});
app.controller('modSystemController', function ($scope) {
  $scope.saved = {};
  $scope.save = function (id, val) {
    if (id == 'modCommandRoles') {
      val = formatSaveArray(val);
    }
    $scope.saved[id] = val;
    output(`Saving ${id} as ${val}`);
  };
  $scope.getSaved = function () {
    return $scope.saved;
  }
  $scope.resetSaved = function () {
    $scope.saved = {};
  }
  $scope.load = function (data) {
    $scope.modSystemEnabled = data.modSystemEnabled == 'true' || data.modSystemEnabled == true;
    $scope.modCommandRoles = formatLoadArray(data.modCommandRoles);
  };
});
app.controller('meetingSystemController', function ($scope) {
  $scope.saved = {};
  $scope.save = function (id, val) {
    $scope.saved[id] = val;
    output(`Saving ${id} as ${val}`);
  };
  $scope.getSaved = function () {
    return $scope.saved;
  }
  $scope.resetSaved = function () {
    $scope.saved = {};
  }
  $scope.load = function (data) {
    $scope.meetingNotificationsEnabled = data.meetingNotificationsEnabled == 'true' || data.meetingNotificationsEnabled == true;
    $scope.meetingNotificationsChannelId = data.meetingNotificationsChannelId;
    $scope.meetings = data.meetings;
  };
});
app.controller('miscController', function ($scope) {
  $scope.saved = {};
  $scope.save = function (id, val) {
    if (id == 'blaiseWhitelistedChannelNames' || id == 'restrictedCommandRoles') {
      val = formatSaveArray(val);
    }
    $scope.saved[id] = val;
    output(`Saving ${id} as ${val}`);
  };
  $scope.getSaved = function () {
    return $scope.saved;
  }
  $scope.resetSaved = function () {
    $scope.saved = {};
  }
  $scope.load = function (data) {
    $scope.likeCounterEnabled = data.likeCounterEnabled == 'true' || data.likeCounterEnabled == true;
    $scope.blaiseWhitelistedChannelNames = formatLoadArray(data.blaiseWhitelistedChannelNames);
    $scope.restrictedCommandRoles = formatLoadArray(data.restrictedCommandRoles);
  };
});
app.controller('errorController', function ($scope) {
  $scope.loadError = function (err) {
    $scope.err = err
  };
});
function save() {
  var saveToUpdate = {};
  Object.assign(saveToUpdate, angular.element(document.getElementById('serverSettingsController')).scope().getSaved());
  Object.assign(saveToUpdate, angular.element(document.getElementById('trelloSettingsController')).scope().getSaved());
  Object.assign(saveToUpdate, angular.element(document.getElementById('orderSystemController')).scope().getSaved());
  Object.assign(saveToUpdate, angular.element(document.getElementById('swearFilterController')).scope().getSaved());
  Object.assign(saveToUpdate, angular.element(document.getElementById('modSystemController')).scope().getSaved());
  Object.assign(saveToUpdate, angular.element(document.getElementById('meetingSystemController')).scope().getSaved());
  Object.assign(saveToUpdate, angular.element(document.getElementById('miscController')).scope().getSaved());
  output(`Updating:`);
  output(saveToUpdate);
  $.post('/updateConfig', { uid: getUrlParam('id', null), data: saveToUpdate });
  angular.element(document.getElementById('serverSettingsController')).scope().resetSaved();
  angular.element(document.getElementById('trelloSettingsController')).scope().resetSaved();
  angular.element(document.getElementById('orderSystemController')).scope().resetSaved();
  angular.element(document.getElementById('swearFilterController')).scope().resetSaved();
  angular.element(document.getElementById('modSystemController')).scope().resetSaved();
  angular.element(document.getElementById('meetingSystemController')).scope().resetSaved();
  angular.element(document.getElementById('miscController')).scope().resetSaved();
}
function load(data) {
  output(`Loading:`);
  output(data);
  angular.element(document.getElementById('serverSettingsController')).scope().load(data);
  angular.element(document.getElementById('trelloSettingsController')).scope().load(data);
  angular.element(document.getElementById('orderSystemController')).scope().load(data);
  angular.element(document.getElementById('swearFilterController')).scope().load(data);
  angular.element(document.getElementById('modSystemController')).scope().load(data);
  angular.element(document.getElementById('meetingSystemController')).scope().load(data);
  angular.element(document.getElementById('miscController')).scope().load(data);
}
function error(err) {
  angular.element(document.getElementById('errorController')).scope().loadError(err);
}
function output(mess) {
  console.log(mess);
}
function getUrlParam(param, def) {
  var urlparameter = def;
  if (window.location.href.indexOf(param) > -1) {
    urlparameter = getUrlVars()[param];
  }
  return urlparameter;
}
function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key] = value;
  });
  return vars;
}
function formatSaveArray(value) {
  if(value == null || value == undefined) return;
  var array = value.split(',');
  for (var val in array) {
    val.trim();
  }
  return array;
}
function formatLoadArray(array) {
  if(array == null || array == undefined) return;
  if(Array.isArray(array)) {
    return array.join(', ');
  }else {
    return array;
  }
}
