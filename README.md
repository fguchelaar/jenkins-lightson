#jenkins-lightson

A Node.js application to control Bluetooth LED lights with respect to jenkins' build states.

To configure builds, you need to add configurations to the `config` variable in `index.js`.  The
keys in the config-dictionary are the uuid's of the lights.

Example:

```JavaScript
var config = {
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
```
