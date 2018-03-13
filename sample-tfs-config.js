// Create a file called 'config.js' with these contents 

var config = {};

// cron-style schedule for turning the lights ON
config.onSchedule = '0 0,15,30,45 08-18 * * 1-5';

// cron-style schedule for turning the lights OFF
config.offSchedule = '0 10,25,40,55 08-18 * * 1-5';

// configure the serial port to which the NodeMCU is connected
config.serialport = '/dev/cu.SLAB_USBtoUART';

// Configure one light per job. Provide build-info, startIndex of the first LED and number of LEDs to use
config.lights = [
  {
    baseURL: 'http://buildserver1.company.org:8080/tfs/DefaultCollection/',
    project: 'yajw',
    buildDefinition: 58,
    token: 'PERSONAL_ACCESS_TOKEN_WITH_BUILD_READ_RIGHTS',
    startIndex: 1,
    numberOfBuilds: 18
  },
  {
    baseURL: 'http://vsts.build.company.org:8080/tfs/DefaultCollection/',
    project: 'PearWatch',
    buildDefinition: 11,
    token: 'PERSONAL_ACCESS_TOKEN_WITH_BUILD_READ_RIGHTS',
    startIndex: 21,
    numberOfBuilds: 18
  }
]

module.exports = config;