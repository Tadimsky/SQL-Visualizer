'use strict';

/**
 * @ngdoc overview
 * @name sqlVisualizerApp
 * @description
 * # sqlVisualizerApp
 *
 * Main module of the application.
 */
angular
  .module('sqlVisualizerApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
