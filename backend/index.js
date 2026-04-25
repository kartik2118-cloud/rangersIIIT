require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const http     = require("http");
const { Server: SocketIO } = require("socket.io");

const qrRoutes              = require("./routes/qr");
const txRoutes              = require("./routes/transactions");
const { startPaymentListener } = require("./paymentListener");

const app    = express();
const server = http.createServer(app);   // shared server for HTTP + WebSocket

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new SocketIO(server, {
  cors: {
    origin:  process.env.FRONTEND_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Organizer joins a fest-specific room for scoped broadcasts
  socket.on("join:fest", (festId) => {
    socket.join(`fest-${festId}`);
    console.log(`[Socket.io] ${socket.id} joined room fest-${festId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

// ─── HTTP Routes ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use("/api/qr",           qrRoutes);
app.use("/api/transactions",  txRoutes);

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`FestPass backend running on http://localhost:${PORT}`);
  // Start blockchain listener AFTER server is ready, inject Socket.io instance
  startPaymentListener(io);
});
