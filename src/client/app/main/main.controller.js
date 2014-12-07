'use strict';

angular.module('sqlvizApp')
  .controller('MainCtrl', function ($scope, $http) {

    $scope.sqlCommand = '';
    $scope.parsedTreeText = '';
    $scope.parsedTree;

    $scope.$watch('sqlCommand',
      function(newValue, oldValue) {
        if ( newValue !== oldValue ) {
          if (newValue.indexOf(';') != newValue.length - 1) {
            newValue = newValue + ';';
          }
          $http.post('/api/sql', {sql: newValue})
            .success(function(data, status, headers) {
              $scope.parsedTree = data; //cleanupTree(data);
              $scope.parsedTreeText = JSON.stringify(data, undefined, 4);
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
