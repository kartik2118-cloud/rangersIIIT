'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import type { Wallet } from '@/lib/store';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  college: string;
  rollNumber: string;
  walletCreated: boolean;
  walletAddress: string;
  createdAt: string;
}

import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txCount, setTxCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ college: '', rollNumber: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(me => {
        if (!me.success || !me.user) {
          setLoading(false);
          return;
        }
        setUser(me.user);
        setEditForm({ college: me.user.college, rollNumber: me.user.rollNumber });
        return Promise.all([
          fetch('/api/wallet').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/transactions').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        ]);
      })
      .then((res) => {
        if (!res) return;
        const [w, t] = res;
        if (w.success) setWallet(w.data);
        if (t.success) setTxCount(t.data?.length || 0);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    try {
      await signOut(auth); // Clear Firebase session
    } catch (err) {
      console.error('Firebase signout error', err);
    }
    await fetch('/api/auth/logout', { method: 'POST' }); // Clear JWT session
    router.push('/login');
  }

  async function handleGoogleLink() {
    try {
      await signInWithPopup(auth, googleProvider);
      alert('Google account successfully linked!');
    } catch (err) {
      alert('Failed to link Google account.');
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => prev ? { ...prev, college: editForm.college, rollNumber: editForm.rollNumber } : null);
        setIsEditing(false);
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (err) {
      alert('Error updating profile');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="main-content"><div className="loading"><div className="spinner" />Loading profile...</div></main>
      </div>
    );
  }

  if (!user) {
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

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Recently';

  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="app-shell">
      <Nav balance={wallet?.balance} userName={user.name} />
      <main className="main-content">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <div className="profile-badge">
            <span className="profile-badge-dot" />
            Student
          </div>
        </div>

        {/* Stats Row */}
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-value">{wallet?.balance ?? 0}</div>
            <div className="profile-stat-label">FEST Balance</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{txCount}</div>
            <div className="profile-stat-label">Transactions</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{user.walletCreated ? '✓' : '—'}</div>
            <div className="profile-stat-label">Wallet</div>
          </div>
        </div>

        {/* Info Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>Student Information</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Edit</button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setIsEditing(false); setEditForm({ college: user.college, rollNumber: user.rollNumber }); }} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} style={{ background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: '4px 12px', borderRadius: '4px' }}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          )}
        </div>
        <div className="profile-card">
          <div className="profile-field">
            <div className="profile-field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="profile-field-content">
              <div className="profile-field-label">Full Name</div>
              <div className="profile-field-value">{user.name}</div>
            </div>
          </div>
          <div className="profile-field">
            <div className="profile-field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div className="profile-field-content">
              <div className="profile-field-label">Email</div>
              <div className="profile-field-value">{user.email}</div>
            </div>
          </div>
          <div className="profile-field">
            <div className="profile-field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <div className="profile-field-content">
              <div className="profile-field-label">College</div>
              {isEditing ? (
                <input className="field-input" style={{ marginTop: '4px', padding: '6px 10px', fontSize: '14px' }} value={editForm.college} onChange={e => setEditForm({ ...editForm, college: e.target.value })} />
              ) : (
                <div className="profile-field-value">{user.college}</div>
              )}
            </div>
          </div>
          <div className="profile-field">
            <div className="profile-field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div className="profile-field-content">
              <div className="profile-field-label">Roll Number</div>
              {isEditing ? (
                <input className="field-input" style={{ marginTop: '4px', padding: '6px 10px', fontSize: '14px' }} value={editForm.rollNumber} onChange={e => setEditForm({ ...editForm, rollNumber: e.target.value })} />
              ) : (
                <div className="profile-field-value">{user.rollNumber}</div>
              )}
            </div>
          </div>
          <div className="profile-field">
            <div className="profile-field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div className="profile-field-content">
              <div className="profile-field-label">Joined</div>
              <div className="profile-field-value">{joinDate}</div>
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        <h2 className="section-title" style={{ marginTop: '28px' }}>Wallet Details</h2>
        <div className="profile-card">
          <div className="profile-field">
            <div className="profile-field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1"/></svg>
            </div>
            <div className="profile-field-content">
              <div className="profile-field-label">Wallet Address</div>
              <div className="profile-field-value" style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '13px' }}>
                {user.walletAddress || 'Not created yet'}
              </div>
            </div>
          </div>
          <div className="profile-field">
            <div className="profile-field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div className="profile-field-content">
              <div className="profile-field-label">FEST Token Balance</div>
              <div className="profile-field-value" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                {wallet?.balance ?? 0} FEST
              </div>
            </div>
          </div>
          <div className="profile-field" style={{ borderBottom: 'none' }}>
            <div className="profile-field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <div className="profile-field-content">
              <div className="profile-field-label">Network</div>
              <div className="profile-field-value">Base Sepolia (Chain 84532)</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '24px' }}>
          <button className="quick-btn" style={{ flexDirection: 'row', justifyContent: 'center', gap: '10px', width: '100%', border: '1px solid var(--border)' }} onClick={handleGoogleLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Link Google Account
          </button>
          <button className="quick-btn" style={{ flexDirection: 'row', justifyContent: 'center', gap: '10px', width: '100%' }} onClick={() => router.push('/wallet')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1"/></svg>
            Go to Wallet
          </button>
          <button className="profile-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Log out
          </button>
        </div>
      </main>
    </div>
  );
}
