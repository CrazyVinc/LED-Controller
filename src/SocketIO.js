let io;
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
};

exports.sendMessage = (roomId, key, message) => io.to("a").emit("hello", "world");


exports.getRooms = () => io.sockets.adapter.rooms;

module.exports.ws = () => io;