require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",   // required for OZ v5 Bytes.sol (mcopy opcode / EIP-5656)
    },
  },
  networks: {
    // ── Local ────────────────────────────────────────────────────────────────
    hardhat: {
      hardfork: "cancun",   // enables mcopy + transient storage opcodes locally
    },

    // ── Base Sepolia (testnet) ────────────────────────────────────────────────
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },

    // ── Base Mainnet ──────────────────────────────────────────────────────────
    base: {
      url: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    apiKey: {
      base:        process.env.BASESCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL:     "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
  paths: {
    sources:   "./src",       // solidity files in contracts/src/
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
