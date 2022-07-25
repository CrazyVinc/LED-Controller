let io;
const fs = require('fs');

exports.socketConnection = (server) => {
  io = require('socket.io')(server);

  io.on('connection', (socket) => {
    console.info(`Client connected [id=${socket.id}]`);
    socket.join(socket.request._query.id);
    socket.join("a");
    socket.on('disconnect', () => {
      console.info(`Client disconnected [id=${socket.id}]`);
    });
  });

  io.of(/^\/child(?:\/\w+)?$/).on("connection", (socket) => {
    console.info(`There is a client connected[id=${socket.id}]`);
    socket.on('disconnect', () => { 
      console.info(`There is a client disconnected[id=${socket.id}]`);
    });
    let LastDataJSON = fs.readFileSync("LastData.json");
    try {
      LastDataJSON = JSON.parse(LastDataJSON);
    } catch (e) {
      LastDataJSON = {}
    }
    
    const reg = /\/child\/(\w+)/
    const res = socket.nsp.name.match(reg)[1];
    console.log(socket.nsp.name)
    if(LastDataJSON?.[res] !== undefined) {
      setTimeout(() => {
        io.of(socket.nsp.name).emit('write', LastDataJSON[res]["Command"]);
        console.log(LastDataJSON[res]["Command"]);
      }, 2500);
    } else {
      Object.keys(LastDataJSON).forEach(function (Name) {
        if(LastDataJSON[Name]["Command"] === undefined) return;
        console.log(38)
        var Command = LastDataJSON[Name]["Command"];
        io.of(socket.nsp.name).emit('write', Command);
      });
    }
    /*
    TODO: Add on connection write based of LastData.json
    ws().of('/child').emit('write', data);
    */
  });
};


exports.sendMessage = (roomId, key, message) => io.to("a").emit("hello", "world");

exports.getRooms = () => io.sockets.adapter.rooms;

module.exports.ws = () => io;