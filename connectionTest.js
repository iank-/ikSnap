mysql = require('mysql');
conn = mysql.createConnection({
  host: 'web2.cpsc.ucalgary.ca',
  user: 's513_ikabeary',
  password: '10025843',
  database: 's513_ikabeary'
});

conn.connect();

conn.query("DROP TABLE user ;", function(err, rows, fields) {
  if (err) throw err;
});
conn.query("DROP TABLE photo ;", function(err, rows, fields) {
  if (err) throw err;
});
conn.query("DROP TABLE following ;", function(err, rows, fields) {
  if (err) throw err;
});
conn.query("DROP TABLE photostream ;", function(err, rows, fields) {
  if (err) throw err;
});


conn.query("CREATE TABLE user (user_id int NOT NULL AUTO_INCREMENT, username varchar(256) NOT NULL, password varchar(256), full_name varchar(256), PRIMARY KEY (user_id), UNIQUE (username));", function(err, rows, fields) {
  if (err) throw err;

  //console.log('The solution is: ', rows[0].solution);
});


conn.query("CREATE TABLE photo (photo_id int NOT NULL AUTO_INCREMENT, owner_user_id varchar(256), url varchar(256), date_added date, PRIMARY KEY (photo_id)); ", function(err, rows, fields) {
  if (err) throw err;

});


conn.query("CREATE TABLE following ( follower_user_id varchar(256) NOT NULL, following_user_id varchar(256) NOT NULL);" , function(err, rows, fields) {
  if (err) throw err;

});


conn.query("CREATE TABLE photostream (user_id varchar(256), photo_id int);", function(err, rows, fields) {
  if (err) throw err;

});

conn.end();
