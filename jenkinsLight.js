var http = require('http');
var noble = require('noble');
var lightCommands = require('./lightCommands.js');
var httpntlm = require('httpntlm');

var color_service = 'ffe5';
var rgbw_char_uuid = 'ffe9';

var commands = new lightCommands();

function JenkinsLight(baseURL, project, buildDefinition, username, password, domain, peripheral) {
  this._baseURL = baseURL;
  this._project = project;
  this._buildDefinition = buildDefinition;
  this._username = username;
  this._password = password;
  this._domain = domain;
  this._peripheral = peripheral;

  this._enabled = false;
  this._rgbw = undefined;
  this._refreshTimer = undefined;

  var _this = this;

  this._peripheral.discoverServices([color_service], function (error, services) {

    for (var i in services) {
      _this.log(' ' + i + ' uuid: ' + services[i].uuid);
      var service = services[i];

      service.discoverCharacteristics([rgbw_char_uuid], function (error, characteristics) {

        for (var i in characteristics) {
          var characteristic = characteristics[i];
          _this.log(' ' + i + ': ' + characteristic.uuid);
          if (characteristic.uuid === rgbw_char_uuid) {
            _this._rgbw = characteristic;
          }
        }

        if (_this._rgbw !== undefined) {

          _this.turnOn();
          setTimeout(function () {
            _this.setBuildState('initial');
            _this.refreshBuildState();
          }, 200);
        }
        else {
          _this.log('could not find "rgbw characteristic"');
        }
      });
    }
  });

  this._peripheral.once('disconnect', function () {
    _this.log('disconnected');
    // TODO: emit some event, so that we can rescan 
  });

}

JenkinsLight.prototype.turnOn = function () {
  if (!this._enabled) {
    this.log('swithed to ON');

    this._enabled = true;

    this._rgbw.write(new Buffer(commands.on()), true);

    this._lastBuildState = '';
    var _this = this;

    this._refreshTimer = setInterval(function () {
      _this.refreshBuildState();
    }, 10000);
  }
};

JenkinsLight.prototype.turnOff = function () {
  if (this._enabled) {
    this.log('swithed to OFF');
    this._enabled = false;

    clearInterval(this._refreshTimer);
    this._refreshTimer = undefined;
    this._rgbw.write(new Buffer(commands.off()), true);
  }
};

JenkinsLight.prototype.log = function (message) {
  console.log(new Date().toLocaleString() + ' - [' + this._project + ':' + this._buildDefinition + '] - ' + message);
};

JenkinsLight.prototype.refreshBuildState = function () {

  var theUrl = this._baseURL + this._project + "/_apis/build/builds?definitions=" + this._buildDefinition + "&$top=1"
  var _this = this;

  httpntlm.get({
    url: theUrl,
    username: this._username,
    password: this._password,
    domain: this._domain
  }, function (err, res) {

    if (err) {
      _this.log("ERROR: " + err);
      _this.setBuildState('ERROR');
    }
    else {
      try {
        var response = JSON.parse(res.body);
        if (response.value[0].status == 'completed') {
          if (response.value[0].result == 'failed') {
            _this.setBuildState('FAILURE');
          }
          else if (response.value[0].result == 'succeeded') {
            _this.setBuildState('SUCCESS');
          }
        }
        else if (response.value[0].status == 'inProgress') {
          _this.setBuildState('BUILDING');
        }
        else if (response.value[0].status == 'notStarted') {
          _this.setBuildState('NOTSTARTED');
        }
        else {
          _this.log("ERROR: unexpected status/result.\n" + response);
          _this.setBuildState('ERROR');
        }
      } catch (e) {
        _this.log('ERROR: getting JSON: ' + e);
        _this.setBuildState('ERROR');
      }
    }
  });
};

JenkinsLight.prototype.setBuildState = function (state) {

  if (this._enabled && this.lastBuildState !== state) {
    var _this = this;

    this.lastBuildState = state;

    this.log('set build state to: ' + state);

    var bytes = [];

    switch (state.toUpperCase()) {
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
      case 'NOTSTARTED':
        {
          bytes = commands.rgb(0x00, 0x02, 0x02);
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

    this._rgbw.write(new Buffer(bytes), true, function (error) {
      if (error != null) {
        _this.log("ERROR: writing to characteristic: " + error);
      }
    });
  }
};

module.exports = JenkinsLight;
