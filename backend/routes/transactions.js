const { Router } = require("express");
const { ethers }   = require("ethers");

const router = Router();

// ─── Provider + Contract setup ────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(
  process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"
);

const FEST_PAY_ABI = [
  "event PaymentReceived(uint256 indexed festId, address indexed merchant, address indexed student, uint256 amount)",
];

const festPay = new ethers.Contract(
  process.env.FEST_PAY_ADDRESS || ethers.ZeroAddress,
  FEST_PAY_ABI,
  provider
);

// In-memory store (replace with DB in production)
const txStore = [];

// ── Listen for on-chain PaymentReceived events ─────────────────────────────
festPay.on("PaymentReceived", (festId, merchant, student, amount, event) => {
  const record = {
    festId:   festId.toString(),
    merchant: merchant.toLowerCase(),
    student:  student.toLowerCase(),
    amount:   ethers.formatUnits(amount, 18),
    txHash:   event.log?.transactionHash,
    block:    event.log?.blockNumber,
    ts:       Date.now(),
  };
  txStore.unshift(record);             // newest first
  console.log("[PaymentReceived]", record);
});

// ─── GET /api/transactions ────────────────────────────────────────────────────
/**
 * Returns all captured PaymentReceived events (newest first).
 * Query params:
 *   merchant {string} - filter by merchant address
 *   festId   {string} - filter by festId
 *   limit    {number} - max results (default 50)
 */
router.get("/", (req, res) => {
  const { merchant, festId, limit = "50" } = req.query;
  let results = [...txStore];

  if (merchant) {
    results = results.filter((r) => r.merchant === merchant.toLowerCase());
  }
  if (festId) {
    results = results.filter((r) => r.festId === String(festId));
  }

  res.json({ count: results.length, transactions: results.slice(0, Number(limit)) });
});

// ─── GET /api/transactions/recent ────────────────────────────────────────────
/**
 * Returns the 10 most recent transactions — used by the organizer dashboard live feed.
 */
router.get("/recent", (_req, res) => {
  res.json({ transactions: txStore.slice(0, 10) });
});

module.exports = router;
