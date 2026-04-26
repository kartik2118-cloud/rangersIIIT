'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', college: '', rollNumber: '', password: '', confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleSignup(e: React.MouseEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const res = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName,
          uid: user.uid,
        }),
      });
      
      const data = await res.json();

      if (data.success) {
        router.push('/onboarding');
      } else {
        setError(data.error || 'Firebase signup failed.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign-up failed.');
      setLoading(false);
    }
  }


  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          college: form.college,
          rollNumber: form.rollNumber,
          password: form.password,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      router.push('/onboarding');
    } catch {
      setError('Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Fest<span>Pass</span></div>
        <p className="auth-tagline">Create your student account to get started.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Full name</label>
            <input className="field-input" placeholder="Arjun Mehta" value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label">College email</label>
            <input className="field-input" type="email" placeholder="you@college.ac.in" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">College</label>
              <input className="field-input" placeholder="IIIT Hyderabad" value={form.college} onChange={e => update('college', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Roll number</label>
              <input className="field-input" placeholder="CS22B1045" value={form.rollNumber} onChange={e => update('rollNumber', e.target.value)} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Password</label>
            <input className="field-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => update('password', e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label">Confirm password</label>
            <input className="field-input" type="password" placeholder="••••••••" value={form.confirm} onChange={e => update('confirm', e.target.value)} required />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button className="auth-social" onClick={handleGoogleSignup} disabled={loading}>
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <p className="auth-footer">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
