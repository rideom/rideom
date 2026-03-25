const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./src/routes/auth.route");
const protectedRoute = require("./src/routes/protected.route");
const driverRoutes = require("./src/routes/driver.route");

const app = express();
const server = http.createServer(app);

// ✅ CORS — update origin to your real frontend domain before launch
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

// ✅ Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Health check route (required for Render/Railway)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Rideom API Running 🚀",
    version: "1.0.0"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoute);   // fixed typo: proctedRoute → protectedRoute
app.use("/api/driver", driverRoutes);

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? null : err.message
  });
});

// ✅ Socket.io — real-time ride tracking
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("driver_location", (data) => {
    io.emit("update_driver_location", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});