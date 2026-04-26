'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import { SAMPLE_QR, FESTS } from '@/lib/store';
import type { Wallet } from '@/lib/store';

type Step = 'select' | 'confirm' | 'processing' | 'success';

export default function PayPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [step, setStep] = useState<Step>('select');
  const [selectedQR, setSelectedQR] = useState('');
  const [txHash, setTxHash] = useState('');
  const [newBalance, setNewBalance] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/wallet').then(r => r.json()).then(d => {
      if (d.success) setWallet(d.data);
    });
  }, []);

  const qr = SAMPLE_QR.find(q => q.id === selectedQR);
  const fest = qr ? FESTS.find(f => f.id === qr.festId) : null;
  const merchant = fest?.merchants.find(m => m.id === qr?.merchantId);

  function handleSelectAndConfirm() {
    if (!selectedQR) return;
    setError('');
    setStep('confirm');
  }

  async function handlePay() {
    if (!qr) return;
    setStep('processing');
    setError('');

    const orderRef = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festId: qr.festId,
          merchantId: qr.merchantId,
          amount: qr.amount,
          orderRef,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Payment failed.');
        setStep('confirm');
        return;
      }

      setTxHash(data.txHash);
      setNewBalance(data.newBalance);
      setStep('success');
    } catch {
      setError('Payment failed. Try again.');
      setStep('confirm');
    }
  }

  function handleReset() {
    setStep('select');
    setSelectedQR('');
    setTxHash('');
    setError('');
    // Refresh wallet balance
    fetch('/api/wallet').then(r => r.json()).then(d => {
      if (d.success) setWallet(d.data);
    });
  }

  return (
    <div className="app-shell">
      <Nav balance={wallet?.balance} />
      <main className="main-content">
        <h1 className="section-title" style={{ fontSize: '20px', marginBottom: '24px' }}>Pay</h1>

        {/* Step 1: Select */}
        {step === 'select' && (
          <>
            <div className="pay-section">
              <div className="pay-label">Scan QR or select a merchant</div>
              {/* Mock QR scanner area */}
              <div style={{
                background: 'var(--surface-2)',
                border: '2px dashed var(--border-light)',
                borderRadius: 'var(--radius)',
                padding: '32px',
                textAlign: 'center',
                marginBottom: '16px',
                color: 'var(--text-3)',
                fontSize: '13px',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 8px', color: 'var(--text-3)' }}>
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                QR scanner would open here
              </div>

              <div className="pay-label">Or select a sample request</div>
              <select
                className="pay-select"
                value={selectedQR}
                onChange={e => setSelectedQR(e.target.value)}
              >
                <option value="">Choose a merchant...</option>
                {SAMPLE_QR.map(q => {
                  const f = FESTS.find(fest => fest.id === q.festId);
                  return (
                    <option key={q.id} value={q.id}>
                      {q.label} — {q.amount} FEST ({f?.name})
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              className="pay-btn"
              disabled={!selectedQR}
              onClick={handleSelectAndConfirm}
            >
              Continue
            </button>
          </>
        )}

        {/* Step 2: Confirm */}
        {step === 'confirm' && qr && (
          <>
            {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}

            <div className="pay-section">
              <div className="pay-amount-big">{qr.amount}<small>FEST</small></div>
            </div>

            <div className="pay-section">
              <div className="pay-detail">
                <span className="pay-detail-label">Merchant</span>
                <span className="pay-detail-value">{merchant?.name}</span>
              </div>
              <div className="pay-detail">
                <span className="pay-detail-label">Festival</span>
                <span className="pay-detail-value">{fest?.name}</span>
              </div>
              <div className="pay-detail">
                <span className="pay-detail-label">Campus</span>
                <span className="pay-detail-value">{fest?.campus}</span>
              </div>
              <div className="pay-detail">
                <span className="pay-detail-label">Category</span>
                <span className="pay-detail-value">{merchant?.category}</span>
              </div>
              <div className="pay-detail">
                <span className="pay-detail-label">Your balance</span>
                <span className="pay-detail-value">{wallet?.balance} FEST</span>
              </div>
            </div>

            <button className="pay-btn" onClick={handlePay}>
              Confirm Payment
            </button>
            <button
              className="quick-btn"
              style={{ width: '100%', marginTop: '8px', flexDirection: 'row', justifyContent: 'center' }}
              onClick={() => setStep('select')}
            >
              Cancel
            </button>
          </>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div className="spinner" />
            <p style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: '8px' }}>Processing payment on Base...</p>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="pay-success">
            <div className="pay-success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>Payment successful</h2>
            <p className="pay-success-detail">{qr?.amount} FEST paid to {merchant?.name}</p>
            <p className="pay-success-detail">{fest?.name} · {fest?.campus}</p>
            <div className="pay-success-hash">{txHash}</div>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>
              New balance: <strong>{newBalance} FEST</strong>
            </p>
            <button className="pay-btn" onClick={handleReset}>Make another payment</button>
            <button
              className="quick-btn"
              style={{ width: '100%', marginTop: '8px', flexDirection: 'row', justifyContent: 'center' }}
              onClick={() => router.push('/wallet')}
            >
              Back to wallet
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
