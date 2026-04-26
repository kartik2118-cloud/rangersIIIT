import { ethers } from "ethers";

// ─── ABI ──────────────────────────────────────────────────────────────────────
// Minimal ABI slice — only the functions this utility needs.
// Import the full generated ABI from artifacts/ in production.
const FEST_PAY_ABI = [
  "function payMerchant(uint256 festId, address merchant, uint256 amount) external",
  "event PaymentReceived(uint256 indexed festId, address indexed merchant, address indexed student, uint256 amount)",
];

// Needed only when the approve step is handled here (see note below).
const ERC20_APPROVE_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// ─── Contract address ─────────────────────────────────────────────────────────
// Set via environment variable so this file never needs editing between deploys.
const FEST_PAY_ADDRESS =
  typeof import.meta !== "undefined"
    ? import.meta.env?.VITE_FEST_PAY_ADDRESS          // Vite / Next.js client
    : process.env.FEST_PAY_ADDRESS;                   // Node.js (tests / backend)

const FEST_TOKEN_ADDRESS =
  typeof import.meta !== "undefined"
    ? import.meta.env?.VITE_FEST_TOKEN_ADDRESS
    : process.env.FEST_TOKEN_ADDRESS;

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
/**
 * @typedef {Object} QRPayload
 * @property {"pay_merchant"} action
 * @property {string}         merchant  - Ethereum address of the vendor
 * @property {string|number}  festId    - Fest/event identifier
 * @property {number|null}    amount    - FEST amount (may be null for open-amount QRs)
 * @property {number}         chainId   - 84532 (Base Sepolia) or 8453 (Base Mainnet)
 *
 * @typedef {Object} PaymentResult
 * @property {boolean} success
 * @property {string}  txHash      - Transaction hash on success
 * @property {string}  [error]     - Human-readable error message on failure
 */

// ─── Main utility ─────────────────────────────────────────────────────────────

/**
 * processQRPayment
 *
 * Executes an on-chain FEST token payment from a student to a merchant by
 * calling `FestPay.payMerchant()` on the Base network.
 *
 * This is a **pure async utility** — it holds no React state.
 * Wire it inside `usePayMerchant` (the React hook) or call it directly in tests.
 *
 * Pre-conditions:
 *   • `providerOrSigner` must be a connected ethers.js v6 Signer (not a read-only Provider).
 *   • The student must have already approved FestPay to spend ≥ amountToPay FEST,
 *     OR you must pass `handleApprove: true` to let this function do it inline.
 *
 * ─── WHERE THE ERC-20 APPROVE SHOULD HAPPEN ─────────────────────────────────
 *
 *  Option A (recommended for EOA / MetaMask wallets):
 *    Call approve() separately BEFORE calling this function — typically inside
 *    the React hook (usePayMerchant.js) so the UI can show a distinct
 *    "Approving…" loading state.
 *
 *  Option B (smart / social wallets with tx batching, e.g. Coinbase Smart Wallet):
 *    Batch approve + payMerchant into a single UserOperation via ERC-4337.
 *    The wallet SDK handles atomic execution, so you never need a separate
 *    approve call here. In that case, set handleApprove: false (default).
 *
 *  Option C (convenience — pass handleApprove: true):
 *    This function will check the current allowance and issue an approve tx
 *    inline if needed. Simpler but gives less UI control.
 *
 * @param {QRPayload}                parsedQrData   - Decoded QR payload object
 * @param {ethers.Signer}            providerOrSigner - ethers.js v6 Signer
 * @param {number}                   amountToPay    - Human-readable FEST (e.g. 50 = 50 FEST)
 * @param {{ handleApprove?: boolean }} [options]   - Extra options
 * @returns {Promise<PaymentResult>}
 */
export async function processQRPayment(
  parsedQrData,
  providerOrSigner,
  amountToPay,
  { handleApprove = false } = {}
) {
  // ── 1. Input validation ────────────────────────────────────────────────────
  if (!parsedQrData || parsedQrData.action !== "pay_merchant") {
    return { success: false, error: "Invalid QR payload: missing or wrong action." };
  }

  const { merchant, festId } = parsedQrData;

  if (!ethers.isAddress(merchant)) {
    return { success: false, error: `Invalid merchant address: ${merchant}` };
  }

  if (!amountToPay || Number(amountToPay) <= 0) {
    return { success: false, error: "Amount must be greater than zero." };
  }

  if (!FEST_PAY_ADDRESS || !ethers.isAddress(FEST_PAY_ADDRESS)) {
    return { success: false, error: "FEST_PAY_ADDRESS environment variable is not set." };
  }

  try {
    // ── 2. Resolve signer ────────────────────────────────────────────────────
    // Accept either a raw Signer or a BrowserProvider (get signer from it)
    let signer;
    if (typeof providerOrSigner.getSigner === "function") {
      signer = await providerOrSigner.getSigner();
    } else {
      signer = providerOrSigner;
    }

    // ── 3. Convert amount to 18-decimal wei ──────────────────────────────────
    // FEST token uses 18 decimals (same as ETH).
    // ethers.parseUnits("50", 18) → 50_000_000_000_000_000_000n
    const amountWei = ethers.parseUnits(String(amountToPay), 18);

    // ── 4. (Optional) ERC-20 approve ─────────────────────────────────────────
    //
    // If handleApprove is true, check the student's current allowance and
    // top it up before attempting the transfer.  See the WHERE NOTE above.
    //
    // ⚠️  Smart wallets (ERC-4337) should batch this with the pay call instead.
    //
    if (handleApprove) {
      if (!FEST_TOKEN_ADDRESS || !ethers.isAddress(FEST_TOKEN_ADDRESS)) {
        return { success: false, error: "FEST_TOKEN_ADDRESS environment variable is not set." };
      }

      const festToken   = new ethers.Contract(FEST_TOKEN_ADDRESS, ERC20_APPROVE_ABI, signer);
      const studentAddr = await signer.getAddress();
      const allowance   = await festToken.allowance(studentAddr, FEST_PAY_ADDRESS);

      if (allowance < amountWei) {
        // Approve exact amount (not unlimited) — principle of least privilege
        const approveTx = await festToken.approve(FEST_PAY_ADDRESS, amountWei);
        await approveTx.wait(1);
      }
    }

    // ── 5. Instantiate FestPay contract ──────────────────────────────────────
    const festPay = new ethers.Contract(FEST_PAY_ADDRESS, FEST_PAY_ABI, signer);

    // ── 6. Call payMerchant ──────────────────────────────────────────────────
    //
    //  FestPay.payMerchant(uint256 festId, address merchant, uint256 amount)
    //
    //  This triggers:
    //   • festToken.transferFrom(student, merchant, amountWei)  — inside the contract
    //   • Emits: PaymentReceived(festId, merchant, student, amount)
    //
    const tx = await festPay.payMerchant(
      BigInt(festId),   // cast to bigint — ethers v6 requires BigInt for uint256
      merchant,
      amountWei
    );

    // ── 7. Wait for 1 on-chain confirmation ──────────────────────────────────
    const receipt = await tx.wait(1);

    // Sanity check: ensure the tx didn't revert (status 0 = reverted)
    if (receipt.status === 0) {
      return { success: false, error: "Transaction was reverted on-chain." };
    }

    // ── 8. Return success ────────────────────────────────────────────────────
    return {
      success: true,
      txHash:  tx.hash,
      receipt,           // full receipt available for downstream use
    };

  } catch (err) {
    // ── Map ethers.js / RPC errors to clean messages ──────────────────────
    const message =
      err?.reason                          // Solidity revert reason string
      ?? err?.shortMessage                 // ethers.js v6 condensed error
      ?? err?.info?.error?.message         // MetaMask RPC error body
      ?? err?.message
      ?? "Unknown payment error.";

    console.error("[processQRPayment] Error:", message, err);
    return { success: false, error: message };
  }
}
