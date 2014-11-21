'use strict';

var _ = require('lodash');
var sql = require('./sqlparser.js');

// Get list of sqls
exports.index = function(req, res) {
  res.json([]);
};

exports.parseSQL = function(req, res) {
  var command = req.body.sql;
  if (command) {
    var tree = sql.parse(command);
    return res.json(tree);
  }
  else {
    return res.json({});
  }
};
