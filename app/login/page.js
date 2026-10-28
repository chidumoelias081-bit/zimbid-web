'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, homeFor, saveSession } from '../../lib/api';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    setBusy(true); setError('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email: f.get('email'), password: f.get('password') } });
      saveSession(data);
      router.replace(homeFor(data.user.role));
    } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <main className="auth">
      <h1 className="brand">ZimBid<small>prototype</small></h1>
      <h2>Sign in</h2>
      <form onSubmit={submit} className="stack">
        <label className="field">Email<input name="email" type="email" required autoComplete="email" /></label>
        <label className="field">Password<input name="password" type="password" required autoComplete="current-password" /></label>
        <p className="err" role="alert">{error}</p>
        <button className="btn" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <p className="muted">New here? <Link href="/register">Create an account</Link></p>
    </main>
  );
}
