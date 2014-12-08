'use strict';


angular.module('sqlvizApp')
  .directive('treeGraph', ['d3Service', function (d3Service) {

    /**
     *  Determines whether the node is a table reference
     */
    var isTable = function(node) {
      if (node.name == 'value') {
        if (node.children) {
          if (node.children.indexOf('table_name')) {
            return true;
          }
        }
      }
      return false;
    };

    var createTable = function(svg, tableObj, x, y) {
      var table = [];
      table.push(tableObj);

      var tableW = 150;
      var tableH = 200;
      var padding = 20;
      var innerRectPad = 13;

      var rects = svg.selectAll("body")
        .data(table)
        .enter()
        .append("svg:g")
        .attr("transform", function(d, i) {
          return "translate(" + x + ", " + y + ")";
        });


      rects
        .append("rect")
        .attr("class", "rect")
        .attr("width", tableW)
        .attr("height", function(d){
          var length = d.columns.length;
          return length * 32 + 25;
        })
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("ry", 0)
        .attr("rx", 0)
        .attr("fill", function(d,i) {
          // return "rgb(34,245,185)";
          return "rgb(73,119,188)";
        });

      //headers
      rects
        .append("svg:text")
        .text(function(d){
          return d.name
        })
        .attr("dx", tableW / 2)
        .attr("dy", 15)
        .attr("width", 100)
        .attr("height", 20)
        .attr("font-size", 16)
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle");

      rects
        .append("line")
        .attr("x1", 0)
        .attr("y1", padding)
        .attr("x2", tableW)
        .attr("y2", padding)
        .attr("stroke", "black")
        .attr("stroke-width", 3);



      //inner rects
      rects.selectAll("g")
        .data(function(d) {
          return d.columns;
        })
        .enter()
        .append("rect")
        .attr("width", tableW-2)
        .attr("height", function(d){
          return 20;
        })
        .attr("y", function(d, i){
          return 27*(i+1)+padding-innerRectPad;
        })
        .attr("stroke", function(d){
          if(d.selected == "SELECT") {
            return "yellow";
          }
          else if(d.selected == "WHERE") {
            return "white";
          }
          else {
            return "black";
          }
        })
        .attr("stroke-width", 1)
        .attr("fill", function(d,i) {
          // return "rgb(34,245,185)";
          return "rgba(34,245,0,0.3)";
        });

      //columns
      rects.selectAll("g")
        .data(function(d) {
          return d.columns;
        })
        .enter()
        .append("text")
        .text(function(d) {
          return d.name;
        })
        .attr("dx", tableW / 2)
        .attr("dy", function(d,i){
          return 27*(i+1) + padding;
        })
        .attr("fill", function(d){
          if(d.selected == "SELECT") {
            return "yellow";
          }
          else if(d.selected == "WHERE") {
            return "white";
          }
          else {
            return "black";
          }
        })
        .attr("text-anchor", "middle")
        .attr("width", 100)
        .attr("height", 20);
    };

    return {
      restrict: 'E',
      scope: {
        data: '='
      },
      link: function (scope, element, attrs) {
        d3Service.d3().then(function(d3) {
          var margin = {top: 20, right: 120, bottom: 20, left: 50},
            width = 1400,
            height = 1000;

          var svg = d3.select(element[0])
            .append('svg:svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr("transform", "translate(" + margin.left +  "," + margin.top + "), scale(0.95)");

          width = width - margin.left - margin.right;
          height = height - margin.top - margin.bottom;

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

            if (!jsonData) {
              return;
            }
            var data = jsonData.simple;
            if (!data) {
              return;
            }

            // Create a tree "canvas"
            var tree = d3.layout.cluster()
              .size([height,width])
              .children(function(d) {
                return (!d.children || d.children.length === 0) ? null: d.children;
              });
            /*
              .separation(function(a, b) {
                if (a.parent == b.parent) {
                  if (isTable(a) || isTable(b)) {
                    return 30;
                  }
                }
                return 10;
              });
              */

            var diagonal = d3.svg.diagonal()
              .projection(function(d) { return [d.y, d.x]; });

            var colors = d3.scale.category20()

            // Preparing the data for the tree layout, convert data into an array of nodes
            var nodes = tree.nodes(data);
            // take the nodes and clean them up
            // Create an array with all the links
            var links = tree.links(nodes);

            var link = svg.selectAll("path.link")
              .data(links)
              .enter().append("svg:path")
              .attr("class", "link")
              .attr("d", diagonal);

            var node = svg.selectAll("g.node")
              .data(nodes.filter(function(d) {
                return !d.model.table;
              }))
              .enter().append("svg:g")
              .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

            // Add the dot at every node
            node.append("svg:circle")
              .attr("r", 10)
              .attr("fill", function(d) {
                  return colors(d.depth);
                });


            // place the name atribute left or right depending if children
            node.append("svg:text")
              .attr("dx", 0)
              .attr("dy", function(d) { return d.children? -8 : 20 } )
              .attr("text-anchor", 'middle')
              .text(function(d) {
                if (d.model.table) {return '';}
                return d.model.name;
              });

            // place the name atribute left or right depending if children


              node.append("svg:text")
                .attr("dx", 0)
                .attr("dy", function(d) { return d.children? 15 : 40 } )
                .attr("text-anchor", 'middle')
                .text(function(d) {
                  // don't draw tables
                  if (d.model.table) {return '';}
                  return d.model.statement == d.model.name || d.depth < 4 ? '' : d.model.statement;
                });

            // Create tables at the appropriate nodes.
            nodes.forEach(function (n) {
              if (n.model.table) {
                //if (n.model.statement.model.statement === (tables[count]).name) {
                createTable(svg, n.model.table, n.y, n.x);
                //}
              }
            });


          }
        });
      }
    };
}]);
