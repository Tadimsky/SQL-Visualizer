'use strict';


angular.module('sqlvizApp')
  .directive('treeGraph', ['d3Service', function (d3Service) {

    return {
      restrict: 'EA',
      scope: {
        data: '='
      },
      link: function (scope, element, attrs) {
        d3Service.d3().then(function(d3) {
          var margin = {top: 0, right: 120, bottom: 20, left: 0},
            width = 1400 - margin.right - margin.left,
            height = 1000 - margin.top - margin.bottom;

          var svg = d3.select(element[0])
            .append('svg:svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr("transform", "translate(" + margin.left +  "," + margin.top + ")");

          window.onresize = function() {
            scope.$apply();
          };

          scope.$watch(function() {
            return angular.element(window)[0].innerWidth;
          }, function() {
            scope.render(scope.data);
          });

          scope.$watch('data', function(newVal, oldVal) {
            return scope.render(newVal);
          }, true);

          scope.render = function(jsonData) {

            var data = jsonData;

            svg.selectAll('*').remove();

            if (!data) {
              return;
            }

            // Create a tree "canvas"
            var tree = d3.layout.tree()
              .size([width,height])
              .children(function(d) {
                return (!d.children || d.children.length === 0) ? null: d.children;
              });

            var diagonal = d3.svg.diagonal()
              .projection(function(d) { return [d.x, d.y]; });

            // Preparing the data for the tree layout, convert data into an array of nodes
            var nodes = tree.nodes(data);



            // Create an array with all the links
            var links = tree.links(nodes);

            var link = svg.selectAll("path.link")
              .data(links)
              .enter().append("svg:path")
              .attr("class", "link")
              .attr("d", diagonal);

            var node = svg.selectAll("g.node")
              .data(nodes)
              .enter().append("svg:g")
              .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

            // Add the dot at every node
            node.append("svg:circle")
              .attr("r", 3.5);

            // place the name atribute left or right depending if children
            node.append("svg:text")
              .attr("dx", 0)
              .attr("dy", function(d) { return d.children? -8 : 20 } )
              .attr("text-anchor", 'middle')
              .text(function(d) { return d.name; });

            // place the name atribute left or right depending if children


              node.append("svg:text")
                .attr("dx", 0)
                .attr("dy", function(d) { return d.children? 15 : 40 } )
                .attr("text-anchor", 'middle')
                .text(function(d) {return d.statement == d.name || d.depth < 4 ? '' : d.statement; });

          }
        });
      }
    };
}]);