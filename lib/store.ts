// ── Types ────────────────────────────────────────────────────────────────────

export interface Merchant {
  id: string;
  name: string;
  category: 'Food' | 'Merch' | 'Games' | 'Tickets';
  wallet: string;
}

export interface Fest {
  id: string;
  name: string;
  category: string;
  campus: string;
  dates: string;
  status: 'active' | 'upcoming' | 'ended';
  organizer: string;
  merchants: Merchant[];
}

export interface Wallet {
  address: string;
  balance: number;
  studentName: string;
  college: string;
}

export interface Transaction {
  id: string;
  festId: string;
  festName: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  orderRef: string;
  category: string;
  icon: string;
  status: 'success' | 'pending' | 'failed';
  txHash: string;
  timestamp: string;
}

// ── Fest + Merchant Registry (mirrors FestRegistry.sol) ─────────────────────

export const FESTS: Fest[] = [
  {
    id: 'fest-techvista',
    name: 'TechVista 2026',
    category: 'Tech Fest',
    campus: 'IIT Delhi',
    dates: 'Apr 28 – Apr 30',
    status: 'active',
    organizer: '0xOrg1...aB12',
    merchants: [
      { id: 'mc-bytebites', name: 'Byte Bites Café', category: 'Food', wallet: '0xMc1...f1A0' },
      { id: 'mc-devswag', name: 'DevSwag Store', category: 'Merch', wallet: '0xMc2...e2B1' },
    ],
  },
  {
    id: 'fest-resonance',
    name: 'Resonance',
    category: 'Cultural Fest',
    campus: 'IIIT Hyderabad',
    dates: 'May 2 – May 4',
    status: 'active',
    organizer: '0xOrg2...cD34',
    merchants: [
      { id: 'mc-ragakitchen', name: 'Raga Kitchen', category: 'Food', wallet: '0xMc3...d3C2' },
      { id: 'mc-culturethreads', name: 'Culture Threads', category: 'Merch', wallet: '0xMc4...c4D3' },
    ],
  },
  {
    id: 'fest-blitz',
    name: 'Blitz Arena',
    category: 'Sports Fest',
    campus: 'NIT Trichy',
    dates: 'May 8 – May 10',
    status: 'active',
    organizer: '0xOrg3...eF56',
    merchants: [
      { id: 'mc-powerbowl', name: 'Power Bowl', category: 'Food', wallet: '0xMc5...b5E4' },
      { id: 'mc-arcadezone', name: 'Arena Arcade', category: 'Games', wallet: '0xMc6...a6F5' },
    ],
  },
];

// ── Icon map for categories ─────────────────────────────────────────────────

export const CATEGORY_ICONS: Record<string, string> = {
  Food: '◉',
  Merch: '◎',
  Games: '◈',
  Tickets: '◇',
};

// ── QR Samples (mock payloads) ──────────────────────────────────────────────

export interface QRPayload {
  id: string;
  label: string;
  festId: string;
  merchantId: string;
  amount: number;
}

export const SAMPLE_QR: QRPayload[] = [
  { id: 'qr1', label: 'Byte Bites — Combo Meal', festId: 'fest-techvista', merchantId: 'mc-bytebites', amount: 45 },
  { id: 'qr2', label: 'DevSwag — T-Shirt', festId: 'fest-techvista', merchantId: 'mc-devswag', amount: 120 },
  { id: 'qr3', label: 'Raga Kitchen — Thali', festId: 'fest-resonance', merchantId: 'mc-ragakitchen', amount: 60 },
  { id: 'qr4', label: 'Culture Threads — Tote Bag', festId: 'fest-resonance', merchantId: 'mc-culturethreads', amount: 80 },
  { id: 'qr5', label: 'Power Bowl — Energy Pack', festId: 'fest-blitz', merchantId: 'mc-powerbowl', amount: 35 },
  { id: 'qr6', label: 'Arena Arcade — 5 Rounds', festId: 'fest-blitz', merchantId: 'mc-arcadezone', amount: 50 },
];
