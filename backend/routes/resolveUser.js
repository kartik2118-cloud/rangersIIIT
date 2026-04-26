/**
 * routes/resolveUser.js — Express wrapper around the mock Lambda handler.
 * Mounted at: GET /api/resolve-user?username=@arya_chougule
 */

const express = require("express");
const router  = express.Router();

// ── Mock DynamoDB table (same data as the Lambda version) ────
const MOCK_USERS = {
  "@arya_chougule": { username: "@arya_chougule", walletAddress: "0xABcDEF1234567890ABcDEF1234567890ABcDEF12", displayName: "Arya Chougule",  avatar: "AC" },
  "@sakshi":        { username: "@sakshi",         walletAddress: "0xDEaDBEeF5678901234DEaDBEeF5678901234DEaD", displayName: "Sakshi Sharma",   avatar: "SS" },
  "@kartik":        { username: "@kartik",         walletAddress: "0xBEEF90121234567890BEEF90121234567890BEEF", displayName: "Kartik Bhatt",    avatar: "KB" },
  "@tanmay":        { username: "@tanmay",         walletAddress: "0xCAFE34561234567890CAFE34561234567890CAFE", displayName: "Tanmay Patel",    avatar: "TP" },
  "@priya_mehta":   { username: "@priya_mehta",    walletAddress: "0xF00D1234567890ABcDEFF00D1234567890ABcDEF", displayName: "Priya Mehta",     avatar: "PM" },
};

router.get("/", async (req, res) => {
  const raw      = (req.query.username ?? "").trim().toLowerCase();
  const username = raw.startsWith("@") ? raw : `@${raw}`;

  if (!raw) return res.status(400).json({ error: "Missing query param: username" });

  console.log(`[resolveUser] 🔍 Looking up "${username}"...`);
  await new Promise((r) => setTimeout(r, 50)); // simulate DynamoDB latency

  const record = MOCK_USERS[username];
  if (!record) {
    console.log(`[resolveUser] ❌ Not found: ${username}`);
    return res.status(404).json({ error: `User "${username}" not found.` });
  }

  console.log(`[resolveUser] ✔ Resolved → ${record.walletAddress}`);
  res.json(record);
});

module.exports = router;
