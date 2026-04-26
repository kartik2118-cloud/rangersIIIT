const { useState, useEffect, useCallback } = React;

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_WALLET = {
  address: '0x3aF8...c1D2',
  balance: 480,
  usd: 48.00,
};

const FESTS = [
  {
    id: 'fest_001', name: 'Aaroha Music Fest', category: 'Music',
    location: 'IIT Delhi', date: 'Apr 26–27', merchants: ['Stage Bites', 'Melody Merch', 'Hydration Hub'],
    color: '#ec4899', tagClass: 'tag-music', icon: '🎵', live: true,
  },
  {
    id: 'fest_002', name: 'TechXpo 2025', category: 'Tech',
    location: 'IIIT Hyderabad', date: 'Apr 28', merchants: ['Code Café', 'Gadget Den', 'Hacker Snacks'],
    color: '#38bdf8', tagClass: 'tag-tech', icon: '💻', live: true,
  },
  {
    id: 'fest_003', name: 'Rang Utsav', category: 'Cultural',
    location: 'NIT Trichy', date: 'May 2–3', merchants: ['Chaat Corner', 'Art Alley', 'Folk Fusion'],
    color: '#fbbf24', tagClass: 'tag-cultural', icon: '🎨', live: false,
  },
];

const PAY_REQUESTS = [
  { id: 'pr1', merchant: 'Stage Bites', festId: 'fest_001', festName: 'Aaroha Music Fest', amount: 60, orderRef: 'ORD-4821', category: 'Food' },
  { id: 'pr2', merchant: 'Melody Merch', festId: 'fest_001', festName: 'Aaroha Music Fest', amount: 120, orderRef: 'ORD-4822', category: 'Merch' },
  { id: 'pr3', merchant: 'Code Café', festId: 'fest_002', festName: 'TechXpo 2025', amount: 40, orderRef: 'ORD-5101', category: 'Food' },
  { id: 'pr4', merchant: 'Gadget Den', festId: 'fest_002', festName: 'TechXpo 2025', amount: 200, orderRef: 'ORD-5102', category: 'Merch' },
];

const HISTORY_INIT = [
  { id: 'h1', merchant: 'Stage Bites', festName: 'Aaroha Music Fest', amount: 60, date: 'Apr 25, 2:14 PM', category: 'Food', icon: '🍔', status: 'success', txHash: '0xabc...11f' },
  { id: 'h2', merchant: 'Melody Merch', festName: 'Aaroha Music Fest', amount: 120, date: 'Apr 25, 1:55 PM', category: 'Merch', icon: '👕', status: 'success', txHash: '0xdef...22a' },
  { id: 'h3', merchant: 'Code Café', festName: 'TechXpo 2025', amount: 40, date: 'Apr 24, 4:30 PM', category: 'Food', icon: '☕', status: 'success', txHash: '0x123...99b' },
  { id: 'h4', merchant: 'Hacker Snacks', festName: 'TechXpo 2025', amount: 35, date: 'Apr 24, 3:10 PM', category: 'Food', icon: '🍕', status: 'success', txHash: '0x456...77c' },
  { id: 'h5', merchant: 'Art Alley', festName: 'Rang Utsav', amount: 80, date: 'Apr 23, 6:45 PM', category: 'Merch', icon: '🎨', status: 'success', txHash: '0x789...55d' },
  { id: 'h6', merchant: 'Folk Fusion', festName: 'Rang Utsav', amount: 50, date: 'Apr 23, 5:00 PM', category: 'Tickets', icon: '🎟️', status: 'success', txHash: '0xbcd...33e' },
  { id: 'h7', merchant: 'Hydration Hub', festName: 'Aaroha Music Fest', amount: 15, date: 'Apr 22, 8:20 PM', category: 'Food', icon: '🥤', status: 'success', txHash: '0xef1...44f' },
];

const ICONS_MAP = { Food: '🍔', Merch: '👕', Tech: '💻', Tickets: '🎟️', Games: '🎮' };
const CAT_BG = { Food: 'rgba(249,115,22,0.12)', Merch: 'rgba(167,139,250,0.12)', Tickets: 'rgba(34,211,160,0.12)', Games: 'rgba(56,189,248,0.12)', Tech: 'rgba(56,189,248,0.12)' };

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function NavBar({ title, showBack, onBack, chip }) {
  return (
    <div className="nav-bar">
      {showBack
        ? <button className="nav-back" onClick={onBack}>← {title}</button>
        : <div className="nav-logo">Fest<span>Pass</span></div>
      }
      {chip && <div className="nav-chip">{chip}</div>}
    </div>
  );
}

function BottomNav({ screen, setScreen }) {
  const items = [
    { id: 'wallet', icon: '👛', label: 'Wallet' },
    { id: 'pay', icon: '⚡', label: 'Pay' },
    { id: 'history', icon: '📋', label: 'History' },
  ];
  return (
    <div className="bottom-nav">
      {items.map(i => (
        <button key={i.id} className={`nav-item ${screen === i.id ? 'active' : ''}`} onClick={() => setScreen(i.id)}>
          <span className="nav-icon">{i.icon}</span>
          <span className="nav-label">{i.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── SCREEN: ONBOARDING ──────────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [loading, setLoading] = useState(false);

  function handleCreate() {
    setLoading(true);
    setTimeout(onComplete, 1800);
  }

  if (loading) {
    return (
      <div className="shell">
        <div className="loading-screen">
          <div className="spinner" />
          <div className="loading-text">Creating your smart wallet…</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Deploying on Base Sepolia · Gasless</div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="content">
        <div className="ob-hero">
          <div className="ob-badge">⚡ Powered by Base · FEST Token</div>
          <h1 className="ob-title">Create your<br /><span>FestPass Wallet</span></h1>
          <p className="ob-sub">One wallet, one token — works at every campus fest across colleges. Pay, earn rewards, and carry your balance forever.</p>
        </div>

        <div className="ob-cards">
          <div className="ob-card">
            <span className="ob-card-icon">🎪</span>
            <div className="ob-card-text">
              <h4>Works at all fests</h4>
              <p>IIT, IIIT, NIT, and more — all on one rail</p>
            </div>
          </div>
          <div className="ob-card">
            <span className="ob-card-icon">💰</span>
            <div className="ob-card-text">
              <h4>Balance never expires</h4>
              <p>Your FEST tokens persist across events</p>
            </div>
          </div>
          <div className="ob-card">
            <span className="ob-card-icon">🔐</span>
            <div className="ob-card-text">
              <h4>Sign in once, pay anywhere</h4>
              <p>No repeated KYC or wallet setup per fest</p>
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={handleCreate}>✨ Create Wallet — It's Free</button>

        <div className="ob-divider">or continue with</div>

        <div className="ob-social">
          {[
            { icon: '🔵', label: 'Continue with Google' },
            { icon: '📧', label: 'Continue with College Email' },
            { icon: '🎓', label: 'Use College ID / SSO' },
          ].map(s => (
            <button key={s.label} className="ob-social-btn" onClick={handleCreate}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="ob-gasless">
          <span>⛽</span>
          <span><span>Gasless onboarding</span> — no ETH needed to get started</span>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: WALLET ───────────────────────────────────────────────────────────
function WalletScreen({ wallet, txHistory, onPay }) {
  const recentTx = txHistory.slice(0, 3);

  return (
    <div className="shell">
      <NavBar chip="Base Sepolia" />
      <div className="content">
        {/* Balance Card */}
        <div className="wallet-card">
          <div className="wallet-addr">Smart Wallet · <span>{wallet.address}</span></div>
          <div className="wallet-balance-label">FEST Balance</div>
          <div className="wallet-balance">
            {wallet.balance.toLocaleString()} <span>FEST</span>
          </div>
          <div className="wallet-usd">≈ ₹{(wallet.balance * 10).toLocaleString()} · ${wallet.usd.toFixed(2)} USD</div>
          <div className="wallet-actions">
            <button className="wallet-action-btn">➕ Top Up</button>
            <button className="wallet-action-btn" onClick={onPay}>⚡ Pay Now</button>
            <button className="wallet-action-btn">📤 Send</button>
          </div>
        </div>

        {/* Active Fests */}
        <div className="section-title">Active Fests</div>
        <div className="fests-grid">
          {FESTS.map(f => (
            <div className="fest-card" key={f.id}>
              <div className="fest-card-top">
                <span className={`fest-tag ${f.tagClass}`}>{f.icon} {f.category}</span>
                {f.live
                  ? <span className="fest-live"><span className="fest-live-dot" />Live Now</span>
                  : <span style={{ fontSize: 10, color: 'var(--muted)' }}>Upcoming · {f.date}</span>
                }
              </div>
              <div className="fest-name">{f.name}</div>
              <div className="fest-meta">
                <span className="fest-meta-item">📍 {f.location}</span>
                <span className="fest-meta-item">📅 {f.date}</span>
              </div>
              <div className="fest-merchants">
                {f.merchants.map(m => <span className="merchant-chip" key={m}>{m}</span>)}
              </div>
              <button className="btn-pay" onClick={onPay}>Pay at {f.name.split(' ')[0]} →</button>
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="section-title">Recent</div>
        <div className="tx-list">
          {recentTx.map(tx => (
            <div className="tx-item" key={tx.id}>
              <div className="tx-left">
                <div className="tx-icon" style={{ background: CAT_BG[tx.category] || 'rgba(255,255,255,0.05)' }}>
                  {tx.icon}
                </div>
                <div>
                  <div className="tx-merchant">{tx.merchant}</div>
                  <div className="tx-fest">{tx.festName}</div>
                </div>
              </div>
              <div className="tx-right">
                <div className="tx-amount">−{tx.amount} FEST</div>
                <div className="tx-time">{tx.date.split(',')[1]?.trim()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav screen="wallet" setScreen={(s) => s === 'pay' ? onPay() : null} />
    </div>
  );
}

// ─── SCREEN: PAY ─────────────────────────────────────────────────────────────
function PayScreen({ wallet, onPayComplete, onBack, setScreen }) {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState('select'); // select | confirm | success
  const [paying, setPaying] = useState(false);
  const [newBal, setNewBal] = useState(wallet.balance);

  function handleConfirm() {
    setPaying(true);
    setTimeout(() => {
      setNewBal(wallet.balance - selected.amount);
      setPaying(false);
      setStep('success');
      onPayComplete(selected, wallet.balance - selected.amount);
    }, 1600);
  }

  if (step === 'success') {
    return (
      <div className="shell">
        <NavBar title="Back" showBack onBack={() => { setStep('select'); setSelected(null); }} />
        <div className="content">
          <div className="pay-success">
            <div className="success-circle">✓</div>
            <div className="success-title">Payment Successful!</div>
            <div className="success-sub">Transaction confirmed on Base Sepolia</div>
            <div className="success-amount">{selected.amount} FEST</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>≈ ₹{selected.amount * 10}</div>
            <div className="success-detail">
              <div className="sd-row"><span className="sd-label">Merchant</span><span className="sd-val">{selected.merchant}</span></div>
              <div className="sd-row"><span className="sd-label">Fest</span><span className="sd-val">{selected.festName}</span></div>
              <div className="sd-row"><span className="sd-label">Order Ref</span><span className="sd-val">{selected.orderRef}</span></div>
              <div className="sd-row"><span className="sd-label">Remaining Balance</span><span className="sd-val" style={{ color: 'var(--green)' }}>{newBal} FEST</span></div>
              <div className="sd-row"><span className="sd-label">Tx Hash</span><span className="sd-val" style={{ fontFamily: 'monospace', fontSize: 11 }}>0x{Math.random().toString(16).slice(2, 10)}…</span></div>
            </div>
            <button className="btn-primary" onClick={() => { setStep('select'); setSelected(null); setScreen('wallet'); }}>Back to Wallet</button>
            <div style={{ height: 10 }} />
            <button className="btn-secondary" onClick={() => { setStep('select'); setSelected(null); }}>Make Another Payment</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm' && selected) {
    return (
      <div className="shell">
        <NavBar title="Pay" showBack onBack={() => setStep('select')} />
        <div className="content">
          <div style={{ marginBottom: 20 }}>
            <div className="section-title">Payment Details</div>
          </div>
          <div className="pay-confirm-card">
            <div className="pay-confirm-row">
              <span className="pcr-label">Merchant</span>
              <span className="pcr-value">{selected.merchant}</span>
            </div>
            <div className="pay-confirm-row">
              <span className="pcr-label">Festival</span>
              <span className="pcr-value">{selected.festName}</span>
            </div>
            <div className="pay-confirm-row">
              <span className="pcr-label">Category</span>
              <span className="pcr-value">{selected.category}</span>
            </div>
            <div className="pay-confirm-row">
              <span className="pcr-label">Order Ref</span>
              <span className="pcr-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>{selected.orderRef}</span>
            </div>
            <div className="pay-confirm-row">
              <span className="pcr-label">Amount</span>
              <span className="pcr-amount">{selected.amount} FEST</span>
            </div>
          </div>

          <div className="pay-balance-hint">
            <div>
              <div className="pbh-left">Your Balance</div>
              <div className="pbh-balance">{wallet.balance} FEST → {wallet.balance - selected.amount} FEST after</div>
            </div>
            <span>✅</span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginBottom: 16, lineHeight: 1.6 }}>
            Calls <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>FestPay.pay({selected.festId}, merchantId, {selected.amount}, "{selected.orderRef}")</code>
          </div>

          <button className="btn-primary" onClick={handleConfirm} disabled={paying}>
            {paying ? '⏳ Confirming on-chain…' : `⚡ Confirm Payment · ${selected.amount} FEST`}
          </button>
          <div style={{ height: 10 }} />
          <button className="btn-secondary" onClick={() => setStep('select')}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <NavBar title="Wallet" showBack onBack={onBack} chip="Pay with FEST" />
      <div className="content">
        <div className="pay-qr-box">
          <div className="qr-icon">📷</div>
          <div className="qr-label">Scan Merchant QR</div>
          <div className="qr-sub">Tap to open camera · QR includes festId, merchantId, amount</div>
        </div>

        <div className="ob-divider" style={{ margin: '16px 0' }}>or select a payment request</div>

        <div className="section-title">Open Requests</div>
        <div className="pay-requests">
          {PAY_REQUESTS.map(pr => (
            <div
              key={pr.id}
              className={`pay-request-card ${selected?.id === pr.id ? 'selected' : ''}`}
              onClick={() => setSelected(pr)}
            >
              <div className="pr-top">
                <div className="pr-merchant">{ICONS_MAP[pr.category] || '🛒'} {pr.merchant}</div>
                <div className="pr-amount">{pr.amount} <span>FEST</span></div>
              </div>
              <div className="pr-meta">
                <span>🎪 {pr.festName}</span>
                <span>#{pr.orderRef}</span>
                <span style={{ color: 'var(--accent2)' }}>{pr.category}</span>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div style={{ marginTop: 20 }}>
            <button className="btn-primary" onClick={() => setStep('confirm')}>
              Continue · Pay {selected.amount} FEST to {selected.merchant} →
            </button>
          </div>
        )}
      </div>
      <BottomNav screen="pay" setScreen={setScreen} />
    </div>
  );
}

// ─── SCREEN: HISTORY ─────────────────────────────────────────────────────────
function HistoryScreen({ txHistory, setScreen }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Food', 'Merch', 'Tickets', 'Games'];

  const filtered = filter === 'All' ? txHistory : txHistory.filter(t => t.category === filter);

  return (
    <div className="shell">
      <NavBar chip="All Fests" />
      <div className="content">
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Transaction History</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{txHistory.length} payments · all fests · FEST token</p>
        </div>

        <div className="filter-chips">
          {filters.map(f => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'All' ? '✦ ' : ''}{f}
            </button>
          ))}
        </div>

        <div className="hist-list">
          {filtered.map(tx => (
            <div className="hist-item" key={tx.id}>
              <div className="hist-left">
                <div className="hist-icon" style={{ background: CAT_BG[tx.category] || 'rgba(255,255,255,0.05)' }}>
                  {tx.icon}
                </div>
                <div>
                  <div className="hist-merchant">{tx.merchant}</div>
                  <div className="hist-meta">{tx.festName} · {tx.date}</div>
                </div>
              </div>
              <div className="hist-right">
                <div className="hist-amount">−{tx.amount} FEST</div>
                <div className={`hist-status ${tx.status === 'success' ? 'status-success' : 'status-pending'}`}>
                  {tx.status === 'success' ? '✓ Confirmed' : '⏳ Pending'}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center" style={{ padding: '40px 0', color: 'var(--muted)' }}>
              No {filter} transactions yet
            </div>
          )}
        </div>
      </div>
      <BottomNav screen="history" setScreen={setScreen} />
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState('onboarding'); // onboarding | wallet | pay | history
  const [wallet, setWallet] = useState({ ...DEMO_WALLET });
  const [txHistory, setTxHistory] = useState([...HISTORY_INIT]);

  function handleOnboarded() {
    setScreen('wallet');
  }

  function handlePayComplete(tx, newBalance) {
    setWallet(w => ({ ...w, balance: newBalance }));
    const newTx = {
      id: 'h_new_' + Date.now(),
      merchant: tx.merchant,
      festName: tx.festName,
      amount: tx.amount,
      date: 'Just now',
      category: tx.category,
      icon: ICONS_MAP[tx.category] || '🛒',
      status: 'success',
      txHash: '0x' + Math.random().toString(16).slice(2, 10) + '…',
    };
    setTxHistory(h => [newTx, ...h]);
  }

  if (screen === 'onboarding') return <Onboarding onComplete={handleOnboarded} />;
  if (screen === 'pay') return (
    <PayScreen
      wallet={wallet}
      onPayComplete={handlePayComplete}
      onBack={() => setScreen('wallet')}
      setScreen={setScreen}
    />
  );
  if (screen === 'history') return (
    <HistoryScreen txHistory={txHistory} setScreen={setScreen} />
  );

  // wallet (default after onboarding)
  return (
    <WalletScreen
      wallet={wallet}
      txHistory={txHistory}
      onPay={() => setScreen('pay')}
    />
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
