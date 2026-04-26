-- ============================================================
-- FestPass Supabase Seed Data
-- Run AFTER schema.sql. Matches the static data shown in the HTML pages.
-- ============================================================

-- 1. Organizer
INSERT INTO organizers (id, email, name, wallet_addr)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'organizer@festpass.xyz',
  'FestPass Organizer',
  '0xORGANIZER1234567890ABCDEF1234567890'
) ON CONFLICT DO NOTHING;

-- 2. Fests
INSERT INTO fests (id, organizer_id, name, location, start_date, end_date, status)
VALUES
  ('f0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'Neon Nights Music Festival', 'Austin, TX',
   '2024-10-12', '2024-10-14', 'live'),
  ('f0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'Winter Brew Fest 2024', 'Denver, CO',
   '2024-12-05', '2024-12-07', 'upcoming'),
  ('f0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'Summer Solstice', 'Miami, FL',
   '2024-06-20', '2024-06-22', 'ended'),
  ('f0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'TechHouse Fest', 'San Francisco, CA',
   '2024-09-01', '2024-09-03', 'ended')
ON CONFLICT DO NOTHING;

-- 3. Merchants
INSERT INTO merchants (id, fest_id, name, category, wallet_addr)
VALUES
  ('m0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Burger Bros',       'Food & Bev',    '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'),
  ('m0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'Merch Tent A',      'Merchandise',   '0x8B3a350cf5c34c9194ca85829a2df0ec3153be0'),
  ('m0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'VIP Lounge Bar',    'Food & Bev',    '0x9F213c5dB81a81E0e47F6d8ba5f4F0e5dF3D100'),
  ('m0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'Neon Burger Stand', 'Food & Bev',    '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B'),
  ('m0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001', 'Bite Me Burger',    'Food & Bev',    '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'),
  ('m0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001', 'Neon Threads',      'Merchandise',   '0x8B3a350cf5c34c9194ca85829a2df0ec3153be0'),
  ('m0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000003', 'Thirst Trap',       'Food & Bev',    '0x9F213c5dB81a81E0e47F6d8ba5f4F0e5dF3D100'),
  ('m0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000004', 'Cyber Merch Tent',  'Merchandise',   '0xDEaDBEeF5678901234DEaDBEeF5678901234DEaD'),
  ('m0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000004', 'Main Stage Drinks', 'Food & Bev',    '0xBEEF90121234567890BEEF90121234567890BEEF'),
  ('m0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000001', 'Craft Beer Co',     'Food & Bev',    '0xCAFE34561234567890CAFE34561234567890CAFE')
ON CONFLICT DO NOTHING;

-- 4. Transactions
INSERT INTO transactions (fest_id, merchant_id, merchant_name, fest_name, student_wallet, amount, tx_hash, status, created_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001','m0000000-0000-0000-0000-000000000004','Neon Burger Stand','Neon Nights','0x7F2...8a9B',15.00,'0x9d3f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f','success',NOW()-INTERVAL '30 min'),
  ('f0000000-0000-0000-0000-000000000004','m0000000-0000-0000-0000-000000000008','Cyber Merch Tent', 'TechHouse',  '0x3A1...c4D2',45.00,'0x2b1e45c6d7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c','success',NOW()-INTERVAL '60 min'),
  ('f0000000-0000-0000-0000-000000000001','m0000000-0000-0000-0000-000000000003','VIP Lounge Bar',  'Neon Nights','0x9B4...1eF5',120.00,'0x5c48a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8','pending',NOW()-INTERVAL '90 min'),
  ('f0000000-0000-0000-0000-000000000001','m0000000-0000-0000-0000-000000000010','Craft Beer Co',   'Neon Nights','0x1C2...d5E4',8.00,'0x1a83c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0','failed',NOW()-INTERVAL '120 min'),
  ('f0000000-0000-0000-0000-000000000004','m0000000-0000-0000-0000-000000000009','Main Stage Drinks','TechHouse', '0x5D3...f6A1',22.50,'0x7e29b4a5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1','success',NOW()-INTERVAL '150 min')
ON CONFLICT DO NOTHING;
