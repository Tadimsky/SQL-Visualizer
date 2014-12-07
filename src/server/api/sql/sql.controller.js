'use strict';

var _ = require('lodash');
var sql = require('./sqlparser.js');

var TreeModel = require('tree-model');

// Get list of sqls
exports.index = function(req, res) {
  res.json([]);
};

var generateResultTable = function(root) {

  var output = [];

  var select_results =  root.all(function(node) {
    node = node.model;
    return node.name == 'select_result'
  });

  select_results.forEach(function(node) {

    var value = node.first(function(n) {
      n = n.model;
      return n.name == 'value';
    });

    var table_name = value.first(function(table) {
      table = table.model;
      return table.name == 'table_name';
    });
    var column_name = value.first(function(column) {
      column = column.model;
      return column.name == 'column_name';
    });

    output.push({
      table: table_name ? table_name.model : null,
      column: column_name ? column_name.model : name,
      string: value.statement
    });
  });
  return output;
};

var reformat = function(data) {
  var stack = [];
  var root = data;
  stack.push(root);
  var cur = stack.pop();
  while (cur) {
    if (cur.name == 'select_core') {
      if (cur.children) {
        var i = 0;
        while (i < cur.children.length) {
          var child = cur.children[i];
          switch (child.name) {
            case 'SELECT':
            case 'FROM':
            case 'WHERE':
                  var sibling = cur.children[i+1];
                  if (sibling) {
                    child.children = [];
                    child.children.push(sibling);
                    cur.children.splice(i+1, 1);
                  }
                  i++;
                  break;
            default:
                  i++;
                  break;
          }
        }
      }
    }
    if (cur.children) {
      cur.children.forEach(function(c) {
        stack.push(c);
      });
    }
    cur = stack.pop();
  }
  return root;
};

var prune = function(data) {
  if (!data) {
    return null;
  }
  // if there is no name tag, then it is not anything useful
  if (!data.name) {
    // discard
    // never has children
    return null;
  }
  else {
    // don't care about whitespace
    var text = data.name;
    if ((text.indexOf('whitespace') > -1) || (text.indexOf('semicolon') > -1)) {
      // discard
      // never has children
    }
    else {
      if ((data.name.indexOf('#document') == 0 ) || (data.name.indexOf('start') == 0 ) || (data.name.indexOf('source') == 0)){
        if (!data.children[0]) {
          return data;
        }
        else {
          data = data.children[0];
        }
      }

      if (data.range) {
        var stmt = data.source.substr(data.range.location, data.range.length);
        stmt = stmt.trim();
        if (stmt !== data.name) {
          data.statement = stmt;
          delete data.range;
        }
      }

      if (data.children) {
        var kids = [];
        for (var i = 0; i < data.children.length; i++) {
          var t = prune(data.children[i]);
          if (t) {
            kids.push(t);
          }
        }
        data.children = kids;
      }
      else {
        console.log(data);
      }
      return data;
    }
  }
  return null;
};

exports.parseSQL = function(req, res) {
  var command = req.body.sql;
  if (command) {

    // parse the tree
    var tree = sql.parse(command);
    // clean out junk
    tree = prune(tree);
    // simplify
    tree = reformat(tree);
    // we now have a better looking tree

    // create tree model to extract data
    var t = new TreeModel();
    var root = t.parse(tree);

    var resultTable = generateResultTable(root);
    console.log(resultTable);



    //interpretSQL(tree);

    return res.json(tree);
  }
  else {
    return res.json({});
  }
};
