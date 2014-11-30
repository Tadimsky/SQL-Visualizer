'use strict';

angular.module('sqlvizApp')
  .controller('MainCtrl', function ($scope, $http) {

    $scope.sqlCommand = '';
    $scope.parsedTreeText = '';
    $scope.parsedTree;

    var cleanupTree = function(data) {
      var root = data;
      var queue = [];
      queue.push(root);

      while (queue.length > 0) {
        var c = queue.pop();

        if (c.source && c.range) {
          c.statement = c.source.substr(c.range.location, c.range.length);
        }

        if (c.children) {
          c.children.forEach(function(child, index) {
            if (!child.name) {
              c.children.splice(index, 1);
            }
            else {
              if (child.name.indexOf('whitespace') > -1) {
                c.children.splice(index, 1);
              }
              else {
                queue.push(child);
              }
            }
          });
        }
      }

      return data;
    };

    $scope.$watch('sqlCommand',
      function(newValue, oldValue) {
        console.log(newValue + " - " + oldValue);
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
