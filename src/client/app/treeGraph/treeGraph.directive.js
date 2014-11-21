'use strict';


angular.module('sqlvizApp')
  .directive('treeGraph', ['d3Service', function (d3Service) {
    return {
      restrict: 'EA',
      link: function (scope, element, attrs) {
        d3Service.d3().then(function(d3) {
          alert('hello');
        });
      }
    };
}]);
