-- ============================================================
-- FestPass Supabase Schema
-- Run this entire file in the Supabase SQL Editor once.
-- ============================================================

-- 1. ORGANIZERS
CREATE TABLE IF NOT EXISTS organizers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  wallet_addr TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FESTS
CREATE TABLE IF NOT EXISTS fests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES organizers(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  location     TEXT,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  status       TEXT CHECK (status IN ('upcoming','live','ended')) DEFAULT 'upcoming',
  token_addr   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MERCHANTS
CREATE TABLE IF NOT EXISTS merchants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fest_id     UUID REFERENCES fests(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT CHECK (category IN ('Food & Bev','Merchandise','Services','Entertainment')),
  wallet_addr TEXT NOT NULL,
  joined_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fest_id        UUID REFERENCES fests(id),
  merchant_id    UUID REFERENCES merchants(id),
  merchant_name  TEXT,
  fest_name      TEXT,
  student_wallet TEXT NOT NULL,
  amount         NUMERIC(18,4) NOT NULL,
  tx_hash        TEXT UNIQUE NOT NULL,
  status         TEXT CHECK (status IN ('success','pending','failed')) DEFAULT 'pending',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ─────────────────────────────────────
ALTER TABLE organizers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Public read (tighten with Auth in production)
CREATE POLICY "public_read_organizers"     ON organizers    FOR SELECT USING (true);
CREATE POLICY "public_read_fests"          ON fests         FOR SELECT USING (true);
CREATE POLICY "public_insert_fests"        ON fests         FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_fests"        ON fests         FOR UPDATE USING (true);
CREATE POLICY "public_read_merchants"      ON merchants     FOR SELECT USING (true);
CREATE POLICY "public_insert_merchants"    ON merchants     FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_transactions"   ON transactions  FOR SELECT USING (true);
CREATE POLICY "public_insert_transactions" ON transactions  FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_transactions" ON transactions  FOR UPDATE USING (true);
