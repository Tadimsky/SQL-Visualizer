'use strict';

var _ = require('lodash');
var sql = require('./sqlparser.js');
var crypto = require('crypto');
var TreeModel = require('tree-model');

exports.index = function(req, res) {
  res.json([]);
};

var removeCircularReferences = function(root) {
  root.walk(function(n) {
    if (n.model.children) {
      delete n.model.children;
    }
    if (n.parent) {
      delete n.parent;
    }
  });
  return root;
};

var simplifyTree = function(root) {
  var nRoot = root.first(function(n) {
    return n.model.name == 'sql_stmt';
  });
  if (!nRoot) return root;

  // remove select_results node
  var selects = nRoot.all(function(n) {
    return (n.model.name == 'select_results');
  });
  selects.forEach(function(n) {
    n.children.forEach(function(child) {
      n.parent.addChild(child);
    });
    n.drop();
  });


  nRoot.walk(function(n) {
    switch (n.model.name) {
      case 'select_result':
          n.children = [];
        break;
      case 'single_source':
        var table = n.first(function(t) {
          return t.model.name == 'table_name';
        });
        if (table) {
          n.model.name = 'table';
          n.model.table = table;
          n.model.statement = table;
        }

            break;
      case 'join_constraint':
        var expr = n.first(function(t) {
          return t.model.name == 'expr';
        });
        if (expr) {
          expr.children = [];
        }
        break;

    }
  });

  nRoot.all(function(n) {
    return n.model.name == 'table';
  }).forEach(function(n) {
    n.children.forEach(function(child) {
      child.all(function() {return true})
        .forEach(function(n) {n.drop(); });
    });
  });


  return nRoot;
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
      return n.name == 'expr';
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
      column: column_name ? column_name.model : null,
      string: value.model.statement
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
    if ((text.indexOf('whitespace') > -1) || (text.indexOf('semicolon') > -1) || (text.indexOf('comma') > -1)) {
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
          delete data.source;
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
 * Breadth first search to find table names
 * @param json
 */
var findTables = function (json) {
    var returnArray = [];
    var uniqueTables = {};
    var visited = {};
    var firstNode = json.children[0];

    if (!firstNode) {
      return null;
    }
    var stack = [];
    stack.push(firstNode);

    if (!firstNode) {
      return null;
    }

    while (stack.length > 0) {
        var topNode = stack.pop();
        if (!topNode) {
          break;
        }
        var prehash = JSON.stringify(topNode);
        var hashed = crypto.createHash('md5').update(prehash).digest('base64');
        if (!visited.hasOwnProperty(hashed)) {
            if (topNode.name === "table_name") {
                returnArray.push((topNode.children)[0].statement);
                uniqueTables[(topNode.children)[0].statement] = [];
                //uniqueTables.name = uniqueTables[(topNode.children)[0].statement];
            }
            visited[hashed] = "true";
            stack = stack.concat(topNode.children);
        }
    }
    var tables = addColumns(uniqueTables, json);
    var final = formatJSON(tables);
    return final;
};

var formatJSON = function (tables) {
    var result = [];

    for (var key in tables) {
      var table = {};
      table.name = key;


      var array = tables[key];
      var dict = {};
      var lookup = {"SELECT":3, "WHERE":2, "JOIN":1};
      var col = [];
      for (var i=0; i<array.length; i++) {
        var item = array[i];

        if (!dict.hasOwnProperty(item.name)) {
          dict[item.name] = item.used;
        }
        else if (lookup[dict[item.name]] < lookup[item.used]) {
          dict[item.name] = item.used;
        }
      }
      for (var k in dict) {
        var o = {};
        o[k] = dict[k]
        col.push(o);
      }

      table.columns = col;
      result.push(table);
    }
    return result;
}

/**
 * Add column objects to the corresponding table
 * @param tables - Map of tables
 */
var addColumns = function (tables, json) {

    var selectColumns = findColumnObject(tables, json, "SELECT");
    var findJoined = findColumnObject(tables, json, "join_source");
    var findWhere = findColumnObject(tables, json, "WHERE");
    var array = selectColumns.concat(findJoined, findWhere);


    for (var key in tables) {
      if (tables.hasOwnProperty(key)) {
        for (var i=0; i<array.length;i++) {
          var tuple = array[i];
          if (tuple.table === key) {
            var columnObject = {};
            columnObject.name = tuple.column;
            columnObject.used = tuple.operator;
            tables[key].push(columnObject);
          }
        }
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
        if (!topNode) {
          break;
        }
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
        var tuple = {};
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

    // THIS NEEDS TO STAY HERE
    var tables = findTables(tree);

    // create tree model to extract data
    var t = new TreeModel();
    var root = t.parse(tree);
    // calculate the output table
    var resultTable = generateResultTable(root);

    var simpleTree = simplifyTree(root);

    var noncircularTree = removeCircularReferences(simpleTree);


    //var tables = findTables(tree);
    return res.send(
      {
        tables: tables,
        tree: null,
        output: resultTable,
        simple: noncircularTree
      }
    );
  }
  else {
    return res.json({});
  }
};

