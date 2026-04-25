const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // ── 1. Deploy FEST Token ──────────────────────────────────────────────────
  const FESTToken = await ethers.getContractFactory("FESTToken");
  const festToken = await FESTToken.deploy(deployer.address);
  await festToken.waitForDeployment();
  console.log("FESTToken deployed to:", await festToken.getAddress());

  // ── 2. Deploy FestPass ────────────────────────────────────────────────────
  // SIGNER_ADDRESS = the backend hot-wallet that signs QR payment requests.
  // In production use a separate key stored in your backend .env.
  const signerAddress = process.env.SIGNER_ADDRESS || deployer.address;

  const FestPass = await ethers.getContractFactory("FestPass");
  const festPass = await FestPass.deploy(
    await festToken.getAddress(),
    signerAddress,
    deployer.address
  );
  await festPass.waitForDeployment();
  console.log("FestPass deployed to:", await festPass.getAddress());

  // ── 3. Register a sample vendor stall ────────────────────────────────────
  const stallId = ethers.encodeBytes32String("FOOD_STALL_A");
  const vendorWallet = deployer.address; // Replace with real vendor wallet

  await (await festPass.registerVendor(stallId, vendorWallet, "Food Stall A")).wait();
  console.log("Registered vendor: Food Stall A");

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n=== Deployment Summary ===");
  console.log("FEST_TOKEN_ADDRESS=", await festToken.getAddress());
  console.log("FEST_PASS_ADDRESS=", await festPass.getAddress());
  console.log("SIGNER_ADDRESS=", signerAddress);
}

main().catch((e) => { console.error(e); process.exit(1); });
