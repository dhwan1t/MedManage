const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// ── Validate critical env vars early ──
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error(
    "FATAL: JWT_SECRET environment variable is not set. Server cannot start.",
  );
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error(
    "FATAL: MONGO_URI environment variable is not set. Server cannot start.",
  );
  process.exit(1);
}

const PORT = process.env.PORT || 5001;

// ── Allowed origins for CORS ──
// In production, set CORS_ORIGIN to your frontend domain(s), comma-separated.
// e.g. CORS_ORIGIN=https://medmanage.example.com,https://admin.medmanage.example.com
// In development, defaults to localhost Vite dev server.
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"];

const app = express();
const server = http.createServer(app);

// ── P0-02: Scoped CORS — no more origin: '*' ──
const corsOptions = {
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.use(express.json());

// ── P0-05: Socket.IO authentication middleware ──
// Clients must pass { auth: { token: "<JWT>" } } when connecting.
// Unauthenticated connections are rejected.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required: no token provided"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; // { userId, role, hospitalId, ambulanceId }
    next();
  } catch (err) {
    return next(new Error("Authentication failed: invalid token"));
  }
});

// ── P1-06: Mongoose connection with proper options ──
mongoose
  .connect(MONGO_URI, {
    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 2,
    // Timeout settings
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Heartbeat
    heartbeatFrequencyMS: 10000,
    // Retry
    retryWrites: true,
    retryReads: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// ── Graceful shutdown — close Mongoose on SIGINT/SIGTERM ──
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  } catch (err) {
    console.error("Error during shutdown:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// ── Routes ──
app.use("/api/auth", require("./routes/auth"));
app.use("/api/public", require("./routes/public"));
app.use("/api/cases", require("./routes/cases"));
app.use("/api/ambulance", require("./routes/ambulance"));
app.use("/api/hospital", require("./routes/hospital"));
app.use("/api/admin", require("./routes/admin"));

// ── Socket.IO handler ──
require("./sockets/socketHandler")(io);

// ── Make io accessible from route handlers ──
app.set("io", io);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
