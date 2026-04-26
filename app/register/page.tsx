'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', college: '', rollNumber: '', password: '', confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

        <p className="auth-footer">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
