var express = require('express')
  , app = express.createServer();

app.use(express.bodyParser());

app.post('/', function(request, response){
  console.log(request.body);      // your JSON
  console.log("TESTING : ");

  var json = request.body;

  var i;
  for (i=0; i < json.length; i++) {
	  console.log("id is " + json[i].id);
	  console.log("name is " + json[i].name);

	  if (json[i].follows !== undefined && json[i].follows[0] !== undefined) {
	  	var j;
	  	for (j=0; j<json[i].follows.length; j++) {
			console.log("following :: " + json[i].follows[j])
	  	}
	  }

	  console.log("password is " + json[i].password);
	  console.log("###############");
  }

  response.send(request.body);    // echo the result back
});

var port = 1337;
console.log('[i] listening on '+ port +'...');
app.listen(port);
