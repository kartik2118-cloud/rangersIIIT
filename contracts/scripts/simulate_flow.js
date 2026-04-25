/**
 * simulate_flow.js
 *
 * End-to-End simulation of the entire FestPass payment flow on a local
 * Hardhat network. No frontend needed — every layer is scripted.
 *
 * Run:
 *   npx hardhat run scripts/simulate_flow.js
 *
 * Layers simulated:
 *   🏛  ADMIN      — deploy contracts, mint tokens
 *   📱  ORGANIZER  — build the QR JSON payload
 *   🎓  STUDENT    — parse QR, approve, call payMerchant()
 *   🖥  BACKEND    — parse tx logs to prove PaymentReceived fired
 */

const { ethers } = require("hardhat");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DECIMALS   = 18n;
const toWei  = (n) => ethers.parseUnits(String(n), DECIMALS);
const toFEST = (w) => ethers.formatUnits(w, DECIMALS);
const sep    = () => console.log("\n" + "─".repeat(60));

async function main() {
  console.log("\n🚀  FestPass E2E Flow Simulation");
  console.log("=".repeat(60));

  // ══════════════════════════════════════════════════════════════
  // STEP 1 — Get signers
  // ══════════════════════════════════════════════════════════════
  sep();
  console.log("STEP 1 — Wallets");

  const [admin, student, merchant] = await ethers.getSigners();

  console.log(`  Admin    : ${admin.address}`);
  console.log(`  Student  : ${student.address}`);
  console.log(`  Merchant : ${merchant.address}`);
  console.log("✅  Wallets ready");

  // ══════════════════════════════════════════════════════════════
  // STEP 2 — Deploy FESTToken
  // ══════════════════════════════════════════════════════════════
  sep();
  console.log("STEP 2 — Deploy FESTToken");

  const FESTToken = await ethers.getContractFactory("FESTToken", admin);
  const festToken = await FESTToken.deploy(admin.address);
  await festToken.waitForDeployment();
  const festTokenAddr = await festToken.getAddress();

  console.log(`  FESTToken deployed : ${festTokenAddr}`);
  console.log("✅  FESTToken deployed");

  // ══════════════════════════════════════════════════════════════
  // STEP 3 — Deploy FestPay
  // ══════════════════════════════════════════════════════════════
  sep();
  console.log("STEP 3 — Deploy FestPay");

  const FestPay = await ethers.getContractFactory("FestPay", admin);
  const festPay = await FestPay.deploy(festTokenAddr);
  await festPay.waitForDeployment();
  const festPayAddr = await festPay.getAddress();

  console.log(`  FestPay deployed   : ${festPayAddr}`);
  console.log("✅  FestPay deployed");

  // ══════════════════════════════════════════════════════════════
  // STEP 4 — Mint 500 FEST to student
  // ══════════════════════════════════════════════════════════════
  sep();
  console.log("STEP 4 — Mint 500 FEST → Student");

  // Admin adds themselves as minter (already owner, but showing the flow)
  await (await festToken.connect(admin).addMinter(admin.address)).wait();
  await (await festToken.connect(admin).mint(student.address, toWei(500))).wait();

  const studentBalance = await festToken.balanceOf(student.address);
  console.log(`  Student FEST balance : ${toFEST(studentBalance)} FEST`);

  if (studentBalance !== toWei(500)) {
    throw new Error("❌ Mint failed: balance mismatch");
  }
  console.log("✅  500 FEST minted to student");

  // ══════════════════════════════════════════════════════════════
  // STEP 5 — Student approves FestPay to spend 50 FEST
  // ══════════════════════════════════════════════════════════════
  sep();
  console.log("STEP 5 — Student approves FestPay (50 FEST)");

  const PAYMENT_AMOUNT = 50;
  await (
    await festToken
      .connect(student)
      .approve(festPayAddr, toWei(PAYMENT_AMOUNT))
  ).wait();

  const allowance = await festToken.allowance(student.address, festPayAddr);
  console.log(`  Allowance set : ${toFEST(allowance)} FEST`);

  if (allowance !== toWei(PAYMENT_AMOUNT)) {
    throw new Error("❌ Approve failed: allowance mismatch");
  }
  console.log("✅  Approval confirmed");

  // ══════════════════════════════════════════════════════════════
  // STEP 6 — SIMULATE ORGANIZER: Build QR JSON payload
  // ══════════════════════════════════════════════════════════════
  sep();
  console.log("STEP 6 — [ORGANIZER] Generate QR payload");

  const FEST_ID   = 1;
  const CHAIN_ID  = 31337;   // Hardhat local network

  const qrPayload = {
    action:   "pay_merchant",
    merchant: merchant.address,
    festId:   String(FEST_ID),
    amount:   String(PAYMENT_AMOUNT),
    chainId:  CHAIN_ID,
  };

  const qrString = JSON.stringify(qrPayload);

  console.log("\n  📷  QR Code would encode:");
  console.log("  " + qrString);
  console.log("\n✅  QR payload generated");

  // ══════════════════════════════════════════════════════════════
  // STEP 7 — SIMULATE STUDENT APP: Parse QR + call payMerchant()
  // ══════════════════════════════════════════════════════════════
  sep();
  console.log("STEP 7 — [STUDENT APP] Parse QR → call payMerchant()");

  // Simulate what QRScanner.jsx + executePayment.js do
  const parsed = JSON.parse(qrString);

  if (parsed.action !== "pay_merchant") {
    throw new Error("❌ Invalid QR action");
  }

  console.log(`  Parsed merchant : ${parsed.merchant}`);
  console.log(`  Parsed festId   : ${parsed.festId}`);
  console.log(`  Parsed amount   : ${parsed.amount} FEST`);

  const studentBalanceBefore  = await festToken.balanceOf(student.address);
  const merchantBalanceBefore = await festToken.balanceOf(merchant.address);
  console.log(`\n  Merchant balance before : ${toFEST(merchantBalanceBefore)} FEST`);

  // Student calls payMerchant using the student signer
  const festPayAsStudent = festPay.connect(student);
  const tx = await festPayAsStudent.payMerchant(
    BigInt(parsed.festId),
    parsed.merchant,
    toWei(Number(parsed.amount))
  );
  const receipt = await tx.wait();

  console.log(`\n  Tx hash   : ${receipt.hash}`);
  console.log(`  Gas used  : ${receipt.gasUsed.toString()}`);
  console.log("✅  payMerchant() executed");

  // ══════════════════════════════════════════════════════════════
  // STEP 8 — SIMULATE BACKEND: Parse PaymentReceived from logs
  // ══════════════════════════════════════════════════════════════
  sep();
  console.log("STEP 8 — [BACKEND] Parse PaymentReceived event from logs");

  // The backend listens via festPay.on("PaymentReceived", ...) in production.
  // Here we parse the receipt logs directly — identical data.
  const iface = festPay.interface;
  const eventFragment = iface.getEvent("PaymentReceived");

  let eventFound = false;

  for (const log of receipt.logs) {
    try {
      const decoded = iface.decodeEventLog(eventFragment, log.data, log.topics);
      const parsedEvent = {
        festId:     decoded.festId.toString(),
        merchant:   decoded.merchant.toLowerCase(),
        student:    decoded.student.toLowerCase(),
        amountWei:  decoded.amount.toString(),
        amountFest: toFEST(decoded.amount),
      };

      console.log("\n  📡  PaymentReceived event decoded:");
      console.log(`    festId     : ${parsedEvent.festId}`);
      console.log(`    merchant   : ${parsedEvent.merchant}`);
      console.log(`    student    : ${parsedEvent.student}`);
      console.log(`    amount     : ${parsedEvent.amountFest} FEST`);
      console.log(`    amountWei  : ${parsedEvent.amountWei}`);

      // Assertions
      if (parsedEvent.festId   !== String(FEST_ID))                   throw new Error("festId mismatch");
      if (parsedEvent.merchant !== merchant.address.toLowerCase())    throw new Error("merchant mismatch");
      if (parsedEvent.student  !== student.address.toLowerCase())     throw new Error("student mismatch");
      if (parsedEvent.amountFest !== String(PAYMENT_AMOUNT) + ".0")  throw new Error("amount mismatch");

      eventFound = true;
      console.log("\n✅  Event data verified — all fields match");
      break;
    } catch (decodeErr) {
      // Log wasn't from our event — skip
    }
  }

  if (!eventFound) {
    throw new Error("❌ PaymentReceived event NOT found in transaction logs");
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 9 — Verify on-chain balances
  // ══════════════════════════════════════════════════════════════
  sep();
  console.log("STEP 9 — Verify final on-chain balances");

  const studentBalanceAfter  = await festToken.balanceOf(student.address);
  const merchantBalanceAfter = await festToken.balanceOf(merchant.address);

  console.log(`  Student  balance : ${toFEST(studentBalanceBefore)}  → ${toFEST(studentBalanceAfter)} FEST  (spent ${PAYMENT_AMOUNT})`);
  console.log(`  Merchant balance : ${toFEST(merchantBalanceBefore)} → ${toFEST(merchantBalanceAfter)} FEST  (received ${PAYMENT_AMOUNT})`);

  // Final assertions
  if (studentBalanceAfter !== toWei(500) - toWei(PAYMENT_AMOUNT)) {
    throw new Error("❌ Student balance incorrect after payment");
  }
  if (merchantBalanceAfter !== merchantBalanceBefore + toWei(PAYMENT_AMOUNT)) {
    throw new Error("❌ Merchant balance incorrect after payment");
  }

  console.log("✅  Balances correct");

  // ══════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════
  console.log("\n" + "=".repeat(60));
  console.log("🎉  ALL STEPS PASSED — FestPass E2E flow verified!");
  console.log("=".repeat(60));
  console.log(`
  Summary
  ────────────────────────────────────────
  FESTToken   : ${festTokenAddr}
  FestPay     : ${festPayAddr}
  Fest ID     : ${FEST_ID}
  Amount paid : ${PAYMENT_AMOUNT} FEST
  Tx hash     : ${receipt.hash}
  Gas used    : ${receipt.gasUsed.toString()} units
  `);
}

main().catch((err) => {
  console.error("\n❌  Simulation failed:", err.message);
  process.exitCode = 1;
});
