'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'ready' | 'creating' | 'done'>('ready');
  const [walletAddr, setWalletAddr] = useState('');
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    // Check if wallet already created
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user.walletCreated) {
          setWalletAddr(data.user.walletAddress || '');
          setStep('done');
        }
        setUserChecked(true);
      })
      .catch(() => setUserChecked(true));
  }, []);

  async function handleCreate() {
    setStep('creating');
    try {
      const res = await fetch('/api/wallet/create', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // Fetch wallet address
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        setWalletAddr(meData.user?.walletAddress || '0x...');
        setStep('done');
      }
    } catch {
      setStep('ready');
    }
  }

  if (!userChecked) {
    return <div className="ob-container"><div className="loading"><div className="spinner" />Loading...</div></div>;
  }

  return (
    <div className="ob-container">
      <div className="ob-card">
        <div className="ob-logo">Fest<span>Pass</span></div>

        <h1 className="ob-title">Create your FestPass wallet</h1>
        <p className="ob-desc">
          One wallet and one token that works across every campus festival.
          Pay at food stalls, buy merch, play games — all with your FEST balance.
          No separate tokens. No expired credits.
        </p>

        {/* Progress steps */}
        <div className="ob-steps">
          <div className={`ob-step ${step === 'ready' || step === 'creating' || step === 'done' ? 'done' : ''}`}>
            <div className="ob-step-dot">✓</div>
            <span className="ob-step-label">Login</span>
          </div>
          <div className={`ob-step ${step === 'creating' ? 'active' : ''} ${step === 'done' ? 'done' : ''}`}>
            <div className="ob-step-dot">{step === 'done' ? '✓' : '2'}</div>
            <span className="ob-step-label">Wallet</span>
          </div>
          <div className={`ob-step ${step === 'done' ? 'done' : ''}`}>
            <div className="ob-step-dot">{step === 'done' ? '✓' : '3'}</div>
            <span className="ob-step-label">Ready</span>
          </div>
        </div>

        {step === 'ready' && (
          <>
            <button className="ob-cta" onClick={handleCreate}>Create Wallet</button>
            <p className="ob-gasless">Gasless setup · No seed phrase needed</p>
          </>
        )}

        {step === 'creating' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="spinner" />
            <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>Deploying your smart wallet on Base...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="ob-success">
            <div className="ob-check">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Wallet created</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>Your smart wallet is live on Base Sepolia.</p>
            <div className="ob-wallet-addr">{walletAddr.slice(0, 6)}...{walletAddr.slice(-4)}</div>
            <button className="ob-cta" onClick={() => router.push('/wallet')}>Go to Wallet</button>
          </div>
        )}
      </div>
    </div>
  );
}
