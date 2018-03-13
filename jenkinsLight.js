var http = require('http');
var noble = require('noble');
var lightCommands = require('./lightCommands.js');

var VSTSProxy = require('./VSTSProxy.js');

function JenkinsLight(baseURL, project, buildDefinition, token, ledController, startIndex, numberOfBuilds) {
  this._baseURL = baseURL;
  this._project = project;
  this._buildDefinition = buildDefinition;
  this._startIndex = startIndex;
  this._numberOfBuilds = numberOfBuilds;

  this._proxy = new VSTSProxy(baseURL, project, buildDefinition, token);
  this._ledController = ledController;
  this._enabled = false;
  this._refreshTimer = undefined;

  var _this = this;

  _this.turnOn();
  setTimeout(function () {
    // _this.setBuildState('initial');
    _this.refreshBuildState();
  }, 200);
}

JenkinsLight.prototype.turnOn = function () {
  if (!this._enabled) {
    this.log('swithed to ON');

    this._enabled = true;

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
  }
};

JenkinsLight.prototype.log = function (message) {
  console.log(new Date().toLocaleString() + ' - [' + this._project + ':' + this._buildDefinition + '] - ' + message);
};

JenkinsLight.prototype.refreshBuildState = function () {
  const _this = this;
  this._proxy.getLatestStates(this._numberOfBuilds, (states) => {
    _this.setBuildStates(states);
  });
};

JenkinsLight.prototype.setBuildStates = function (states) {

  const colors = states.map(state => {
    switch (state.toUpperCase()) {
      case 'FAILURE':
        {
          return "020000";
        }
      case 'SUCCESS':
        {
          return "000200";
        }
      case 'BUILDING':
        {
          return "000010";
        }
      case 'NOTSTARTED':
        {
          return "040004";
        }
      case 'INITIAL':
        {
          return "020200";
        }
      default:
        {
          return "040200";
          break;
        }
    }
  }).join(',');

  const command = this._startIndex + ',' + colors + '\n';

  this._ledController.exec(command);
};

module.exports = JenkinsLight;
