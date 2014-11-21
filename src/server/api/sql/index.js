'use strict';

var express = require('express');
var controller = require('./sql.controller');

var router = express.Router();

router.post('/', controller.parseSQL);

module.exports = router;
