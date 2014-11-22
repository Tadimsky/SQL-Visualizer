'use strict';

angular.module('sqlvizApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
    });

    $scope.sqlCommand = '';
    $scope.parsedTree = '';


    $scope.data = [
      {name: 'Jonno', score: 100},
      {name: 'Megan', score: 90},
      {name: 'Carlos', score: 50}
    ];

    $scope.$watch('sqlCommand',
      function(newValue, oldValue) {
        console.log(newValue + " - " + oldValue);
        if ( newValue !== oldValue ) {
          if (newValue.indexOf(';') != newValue.length - 1) {
            newValue = newValue + ';';
          }
          $http.post('/api/sql', {sql: newValue})
            .success(function(data, status, headers) {
              $scope.parsedTree = JSON.stringify(data, undefined, 4);
            })
            .error(function(data, status) {
              alert(status);
            });
        }
      }
    );


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
