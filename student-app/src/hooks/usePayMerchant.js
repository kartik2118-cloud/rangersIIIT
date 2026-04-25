import { useState, useCallback } from "react";
import { ethers } from "ethers";

/**
 * usePayMerchant
 *
 * React hook that drives the on-chain payment flow for the Student App.
 * Calls FestPay.payMerchant() on the Base network using ethers.js v6.
 *
 * Flow:
 *  1. Ensure the student's wallet has approved FestPay to spend ≥ amount FEST.
 *  2. Call payMerchant(festId, merchant, amountWei) on the FestPay contract.
 *  3. Wait for transaction confirmation.
 *
 * Usage:
 *   const { pay, status, txHash, error, reset } = usePayMerchant();
 *   await pay({ merchant, festId, amount });
 *
 * Expects window.ethereum (MetaMask / Coinbase Wallet / smart-wallet injected provider).
 */

// ─── ABI slices (only what we need — keeps bundle small) ─────────────────────

const FEST_PAY_ABI = [
  "function payMerchant(uint256 festId, address merchant, uint256 amount) external",
];

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// ─── Contract addresses — swap for mainnet when ready ────────────────────────
// These match the output of contracts/scripts/deploy.js on Base Sepolia.
const FEST_PAY_ADDRESS  = import.meta.env.VITE_FEST_PAY_ADDRESS  || "";
const FEST_TOKEN_ADDRESS = import.meta.env.VITE_FEST_TOKEN_ADDRESS || "";
const BASE_SEPOLIA_CHAIN_ID = 84532n;

// ─── Status constants ─────────────────────────────────────────────────────────
export const PAY_STATUS = {
  IDLE:       "idle",
  CONNECTING: "connecting",
  APPROVING:  "approving",
  PAYING:     "paying",
  CONFIRMING: "confirming",
  SUCCESS:    "success",
  ERROR:      "error",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePayMerchant() {
  const [status,  setStatus]  = useState(PAY_STATUS.IDLE);
  const [txHash,  setTxHash]  = useState(null);
  const [error,   setError]   = useState(null);

  const reset = useCallback(() => {
    setStatus(PAY_STATUS.IDLE);
    setTxHash(null);
    setError(null);
  }, []);

  /**
   * pay({ merchant, festId, amount })
   * @param {string} merchant   - Merchant Ethereum address
   * @param {string|number} festId - Fest identifier (uint256)
   * @param {number} amount     - FEST amount (human-readable, e.g. 50 = 50 FEST)
   */
  const pay = useCallback(async ({ merchant, festId, amount }) => {
    setError(null);
    setTxHash(null);

    try {
      // ── 1. Connect wallet ──────────────────────────────────────────────────
      setStatus(PAY_STATUS.CONNECTING);

      if (!window.ethereum) {
        throw new Error("No Web3 wallet detected. Install MetaMask or Coinbase Wallet.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const studentAddress = await signer.getAddress();

      // ── 2. Verify chain ────────────────────────────────────────────────────
      const { chainId } = await provider.getNetwork();
      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        // Ask wallet to switch to Base Sepolia
        await provider.send("wallet_switchEthereumChain", [
          { chainId: "0x" + BASE_SEPOLIA_CHAIN_ID.toString(16) },
        ]).catch(async (switchErr) => {
          // Chain not added yet — add it
          if (switchErr.code === 4902) {
            await provider.send("wallet_addEthereumChain", [{
              chainId:         "0x" + BASE_SEPOLIA_CHAIN_ID.toString(16),
              chainName:       "Base Sepolia",
              nativeCurrency:  { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls:         ["https://sepolia.base.org"],
              blockExplorerUrls: ["https://sepolia.basescan.org"],
            }]);
          } else {
            throw switchErr;
          }
        });
      }

      // ── 3. Contract instances ──────────────────────────────────────────────
      const festToken = new ethers.Contract(FEST_TOKEN_ADDRESS, ERC20_ABI, signer);
      const festPay   = new ethers.Contract(FEST_PAY_ADDRESS,   FEST_PAY_ABI, signer);

      // ── 4. Convert amount to wei (18 decimals) ─────────────────────────────
      const decimals  = await festToken.decimals();
      const amountWei = ethers.parseUnits(String(amount), decimals);

      // ── 5. Check & set allowance ───────────────────────────────────────────
      const allowance = await festToken.allowance(studentAddress, FEST_PAY_ADDRESS);

      if (allowance < amountWei) {
        setStatus(PAY_STATUS.APPROVING);
        const approveTx = await festToken.approve(FEST_PAY_ADDRESS, amountWei);
        await approveTx.wait(1);   // wait 1 confirmation
      }

      // ── 6. Execute payment ─────────────────────────────────────────────────
      setStatus(PAY_STATUS.PAYING);
      const payTx = await festPay.payMerchant(
        BigInt(festId),
        merchant,
        amountWei
      );
      setTxHash(payTx.hash);

      // ── 7. Wait for on-chain confirmation ──────────────────────────────────
      setStatus(PAY_STATUS.CONFIRMING);
      await payTx.wait(1);

      setStatus(PAY_STATUS.SUCCESS);
    } catch (err) {
      // Surface user-friendly messages
      const message =
        err?.reason                             // Solidity revert reason
        ?? err?.shortMessage                    // ethers.js v6 short message
        ?? err?.message
        ?? "Payment failed. Please try again.";

      setError(message);
      setStatus(PAY_STATUS.ERROR);
    }
  }, []);

  return { pay, status, txHash, error, reset };
}
