'use strict';

angular.module('sqlvizApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
    });


    $scope.editorOptions = {
      lineWrapping : true,
      lineNumbers: true,
      indentWithTabs: true,
      smartIndent: true,
      autofocus: true,
      extraKeys: {'Ctrl-Space': 'autocomplete'},
      mode: 'text/x-mysql',
      theme: 'monokai'
    };
  });
