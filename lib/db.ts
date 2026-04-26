import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { FESTS } from './store';
import type { Transaction } from './store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseServiceKey || 'anon', {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ── USER RECORD ──────────────────────────────────────────────────────────────
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  college: string;
  rollNumber: string;
  passwordHash: string;
  walletAddress: string;
  walletCreated: boolean;
  balance: number;
  createdAt: string;
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function fakeWallet(email: string) {
  const hex = Buffer.from(email).toString('hex').slice(0, 8).toUpperCase();
  return `0x${hex}...${genId().slice(0, 4).toUpperCase()}`;
}

async function seedTxs(userId: string, festName: string) {
  const now = Date.now();
  const txs = [
    {
      id: 'seed_' + userId + '_1',
      user_id: userId,
      merchant_id: 'mc-bytebites', merchant_name: 'Byte Bites Café',
      fest_id: 'fest-techvista', fest_name: festName,
      amount: 60, order_ref: 'ORD-SEED1', category: 'Food', icon: '🍔',
      status: 'success', tx_hash: '0xseed1abc...',
      timestamp: new Date(now - 7200000).toISOString(),
    },
    {
      id: 'seed_' + userId + '_2',
      user_id: userId,
      merchant_id: 'mc-ragakitchen', merchant_name: 'Raga Kitchen',
      fest_id: 'fest-resonance', fest_name: 'Resonance',
      amount: 40, order_ref: 'ORD-SEED2', category: 'Food', icon: '☕',
      status: 'success', tx_hash: '0xseed2def...',
      timestamp: new Date(now - 86400000).toISOString(),
    },
  ];
  await supabase.from('transactions').insert(txs);
}

function mapUserRow(row: any): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    college: row.college,
    rollNumber: row.roll_number,
    passwordHash: row.password_hash,
    walletAddress: row.wallet_address,
    walletCreated: row.wallet_created,
    balance: Number(row.balance),
    createdAt: row.created_at,
  };
}

// ── WALLET CREATED STATE ─────────────────────────────────────────────────────
export async function setWalletCreated(userId: string): Promise<void> {
  await supabase.from('users').update({ wallet_created: true }).eq('id', userId);
}

// ── CRUD ─────────────────────────────────────────────────────────────────────
export async function createUser(data: {
  name: string; email: string; college: string; rollNumber: string; password: string;
}): Promise<UserRecord | { error: string }> {
  
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', data.email.toLowerCase()).single();
  if (existingUser) return { error: 'Email already registered.' };

  const passwordHash = await bcrypt.hash(data.password, 10);
  const id = genId();
  
  const newUser = {
    id,
    name: data.name,
    email: data.email.toLowerCase(),
    college: data.college,
    roll_number: data.rollNumber,
    password_hash: passwordHash,
    wallet_address: fakeWallet(data.email),
    wallet_created: false,
    balance: 500,
  };

  const { data: row, error } = await supabase.from('users').insert([newUser]).select().single();
  if (error) return { error: error.message };

  await seedTxs(id, 'TechVista 2026');
  return mapUserRow(row);
}

export async function verifyCredentials(
  email: string, password: string
): Promise<UserRecord | null> {
  const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single();
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? mapUserRow(user) : null;
}

export async function getUserById(id: string): Promise<UserRecord | undefined> {
  const { data: user } = await supabase.from('users').select('*').eq('id', id).single();
  return user ? mapUserRow(user) : undefined;
}

export async function updateProfile(userId: string, data: { college: string; rollNumber: string }): Promise<boolean> {
  const { error } = await supabase.from('users').update({
    college: data.college,
    roll_number: data.rollNumber
  }).eq('id', userId);
  return !error;
}

export async function findOrCreateFirebaseUser(
  email: string, name: string, uid: string
): Promise<UserRecord> {
  const lowerEmail = email.toLowerCase();
  const { data: existingUser } = await supabase.from('users').select('*').eq('email', lowerEmail).single();
  
  if (existingUser) {
    return mapUserRow(existingUser);
  }

  const id = genId();
  const newUser = {
    id,
    name: name || 'Student',
    email: lowerEmail,
    college: 'Firebase Auth',
    roll_number: uid.slice(0, 8),
    password_hash: 'firebase_auth',
    wallet_address: fakeWallet(lowerEmail),
    wallet_created: false,
    balance: 500,
  };

  const { data: row } = await supabase.from('users').insert([newUser]).select().single();
  await seedTxs(id, 'TechVista 2026');
  return row ? mapUserRow(row) : mapUserRow(newUser);
}

export async function getUserWallet(userId: string) {
  const { data: user } = await supabase.from('users').select('wallet_address, balance, name, college').eq('id', userId).single();
  if (!user) return null;
  return {
    address: user.wallet_address,
    balance: Number(user.balance),
    studentName: user.name,
    college: user.college,
  };
}

export async function getUserTxs(userId: string): Promise<Transaction[]> {
  const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
  if (!txs) return [];
  
  return txs.map(tx => ({
    id: tx.id,
    merchantId: tx.merchant_id,
    merchantName: tx.merchant_name,
    festId: tx.fest_id,
    festName: tx.fest_name,
    amount: Number(tx.amount),
    orderRef: tx.order_ref,
    category: tx.category,
    icon: tx.icon,
    status: tx.status,
    txHash: tx.tx_hash,
    timestamp: tx.timestamp,
  }));
}

export async function processUserPayment(
  userId: string,
  params: { merchantId: string; festId: string; amount: number; orderRef: string }
): Promise<{ success: boolean; txHash: string; newBalance: number; error?: string }> {
  
  const { data: user, error: userErr } = await supabase.from('users').select('balance').eq('id', userId).single();
  if (userErr || !user) return { success: false, txHash: '', newBalance: 0, error: 'User not found.' };
  
  const currentBalance = Number(user.balance);
  if (currentBalance < params.amount) return { success: false, txHash: '', newBalance: currentBalance, error: 'Insufficient FEST balance.' };

  const fest = FESTS.find(f => f.id === params.festId);
  const merchant = fest?.merchants.find(m => m.id === params.merchantId);
  if (!fest || !merchant) return { success: false, txHash: '', newBalance: currentBalance, error: 'Invalid fest or merchant.' };

  const txHash = '0x' + Math.random().toString(16).slice(2, 18);
  const newBalance = currentBalance - params.amount;

  const { error: updateErr } = await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
  if (updateErr) return { success: false, txHash: '', newBalance: currentBalance, error: 'Failed to update balance.' };

  const CAT_ICON: Record<string, string> = { Food: '🍔', Merch: '👕', Tickets: '🎟️', Games: '🎮' };
  
  const newTx = {
    id: 'tx_' + Date.now(),
    user_id: userId,
    merchant_id: params.merchantId,
    merchant_name: merchant.name,
    fest_id: params.festId,
    fest_name: fest.name,
    amount: params.amount,
    order_ref: params.orderRef,
    category: merchant.category,
    icon: CAT_ICON[merchant.category] ?? '🛒',
    status: 'success',
    tx_hash: txHash,
  };

  await supabase.from('transactions').insert([newTx]);

  return { success: true, txHash, newBalance };
}
