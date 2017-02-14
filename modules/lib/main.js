"use strict";
var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
// var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lessMiddleware = require('less-middleware');
var hbs = require('hbs');
var mongo = require('mongodb');
var async = require('async');
var http = require('http');
var cf = require("./config.js");
var config = cf();

function newApp() {
	var self = this;

	var mClient = null;
	self.db = function (cb) {
		if (mClient) {
			return cb(null, mClient);
		}
		// Retrieve
		var MongoClient = mongo.MongoClient;
		var url =  "mongodb://";
		if (config.mongo.authorization) {
			url += config.mongo.user + ":" + config.mongo.password + "@";
		}
		url += config.mongo.host + ":"+
			config.mongo.port +"/" +
			config.mongo.db +
			"?connectTimeoutMS=" + 900000;
		// Connect to the db
		console.log("Connecting to: " + url);
		MongoClient.connect(url, {db: config.ccfg || {}, server: config.scfg || {}}, function (err, db) {
			mClient = db;
			cb(null, mClient);
		});
	};
	self.collection = function(name,cb) {
		self.db(function(err, db) {
			db.collection(name, function (err, collection) {
				cb(err, collection);
			});
		});
	};



	self.startApp = function (cb) {
		process.on('uncaughException', function (e) {
			console.trace(e);
		});
		console.time("startApp");
		async.series([
			function initBasics(cb) {
				var app = module.exports = express();
				self.app = app;
				// all environments
				hbs.registerPartials(__dirname + '/../../views');

				app.set('port', process.env.PORT || config.app.port);
				// view engine setup
				app.set('views', path.join(__dirname, '../../views'));
				app.set('view engine', 'hbs');
				// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
				// app.use(logger('dev'));
				app.use(bodyParser.json());
				app.use(bodyParser.urlencoded({ extended: true }));
				app.use(cookieParser());
				app.use(lessMiddleware(path.join(__dirname, '/../../public')));
				app.use(express.static(path.join(__dirname, '/../../public')));

				app.use(function (req, res, next) {
					res.locals.tiles = config.app.tiles;
					res.locals.mapOpts = config.app.mapOpts;
					res.locals.layout = "layout";
					res.locals.uniq = Date.now();
					res.locals.url = req.url;
					res.locals.urlPath = req._parsedUrl.pathname;
					res.locals.query = req._parsedUrl.query;
					res.locals.host = req.hostname;
					next();
				});
				cb();
			},
			function(cb) {
				cb();
			}
		], function(err) {
			console.timeEnd("startApp");
			if (err) {
				console.trace(err);
				return cb(err);
			}
			require('../../routes/index')(self);

			// error handler
			self.app.use(function(err, req, res, next) {
				res.status(err.status || 500);
				res.locals.layout = null;
				if (req.app.get('env') === 'development') {
					res.locals.message = err.message;
					res.locals.error =	err;
					res.render('error');
				} else {
					console.trace(err);
					res.send(500);
				}
			});

			var httpsrv = http.createServer(self.app);
			httpsrv.listen(self.app.get('port'), function() {
				console.log('Express server listening on port ' + self.app.get('port'));
				cb();
			});
		});
	};
}

module.exports = function () {
	return new newApp();
};
