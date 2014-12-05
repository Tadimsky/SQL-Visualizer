'use strict';

var express = require('express');
var controller = require('./sql.controller');

var router = express.Router();

router.post('/', controller.parseSQL);

router.post('/tables', controller.getTables);

module.exports = router;
