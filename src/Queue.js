const PromiseQueue = require("easy-promise-queue").default;
var {ws} = require('./SocketIO');
let pq = new PromiseQueue({concurrency: 1});

setTimeout(() => {
    ws().on('connection', (socket) => {
        socket.on('Queue', (msg) => {
            console.log(msg, 93);
            if(msg == "reset") pq._queue = [];
            console.log(pq._queue);
        });
    });
    // console.log(ws().sockets);
}, 0);



module.exports = {
    pq: pq,
}