'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import type { Fest, Transaction, Wallet } from '@/lib/store';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [fests, setFests] = useState<Fest[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/wallet').then(r => { if (r.status === 401) throw new Error('auth'); return r.json(); }),
      fetch('/api/fests').then(r => r.json()),
      fetch('/api/transactions').then(r => r.json()),
    ]).then(([w, f, t]) => {
      if (w.success) setWallet(w.data);
      if (f.success) setFests(f.data);
      if (t.success) setTxs(t.data);
      setLoading(false);
    }).catch((err) => {
      if (err.message === 'auth') {
        router.push('/login');
        return;
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="main-content"><div className="loading"><div className="spinner" />Loading wallet...</div></main>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="main-content">
          <div className="empty-state">
            <p>Session expired. Please sign in again.</p>
            <button className="auth-btn" style={{ marginTop: '16px' }} onClick={() => router.push('/login')}>Sign in</button>
          </div>
        </main>
      </div>
    );
  }

  const recentTxs = txs.slice(0, 4);

  return (
    <div className="app-shell">
      <Nav balance={wallet.balance} userName={wallet.studentName} />
      <main className="main-content">
        {/* Balance */}
        <div className="balance-card">
          <div className="balance-label">FEST Balance</div>
          <div className="balance-amount">{wallet.balance}<small>FEST</small></div>
          <div className="balance-addr">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="quick-btn" onClick={() => router.push('/pay')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Pay
          </button>
          <button className="quick-btn" onClick={() => router.push('/history')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            History
          </button>
          <button className="quick-btn" onClick={() => { const el = document.getElementById('fests-section'); el?.scrollIntoView({ behavior: 'smooth' }); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Fests
          </button>
        </div>

        {/* Active Fests */}
        <div id="fests-section">
          <h2 className="section-title">Active Fests</h2>
          <div className="fest-scroll">
            {fests.filter(f => f.status === 'active').map(fest => (
              <div className="fest-card" key={fest.id}>
                <div className="fest-cat">{fest.category}</div>
                <div className="fest-name">{fest.name}</div>
                <div className="fest-meta">{fest.campus} · {fest.dates}</div>
                <div className="fest-status">
                  <span className="fest-status-dot" />
                  Live
                </div>
                <button className="fest-cta" onClick={() => router.push('/pay')}>Pay at this fest</button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        {recentTxs.length > 0 && (
          <>
            <h2 className="section-title">Recent</h2>
            <div className="tx-list">
              {recentTxs.map(tx => (
                <div className="tx-row" key={tx.id}>
                  <div className="tx-icon">{tx.icon}</div>
                  <div className="tx-info">
                    <div className="tx-merchant">{tx.merchantName}</div>
                    <div className="tx-fest">{tx.festName}</div>
                  </div>
                  <div className="tx-right">
                    <div className="tx-amount">-{tx.amount} FEST</div>
                    <div className="tx-time">{timeAgo(tx.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="quick-btn"
              style={{ width: '100%', marginTop: '16px', flexDirection: 'row', justifyContent: 'center', gap: '8px' }}
              onClick={() => router.push('/history')}
            >
              View all transactions
            </button>
          </>
        )}
      </main>
    </div>
  );
}
