var express = require('express');
var noble = require('noble');
var CronJob = require('cron').CronJob;
var jenkinsLight = require('./jenkinsLight.js');

var config = require('./config.js');

var lights = []
var color_service = 'ffe5';


function log (message) {
  console.log(new Date().toLocaleString() + ' - ' + message);
};

log('Let there be green light');

noble.on('stateChange', function(state) {
  log('bluetooth adapter state changed: ' + state)
	if (state === 'poweredOn') {
		noble.startScanning([color_service]);
	} else {
		noble.stopScanning();
	}
});

noble.on('discover', function(peripheral) {
	log('Found device with local name: ' + peripheral.advertisement.localName);
	log('\tadvertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);

	peripheral.connect(function(error) {
		log('connected to peripheral: ' + peripheral.uuid);

    var job = config.lights[peripheral.uuid];
    if (job) {
      lights.push(new jenkinsLight(job.baseURL, job.project, job.buildDefinition, job.username, job.password, job.domain, peripheral)); 
    }
  });
});

//
// Cronjobs to turn the lights on/off
//

// turnOn can be called while 'on', so no harm is done doing it often
if (config.onSchedule) {
  log('Schedule for lights ON: ' + config.onSchedule);
  new CronJob(config.onSchedule,
    function () {
      log("Turning all lights ON");
      for (i in lights) {
        lights[i].turnOn(); 
      }
    },
    null,
    true);
}

if (config.offSchedule) {
  log('Schedule for lights OFF: ' + config.offSchedule);
  new CronJob(config.offSchedule,
    function () {
      log("Turning all lights OFF");
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
  log('Listening on ' + bind);
}
