var express = require('express');
var noble = require('noble');
var jenkinsLight = require('./jenkinsLight.js');

// Add your config here
var config = {
};

console.log('Let there be green light');

var lights = []

noble.on('stateChange', function(state) {
	if (state === 'poweredOn') {
		noble.startScanning(['ffe5']);
	} else {
		noble.stopScanning();
	}
});

noble.on('discover', function(peripheral) {
	console.log('Found device with local name: ' + peripheral.advertisement.localName);
	console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);

	peripheral.connect(function(error) {
		console.log('connected to peripheral: ' + peripheral.uuid);

    var job = config[peripheral.uuid];
    console.log(job); 
    if (job) {
      console.log('found job for light with name: ' + peripheral.advertisement.localName)
      var jl = new jenkinsLight(job.host, job.port, job.job, peripheral);
      lights.push(jl);  
      console.log('added JenkinsLight: ' + jl);
    }
  });
});


// REST API, primarily for testing purposes
var router = express.Router();

router.get('/jl/:state', function (req,res,next) {
  for (i in lights) {
    lights[i].setBuildState(req.params.state);
  }
  res.json({'state': req.params.state});
});


var app = express();
app.use('/', router);

app.set('port', 3000);

var http = require('http');
var server = http.createServer(app);
server.listen(3000);

server.on('listening', onListening);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
  ? 'pipe ' + addr
  : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}