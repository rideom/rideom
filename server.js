// // const express = require("express");
// // const cors = require("cors");
// // const http = require("http");
// // const { Server } = require("socket.io");
// // require("dotenv").config();

// // const authRoutes = require("./src/routes/auth.route");
// // const protectedRoute = require("./src/routes/protected.route");
// // const driverRoutes = require("./src/routes/driver.route");
// // const fareRoutes = require("./src/routes/fare.route");
// // const rideRoutes = require("./src/routes/ride.routes");

// // const app = express();
// // const server = http.createServer(app);

// // // ✅ CORS — update origin to your real frontend domain before launch
// // const io = new Server(server, {
// //   cors: { origin: '*' },
// // });

// // // ✅ Middlewares
// // app.use(
// //   cors({
// //     origin: process.env.CLIENT_URL || "*",
// //     credentials: true,
// //   }),
// // );
// // app.use(express.json({ limit: "10mb" }));
// // app.use(express.urlencoded({ extended: true }));

// // // ✅ Health check route (required for Render/Railway)
// // app.get("/", (req, res) => {
// //   res.json({
// //     status: "ok",
// //     message: "Rideom API Running 🚀",
// //     version: "1.0.0",
// //   });
// // });

// // app.get("/health", (req, res) => {
// //   res.status(200).json({ status: "healthy" });
// // });

// // // ✅ Routes
// // app.use("/api/auth", authRoutes);
// // app.use("/api/protected", protectedRoute); // fixed typo: proctedRoute → protectedRoute
// // app.use("/api/driver", driverRoutes);
// // app.use("/api/fare", fareRoutes);
// // app.use('/api/rides', rideRoutes);

// // // ✅ 404 Handler
// // app.use((req, res) => {
// //   res.status(404).json({ error: "Route not found" });
// // });

// // // ✅ Global Error Handler
// // app.use((err, req, res, next) => {
// //   console.error(err.stack);
// //   res.status(500).json({
// //     error: "Internal server error",
// //     message: process.env.NODE_ENV === "production" ? null : err.message,
// //   });
// // });

// // //hii

// // // ✅ Socket.io — real-time ride tracking
// // // io.on("connection", (socket) => {
// // //   console.log("Client connected:", socket.id);

// // //   socket.on("driver_location", (data) => {
// // //     io.emit("update_driver_location", data);
// // //   });

// // //   socket.on("disconnect", () => {
// // //     console.log("Client disconnected:", socket.id);
// // //   });
// // // });

// // // Map: userId (string) → socketId
// // const connectedUsers = new Map();

// // io.on("connection", (socket) => {
// //   console.log("Socket connected:", socket.id);

// //   // Client registers their userId right after connecting
// //   socket.on("register", (userId) => {
// //     connectedUsers.set(String(userId), socket.id);
// //     console.log(`✅ User ${userId} registered → socket ${socket.id}`);
// //   });

// //   socket.on("disconnect", () => {
// //     for (const [userId, sockId] of connectedUsers.entries()) {
// //       if (sockId === socket.id) {
// //         connectedUsers.delete(userId);
// //         console.log(`❌ User ${userId} disconnected`);
// //         break;
// //       }
// //     }
// //   });
// // });

// // // Helper to emit to a specific user by their User.id
// // function emitToUser(userId, event, data) {
// //   const socketId = connectedUsers.get(String(userId));
// //   if (socketId) {
// //     io.to(socketId).emit(event, data);
// //     return true;
// //   }
// //   return false;
// // }

// // // ✅ Start server
// // const PORT = process.env.PORT || 5000;
// // server.listen(PORT, () => {
// //   console.log(`Server running on port ${PORT}`);
// //   console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
// // });

// // module.exports = { io, emitToUser, connectedUsers };

// // // const express = require("express");
// // // const cors = require("cors");
// // // const http = require("http");
// // // require("dotenv").config();

// // // const { initSocket } = require("./src/socket/socket"); // ← import

// // // const authRoutes = require("./src/routes/auth.route");
// // // const protectedRoute = require("./src/routes/protected.route");
// // // const driverRoutes = require("./src/routes/driver.route");
// // // const fareRoutes = require("./src/routes/fare.route");
// // // const rideRoutes = require("./src/routes/ride.routes");

// // // const app = express();
// // // const server = http.createServer(app);

// // // // ✅ Init socket (no circular dependency)
// // // initSocket(server);

// // // // ✅ Middlewares
// // // app.use(
// // //   cors({
// // //     origin: process.env.CLIENT_URL || "*",
// // //     credentials: true,
// // //   }),
// // // );
// // // app.use(express.json({ limit: "10mb" }));
// // // app.use(express.urlencoded({ extended: true }));

// // // // ✅ Health routes
// // // app.get("/", (req, res) => {
// // //   res.json({
// // //     status: "ok",
// // //     message: "Rideom API Running 🚀",
// // //     version: "1.0.0",
// // //   });
// // // });
// // // app.get("/health", (req, res) => {
// // //   res.status(200).json({ status: "healthy" });
// // // });

// // // // ✅ Routes
// // // app.use("/api/auth", authRoutes);
// // // app.use("/api/protected", protectedRoute);
// // // app.use("/api/driver", driverRoutes);
// // // app.use("/api/fare", fareRoutes);
// // // app.use("/api/rides", rideRoutes);

// // // // ✅ 404 Handler
// // // app.use((req, res) => {
// // //   res.status(404).json({ error: "Route not found" });
// // // });

// // // // ✅ Global Error Handler
// // // app.use((err, req, res, next) => {
// // //   console.error(err.stack);
// // //   res.status(500).json({
// // //     error: "Internal server error",
// // //     message: process.env.NODE_ENV === "production" ? null : err.message,
// // //   });
// // // });

// // // // ✅ Start server
// // // const PORT = process.env.PORT || 5000;
// // // server.listen(PORT, () => {
// // //   console.log(`Server running on port ${PORT}`);
// // //   console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
// // // });

// // // module.exports = { server };

// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");
// require("dotenv").config();

// // ✅ Import your complete socket handler
// const {
//   initSocket,
//   pushNewRideToDriver,
//   notifyCustomer,
//   notifyDriver,
//   getConnectedUsers,
// } = require("./src/socket/socket"); // ← adjust path if needed

// const authRoutes = require("./src/routes/auth.route");
// const protectedRoute = require("./src/routes/protected.route");
// const driverRoutes = require("./src/routes/driver.route");
// const fareRoutes = require("./src/routes/fare.route");
// const rideRoutes = require("./src/routes/ride.routes");

// const app = express();
// const server = http.createServer(app);

// // ✅ Create io instance
// const io = new Server(server, {
//   cors: { origin: "*" },
// });

// // ✅ Middlewares
// app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));

// // ✅ Health routes
// app.get("/", (req, res) =>
//   res.json({
//     status: "ok",
//     message: "Rideom API Running 🚀",
//     version: "1.0.0",
//   }),
// );
// app.get("/health", (req, res) => res.status(200).json({ status: "healthy" }));

// // ✅ API Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/protected", protectedRoute);
// app.use("/api/driver", driverRoutes);
// app.use("/api/fare", fareRoutes);
// app.use(
//   "/api/rides",
//   (req, res, next) => {
//     req.io = io;
//     next();
//   },
//   rideRoutes,
// );

// // ✅ 404 Handler
// app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// // ✅ Global Error Handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     error: "Internal server error",
//     message: process.env.NODE_ENV === "production" ? null : err.message,
//   });
// });

// // ✅ Wire up the complete socket handler (pass io, NOT server)
// initSocket(io);

// // ✅ Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
// });

// // ✅ Export io + helpers for use in ride/booking controllers
// module.exports = {
//   io,
//   pushNewRideToDriver,
//   notifyCustomer,
//   notifyDriver,
//   getConnectedUsers,
// };

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./src/routes/auth.route");
const protectedRoute = require("./src/routes/protected.route");
const driverRoutes = require("./src/routes/driver.route");
const fareRoutes = require("./src/routes/fare.route");
const rideRoutes = require("./src/routes/ride.routes");

const { initSocket } = require("./src/socket/socket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// ✅ Init socket BEFORE routes load (breaks circular dep)
initSocket(io);

// ✅ Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Health
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Rideom API Running 🚀",
    version: "1.0.0",
  });
});
app.get("/health", (req, res) => res.status(200).json({ status: "healthy" }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoute);
app.use("/api/driver", driverRoutes);
app.use("/api/fare", fareRoutes);
app.use("/api/rides", rideRoutes);

// ✅ 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? null : err.message,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = { server };
