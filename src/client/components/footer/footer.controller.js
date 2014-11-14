'use strict';

angular.module('sqlvizApp')
  .controller('FooterCtrl', function ($scope, $location) {
    $scope.project = {
        title: 'Duke University CS 316'
      };

    $scope.authors = [
      {
        name: 'Jonno',
        netid: 'jas138',
        github: 'Tadimsky'
      },
      {
        name: 'Carlos',
        netid: 'cer26',
        github: 'Czarlos'
      },
      {
        name: 'Ryan F',
        netid: 'ref13',
        github: 'RFish6'
      },
      {
        name: 'Ryan T',
        netid: 'rt181',
        github: 'rtoussaint'
      }
    ];

    $scope.isCollapsed = true;

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
