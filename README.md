<div align="center">
  <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1200&h=400" alt="FestPass Banner" />

  <h1>🎟️ FestPass</h1>
  <p><strong>One Wallet, Every Fest. A unified decentralized token economy for campus festivals.</strong></p>

  <p>
    <a href="#features">Features</a> • 
    <a href="#tech-stack">Tech Stack</a> • 
    <a href="#getting-started">Getting Started</a> • 
    <a href="#smart-contracts">Smart Contracts</a>
  </p>
</div>

---

## 📖 Overview

**FestPass** solves the fragmented payment experience across college festivals. Instead of buying physical coupons or dealing with different payment gateways for every stall, students use a single digital wallet powered by the **FEST token**. 

Merchants get instant settlements, organizers get real-time analytics, and students get a seamless, cashless experience.

<div align="center">
  <img src="https://images.unsplash.com/photo-1616077168712-fc6c788db4af?auto=format&fit=crop&q=80&w=800" alt="App UI Mockup" width="400" style="border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />
</div>

## ✨ Features

- **📱 Premium Mobile-First UI**: A sleek, warm neutral minimal design built for fast transactions on the go.
- **👛 Universal Student Wallet**: One FEST token balance usable across all participating campus festivals.
- **⚡ Gasless & Instant Payments**: Seamless 1-click payments to merchants and food stalls.
- **🔒 Secure Authentication**: JWT-based stateless authentication with Edge compatibility.
- **📊 Real-time History**: View past transactions, filter by festival, and track spending.
- **🔗 Blockchain Ready**: Built with a clear abstraction layer ready to connect to Base Sepolia via viem/wagmi.

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.0 (App Router)
- **UI Library**: React 19
- **Styling**: Vanilla CSS (CSS Variables, responsive, mobile-first)
- **Authentication**: `jose` (JWT), `bcryptjs`
- **Database**: In-memory simulation (ready to swap with Supabase/PostgreSQL)
- **Smart Contracts (Planned)**: Solidity (Base Sepolia)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/kartik2118-cloud/rangersIIIT.git
cd festpass
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Ensure you set a secret for JWT signing in your `.env`:
```env
JWT_SECRET=your_super_secret_jwt_key_here
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```text
festpass/
├── app/                  # Next.js App Router pages & API routes
│   ├── api/              # API endpoints (auth, wallet, fests, transactions)
│   ├── history/          # Transaction history page
│   ├── login/            # Authentication
│   ├── pay/              # Payment interface
│   ├── profile/          # User profile and stats
│   ├── wallet/           # Main wallet dashboard
│   ├── globals.css       # Core design system and global styles
│   └── layout.tsx        # Root layout
├── components/           # Reusable React components (Nav, etc.)
├── contracts/            # Solidity smart contracts for on-chain migration
├── lib/                  # Core logic
│   ├── auth.ts           # JWT authentication helpers
│   ├── db.ts             # In-memory database & seeded state
│   └── store.ts          # Unified TypeScript interfaces
└── middleware.ts         # Route protection and Edge middleware
```

## 📜 Smart Contracts Architecture (Base Sepolia)

While the current MVP uses an in-memory database simulation for immediate testing, the architecture is designed to seamlessly migrate to on-chain execution on **Base Sepolia**. Reference contracts are available in the `/contracts` directory:

1. **`FestToken.sol`**: An ERC20 token serving as the unified currency.
2. **`FestRegistry.sol`**: A registry tracking verified festivals and registered merchants.
3. **`FestPay.sol`**: The core payment gateway handling gasless, secure transfers between students and merchants.

---
*Designed and built for the ultimate campus festival experience.*
