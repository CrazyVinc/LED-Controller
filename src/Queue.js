const PromiseQueue = require("easy-promise-queue").default;
var {ws} = require('./SocketIO');
let IR = new PromiseQueue({concurrency: 1});
let RGB = new PromiseQueue({concurrency: 1});
let Single = new PromiseQueue({concurrency: 1});
let general = new PromiseQueue({concurrency: 1});

setTimeout(() => {
    ws().on('connection', (socket) => {
        socket.on('Queue', (msg) => {
            console.log(msg, 93);
            if(msg == "reset") {
                IR._queue = [];
                RGB._queue = [];
                Single._queue = [];
            }
        });
    });
}, 0);



module.exports = {
    IR,
    RGB,
    Single,
    general
}