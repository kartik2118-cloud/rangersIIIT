'use client';
import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import type { Transaction, Wallet } from '@/lib/store';

const FILTERS = ['All', 'Food', 'Merch', 'Games', 'Tickets'];

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
}

export default function HistoryPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/wallet').then(r => r.json()),
      fetch('/api/transactions').then(r => r.json()),
    ]).then(([w, t]) => {
      if (w.success) setWallet(w.data);
      if (t.success) setTxs(t.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = txs.filter(tx => {
    if (filter !== 'All' && tx.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        tx.merchantName.toLowerCase().includes(q) ||
        tx.festName.toLowerCase().includes(q) ||
        tx.orderRef.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="app-shell">
        <Nav balance={wallet?.balance} />
        <main className="main-content"><div className="loading"><div className="spinner" />Loading history...</div></main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Nav balance={wallet?.balance} />
      <main className="main-content">
        <h1 className="section-title" style={{ fontSize: '20px', marginBottom: '20px' }}>Transaction History</h1>

        <input
          className="search-input"
          placeholder="Search by merchant, fest, or order ref..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="filter-bar">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-chip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">No transactions found.</div>
        ) : (
          <div>
            {filtered.map(tx => (
              <div className="history-row" key={tx.id}>
                <div className="history-icon">{tx.icon}</div>
                <div className="history-info">
                  <div className="history-merchant">{tx.merchantName}</div>
                  <div className="history-meta">
                    <span className="history-fest-badge">{tx.festName}</span>
                    <span>{tx.category}</span>
                  </div>
                  <div className="history-ref">{tx.orderRef}</div>
                </div>
                <div className="history-right">
                  <div className="history-amount">-{tx.amount} FEST</div>
                  <div className="history-time">{formatDate(tx.timestamp)}</div>
                  <span className={`history-status ${tx.status}`}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-3)', marginTop: '24px', paddingBottom: '20px' }}>
          All transactions from one persistent wallet across {new Set(txs.map(t => t.festName)).size} festivals.
        </p>
      </main>
    </div>
  );
}
