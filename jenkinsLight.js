var http = require('http');
var noble = require('noble');

var color_service = 'ffe5';
var red_char = 'ffe6';
var green_char = 'ffe7';
var blue_char = 'ffe8';
var white_char = 'ffea';

function JenkinsLight(host, port, job, peripheral) {
  this._host = host;
  this._port = port;
  this._job = job;
  this._peripheral = peripheral;
  
  this._red = undefined;
  this._blue = undefined;
  this._green = undefined;
  this._white = undefined;

  var _this = this;

  this._peripheral.discoverServices([color_service], function(error, services) {

    for (var i in services) {
      console.log('  ' + i + ' uuid: ' + services[i].uuid);

      var service = services[i];

      service.discoverCharacteristics([red_char, blue_char, green_char, white_char], function(error, characteristics) {

        console.log('discovered the following characteristics:');
        for (var i in characteristics) {
          var characteristic = characteristics[i];
          console.log(' ' + i + ': ' + characteristic.uuid);
          switch(characteristic.uuid) {
            case red_char:
            _this._red = characteristic;
            break;
            case blue_char:
            _this._blue = characteristic;
            break;
            case green_char:
            _this._green = characteristic;
            break;
            case white_char:
            _this._white = characteristic;
            break;
          }
        }
        _this.setBuildState('initial');

        _this.timer = setInterval(function() {
          _this.refreshBuildState();
        }, 10000);
      });
    }
  });
}

JenkinsLight.prototype.toString = function() {
  return JSON.stringify({
    jenkinsHost: this._jenkinsHost,
    peripheral: this._peripheral.advertisement.localName
  });
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
      var response = JSON.parse(body);
      // console.log("Got a response: ", response);

      if (response.building) {
        _this.setBuildState('BUILDING');
      }
      else {
        _this.setBuildState(response.result);
      }
    });
  }).on('error', function(e){
    console.log("Got an error: ", e);
    _this.setBuildState('ERROR');
  });
};

JenkinsLight.prototype.setBuildState = function(state) {
  console.log('set build state: ' + state);

  var r = 0x00;
  var g = 0x00;
  var b = 0x00;
  var w = 0x00;

  switch(state) {
    case 'FAILURE':
    {
      r = 0x10;
      break;
    }
    case 'SUCCESS':
    {    g = 0x10;
      break;
    }
    case 'BUILDING':
    {    b = 0x10;
      break;
    }
    case 'initial':
    {    g = 0x01;
      w = 0x01;
      break;
    }
    default:
    {    w = 0x10;
      break;
    }
  }

  this._red.write(new Buffer([r]), true);
  this._green.write(new Buffer([g]), true);
  this._blue.write(new Buffer([b]), true);
  this._white.write(new Buffer([w]), true);
};

module.exports = JenkinsLight;
