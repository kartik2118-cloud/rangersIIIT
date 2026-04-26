/**
 * paymentListener.js
 *
 * Dedicated blockchain event listener for the FestPass backend.
 * Connects to Base via a persistent WebSocket RPC, listens for
 * FestPay.PaymentReceived events, persists them to a DB, and
 * broadcasts live updates to the Organizer Dashboard via Socket.io.
 *
 * Usage (called once from index.js):
 *   const { startPaymentListener } = require("./paymentListener");
 *   startPaymentListener(io);   // pass the Socket.io server instance
 */

const { ethers } = require("ethers");

// ─── ABI ──────────────────────────────────────────────────────────────────────
// Only the event signature is needed for listening.
const FEST_PAY_ABI = [
  "event PaymentReceived(uint256 indexed festId, address indexed merchant, address indexed student, uint256 amount)",
];

// ─── Config ───────────────────────────────────────────────────────────────────
const FEST_PAY_ADDRESS = process.env.FEST_PAY_ADDRESS;

// Prefer a WebSocket RPC for persistent event subscriptions.
// Falls back to HTTP polling if WS URL is not set.
const RPC_URL =
  process.env.BASE_SEPOLIA_WS_URL ||    // wss://... (preferred)
  process.env.BASE_SEPOLIA_RPC_URL ||   // https://... (fallback)
  "https://sepolia.base.org";

const RECONNECT_DELAY_MS = 5_000;       // wait 5 s before reconnecting on drop

// ─── Internal state ───────────────────────────────────────────────────────────
let _contract  = null;   // active ethers Contract instance
let _provider  = null;   // active provider instance
let _io        = null;   // Socket.io server reference (injected at startup)
let _stopped   = false;  // set to true on graceful shutdown

// ─── DB placeholder helpers ───────────────────────────────────────────────────

/**
 * savePaymentToDb
 *
 * Replace this stub with your real DB call.
 *
 * MongoDB example:
 *   const Payment = require("./models/Payment");
 *   await Payment.create(record);
 *
 * Postgres (pg) example:
 *   await pool.query(
 *     `INSERT INTO payments (fest_id, merchant, student, amount_fest, tx_hash, block_number, created_at)
 *      VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
 *     [record.festId, record.merchant, record.student, record.amountFest, record.txHash, record.blockNumber]
 *   );
 */
async function savePaymentToDb(record) {
  // ── PLACEHOLDER ── replace with real DB logic ─────────────────────────────
  console.log("[DB] Would save record:", record);
  // await db.payments.insertOne(record);   // MongoDB
  // await pool.query("INSERT INTO payments ...", [...]);  // Postgres
}

// ─── Socket.io broadcast helper ──────────────────────────────────────────────

/**
 * broadcastToOrganizers
 *
 * Emits a "payment:received" event to every connected Organizer Dashboard client.
 *
 * On the React organizer dashboard, listen with:
 *   socket.on("payment:received", (data) => {
 *     setTransactions(prev => [data, ...prev]);
 *   });
 *
 * To scope to a specific fest, use Socket.io rooms:
 *   io.to(`fest-${record.festId}`).emit("payment:received", record);
 *   // and on the client: socket.join(`fest-${festId}`)
 */
function broadcastToOrganizers(record) {
  if (!_io) return;

  // Broadcast to ALL connected organizer clients
  _io.emit("payment:received", record);

  // ── PLACEHOLDER: Room-scoped broadcast (recommended for multi-fest) ───────
  // _io.to(`fest-${record.festId}`).emit("payment:received", record);
}

// ─── Core event handler ───────────────────────────────────────────────────────

/**
 * handlePaymentReceived
 *
 * Fired by ethers.js every time FestPay emits PaymentReceived on-chain.
 *
 * @param {bigint}        festId   - Fest/event identifier
 * @param {string}        merchant - Vendor address (checksum)
 * @param {string}        student  - Student address (checksum)
 * @param {bigint}        amount   - FEST amount in wei (18 decimals)
 * @param {ethers.EventLog} event  - Full event log object
 */
async function handlePaymentReceived(festId, merchant, student, amount, event) {
  // ── Parse & normalise ─────────────────────────────────────────────────────
  const record = {
    festId:      festId.toString(),
    merchant:    merchant.toLowerCase(),
    student:     student.toLowerCase(),
    amountWei:   amount.toString(),
    amountFest:  ethers.formatUnits(amount, 18),   // human-readable: "50.0"
    txHash:      event.log?.transactionHash ?? null,
    blockNumber: event.log?.blockNumber     ?? null,
    capturedAt:  new Date().toISOString(),
  };

  console.log(
    `[PaymentReceived] ${record.amountFest} FEST | ` +
    `festId=${record.festId} | merchant=${record.merchant.slice(0,8)}… | ` +
    `tx=${record.txHash?.slice(0,10)}…`
  );

  // ── 1. Persist to database ────────────────────────────────────────────────
  try {
    await savePaymentToDb(record);
  } catch (dbErr) {
    console.error("[DB] Failed to save payment:", dbErr.message);
    // Don't throw — we still want to broadcast even if DB write fails
  }

  // ── 2. Push live update to Organizer Dashboard ────────────────────────────
  broadcastToOrganizers(record);
}

// ─── Listener lifecycle ───────────────────────────────────────────────────────

/**
 * attach
 * Creates a fresh provider + contract instance and registers the event listener.
 */
function attach() {
  if (_stopped) return;

  try {
    // Choose provider type based on RPC URL scheme
    _provider = RPC_URL.startsWith("wss://") || RPC_URL.startsWith("ws://")
      ? new ethers.WebSocketProvider(RPC_URL)
      : new ethers.JsonRpcProvider(RPC_URL);

    if (!FEST_PAY_ADDRESS || !ethers.isAddress(FEST_PAY_ADDRESS)) {
      throw new Error("FEST_PAY_ADDRESS is not set or invalid in .env");
    }

    _contract = new ethers.Contract(FEST_PAY_ADDRESS, FEST_PAY_ABI, _provider);
    _contract.on("PaymentReceived", handlePaymentReceived);

    console.log(`[Listener] Attached to FestPay at ${FEST_PAY_ADDRESS} via ${RPC_URL}`);
  } catch (err) {
    console.error("[Listener] Failed to attach:", err.message);
    scheduleReconnect();
  }

  // ── WebSocket-specific: handle provider drops gracefully ──────────────────
  if (_provider instanceof ethers.WebSocketProvider) {
    _provider.websocket.on("close", () => {
      console.warn("[Listener] WebSocket closed — reconnecting in", RECONNECT_DELAY_MS, "ms");
      detach();
      scheduleReconnect();
    });

    _provider.websocket.on("error", (err) => {
      console.error("[Listener] WebSocket error:", err.message);
    });
  }
}

/**
 * detach
 * Removes all listeners and destroys the current provider cleanly.
 */
function detach() {
  try {
    _contract?.removeAllListeners();
    _provider?.destroy?.();
  } catch {/* ignore cleanup errors */}
  _contract = null;
  _provider = null;
}

/**
 * scheduleReconnect
 * Re-attaches after RECONNECT_DELAY_MS unless the listener has been stopped.
 */
function scheduleReconnect() {
  if (_stopped) return;
  setTimeout(attach, RECONNECT_DELAY_MS);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * startPaymentListener
 *
 * Call once from index.js after the HTTP + Socket.io server is ready.
 *
 * @param {import("socket.io").Server} io - The Socket.io Server instance
 */
function startPaymentListener(io) {
  _io      = io;
  _stopped = false;
  attach();

  // Graceful shutdown hooks
  process.on("SIGINT",  stopPaymentListener);
  process.on("SIGTERM", stopPaymentListener);
}

/**
 * stopPaymentListener
 * Tears down the listener cleanly (called on process exit).
 */
function stopPaymentListener() {
  console.log("[Listener] Stopping…");
  _stopped = true;
  detach();
}

module.exports = { startPaymentListener, stopPaymentListener };
