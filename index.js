var express = require('express');
var noble = require('noble');
var CronJob = require('cron').CronJob;
var jenkinsLight = require('./jenkinsLight.js');

var config = require('./config.js');

var lights = []
var color_service = 'ffe5';

console.log('Let there be green light');

noble.on('stateChange', function(state) {
	if (state === 'poweredOn') {
		noble.startScanning([color_service]);
	} else {
		noble.stopScanning();
	}
});

noble.on('discover', function(peripheral) {
	console.log('Found device with local name: ' + peripheral.advertisement.localName);
	console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);

	peripheral.connect(function(error) {
		console.log('connected to peripheral: ' + peripheral.uuid);

    var job = config.lights[peripheral.uuid];
    console.log(job); 
    if (job) {
      lights.push(new jenkinsLight(job.host, job.port, job.job, peripheral)); 
    }
  });
});

//
// Cronjobs to turn the lights on/off
//

// turnOn can be called while 'on', so no harm is done doing it often
if (config.onSchedule) {
  console.log('Schedule for lights ON: ' + config.onSchedule);
  new CronJob(config.onSchedule,
    function () {
      console.log("Turning all lights ON");
      for (i in lights) {
        lights[i].turnOn(); 
      }
    },
    null,
    true);
}

if (config.offSchedule) {
  console.log('Schedule for lights OFF: ' + config.offSchedule);
  new CronJob(config.offSchedule,
    function () {
      console.log("Turning all lights OFF");
      for (i in lights) {
        lights[i].turnOff();
      }
    },
    null,
    true);
}

//
// REST API, primarily for testing purposes
//
var router = express.Router();

router.get('/jl/:state', function (req,res,next) {
  for (i in lights) {
    if (req.params.state === 'on') {
      lights[i].turnOn();
    }
    else if (req.params.state === 'off') {
      lights[i].turnOff();
    }
    else {
      lights[i].setBuildState(req.params.state);
    }
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
