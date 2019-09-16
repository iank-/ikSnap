/* * Module dependencies */ 
var express = require('express'), 
	stylus = require('stylus'), 
	nib = require('nib'),
	fs = require('fs'),
	mysql = require('mysql'),
	uuid = require('node-uuid'),
	imagemagick = require('imagemagick'),
	flash = require('express-flash'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;
	
	var app = express();
	
	function compile(str, path) {
		return stylus(str).set('filename', path).use(nib())
	}
	
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(stylus.middleware({
		src : __dirname + '/public',
		compile : compile
	}));
	
	app.use(express.static(__dirname + '/public'));
	
	app.use(express.cookieParser("secret"));
	app.use(flash());
	app.use(express.session({
		secret : "525i"
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
		

	
	app.get('/', function (req, res) {
		
		console.log(__dirname + "/public/photos/test.jpg");
		
		var image = __dirname + "/public/photos/test.jpg";
		imagemagick.resize({
			srcPath: image,
			dstPath: __dirname + '/public/photos/thumbnail/test.jpg',
			width: '400'
			
		}, function(err,stdout,stderr){
			if (err) console.log(err);
		});
	});
	
	var port = 1337;
	console.log('[i] listening on '+ port +'...');
	app.listen(port);
	