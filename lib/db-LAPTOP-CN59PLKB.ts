/**
 * Per-student in-memory database.
 * In production: replace with Supabase / PostgreSQL + Row Level Security.
 *
 * Data isolation: every wallet and transaction is keyed by userId.
 * A student can ONLY read/write their own data.
 */
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { FESTS, CATEGORY_ICONS } from './store';
import type { Wallet, Transaction } from './store';

// ── User record ─────────────────────────────────────────────────────────────

interface UserRecord {
  id: string;
  name: string;
  email: string;
  college: string;
  rollNumber: string;
  passwordHash: string;
  walletCreated: boolean;
  wallet: Wallet;
  transactions: Transaction[];
}

const users = new Map<string, UserRecord>();

// ── Seed transactions for new users ─────────────────────────────────────────

function seedTransactions(studentName: string): Transaction[] {
  const now = Date.now();
  const h = 3600000;
  return [
    {
      id: uuid(), festId: 'fest-techvista', festName: 'TechVista 2026',
      merchantId: 'mc-bytebites', merchant: 'Byte Bites Café',
      amount: 45, orderRef: 'ORD-TV-001', category: 'Food', icon: CATEGORY_ICONS.Food,
      status: 'success', txHash: '0x7a1b...3f2e',
      timestamp: new Date(now - 2 * h).toISOString(),
    },
    {
      id: uuid(), festId: 'fest-techvista', festName: 'TechVista 2026',
      merchantId: 'mc-devswag', merchant: 'DevSwag Store',
      amount: 120, orderRef: 'ORD-TV-002', category: 'Merch', icon: CATEGORY_ICONS.Merch,
      status: 'success', txHash: '0x8b2c...4g3f',
      timestamp: new Date(now - 5 * h).toISOString(),
    },
    {
      id: uuid(), festId: 'fest-resonance', festName: 'Resonance',
      merchantId: 'mc-ragakitchen', merchant: 'Raga Kitchen',
      amount: 60, orderRef: 'ORD-RS-001', category: 'Food', icon: CATEGORY_ICONS.Food,
      status: 'success', txHash: '0x9c3d...5h4g',
      timestamp: new Date(now - 24 * h).toISOString(),
    },
    {
      id: uuid(), festId: 'fest-resonance', festName: 'Resonance',
      merchantId: 'mc-culturethreads', merchant: 'Culture Threads',
      amount: 80, orderRef: 'ORD-RS-002', category: 'Merch', icon: CATEGORY_ICONS.Merch,
      status: 'success', txHash: '0xad4e...6i5h',
      timestamp: new Date(now - 26 * h).toISOString(),
    },
    {
      id: uuid(), festId: 'fest-blitz', festName: 'Blitz Arena',
      merchantId: 'mc-powerbowl', merchant: 'Power Bowl',
      amount: 35, orderRef: 'ORD-BA-001', category: 'Food', icon: CATEGORY_ICONS.Food,
      status: 'success', txHash: '0xbe5f...7j6i',
      timestamp: new Date(now - 48 * h).toISOString(),
    },
    {
      id: uuid(), festId: 'fest-blitz', festName: 'Blitz Arena',
      merchantId: 'mc-arcadezone', merchant: 'Arena Arcade',
      amount: 50, orderRef: 'ORD-BA-002', category: 'Games', icon: CATEGORY_ICONS.Games,
      status: 'success', txHash: '0xcf6g...8k7j',
      timestamp: new Date(now - 50 * h).toISOString(),
    },
    {
      id: uuid(), festId: 'fest-techvista', festName: 'TechVista 2026',
      merchantId: 'mc-bytebites', merchant: 'Byte Bites Café',
      amount: 30, orderRef: 'ORD-TV-003', category: 'Food', icon: CATEGORY_ICONS.Food,
      status: 'success', txHash: '0xdg7h...9l8k',
      timestamp: new Date(now - 72 * h).toISOString(),
    },
    {
      id: uuid(), festId: 'fest-resonance', festName: 'Resonance',
      merchantId: 'mc-ragakitchen', merchant: 'Raga Kitchen',
      amount: 40, orderRef: 'ORD-RS-003', category: 'Food', icon: CATEGORY_ICONS.Food,
      status: 'success', txHash: '0xeh8i...am9l',
      timestamp: new Date(now - 96 * h).toISOString(),
    },
    {
      id: uuid(), festId: 'fest-blitz', festName: 'Blitz Arena',
      merchantId: 'mc-arcadezone', merchant: 'Arena Arcade',
      amount: 40, orderRef: 'ORD-BA-003', category: 'Games', icon: CATEGORY_ICONS.Games,
      status: 'success', txHash: '0xfi9j...bnam',
      timestamp: new Date(now - 100 * h).toISOString(),
    },
  ];
}

function generateWalletAddress(): string {
  const hex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return '0x' + hex;
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export function createUser(data: {
  name: string; email: string; college: string; rollNumber: string; password: string;
}): { user: UserRecord } | { error: string } {
  // Check for duplicate email
  for (const u of Array.from(users.values())) {
    if (u.email.toLowerCase() === data.email.toLowerCase()) return { error: 'Email already registered.' };
  }

  const id = uuid();
  const seedTxs = seedTransactions(data.name);
  const totalSpent = seedTxs.reduce((s, t) => s + t.amount, 0);

  const user: UserRecord = {
    id,
    name: data.name,
    email: data.email,
    college: data.college,
    rollNumber: data.rollNumber,
    passwordHash: bcrypt.hashSync(data.password, 10),
    walletCreated: false,
    wallet: {
      address: generateWalletAddress(),
      balance: 500 - totalSpent,
      studentName: data.name,
      college: data.college,
    },
    transactions: seedTxs,
  };

  users.set(id, user);
  return { user };
}

export async function verifyCredentials(email: string, password: string): Promise<UserRecord | null> {
  for (const u of Array.from(users.values())) {
    if (u.email.toLowerCase() === email.toLowerCase()) {
      const ok = await bcrypt.compare(password, u.passwordHash);
      return ok ? u : null;
    }
  }
  return null;
}

export function getUserById(id: string): UserRecord | undefined {
  return users.get(id);
}

export function getUserWallet(userId: string): Wallet | null {
  const u = users.get(userId);
  return u ? u.wallet : null;
}

export function getUserTxs(userId: string): Transaction[] {
  const u = users.get(userId);
  return u ? u.transactions : [];
}

export function setWalletCreated(userId: string): boolean {
  const u = users.get(userId);
  if (!u) return false;
  u.walletCreated = true;
  return true;
}

export function isWalletCreated(userId: string): boolean {
  const u = users.get(userId);
  return u ? u.walletCreated : false;
}

// ── Payment (mirrors FestPay.sol → pay) ─────────────────────────────────────

export function processUserPayment(
  userId: string,
  params: { festId: string; merchantId: string; amount: number; orderRef: string }
): { success: boolean; txHash: string; newBalance: number; error?: string } {
  const user = users.get(userId);
  if (!user) return { success: false, txHash: '', newBalance: 0, error: 'User not found.' };

  if (user.wallet.balance < params.amount) {
    return { success: false, txHash: '', newBalance: user.wallet.balance, error: 'Insufficient FEST balance.' };
  }

  const fest = FESTS.find(f => f.id === params.festId);
  const merchant = fest?.merchants.find(m => m.id === params.merchantId);
  if (!fest || !merchant) return { success: false, txHash: '', newBalance: user.wallet.balance, error: 'Invalid fest or merchant.' };

  // Deduct balance
  user.wallet.balance -= params.amount;

  // Generate tx hash
  const txHash = '0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '...';

  // Record transaction (mirrors PaymentProcessed event)
  const tx: Transaction = {
    id: uuid(),
    festId: fest.id,
    festName: fest.name,
    merchantId: merchant.id,
    merchant: merchant.name,
    amount: params.amount,
    orderRef: params.orderRef,
    category: merchant.category,
    icon: (CATEGORY_ICONS as Record<string, string>)[merchant.category] ?? '◉',
    status: 'success',
    txHash,
    timestamp: new Date().toISOString(),
  };

  user.transactions.unshift(tx);

  return { success: true, txHash, newBalance: user.wallet.balance };
}
