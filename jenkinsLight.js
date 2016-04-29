var http = require('http');
var noble = require('noble');
var lightCommands = require('./lightCommands.js');

var color_service = 'ffe5';
var rgbw_char_uuid = 'ffe9';

var commands = new lightCommands();

function JenkinsLight(host, port, job, peripheral) {
  this._host = host;
  this._port = port;
  this._job = job;
  this._peripheral = peripheral;
  
  this._enabled = false;
  this._rgbw = undefined;
  this._refreshTimer = undefined;

  var _this = this;

  this._peripheral.discoverServices([color_service], function(error, services) {

    for (var i in services) {
      _this.log('  ' + i + ' uuid: ' + services[i].uuid);
      var service = services[i];

      service.discoverCharacteristics([rgbw_char_uuid], function(error, characteristics) {

        for (var i in characteristics) {
          var characteristic = characteristics[i];
          _this.log(' ' + i + ': ' + characteristic.uuid);
          if (characteristic.uuid === rgbw_char_uuid) {
            _this._rgbw = characteristic;
          }
        }

        if (_this._rgbw !== undefined) {

          _this.turnOn();
          setTimeout(function() { 
            _this.setBuildState('initial');
          }, 200);
        }
        else {
          _this.log('could not find "rgbw characteristic"');
        }
      });
    }
  });
}

JenkinsLight.prototype.turnOn = function() {
  if (!this._enabled) {
    this.log('swithed to ON');

    this._enabled = true;
    
    this._rgbw.write(new Buffer(commands.on()), true);

    this._lastBuildState = '';
    var _this = this;
    this._refreshTimer = setInterval(function() {
      _this.refreshBuildState();
    }, 10000);
  }
};

JenkinsLight.prototype.turnOff = function() {
  if (this._enabled) {
    this.log('swithed to OFF');
    this._enabled = false;

    clearInterval(this._refreshTimer);
    this._refreshTimer = undefined;
    this._rgbw.write(new Buffer(commands.off()), true);
  }
};

JenkinsLight.prototype.log = function(message) {
  console.log(new Date().toLocaleString() + ' - [' + this._job + '] - ' + message);
};

JenkinsLight.prototype.refreshBuildState = function() {

  var url = "http://" + this._host + ":" + this._port + "/job/" + this._job + "/lastBuild/api/json"
  var _this = this;

  http.get(url, function(res){
    var body = '';

    res.on('data', function(chunk){
      body += chunk;
    });

    res.on('end', function(){

      try {
        var response = JSON.parse(body);

        if (response.building) {
          _this.setBuildState('BUILDING');
        }
        else {
          _this.setBuildState(response.result);
        }

      } catch(e){
        _this.log('ERROR: getting JSON: ' + e);
        _this.setBuildState('ERROR');
      }

    });
  }).on('error', function(e){
    _this.log('ERROR: ' + e);
    _this.setBuildState('ERROR');
  });
};

JenkinsLight.prototype.setBuildState = function(state) {

  if (this._enabled && this.lastBuildState !== state) {
    var _this = this;

    this.lastBuildState = state;

    this.log('set build state to: ' + state);

    var bytes = [];

    switch(state.toUpperCase()) {
      case 'FAILURE':
      {
        bytes = commands.rgb(0x10, 0x00, 0x00);
        break;
      }
      case 'SUCCESS':
      {
        bytes = commands.rgb(0x00, 0x10, 0x00);
        break;
      }
      case 'BUILDING':
      {
        bytes = commands.rgb(0x00, 0x00, 0x10);
        break;
      }
      case 'INITIAL':
      {
        bytes = commands.rgb(0x02, 0x02, 0x00);
        break;
      }
      default:
      {    
        bytes = commands.rgb(0x04, 0x02, 0x00);
        break;
      }
    }

    this._rgbw.write(new Buffer(bytes), true, function(error) {
      _this.log("ERROR: writing to characteristic: " + error);
    });
  }
};

module.exports = JenkinsLight;
