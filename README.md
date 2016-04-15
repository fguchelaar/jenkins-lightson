#jenkins-lightson

A Node.js application to control Bluetooth LED lights with respect to jenkins' build states.

To configure builds, you need to add a configuration-file named `config.js` in the root of the
directory. A sample configuration-file is provided in `sample-config.js`. The keys in the 
config-dictionary are the uuid's of the lights.

Example:

```JavaScript
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
```

## Lights

The lights I've used for this are: http://www.applamp.nl/led-magical-bluetooth-led-lamp-16m-kleurenwarm-wit.html. I'm guessing these are more or less the same as: http://zengge.en.alibaba.com/product/1658905204-0/Music_Group_Timer_WiFi_LED_Bulb_Wifi_rgbw_led_bulb_light_E26_E14_E27_LED_WiFi_Bulb.html (be sure to get a **Bluetooth** version!).
