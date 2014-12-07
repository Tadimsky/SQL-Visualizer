'use strict';

var _ = require('lodash');
var sql = require('./sqlparser.js');
var crypto = require('crypto');

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
 * Breadth first search to find table names
 * @param json
 */
var findTables = function (json) {
    var returnArray = [];
    var uniqueTables = {};
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
                uniqueTables[(topNode.children)[0].statement] = [];
            }
            visited[hashed] = "true";
            stack = stack.concat(topNode.children);
        }
    }
    var tables = addColumns(uniqueTables, json);
    return tables;
};


/**
 * Add column objects to the corresponding table
 * @param tables - Map of tables
 */
var addColumns = function (tables, json) {
    var selectColumns = findColumnObject(tables, json, "SELECT");
    var findJoined = findColumnObject(tables, json, "join_source");
    var findWhere = findColumnObject(tables, json, "WHERE");
    var array = selectColumns.concat(findJoined, findWhere);
    for(var i=0; i<array.length;i++) {
        var item = array[i];
        if (tables.hasOwnProperty(item["table"])) {
            var obj = {};
            obj[item.column] = item.operator;
            tables[item["table"]].push(obj); //Add column item to list of columns
        }
    }
    console.log(tables);
    return tables;
};

/**
 * Finds the {table:column{section:something}} object
 * of SELECT/FROM/WHERE
 * @param
 */
var findColumnObject = function (tables, json, operator) {
    //1. Find specific operator tree
    var subTrees = [];
    var visited = {};
    var firstNode = json.children[0];
    var stack = [];
    stack.push(firstNode);

    while (stack.length > 0) {
        var topNode = stack.pop();
        var prehash = JSON.stringify(topNode);
        var hashed = crypto.createHash('md5').update(prehash).digest('base64');
        if (!visited.hasOwnProperty(hashed)) {
            if (topNode.name === operator) {
                subTrees.push(topNode.children);
            }
            visited[hashed] = "true";
            stack = stack.concat(topNode.children);
        }
    }
    var array = [];
    //2. Look in that tree for column object
    for(var i=0; i<subTrees.length; i++) {
        var tuples = findColumns(subTrees[0][i]);
        //array.push(tuples);
        if (tuples.length > 0) {
            for(var x=0; x<tuples.length;x++){
            var obj = tuples[x];
            obj["operator"] = operator;
            array.push(obj);
        }
        }
        else {
            array.push({});
        }
    }
    return array;
    //return tables;
};


/**
 * Breadth first search to find column names and associated tables
 * Will return empty array if *
 * @param json
 */
var findColumns = function (json) {
    var returnArray = [];
    var visited = {};
    var firstNode = json;
    var stack = [];
    stack.push(firstNode);

    while (stack.length > 0) {
        var topNode = stack.pop();
        var prehash = JSON.stringify(topNode);
        var hashed = crypto.createHash('md5').update(prehash).digest('base64');
        if (!visited.hasOwnProperty(hashed)) {
            if (topNode.name === "value") {
                returnArray.push(topNode.children);
            }
            visited[hashed] = "true";
            stack = stack.concat(topNode.children);
        }
    }
    var columnTuples = [];

    for (var i=0; i<returnArray.length; i++) {
        var table = "";
        var column = "";
        var tuple = {}
        for (var x=0; x<(returnArray[i]).length; x++) {
            var item = (returnArray[i][x]);
            if (item.name === "table_name") {
                table = item.statement;
            }
            else if (item.name === "column_name") {
                column = item.statement;
            }
        }
        tuple["table"] = table;
        tuple["column"] = column;
        columnTuples.push(tuple);
    }
    return columnTuples;
};


exports.parseSQL = function(req, res) {
  var command = (req.body.sql).toUpperCase();
  if (command) {
    var tree = sql.parse(command);
    tree = prune(tree);
    tree = reformat(tree);

    //interpretSQL(tree);
    var tables = findTables(tree);
    return res.json({tables: tables, tree: tree});

    return res.json(tree);
  }
  else {
    return res.json({});
  }
};

exports.getTables = function (req, res) {
    var command = (req.body.sql).toUpperCase();
    if (command) {
        var tree = sql.parse(command);
        tree = prune(tree);
        tree = reformat(tree);
        var tables = findTables(tree);
        //console.log(tables);
        return res.json([{"tables":tables}, {"tree":tree}]);
    }
    else {
        return res.json({});
    }
};

exports.getColumns = function (req, res) {
    var command = (req.body.sql).toUpperCase();
    if (command) {
        var tree = sql.parse(command);
        tree = prune(tree);
        var columns = findColumns(tree);
        console.log(columns);
        return res.json({"columns":columns});
    }
    else {
        return res.json({});
    }
}

