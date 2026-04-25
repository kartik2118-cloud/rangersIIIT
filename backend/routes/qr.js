const { Router } = require("express");
const { ethers }   = require("ethers");
const { body, validationResult } = require("express-validator");

const router = Router();

// ─── Signer setup ─────────────────────────────────────────────────────────────
// The backend signs QR payloads so FestPass.sol can verify them on-chain.
// Store SIGNER_PRIVATE_KEY in .env — never commit it.
const provider = new ethers.JsonRpcProvider(
  process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"
);
const signer = new ethers.Wallet(
  process.env.SIGNER_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey,
  provider
);

// ─── POST /api/qr/generate ────────────────────────────────────────────────────
/**
 * Generates a signed FestPass QR payload.
 *
 * Body:
 *   stallId  {string}  - Bytes32 hex stall identifier (e.g. "0x464f4f44...")
 *   amount   {number}  - FEST amount in human units (e.g. 50)
 *   festId   {number}  - Fest/event numeric identifier
 *   ttl      {number}  - (optional) Seconds until QR expires; default 300 (5 min)
 *
 * Returns the JSON payload to embed in the QR code.
 * The student app passes this directly to FestPay.payMerchant()
 * (no on-chain signature check needed for the simple FestPay flow).
 */
router.post(
  "/generate",
  [
    body("stallId").isString().notEmpty(),
    body("amount").isFloat({ gt: 0 }),
    body("festId").isInt({ min: 0 }),
    body("merchant").isEthereumAddress(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { stallId, amount, festId, merchant, ttl = 300 } = req.body;

      const expiry  = Math.floor(Date.now() / 1000) + ttl;
      const nonce   = ethers.hexlify(ethers.randomBytes(32));
      const chainId = Number(process.env.CHAIN_ID || 84532);

      // ── Build the QR payload (this is what gets encoded into the QR image) ─
      const qrPayload = {
        action:   "pay_merchant",
        merchant,
        festId:   String(festId),
        amount:   String(amount),
        stallId,
        nonce,
        expiry,
        chainId,
      };

      // ── Optionally sign the payload for FestPass.sol's verify path ──────────
      // (Only needed if you use the full FestPass.sol contract rather than
      //  the simpler FestPay.sol. Keep it here for future use.)
      const msgHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["bytes32", "uint256", "uint256", "bytes32", "uint256", "address"],
          [
            ethers.encodeBytes32String(stallId),
            ethers.parseUnits(String(amount), 18),
            expiry,
            nonce,
            chainId,
            process.env.FEST_PASS_ADDRESS || ethers.ZeroAddress,
          ]
        )
      );
      const signature = await signer.signMessage(ethers.getBytes(msgHash));

      res.json({ payload: qrPayload, signature, expiresAt: expiry });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/qr/verify ─────────────────────────────────────────────────────
/**
 * Lightweight off-chain QR verification (called by organizer dashboard
 * to double-check a scanned QR before accepting cash/physical goods).
 *
 * Body: { payload, signature }
 */
router.post("/verify", async (req, res, next) => {
  try {
    const { payload, signature } = req.body;
    if (!payload || !signature) {
      return res.status(400).json({ error: "payload and signature are required." });
    }

    const { stallId, amount, expiry, nonce, chainId } = payload;

    // Reconstruct the same hash the /generate endpoint signed
    const msgHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "uint256", "uint256", "bytes32", "uint256", "address"],
        [
          ethers.encodeBytes32String(stallId),
          ethers.parseUnits(String(amount), 18),
          expiry,
          nonce,
          chainId,
          process.env.FEST_PASS_ADDRESS || ethers.ZeroAddress,
        ]
      )
    );

    const recovered = ethers.verifyMessage(ethers.getBytes(msgHash), signature);
    const isValid   = recovered.toLowerCase() === signer.address.toLowerCase();
    const isExpired = Math.floor(Date.now() / 1000) > Number(expiry);

    res.json({ valid: isValid && !isExpired, isExpired, recoveredSigner: recovered });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
