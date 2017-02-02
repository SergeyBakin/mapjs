"use strict";
// var express = require('express');
// var router = express.Router();

/* GET home page. */

module.exports = function(ctx) {
	var app = ctx.app;

	app.get('/', function (req, res) {
		res.render('index', { title: 'Map' });
	});
};
