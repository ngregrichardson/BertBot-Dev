/* eslint-disable */
var app = angular.module('app', ['ngMaterial', 'ngMessages', 'material.svgAssetsCache']).config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default').primaryPalette('red').accentPalette('red').dark();
});

var error = '';
app.controller('loginController', function ($scope, $http) {
    $scope.email = '';
    $scope.password = '';
    $scope.error = '';
    $scope.logIn = function () {
        $http.post('/loginUser', { email: $scope.email, password: encodeURIComponent($scope.password) }).then($scope.success, $scope.failure);
    }
    $scope.success = function (res) {
        window.location.href = `/settings?id=${res.data}`;
    }
    $scope.failure = function (res) {
        $scope.error = res.data;
    }
});