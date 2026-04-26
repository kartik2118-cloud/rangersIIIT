-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  college TEXT,
  roll_number TEXT,
  password_hash TEXT NOT NULL,
  wallet_address TEXT,
  wallet_created BOOLEAN DEFAULT FALSE,
  balance NUMERIC DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  merchant_id TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  fest_id TEXT NOT NULL,
  fest_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  order_ref TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  status TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Since we use a custom backend to verify JWTs, the backend acts as an admin.
-- We do not need strict RLS policies for the public.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
