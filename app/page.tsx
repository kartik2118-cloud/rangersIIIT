'use client';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo" style={{ fontSize: '28px', marginBottom: '12px' }}>Fest<span>Pass</span></div>
        <p className="auth-tagline" style={{ marginBottom: '40px', maxWidth: '320px', margin: '0 auto 40px' }}>
          One wallet. One token. Every campus festival.
        </p>
        <button className="auth-btn" style={{ width: '100%', marginBottom: '12px' }} onClick={() => router.push('/login')}>
          Sign in
        </button>
        <button className="auth-social" onClick={() => router.push('/register')}>
          Create an account
        </button>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '32px', lineHeight: '1.6' }}>
          Built on Base · Gasless onboarding · ERC-20 FEST token
        </p>
      </div>
    </div>
  );
}
