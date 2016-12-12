// Create a file called 'config.js' with these contents 

var config = {};

// cron-style schedule for turning the lights ON
config.onSchedule = '0 0,15,30,45 08-18 * * 1-5';

// cron-style schedule for turning the lights OFF
config.offSchedule = '0 10,25,40,55 08-18 * * 1-5';

// Cofigure one light per jenkins job. Provide uuid, jenkins host + port + jobname
config.lights = {
  '4e5cc32f87004d57be60c7db527682d8' : {
    baseURL: 'http://buildserver1.company.org:8080/tfs/DefaultCollection/',
    project: 'yajw',
    buildDefinition: 13,
    username: '*********',
    password: '*********',
    domain: '*********'
  },
  '35a2a0ce0b2f46e7b82c8600ff98dd5a' : {
    baseURL: 'http://vsts.build.company.org:8080/tfs/DefaultCollection/',
    project: 'PearWatch',
    buildDefinition: 121,
    username: '*********',
    password: '*********',
    domain: '*********'
  }
};

module.exports = config;