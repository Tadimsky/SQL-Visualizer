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
  .config(["$routeProvider", function ($routeProvider) {
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
  }]);

'use strict';

/**
 * @ngdoc function
 * @name sqlVisualizerApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sqlVisualizerApp
 */
angular.module('sqlVisualizerApp')
  .controller('MainCtrl', ["$scope", function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  }]);

'use strict';

/**
 * @ngdoc function
 * @name sqlVisualizerApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the sqlVisualizerApp
 */
angular.module('sqlVisualizerApp')
  .controller('AboutCtrl', ["$scope", function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  }]);
