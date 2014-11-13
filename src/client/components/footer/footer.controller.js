'use strict';

angular.module('sqlvizApp')
  .controller('FooterCtrl', function ($scope, $location) {
    $scope.project = {
        title: 'Duke University CS 316'
      };

    $scope.authors = [
      {
        name: 'Tadimsky',
        netid: 'jas138',
        github: 'Tadimsky'
      },
      {
        name: 'Czarlos',
        netid: 'cer26',
        github: 'Czarlos'
      },
      {
        name: 'Fish',
        netid: 'ref13',
        github: 'Fish6'
      },
      {
        name: 'Toto',
        netid: 'rt181',
        github: 'rtoussaint'
      }
    ];

    $scope.isCollapsed = true;

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
