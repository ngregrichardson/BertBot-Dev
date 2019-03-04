var app = angular.module('app', ['ngMaterial', 'ngMessages', 'material.svgAssetsCache']).config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default').primaryPalette('red').accentPalette('red').dark();
});

app.controller('signupController', function ($scope, $http) {
    $scope.email = '';
    $scope.password = '';
    $scope.passwordCheck = '';
    $scope.error = '';
    $scope.signUp = function () {
        if ($scope.password == $scope.passwordCheck) {
            $http.post('/createUser', { email: $scope.email, password: encodeURIComponent($scope.password), serverId: getUrlParam('serverId', null) }).then($scope.success, $scope.failure);
        } else {
            console.log('do not match');
        }
    }
    $scope.success = function (res) {
        window.location.href = `/settings?data=${res.data}`;
    }
    $scope.failure = function (res) {
        $scope.error = res.data;
    }
});

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