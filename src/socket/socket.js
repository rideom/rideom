// src/socket/socket.js
const { Server } = require("socket.io");

let io;
const connectedUsers = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("register", (userId) => {
      connectedUsers.set(String(userId), socket.id);
      console.log(`✅ User ${userId} registered → socket ${socket.id}`);
    });

    socket.on("disconnect", () => {
      for (const [userId, sockId] of connectedUsers.entries()) {
        if (sockId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`❌ User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
}

function emitToUser(userId, event, data) {
  const socketId = connectedUsers.get(String(userId));
  if (socketId && io) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
}

module.exports = { initSocket, emitToUser, connectedUsers };