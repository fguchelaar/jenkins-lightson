var http = require('http');
var noble = require('noble');

var color_service = 'ffe5';
var red_char_uuid = 'ffe6';
var green_char_uuid = 'ffe7';
var blue_char_uuid = 'ffe8';
var white_char_uuid = 'ffea';
var rgbw_char_uuid = 'ffe9';

function JenkinsLight(host, port, job, peripheral) {
  this._host = host;
  this._port = port;
  this._job = job;
  this._peripheral = peripheral;
  
  this._red = undefined;
  this._blue = undefined;
  this._green = undefined;
  this._white = undefined;
  this._rgbw = undefined;

  var _this = this;

  this._peripheral.discoverServices([color_service], function(error, services) {

    for (var i in services) {
      console.log('  ' + i + ' uuid: ' + services[i].uuid);

      var service = services[i];

      service.discoverCharacteristics([red_char_uuid, blue_char_uuid, green_char_uuid, white_char_uuid, rgbw_char_uuid], function(error, characteristics) {

        console.log('discovered the following characteristics:');
        for (var i in characteristics) {
          var characteristic = characteristics[i];
          console.log(' ' + i + ': ' + characteristic.uuid);
          switch(characteristic.uuid) {
            case red_char_uuid:
            _this._red = characteristic;
            break;
            case blue_char_uuid:
            _this._blue = characteristic;
            break;
            case green_char_uuid:
            _this._green = characteristic;
            break;
            case white_char_uuid:
            _this._white = characteristic;
            break;
            case rgbw_char_uuid:
            _this._rgbw = characteristic;
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

  var bytes = [];

  // Static color mode:
  //
  //  0x56,  0x10,  0x00,  0x00,  0x00,  0xF0,  0xAA
  //    |      |      |      |      |      |      |
  // constant  |    green    |   constant  |   constant
  //          red          blue        constant

  // Built-in function mode:
  //
  //  0xBB,  0x28,  0x0A,  0x44
  //    |      |      |      |
  // constant  |    speed    |
  //          mode        constant

  switch(state.toUpperCase()) {
    case 'FAILURE':
    {
      bytes = [0x56, 0x10, 0x00, 0x00, 0x00, 0xF0, 0xAA];
      break;
    }
    case 'SUCCESS':
    {
      bytes = [0x56, 0x00, 0x10, 0x00, 0x00, 0xF0, 0xAA];
      break;
    }
    case 'BUILDING':
    {
      bytes = [0x56, 0x00, 0x00, 0x10, 0x00, 0xF0, 0xAA];
//      bytes = [0xBB, 0x28, 0x0A, 0x44]; // Blue gradual change
      break;
    }
    case 'INITIAL':
    {
      bytes = [0x56, 0x02, 0x02, 0x00, 0x00, 0xF0, 0xAA];
      break;
    }
    default:
    {    
      bytes = [0x56, 0x04, 0x02, 0x00, 0x00, 0xF0, 0xAA];
      break;
    }
  }
  this._rgbw.write(new Buffer(bytes), true);
};

module.exports = JenkinsLight;
