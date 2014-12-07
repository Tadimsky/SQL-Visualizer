'use strict';

var _ = require('lodash');
var sql = require('./sqlparser.js');

var TreeModel = require('tree-model');

// Get list of sqls
exports.index = function(req, res) {
  res.json([]);
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
      if ((data.name.indexOf('start') == 0 ) || (data.name.indexOf('source') == 0)){
        data = data.children[0];
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

/**
 * Understand what the SQL is doing.
 * Find out what tables there are in the statement and
 * what columns are in each table.
 *
 * @param data
 */
var interpretSQL = function(data) {
  var tables = [];

  var queue = [];
  queue.push(data);

  while (queue.length > 0) {
    var cur = queue.pop();
    console.log(cur.name);
    if (cur.name == 'table_name') {
      tables[cur.name] = 'lol';
    }
    for (var i = 0; i < cur.children.length; i++) {
      queue.push(cur.children[i]);
    }
  }

  console.log(tables);
};


exports.parseSQL = function(req, res) {
  var command = req.body.sql;
  if (command) {
    var tree = sql.parse(command);
    tree = prune(tree);

    /*
    var t = new TreeModel();
    var root = t.parse(tree);

    var val = JSON.stringify(root.model, function( key, value) {
      if( key == 'parent') { return value.id;}
      else {return value;}
    });

    return res.send(val);
    */

    tree = reformat(tree);

    //interpretSQL(tree);

    return res.json(tree);
  }
  else {
    return res.json({});
  }
};
