// /**
//  * socket.js  — complete Socket.IO server handler
//  *
//  * Drop this into your server. Usage:
//  *
//  *   const { createServer } = require('http');
//  *   const { Server }       = require('socket.io');
//  *   const { initSocket }   = require('./socket');
//  *
//  *   const httpServer = createServer(app);
//  *   const io         = new Server(httpServer, { cors: { origin: '*' } });
//  *   initSocket(io);
//  *   httpServer.listen(3000);
//  *
//  * What this handles:
//  *   • register        – maps userId → socket.id
//  *   • send_message    – routes chat message + acks both sides
//  *   • typing          – routes typing indicator
//  *   • driver_live_location – broadcasts driver GPS to customer
//  *   • disconnect      – cleans up map
//  *
//  * All chat events are logged in development.
//  */

// const IS_DEV = process.env.NODE_ENV !== "production";
// const log = (...a) => IS_DEV && console.log("[Socket]", ...a);
// const warn = (...a) => IS_DEV && console.warn("[Socket]", ...a);

// // userId (string) → socketId (string)
// // This lives in-process. For multi-server setups use Redis adapter instead.
// const userSocketMap = new Map();

// function initSocket(io) {
//   io.on("connection", (socket) => {
//     log("🔌 New connection:", socket.id);

//     // ── register ────────────────────────────────────────────────
//     // Called by both driver and customer apps immediately after connect.
//     // payload: userId (string)
//     socket.on("register", (userId) => {
//       if (!userId) {
//         warn("register called with no userId");
//         return;
//       }

//       // Remove any stale mapping for this userId (reconnect scenario)
//       for (const [uid, sid] of userSocketMap.entries()) {
//         if (uid === userId && sid !== socket.id) {
//           userSocketMap.delete(uid);
//           break;
//         }
//       }

//       userSocketMap.set(userId, socket.id);
//       log(`✅ Registered: userId=${userId} → socketId=${socket.id}`);
//       log(`   Map size: ${userSocketMap.size}`);
//     });

//     // ── send_message ────────────────────────────────────────────
//     // payload: {
//     //   messageId, toUserId, fromUserId, fromName,
//     //   message, rideId, timestamp
//     // }
//     socket.on("send_message", (msg) => {
//       log(
//         "📨 send_message from",
//         msg?.fromUserId,
//         "to",
//         msg?.toUserId,
//         "| msg:",
//         msg?.message?.slice(0, 40),
//       );

//       if (!msg?.toUserId || !msg?.message) {
//         warn("send_message: missing toUserId or message");
//         socket.emit("message_error", {
//           messageId: msg?.messageId,
//           error: "Missing toUserId or message",
//         });
//         return;
//       }

//       const recipientSocketId = userSocketMap.get(msg.toUserId);

//       if (recipientSocketId) {
//         // Deliver to recipient
//         io.to(recipientSocketId).emit("receive_message", {
//           messageId: msg.messageId,
//           fromUserId: msg.fromUserId,
//           fromName: msg.fromName || "Unknown",
//           message: msg.message,
//           rideId: msg.rideId,
//           timestamp: msg.timestamp || Date.now(),
//         });

//         log(`   ✓ Delivered to socket ${recipientSocketId}`);

//         // Ack to sender
//         socket.emit("message_delivered", {
//           messageId: msg.messageId,
//         });
//       } else {
//         // Recipient not currently connected
//         warn(`   ✗ Recipient ${msg.toUserId} not in map. Current map:`);
//         if (IS_DEV) {
//           for (const [uid, sid] of userSocketMap.entries()) {
//             warn(`      ${uid} → ${sid}`);
//           }
//         }

//         // Still ack sender — message was received by server
//         // In production you'd persist to DB and deliver on reconnect.
//         socket.emit("message_delivered", {
//           messageId: msg.messageId,
//           offline: true, // recipient was offline — store for later delivery
//         });

//         // TODO: save msg to DB and deliver when recipient reconnects
//       }
//     });

//     // ── typing indicator ────────────────────────────────────────
//     // payload: { toUserId, rideId, fromUserId }
//     socket.on("typing", (data) => {
//       if (!data?.toUserId) return;
//       const recipientSocketId = userSocketMap.get(data.toUserId);
//       if (recipientSocketId) {
//         io.to(recipientSocketId).emit("typing", {
//           fromUserId: data.fromUserId,
//           rideId: data.rideId,
//         });
//       }
//     });

//     // ── driver_live_location ────────────────────────────────────
//     // payload: { driverId, customerId, lat, lng, rideId }
//     socket.on("driver_live_location", (data) => {
//       if (!data?.customerId) return;
//       const customerSocketId = userSocketMap.get(data.customerId);
//       if (customerSocketId) {
//         io.to(customerSocketId).emit("driver_location_update", {
//           lat: data.lat,
//           lng: data.lng,
//           driverId: data.driverId,
//           rideId: data.rideId,
//         });
//       }
//     });

//     // ── ride status broadcast ───────────────────────────────────
//     // Called by your REST controller after DB update.
//     // To use from controller: io.emit('broadcast_ride_status', { ... })
//     // Or expose io on app: app.get('io').to(socketId).emit(...)
//     socket.on("broadcast_ride_status", (data) => {
//       // data: { toUserId, status, rideId, reason? }
//       if (!data?.toUserId) return;
//       const targetSocketId = userSocketMap.get(data.toUserId);
//       if (targetSocketId) {
//         io.to(targetSocketId).emit("ride_status_update", {
//           status: data.status,
//           rideId: data.rideId,
//           reason: data.reason,
//         });
//         log(`📢 ride_status_update → ${data.toUserId}: ${data.status}`);
//       }
//     });

//     // ── new_ride_request ────────────────────────────────────────
//     // Your booking controller should call this helper (exported below)
//     // to push a new ride to a specific driver.

//     // ── disconnect ──────────────────────────────────────────────
//     socket.on("disconnect", (reason) => {
//       log("🔌 Disconnected:", socket.id, "reason:", reason);
//       for (const [uid, sid] of userSocketMap.entries()) {
//         if (sid === socket.id) {
//           userSocketMap.delete(uid);
//           log(`   Removed userId=${uid} from map`);
//           break;
//         }
//       }
//     });
//   });

//   log("Socket.IO handler initialised");
// }

// // ── Helper: push new ride request to a specific driver ──────────
// // Call this from your booking controller:
// //   const { pushNewRideToDriver } = require('./socket');
// //   pushNewRideToDriver(io, driverUserId, ridePayload);
// function pushNewRideToDriver(io, driverUserId, ridePayload) {
//   const socketId = userSocketMap.get(driverUserId);
//   if (socketId) {
//     io.to(socketId).emit("new_ride_request", ridePayload);
//     log(`🚖 new_ride_request → driver ${driverUserId}`);
//     return true;
//   }
//   warn(`pushNewRideToDriver: driver ${driverUserId} not connected`);
//   return false;
// }

// // ── Helper: notify customer of ride status change ───────────────
// // Call this from your ride controller after DB update:
// //   const { notifyCustomer } = require('./socket');
// //   notifyCustomer(io, customerUserId, { status: 'accepted', rideId });
// function notifyCustomer(io, customerUserId, data) {
//   const socketId = userSocketMap.get(customerUserId);
//   if (socketId) {
//     io.to(socketId).emit("ride_status_update", data);
//     log(`📢 notifyCustomer → ${customerUserId}:`, data.status);
//     return true;
//   }
//   warn(`notifyCustomer: customer ${customerUserId} not connected`);
//   return false;
// }

// // ── Helper: notify driver of ride status change ─────────────────
// function notifyDriver(io, driverUserId, data) {
//   const socketId = userSocketMap.get(driverUserId);
//   if (socketId) {
//     io.to(socketId).emit("ride_status_update", data);
//     log(`📢 notifyDriver → ${driverUserId}:`, data.status);
//     return true;
//   }
//   return false;
// }

// // ── Debug: get current map (use in admin route) ─────────────────
// function getConnectedUsers() {
//   return Array.from(userSocketMap.entries()).map(([uid, sid]) => ({
//     userId: uid,
//     socketId: sid,
//   }));
// }

// module.exports = {
//   initSocket,
//   pushNewRideToDriver,
//   notifyCustomer,
//   notifyDriver,
//   getConnectedUsers,
// };

/**
 * socket.js — complete Socket.IO server handler
 * Stores io internally so helpers can be called from anywhere without
 * passing io around (avoids circular deps).
 */

const IS_DEV = process.env.NODE_ENV !== "production";
const log = (...a) => IS_DEV && console.log("[Socket]", ...a);
const warn = (...a) => IS_DEV && console.warn("[Socket]", ...a);

// userId (string) → socketId (string)
const userSocketMap = new Map();

// io stored internally after initSocket() is called
let _io = null;

function initSocket(io) {
  _io = io; // ← store reference so helpers work without passing io

  io.on("connection", (socket) => {
    log("🔌 New connection:", socket.id);

    // ── register ──────────────────────────────────────────────────
    socket.on("register", (userId) => {
      if (!userId) {
        warn("register called with no userId");
        return;
      }

      // Remove stale mapping (reconnect scenario)
      for (const [uid, sid] of userSocketMap.entries()) {
        if (uid === String(userId) && sid !== socket.id) {
          userSocketMap.delete(uid);
          break;
        }
      }

      userSocketMap.set(String(userId), socket.id);
      log(`✅ Registered: userId=${userId} → socketId=${socket.id}`);
    });

    // ── send_message ──────────────────────────────────────────────
    socket.on("send_message", (msg) => {
      log("📨 send_message from", msg?.fromUserId, "to", msg?.toUserId);

      if (!msg?.toUserId || !msg?.message) {
        warn("send_message: missing toUserId or message");
        socket.emit("message_error", {
          messageId: msg?.messageId,
          error: "Missing toUserId or message",
        });
        return;
      }

      const recipientSocketId = userSocketMap.get(String(msg.toUserId));

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receive_message", {
          messageId: msg.messageId,
          fromUserId: msg.fromUserId,
          fromName: msg.fromName || "Unknown",
          message: msg.message,
          rideId: msg.rideId,
          timestamp: msg.timestamp || Date.now(),
        });
        socket.emit("message_delivered", { messageId: msg.messageId });
        log(`   ✓ Delivered to socket ${recipientSocketId}`);
      } else {
        warn(`   ✗ Recipient ${msg.toUserId} not connected`);
        // Ack sender — store to DB here for offline delivery if needed
        socket.emit("message_delivered", {
          messageId: msg.messageId,
          offline: true,
        });
      }
    });

    // ── typing indicator ──────────────────────────────────────────
    socket.on("typing", (data) => {
      if (!data?.toUserId) return;
      const recipientSocketId = userSocketMap.get(String(data.toUserId));
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing", {
          fromUserId: data.fromUserId,
          rideId: data.rideId,
        });
      }
    });

    // ── driver_live_location ──────────────────────────────────────
    socket.on("driver_live_location", (data) => {
      if (!data?.customerId) return;
      const customerSocketId = userSocketMap.get(String(data.customerId));
      if (customerSocketId) {
        io.to(customerSocketId).emit("driver_location_update", {
          lat: data.lat,
          lng: data.lng,
          driverId: data.driverId,
          rideId: data.rideId,
        });
      }
    });

    // ── broadcast_ride_status (from client) ───────────────────────
    socket.on("broadcast_ride_status", (data) => {
      if (!data?.toUserId) return;
      const targetSocketId = userSocketMap.get(String(data.toUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("ride_status_update", {
          status: data.status,
          rideId: data.rideId,
          reason: data.reason,
        });
      }
    });

    // ── disconnect ────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      log("🔌 Disconnected:", socket.id, "reason:", reason);
      for (const [uid, sid] of userSocketMap.entries()) {
        if (sid === socket.id) {
          userSocketMap.delete(uid);
          log(`   Removed userId=${uid} from map`);
          break;
        }
      }
    });
  });

  log("Socket.IO handler initialised");
}

// ── Helpers (no need to pass io — uses stored _io) ───────────────

function emitToUser(userId, event, data) {
  if (!_io) {
    warn("emitToUser called before initSocket");
    return false;
  }
  const socketId = userSocketMap.get(String(userId));
  if (socketId) {
    _io.to(socketId).emit(event, data);
    log(`📡 emitToUser → ${userId} [${event}]`);
    return true;
  }
  warn(`emitToUser: userId ${userId} not connected`);
  return false;
}

function pushNewRideToDriver(driverUserId, ridePayload) {
  return emitToUser(driverUserId, "new_ride_request", ridePayload);
}

function notifyCustomer(customerUserId, data) {
  return emitToUser(customerUserId, "ride_status_update", data);
}

function notifyDriver(driverUserId, data) {
  return emitToUser(driverUserId, "ride_status_update", data);
}

function getConnectedUsers() {
  return Array.from(userSocketMap.entries()).map(([uid, sid]) => ({
    userId: uid,
    socketId: sid,
  }));
}

module.exports = {
  initSocket,
  emitToUser,
  pushNewRideToDriver,
  notifyCustomer,
  notifyDriver,
  getConnectedUsers,
};
