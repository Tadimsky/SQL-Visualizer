'use strict';

var _ = require('lodash');
var sql = require('./sqlparser.js');

// Get list of sqls
exports.index = function(req, res) {
  res.json([]);
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
      if ((data.name.indexOf('start') > -1) || (data.name.indexOf('source') == 0)){
        data = data.children[0];
      }

      if (data.range) {
        var stmt = data.source.substr(data.range.location, data.range.length);
        stmt = stmt.trim();
        if (stmt !== data.name) {
          data.statement = stmt;
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

    //interpretSQL(tree);

    return res.json(tree);
  }
  else {
    return res.json({});
  }
};
