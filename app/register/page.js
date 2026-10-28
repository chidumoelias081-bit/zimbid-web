'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, saveSession } from '../../lib/api';

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState('');
  useEffect(() => { setInvite((new URLSearchParams(window.location.search).get('invite') || '').toUpperCase()); }, []);
  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    setBusy(true); setError('');
    try {
      const data = await api('/auth/register', { method: 'POST', body: f });
      saveSession(data);
      router.replace('/documents');
    } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <main className="auth">
      <h1 className="brand">ZimBid<small>prototype</small></h1>
      <h2>Create an account</h2>
      <form onSubmit={submit} className="stack">
        <label className="field">Full name or institution<input name="full_name" required /></label>
        <label className="field">Email<input name="email" type="email" required autoComplete="email" /></label>
        <label className="field">Phone<input name="phone" type="tel" autoComplete="tel" /></label>
        <label className="field">Password (8 characters or more)<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <label className="field">Invite code (optional)<input name="invite" value={invite} onChange={(e) => setInvite(e.target.value.toUpperCase())} maxLength={12} placeholder="If a member invited you" /></label>
        <div className="field">I am a
          <div className="radios"><label><input type="radio" name="role" value="borrower" defaultChecked /> Borrower</label><label><input type="radio" name="role" value="lender" /> Lender (bank, MFI or investor)</label></div>
        </div>
        <p className="muted">After you register you upload your documents, and an admin checks them before you can borrow or bid.</p>
        <p className="err" role="alert">{error}</p>
        <button className="btn" disabled={busy}>{busy ? 'Creating...' : 'Create account'}</button>
      </form>
      <p className="muted">Already registered? <Link href="/login">Sign in</Link></p>
    </main>
  );
}
