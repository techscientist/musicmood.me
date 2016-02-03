var ioc = require('socket.io-client');
var client = ioc.connect("http://localhost:3030");

var tools = require('./lib/tools');
var SerialPort = require("serialport");

var serial_enabled = true;

var beats_per_second = tools.BEATS_PER_SECOND; //the same value needs to be on tools.js to sync
var serialPort;
var buffer = undefined;
var QUEUE = [];
var timer = undefined;

function createBuffer(list) {
    var tmp_buffer = new Buffer(list.length);
    list.forEach((item, index) => {
        tmp_buffer[index] = item
    });
    return tmp_buffer;
}

function writeBuffer(tmp_buffer) {
    serialPort.open((error) => {
        if (error) {
            console.log('failed to open: ' + error);
        } else {
            serialPort.write(tmp_buffer, (err, results) => {
                if (err) {
                    console.log(`serial error: ${err}`);
                }
            });
        }
    });
}

client.once('connect', function() {
    console.log('Client: Connected to port 3030');
    client.on('queue', function(msg) {
        QUEUE.push(msg);
    });
});

function SerialWrite() {
    //console.log(QUEUE.length);
    var tmp_buffer = [];
    var AMPS = new Array(30+1).join('0').split('').map(parseFloat);
    tmp_buffer.push(0x6B);
    tmp_buffer.push(0xBD);
    var color = undefined;
    QUEUE.forEach((item, index) => {
        if ('c' in item && item.p === 0 && !color) {
            item.p = 1;
            color = item;
        }
    });
    if (color) {
        tmp_buffer.push(0xCC);
        tmp_buffer.push(color.i);
        tmp_buffer.push(color.c);
    }else{
        tmp_buffer.push(0xCC);
        tmp_buffer.push(AMPS.length+1);
        tmp_buffer.push(0);
    }
    tmp_buffer.push(0xCA);
    QUEUE.forEach((item, index) => {
        if ('a' in item) {
            AMPS[item.i] = parseInt(item.a);
            item.p = 1;
        }
    });
    AMPS.forEach((item, index) => {
        tmp_buffer.push(item);
    });
    //tools.logger(`QUEUE BEFORE ${JSON.stringify(QUEUE)}`);
    QUEUE = QUEUE.filter((item) => {
        return item.p === 0;
    });
    //tools.logger(`QUEUE AFTER ${JSON.stringify(QUEUE)}`);
    buffer = createBuffer(tmp_buffer);
    if (serial_enabled) {
        writeBuffer(buffer);
    }
    tools.logger(buffer);
}

function initSerial() {
    SerialPort.list(function(err, ports) {
        ports.forEach(function(port) {
            console.log(`\n${port.comName}, ${port.pnpId}, ${port.manufacturer}`);
        });
    });
    var os = require("os").hostname();
    var port = "/dev/ttyACM0"
        // add more cases
    if (os === "Elliot-Alderson.local") {
        port = "/dev/cu.usbmodem1412"
    }
    serialPort = new SerialPort.SerialPort(port, {
            // same as the embed hardware
            baudrate: 921600
        })
        .on('error', (err) => {
            if (err) {
                console.log(`serial error: ${err}`);
            }
            serial_enabled = false;
        });
    timer = setInterval(SerialWrite, 900/tools.BEATS_PER_SECOND);
}

initSerial();
