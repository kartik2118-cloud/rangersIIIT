/**
 * Per-student in-memory database.
 * In production: replace with Supabase / PostgreSQL + Row Level Security.
 *
 * Data isolation: every wallet and every transaction is keyed by userId.
 * A student can ONLY read/write their own data.
 */
import bcrypt from 'bcryptjs';
import { FESTS } from './store';
import type { Transaction } from './store';

// ── USER RECORD ──────────────────────────────────────────────────────────────
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  college: string;
  rollNumber: string;
  passwordHash: string;
  createdAt: string;
  // on-chain identity (simulated)
  walletAddress: string;
  balance: number;
}

// ── IN-MEMORY STORE ──────────────────────────────────────────────────────────
// userId → UserRecord
const users = new Map<string, UserRecord>();
// userId → transactions[]
const userTxs = new Map<string, Transaction[]>();
// userId → wallet created flag
const walletCreated = new Set<string>();

// ── HELPERS ──────────────────────────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function fakeWallet(email: string) {
  const hex = Buffer.from(email).toString('hex').slice(0, 8).toUpperCase();
  return `0x${hex}...${genId().slice(0, 4).toUpperCase()}`;
}

// Demo seed transactions for new users
function seedTxs(userId: string, festName: string): Transaction[] {
  const now = Date.now();
  return [
    {
      id: 'seed_' + userId + '_1',
      merchantId: 'mc-bytebites', merchantName: 'Byte Bites Café',
      festId: 'fest-techvista', festName,
      amount: 60, orderRef: 'ORD-SEED1', category: 'Food', icon: '🍔',
      status: 'success', txHash: '0xseed1abc...',
      timestamp: new Date(now - 7200000).toISOString(),
    },
    {
      id: 'seed_' + userId + '_2',
      merchantId: 'mc-ragakitchen', merchantName: 'Raga Kitchen',
      festId: 'fest-resonance', festName: 'Resonance',
      amount: 40, orderRef: 'ORD-SEED2', category: 'Food', icon: '☕',
      status: 'success', txHash: '0xseed2def...',
      timestamp: new Date(now - 86400000).toISOString(),
    },
  ];
}

// ── WALLET CREATED STATE ─────────────────────────────────────────────────────
export function isWalletCreated(userId: string): boolean {
  return walletCreated.has(userId);
}

export function setWalletCreated(userId: string): void {
  walletCreated.add(userId);
}

// ── CRUD ─────────────────────────────────────────────────────────────────────
export async function createUser(data: {
  name: string; email: string; college: string; rollNumber: string; password: string;
}): Promise<UserRecord | { error: string }> {
  // Check duplicate email
  for (const u of Array.from(users.values())) {
    if (u.email.toLowerCase() === data.email.toLowerCase()) return { error: 'Email already registered.' };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const id = genId();
  const user: UserRecord = {
    id,
    name: data.name,
    email: data.email.toLowerCase(),
    college: data.college,
    rollNumber: data.rollNumber,
    passwordHash,
    createdAt: new Date().toISOString(),
    walletAddress: fakeWallet(data.email),
    balance: 500, // welcome bonus FEST tokens
  };
  users.set(id, user);
  userTxs.set(id, seedTxs(id, 'TechVista 2026'));
  return user;
}

export async function verifyCredentials(
  email: string, password: string
): Promise<UserRecord | null> {
  for (const u of Array.from(users.values())) {
    if (u.email === email.toLowerCase()) {
      const ok = await bcrypt.compare(password, u.passwordHash);
      return ok ? u : null;
    }
  }
  return null;
}

export function getUserById(id: string): UserRecord | undefined {
  return users.get(id);
}

export function getUserWallet(userId: string) {
  const u = users.get(userId);
  if (!u) return null;
  return {
    address: u.walletAddress,
    balance: u.balance,
    studentName: u.name,
    college: u.college,
  };
}

export function getUserTxs(userId: string): Transaction[] {
  return [...(userTxs.get(userId) || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function processUserPayment(
  userId: string,
  params: { merchantId: string; festId: string; amount: number; orderRef: string }
): { success: boolean; txHash: string; newBalance: number; error?: string } {
  const user = users.get(userId);
  if (!user) return { success: false, txHash: '', newBalance: 0, error: 'User not found.' };
  if (user.balance < params.amount) return { success: false, txHash: '', newBalance: user.balance, error: 'Insufficient FEST balance.' };

  const fest = FESTS.find(f => f.id === params.festId);
  const merchant = fest?.merchants.find(m => m.id === params.merchantId);
  if (!fest || !merchant) return { success: false, txHash: '', newBalance: user.balance, error: 'Invalid fest or merchant.' };

  const txHash = '0x' + Math.random().toString(16).slice(2, 18);
  user.balance -= params.amount;

  const CAT_ICON: Record<string, string> = { Food: '🍔', Merch: '👕', Tickets: '🎟️', Games: '🎮' };
  const newTx: Transaction = {
    id: 'tx_' + Date.now(),
    merchantId: params.merchantId, merchantName: merchant.name,
    festId: params.festId, festName: fest.name,
    amount: params.amount, orderRef: params.orderRef,
    category: merchant.category,
    icon: CAT_ICON[merchant.category] ?? '🛒',
    status: 'success', txHash,
    timestamp: new Date().toISOString(),
  };

  const txList = userTxs.get(userId) || [];
  txList.unshift(newTx);
  userTxs.set(userId, txList);

  return { success: true, txHash, newBalance: user.balance };
}
