'use strict';

var _ = require('lodash');
var sql = require('./sqlparser.js');
var crypto = require('crypto');

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

/**
 * Bredth first search to find table names
 *
 */
var findTables = function (json) {
    var returnArray = [];
    var visited = {};
    var firstNode = json.children[0];
    var stack = [];
    stack.push(firstNode);

    while (stack.length > 0) {
        var topNode = stack.pop();
        var prehash = JSON.stringify(topNode);
        var hashed = crypto.createHash('md5').update(prehash).digest('base64');
        if (!visited.hasOwnProperty(hashed)) {
            if (topNode.name === "table_name") {
                returnArray.push((topNode.children)[0].statement);
            }
            visited[hashed] = "true";
            stack = stack.concat(topNode.children);
        }
    }

    for (var i=0; i<returnArray.length; i++) {
        console.log(returnArray[i]);
    }


    return returnArray;
};

var validate = function (string) {

}

exports.parseSQL = function(req, res) {
  var command = (req.body.sql).toUpperCase();
  if (command) {
    var tree = sql.parse(command);
    tree = prune(tree);
    console.log(command);
    //interpretSQL(tree);

    return res.json(tree);
  }
  else {
    return res.json({});
  }
};

exports.getTables = function (req, res) {
    var json = {"good":"match"};
    var command = "SELECT * FROM money, cash;";
    var tree = sql.parse(command);
    tree = prune(tree);
    findTables(tree);
    return res.json(tree);
};


