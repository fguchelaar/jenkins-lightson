var SerialPort = require('serialport');

function LedController(port, timeout) {
    this.timeout = timeout || 100;
    this.queue = [];
    this.ready = true;
    this.serialport = new SerialPort(port, {
        baudRate: 115200
    });
}

LedController.prototype.send = function (cmd, callback) {

    this.serialport.write(cmd, function (err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
    });

    if (callback) callback();
};

LedController.prototype.exec = function () {
    this.queue.push(arguments);
    this.process();
};

LedController.prototype.process = function () {
    if (this.queue.length === 0) return;
    if (!this.ready) return;
    var self = this;
    this.ready = false;
    this.send.apply(this, this.queue.shift());
    setTimeout(function () {
        self.ready = true;
        self.process();
    }, this.timeout);
};

module.exports = LedController;