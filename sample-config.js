// Create a file called 'config.js' with these contents 

var config = {};

config.lights = {
  '4e5cc32f87004d57be60c7db527682d8' : {
    host: 'buildserver1.domain.com',
    port: 8181,
    job: 'facebook'
  },
  '35a2a0ce0b2f46e7b82c8600ff98dd5a' : {
    host: 'megastuff.cool.com',
    port: 8080,
    job: 'myLittleTank'
  }
};

module.exports = config;