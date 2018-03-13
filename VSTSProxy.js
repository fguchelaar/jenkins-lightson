var fetch = require('node-fetch');
var urljoin = require('url-join');

function VSTSProxy(baseUrl, project, buildDefinition, token) {
    this.baseUrl = baseUrl;
    this.project = project;
    this.buildDefinition = buildDefinition;
    this.token = token;
}

VSTSProxy.prototype.getLatestStates = function (numberOfBuilds, callback) {

    const requestUrl = urljoin(
        this.baseUrl,
        this.project,
        "/_apis/build/builds",
        "?definitions=" + this.buildDefinition,
        "&$top=" + numberOfBuilds
    );
    const auth = "Basic " + new Buffer(this.token + ':').toString('base64');

    fetch(requestUrl, {
        headers: {
            Authorization: auth
        }
    })
        .then(res => res.json())
        .then(json => this.parseBuildResults(json))
        .then(states => callback(states))
        .catch(err => {
            console.error(err);
            callback("ERROR")
        });
}

VSTSProxy.prototype.parseBuildResults = function (json) {

    var values = json.value;
    var values = values.sort((a, b) => b.buildNumber - a.buildNumber);
    
    const states = values.map(value => {
        if (value.status == 'completed') {
            if (value.result == 'failed') {
                return 'FAILURE';
            }
            else if (value.result == 'succeeded') {
                return 'SUCCESS';
            }
        }
        else if (value.status == 'inProgress') {
            return 'BUILDING';
        }
        else if (value.status == 'notStarted') {
            return 'NOTSTARTED';
        }
        else {
            //        _this.log("ERROR: unexpected status/result.\n" + json);
            return 'ERROR';
        }
    });
    return states;
}

module.exports = VSTSProxy;