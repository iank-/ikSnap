mysql = require('mysql');
conn = mysql.createConnection({
  host: 'web2.cpsc.ucalgary.ca',
  user: 's513_ikabeary',
  password: '10025843',
  database: 's513_ikabeary'
});

conn.connect();

conn.query("INSERT INTO following (follower_user_id, following_user_id) VALUES ('2','18')", function(err, rows, fields) {
	console.log(rows[0]);
  if (err) throw err;
});
conn.query("INSERT INTO following (follower_user_id, following_user_id) VALUES ('2','19')", function(err, rows, fields) {
	console.log(rows[0]);
  if (err) throw err;
});
conn.query("INSERT INTO following (follower_user_id, following_user_id) VALUES ('2','20')", function(err, rows, fields) {
	console.log(rows[0]);
  if (err) throw err;
});
conn.query("INSERT INTO following (follower_user_id, following_user_id) VALUES ('2','21')", function(err, rows, fields) {
	console.log(rows[0]);
  if (err) throw err;
});
conn.query("INSERT INTO following (follower_user_id, following_user_id) VALUES ('2','22')", function(err, rows, fields) {
	console.log(rows[0]);
  if (err) throw err;
});

conn.query("SELECT * FROM following", function(err, rows, fields) {
	console.log(rows);
  if (err) throw err;
});

conn.end();
