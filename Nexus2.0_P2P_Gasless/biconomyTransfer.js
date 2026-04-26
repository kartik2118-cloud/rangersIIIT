/**
 * biconomyTransfer.js
 *
 * Web3 utility for gasless P2P NexusToken (ERC-20) transfers using
 * Biconomy Account Abstraction (ERC-4337).
 *
 * Flow:
 *   1. Encode ERC-20 transfer() calldata
 *   2. Build a Biconomy SmartAccount with Paymaster config
 *   3. Send as a sponsored UserOperation (gas paid by Paymaster)
 *   4. Return the on-chain txHash + userOpHash
 *
 * Env vars required (set in .env / .env.local):
 *   NEXT_PUBLIC_BICONOMY_PAYMASTER_KEY   — Biconomy dashboard Paymaster API key
 *   NEXT_PUBLIC_NEXUS_TOKEN_ADDRESS      — Deployed NexusToken ERC-20 contract address
 *
 * NOTE: @biconomy/account must be installed:
 *   npm install @biconomy/account
 */

import { ethers }           from "ethers";
import { createSmartAccountClient, PaymasterMode } from "@biconomy/account";

// ─── Environment Variables ────────────────────────────────────────────────────
const PAYMASTER_KEY =
  (typeof import.meta !== "undefined"
    ? import.meta.env?.NEXT_PUBLIC_BICONOMY_PAYMASTER_KEY  // Vite
    : process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_KEY)      // Node / Next
  ?? "";

const NEXUS_TOKEN_ADDRESS =
  (typeof import.meta !== "undefined"
    ? import.meta.env?.NEXT_PUBLIC_NEXUS_TOKEN_ADDRESS
    : process.env.NEXT_PUBLIC_NEXUS_TOKEN_ADDRESS)
  ?? "";

// ─── ERC-20 ABI (minimal — only transfer) ─────────────────────────────────────
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

// ─── Step 1: Encode calldata ──────────────────────────────────────────────────
/**
 * Encodes an ERC-20 transfer(address,uint256) function call.
 *
 * @param {string}  toAddress   Recipient Ethereum address
 * @param {bigint}  amountWei   Transfer amount in wei (18-decimal)
 * @returns {string} Hex-encoded calldata
 */
export function encodeTransferCalldata(toAddress, amountWei) {
  console.log("[NEXUS P2P] 🔧 Encoding ERC-20 transfer calldata...");
  console.log("[NEXUS P2P] 📦 NexusToken address:", NEXUS_TOKEN_ADDRESS);
  console.log("[NEXUS P2P] 📬 Recipient address  :", toAddress);

  const iface    = new ethers.Interface(ERC20_ABI);
  const calldata = iface.encodeFunctionData("transfer", [toAddress, amountWei]);

  console.log("[NEXUS P2P] 📝 Calldata encoded   :", calldata.slice(0, 42) + "...");
  return calldata;
}

// ─── Step 2: Main Gasless Transfer ───────────────────────────────────────────
/**
 * sendGaslessTransfer
 *
 * Takes a Biconomy SmartAccount instance and transfers NexusTokens to a
 * recipient address WITHOUT the user paying gas. Gas is sponsored by the
 * Biconomy Paymaster configured in the .env file.
 *
 * @param {import("@biconomy/account").BiconomySmartAccountV2} smartAccount
 *   Initialised Biconomy smart account (see createBiconomySmartAccount below)
 * @param {string} toAddress     Resolved recipient wallet address
 * @param {number|string} amountHuman  Human-readable token amount (e.g. "50" for 50 FEST)
 *
 * @returns {Promise<{ success: boolean, txHash?: string, userOpHash?: string, error?: string }>}
 */
export async function sendGaslessTransfer(smartAccount, toAddress, amountHuman) {
  console.log("────────────────────────────────────────────");
  console.log("[NEXUS P2P] 🚀 Initiating Gasless P2P Transfer");
  console.log("[NEXUS P2P]    To      :", toAddress);
  console.log("[NEXUS P2P]    Amount  :", amountHuman, "FEST");
  console.log("────────────────────────────────────────────");

  // ── Validate inputs ────────────────────────────────────────────────────────
  if (!ethers.isAddress(toAddress)) {
    const err = `Invalid recipient address: ${toAddress}`;
    console.error("[NEXUS P2P] ❌", err);
    return { success: false, error: err };
  }

  if (!Number(amountHuman) || Number(amountHuman) <= 0) {
    const err = "Amount must be greater than zero.";
    console.error("[NEXUS P2P] ❌", err);
    return { success: false, error: err };
  }

  if (!NEXUS_TOKEN_ADDRESS || !ethers.isAddress(NEXUS_TOKEN_ADDRESS)) {
    const err = "NEXT_PUBLIC_NEXUS_TOKEN_ADDRESS is not set or invalid.";
    console.error("[NEXUS P2P] ❌", err);
    return { success: false, error: err };
  }

  try {
    // ── Convert to 18-decimal wei ─────────────────────────────────────────
    const amountWei = ethers.parseUnits(String(amountHuman), 18);
    console.log("[NEXUS P2P] 💰 Amount (wei):", amountWei.toString());

    // ── Encode ERC-20 transfer calldata ───────────────────────────────────
    const calldata = encodeTransferCalldata(toAddress, amountWei);

    // ── Build the Transaction object (ERC-4337 format) ────────────────────
    const transaction = {
      to:   NEXUS_TOKEN_ADDRESS,   // target = NexusToken contract
      data: calldata,              // encoded transfer()
    };

    console.log("[NEXUS P2P] 🚀 Sending UserOperation via Biconomy AA...");
    console.log("[NEXUS P2P] ⛽ Gas Mode: SPONSORED (Paymaster key active)");

    // ── Submit UserOperation with Paymaster sponsorship ───────────────────
    const userOpResponse = await smartAccount.sendTransaction(transaction, {
      paymasterServiceData: {
        mode: PaymasterMode.SPONSORED,
      },
    });

    console.log("[NEXUS P2P] ✅ UserOp Hash :", userOpResponse.userOpHash);

    // ── Wait for on-chain receipt ─────────────────────────────────────────
    const { receipt } = await userOpResponse.wait();
    const txHash      = receipt.transactionHash;

    console.log("[NEXUS P2P] ✅ Transaction Hash:", txHash);
    console.log("[NEXUS P2P] 🎉 Gasless transfer complete! Zero gas paid by user.");
    console.log("────────────────────────────────────────────");

    return {
      success:    true,
      txHash,
      userOpHash: userOpResponse.userOpHash,
    };

  } catch (err) {
    const message =
      err?.message ?? err?.reason ?? "Unknown Biconomy transfer error.";
    console.error("[NEXUS P2P] ❌ Transfer failed:", message, err);
    return { success: false, error: message };
  }
}

// ─── Step 3: Smart Account Factory ───────────────────────────────────────────
/**
 * createBiconomySmartAccount
 *
 * Creates and returns a BiconomySmartAccountV2 from an ethers.js signer.
 * Call this once when the user connects their wallet, then pass the result
 * to sendGaslessTransfer.
 *
 * @param {ethers.Signer} signer   Connected ethers.js v6 signer
 * @param {number}        chainId  Target chain ID (e.g. 84532 = Base Sepolia)
 * @returns {Promise<import("@biconomy/account").BiconomySmartAccountV2>}
 */
export async function createBiconomySmartAccount(signer, chainId = 84532) {
  if (!PAYMASTER_KEY) {
    throw new Error(
      "NEXT_PUBLIC_BICONOMY_PAYMASTER_KEY is not set. " +
      "Add it to your .env file."
    );
  }

  console.log("[NEXUS P2P] 🔑 Initialising Biconomy SmartAccount...");
  console.log("[NEXUS P2P]    Chain ID:", chainId);

  const smartAccount = await createSmartAccountClient({
    signer,
    chainId,
    biconomyPaymasterApiKey: PAYMASTER_KEY,
    bundlerUrl: `https://bundler.biconomy.io/api/v2/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`,
  });

  const address = await smartAccount.getAccountAddress();
  console.log("[NEXUS P2P] ✔ SmartAccount address:", address);

  return smartAccount;
}
