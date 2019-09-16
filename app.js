/* Now about to change thumbnail path stuff, add thumbnail gen to bulk uploads */ 
var express = require('express'), 
	stylus = require('stylus'), 
	nib = require('nib'),
	fs = require('fs'),
	mysql = require('mysql'),
	uuid = require('node-uuid'),
	gm = require('gm'),
	imagemagick = require('imagemagick'),
	flash = require('express-flash'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;
	
	var gm = require('gm').subClass({ imageMagick: true });
	
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
	
	//app.use(express.logger());
	
	app.use(express.static(__dirname + '/public'));
	
	app.use(express.cookieParser("secret"));
	app.use(flash());
	app.use(express.session({
		secret : "525i"
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
		
	var mysqlDbInfo = {
		host : 'web2.cpsc.ucalgary.ca',
		user : 's513_ikabeary',
		password : '10025843',
		database : 's513_ikabeary'
	}
	
	global.conn = mysql.createConnection(mysqlDbInfo);
	conn.connect();
	
	passport.use(new LocalStrategy(
		function(username, password, done) {
			//console.log("[i] checking authentication for " + username);
			return checkAuthentication(username, password, done);
		}
	));
	
	function checkAuthentication(username, password, done, public_id) {
		//console.log("[i] checking authentication by searching database..");
		var query = "SELECT * FROM user WHERE username = " 
			+ conn.escape(username) + " AND password = " 
			+ conn.escape(password) + ";";
			
		//console.log("[i] performing query : " + query);
		
		conn.query(query, function(err, result) {
			if (err) throw err;
			
			if (result.length > 0) {
				var resultRow = result[0];
				passport.serializeUser(function(resultRow, done) {
					done(null, resultRow);
				});
				passport.deserializeUser(function(id, done) {
					done(null, resultRow);
				});
				return done(null, resultRow);
			} else {
				return done(null, false, { message: "Incorrect user/password combination."});
			}
		})
	}
	
	passport.serializeUser(function(resultRow, done) {
		//console.log("SERIALIZE : " + resultRow);
		done(null, resultRow);
	});
	passport.deserializeUser(function(id, done) {
		done(null, id);
	});
	
	function userLoggedIn(req, res, next) {
		if (req.user) {
			// someone's logged in
			next();
		} else {
			// no one logged in
			res.redirect('/sessions/new');
		}
	}
	
	app.get('/', userLoggedIn,function (req, res) {
		res.redirect('/feed');
	});
	
	app.get('/sessions/new', function (req, res) {
		res.render('login', {
			title : 'Login',
			greeting : 'sign in',
			message : req.flash('error')
		});
	});
	
	app.post('/sessions/create', passport.authenticate('local', {
			successRedirect: '/feed',
			failureRedirect: '/sessions/new',
			failureFlash: true
		})
	);
	
	app.get('/users/new', function(req, res) {
		res.render('signup', {
			title : 'Sign up'
		});

	})
	
	//  requirement 2  //////////////////////////////////
	app.post('/users/create', function(req, res) {
		var fullName = req.body.fullName;
		var username = req.body.username;
		var password = req.body.password;
		
		
		var query = "SELECT * FROM user WHERE username = " + conn.escape(username) + ";";
		
		conn.query(query, function(err, result) {
			if (err) throw err;
			
			if (result.length == 0) {
				//console.log("[i] Will make account: Full name=" + fullName + " & username=" + username);

				var query = "INSERT INTO user (username,password,full_name) VALUES ("
					+ conn.escape(username) + ", " 
					+ conn.escape(password) + ", "
					+ conn.escape(fullName) + ")";
		
				//console.log(query);

				conn.query(query, function(err, rows, fields) {
				  	if (err) throw err;
				  	//console.log('The solution is: ', rows[0].solution);
				});
	
				conn.query("SELECT * FROM user WHERE username = " + conn.escape(username) + ";", function(err, rows, fields) {
				  	if (err) throw err;
				
					req.login(rows[0], function(err) {
						if (err) throw err;
						res.redirect("/feed");
					});
				});

			} else {
				//console.log("[!] User " + username + " already exists!");
				req.flash('info', 'User already exists. Please choose another username.');
				res.redirect("/users/new");
			}
		});
		
	})
	
	
	app.get('/photos/new', userLoggedIn, function(req, res) {
		//console.log(req.user);
		res.render('upload', {
			title : 'Upload Photo',
			username : req.user.username
		});
	})

		
			
	app.post('/photos/create', userLoggedIn, function(req, res) {
		
		console.log(req.files.newImage.path);

		// check that req.files.newImage is of type image/png or image/jpg
		if (req.files.newImage.type == "image/png" || req.files.newImage.type == "image/jpg" || req.files.newImage.type == "image/jpeg") {
			 
			// remember the extension
			var extension = ".png";
			if (req.files.newImage.type == "image/jpg" || req.files.newImage.type == "image/jpeg") {
				extension = ".jpg";
			}
			
			var photoId = uuid.v1();
		
			var imagePath = __dirname + "/public/photos/" + photoId + extension;
			var imageThumbPath = __dirname + "/public/photos/thumbnail/" + photoId + extension;
			var imagePathForDb = (photoId + extension);
		
	   		fs.readFile(req.files.newImage.path, function(error, data) {	
				console.log("Saving this image as : " + imagePath);
				fs.writeFile(imagePath, data, function(err) {
					if (err) throw err;
					
					imagemagick.resize({
						srcPath: imagePath,
						dstPath: imageThumbPath,
						width: "400"
					}, function(err,stdout,stderr){
						if (err) throw err

						// write record to db
						var query = "INSERT INTO photo (owner_user_id,url,date_added) VALUES ("
							+ conn.escape(req.user.user_id) + ", "  
							+ conn.escape(imagePathForDb) + ", "
							+ "NOW()" + ")";

						//console.log(query);

						conn.query(query, function(err, rows, fields) {
						  if (err) throw err;
						  //console.log('The solution is: ', rows[0].solution);
						});

						conn.query("SELECT * FROM photo AS photoList", function(err, rows, fields) {
						  if (err) throw err;
						  //console.log('////////////////////////////////////////////');
						  //console.log('The photolist is: ', rows);
						  //console.log('////////////////////////////////////////////');
						});
		
						res.redirect("/feed")

						
					});					
				})

	   		})
			
			

		} else {
			req.flash('info', 'Images must be of type PNG or JPG.');
			// wrong type of file; bail.
			//console.log("unsupported type : " + req.files.newImage.type);
			res.redirect("/photos/new");
		}
		
	})

	app.get('/users/:id', userLoggedIn, function(req, res) {
		// looking for user by numeric id
		var userId = req.params.id;
		
		//console.log('looking for ' + userId);
		
		var query = "SELECT username, full_name FROM user WHERE user_id = " 
			+ conn.escape(userId) + ";" ;
			
		//console.log("[i] performing query : " + query);
		
		conn.query(query, function(err, userResult) {
			if (err) throw err;
			
			if (userResult.length > 0) {
				var usernameFromNumeric = userResult[0].username;
				var fullnameFromNumeric = userResult[0].full_name;
				
				var feedContentsAsSnapgramPhotos = [];
		
				//console.log("[i] getting images for user " + userId + " from db..");
				var query = "SELECT photo.url AS urls, photo.date_added AS added FROM photo WHERE photo.owner_user_id = " 
					+ conn.escape(userId) + ";";
	
				//console.log("[i] performing query : " + query);

				conn.query(query, function(err, result, fields) {
					if (err) throw err;

					var i;
					for (i = 0; i < result.length; i++) {
					
						var d = result[i].added.toString().split(/[- :]/);
						//console.log("## " + d);
						var date = new Date(d[1] + " " + d[2] + " " + d[3]);
						//console.log(date);
						var newImage = new SnapgramPhoto(userResult[0].full_name, userResult[0].user_id, "/photos/" + result[i].urls, "/photos/thumbnail/" + result[i].urls, date);
						//console.log(newImage);
						feedContentsAsSnapgramPhotos.push(newImage);
					}
					//console.log(feedContentsAsSnapgramPhotos);
					
					//console.log((req.user.user_id != userId) + " " + req.user.user_id + userId);
			
					res.render('feed', {
						title : ("// feed(" + usernameFromNumeric + ")"),
						header : ("// feed(" + usernameFromNumeric + ")"),
						imageArray : feedContentsAsSnapgramPhotos, 
						username : req.user.username,
						followable : (req.user.user_id != userId),
						unfollowable : (req.user.user_id != userId),
						id : userId
					});
				})
			}
		})
	})
	
	function SnapgramPhoto(username, ownerId, url, thumbUrl, date) {
		this.owner = username;
		this.ownerId = ownerId;
		this.url = url;
		this.thumbUrl = thumbUrl;
		this.date = date;

		
		this.desc = username + " - " + time_ago_in_words(this.date);
	}
	
	app.get('/users/:id/unfollow', userLoggedIn, function(req, res) {
		var requestedUser = req.params.id;
		
		if (requestedUser != req.user.user_id) {
			// write record to db
			var query = "DELETE FROM following WHERE follower_user_id = " + "'" + conn.escape(req.user.user_id) + "'" 
				+  " AND following_user_id =" + conn.escape(requestedUser) + "; ";
				
			//console.log(query);

			conn.query(query, function(err, rows, fields) {
			  if (err) throw err;
			  //console.log('The solution is: ', rows[0].solution);
			  res.redirect("/");
			});
			
		}
	})


	app.get('/users/:id/follow', userLoggedIn, function(req, res) {
		var requestedUser = req.params.id;
		
		if (requestedUser != req.user.user_id) {
			// write record to db
			var query = "INSERT INTO following (follower_user_id, following_user_id) VALUES ("
				+ "'" + conn.escape(req.user.user_id) + "', " 
				+ conn.escape(requestedUser) + "); ";
	
			//console.log(query);

			conn.query(query, function(err, rows, fields) {
			  if (err) throw err;
			  //console.log('The solution is: ', rows[0].solution);
			  res.redirect("/");
			});
			
		}
	})


	app.get('/feed', userLoggedIn, function(req, res) {
		//console.log(req.user);
		
		var feedContentsAsSnapgramPhotos = [];

		// all photos for logged in user:
		//console.log("[i] getting images for user " + req.user.user_id + " from db..");
		var query = "SELECT photo.url AS urls, photo.date_added AS added FROM photo WHERE photo.owner_user_id = " 
			+ conn.escape(req.user.user_id) + ";";
	
		//console.log("[i] performing query : " + query);

		conn.query(query, function(err, result, fields) {
			if (err) throw err;
			
			if (result.length < 1) {
				res.render('feed', {
					title : ("your feed (" + req.user.username + ")"),
					header : ("your feed is empty!"),
					username : req.user.username,
					followable : false,
					unfollowable : false,
					id : req.user.user_id
				});
			}

			var i;
			for (i = 0; i < result.length; i++) {
				var d = result[i].added.toString().split(/[- :]/);
				var date = new Date(d[1] + " " + d[2] + " " + d[3]);

				var newImage = new SnapgramPhoto(req.user.full_name, req.user.user_id, "/photos/" + result[i].urls, "/photos/thumbnail/" + result[i].urls, date);
				//console.log(newImage);
				feedContentsAsSnapgramPhotos.push(newImage);
			}
			
			//console.log("[i] getting images for followers from db..");
			var query = "select full_name as owner_full_name, owner_user_id, url as url, date_added as date from photo JOIN user on owner_user_id = user.user_id where photo.owner_user_id in (select following_user_id from following where follower_user_id =" 
				+ conn.escape(req.user.user_id) + ");";
	
			//console.log("[i] performing query : " + query);

			conn.query(query, function(err, result, fields) {
				if (err) throw err;

				var i;
				for (i = 0; i < result.length; i++) {
					var d = result[i].date.toString().split(/[- :]/);
					var date = new Date(d[1] + " " + d[2] + " " + d[3]);

					var newImage = new SnapgramPhoto(result[i].owner_full_name, result[i].owner_user_id,"/photos/" + result[i].url, "/photos/thumbnail/" + result[i].url, date);

					feedContentsAsSnapgramPhotos.push(newImage);
					//console.log("sending : " + feedContentsAsSnapgramPhotos);
					
				}
				res.render('feed', {
					title : ("your feed (" + req.user.username + ")"),
					header : ("your feed (" + req.user.username + ")"),
					imageArray : feedContentsAsSnapgramPhotos, //switch jade to use this next. Keep going, Ian.
					username : req.user.username,
					followable : false,
					id : req.user.user_id
				});
			})
		})
		
		
		
	})
	
	
	
	app.get('/bulk/clear', function(req, res) {
		var password = req.param('password');
		if (password == "asdf") {
			
			var query = "TRUNCATE TABLE user;";
			//console.log("[i] performing query : " + query);
			conn.query(query, function(err, result, fields) {
				if (err) throw err;
			})
			
			var query = "TRUNCATE TABLE photo;";
			//console.log("[i] performing query : " + query);
			conn.query(query, function(err, result, fields) {
				if (err) throw err;
			})
			
			var query = "TRUNCATE TABLE following;";
			//console.log("[i] performing query : " + query);
			conn.query(query, function(err, result, fields) {
				if (err) throw err;
			})
			
		}
		res.redirect("/");
		
	})
	
	app.post('/bulk/users', function(req, res) {
		var password = req.param('password');
		if (password == "asdf") {
			
			var json = req.body;
			
			var i;
			for (i = 0; i < json.length; i++) {
				var query = "INSERT INTO user (user_id, username, password, full_name) VALUES ("
					+ json[i].id + ", " 
					+ conn.escape(json[i].name) + ", " 
					+ conn.escape(json[i].password) + ", " 
					+ conn.escape(json[i].name) + ");";
				//console.log("[i] performing query : " + query);
				conn.query(query, function(err, result, fields) {
					if (err) throw err;
				})
			
			    if (json[i].follows !== undefined && json[i].follows[0] !== undefined) {
					var j;
					for (j = 0; j < json[i].follows.length; j++) {
						var query = "INSERT INTO following (follower_user_id, following_user_id) VALUES ("
							+ json[i].id + ", " 
							+ json[i].follows[j] + ");";
						//console.log("[i] performing query : " + query);
						conn.query(query, function(err, result, fields) {
							if (err) throw err;
						})
					}
				}
			}
			
		}
		res.redirect("/");
		
	})
	
	
	
	var thumbnailQueue = [];
	var maxAtOnce = 15;
	var inProgress = 0;
	var imagesToProcess = [];
	
	function thumbnail(err,stdout,stderr) {
		//console.log("in thumbnail, progress is " + inProgress + " and queue is : " + thumbnailQueue.length);
		inProgress -= 1;
		
		if (inProgress < maxAtOnce && thumbnailQueue.length > 0) {
			//console.log("starting another. queue size = " + thumbnailQueue.length);
			inProgress += 1;
			// get it from the queue
			var imagePath = thumbnailQueue.shift();
			// get the thumbnail path
			var filename = imagePath.substring(imagePath.lastIndexOf('/'), imagePath.length);
			var pathOnly = imagePath.substring(0, imagePath.lastIndexOf('/'));
			var imageThumbPath = pathOnly + "/thumbnail/" + filename;
			
			imagemagick.resize({
				srcPath: imagePath,
				dstPath: imageThumbPath,
				width: "400"
			}, function(err,stdout,stderr){
				if (err) throw err
				//console.log("Resized input image from thumbnail : " + imageThumbPath);
				thumbnail(err,stdout,stderr);
			})
		}
	}
	
	
	app.post('/bulk/streams', function(req, res) {
		var password = req.param('password');
		if (password == "asdf") {
			
			json = req.body;
			
			var i;
			for (i = 0; i < json.length; i++) {
				var filename = json[i].path;
				if (filename !== undefined) {
					

					var imagePath = __dirname + "/public/photos/" + filename;
					var imageThumbPath = __dirname + "/public/photos/thumbnail/" + filename;
				
					var query = "INSERT INTO photo (owner_user_id, url, date_added) VALUES (" 
						+ json[i].user_id + ", " 
						+ conn.escape(filename) + ", " 
						+ "FROM_UNIXTIME( " + conn.escape(json[i].timestamp) +" / 1000 ));";
					//console.log("[i] performing query : " + query);
					conn.query(query, function(err, result, fields) {
						if (err) throw err;
					})
					
					if (inProgress < maxAtOnce) {
						inProgress += 1;
						imagemagick.resize({
							srcPath: imagePath,
							dstPath: imageThumbPath,
							width: "400"
						}, function(err,stdout,stderr){
							if (err) throw err
							//console.log("Resized input image from for : " + imageThumbPath);
							thumbnail(err,stdout,stderr);
						})
					} else {
						thumbnailQueue.push(imagePath);
					}
					
				}
			}
			
		}
		res.redirect("/");
		
	})
	

	//  requirement 0  /////////////////////////////////////////
	app.use(function(req,res,next) {
		res.status(404);
		res.render('notfound');
	})
	
	

	app.use(function(err, req, res, next){
	  res.render('fivehundred', {
	      status: err.status || 500
	    , error: err
	  });
	  console.log("[!!]  " + err);
	});
	
	time_between_in_words = function(from_date, to_date) {
		var ONE_SEC = 1000;
		var ONE_MIN = 60000;
		var ONE_HOUR = 3600000;
		var ONE_DAY = 86400000;
		var ONE_WEEK = 604800000;
		var ONE_MONTH = 2649024000; // assume 4.38wk/mo
		var ONE_YEAR = 31788288000;	

		// get number of ms since Jan 01, 1970.
		var differenceInMs = from_date.getTime() - to_date.getTime();

		// nuke any negatives
		differenceInMs = Math.abs(differenceInMs);

		if (differenceInMs < ONE_MIN) {
			return "less than a minute"

		} else if (differenceInMs >= ONE_MIN && differenceInMs < ONE_HOUR) {
			// some number of minutes
			var numberOfMinutes = differenceInMs / ONE_MIN;
			numberOfMinutes = Math.round(numberOfMinutes);
			return ("today");

		} else if (differenceInMs >= ONE_HOUR && differenceInMs < ONE_DAY) {
			var numberOfHours = differenceInMs / ONE_HOUR;
			numberOfHours = Math.round(numberOfHours);
			return ("today");

		} else if (differenceInMs >= ONE_DAY && differenceInMs < ONE_WEEK) {
			var numberOfDays = differenceInMs / ONE_DAY;
			numberOfDays = Math.round(numberOfDays);
			return (numberOfDays + " day(s) ago");

		} else if (differenceInMs >= ONE_WEEK && differenceInMs < ONE_MONTH) {
			var numberOfWeeks = differenceInMs / ONE_WEEK;
			numberOfWeeks = Math.round(numberOfWeeks);
			return (numberOfWeeks + " week(s) ago");

		} else if (differenceInMs >= ONE_MONTH && differenceInMs < ONE_YEAR) {
			var numberOfMonths = differenceInMs / ONE_MONTH;
			numberOfMonths = Math.round(numberOfMonths);
			return (numberOfMonths + " month(s) ago");

		} else if (differenceInMs >= ONE_YEAR) {
			var numberOfYears = differenceInMs / ONE_YEAR;
			numberOfYears = Math.round(numberOfYears);
			return (numberOfYears + " year(s) ago");

		} else {
			// have a cow
			return ("undefined! " + differenceInMs);
		}
	};

	time_ago_in_words = function(date) {
		var difference = time_between_in_words(date, new Date())
		return difference;
	}
	
	
	var port = 8100;
	console.log('[i] listening on '+ port +'...');
	app.listen(port);
	