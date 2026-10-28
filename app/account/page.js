'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../../components/Shell';
import { useSession } from '../../lib/useSession';
import { api } from '../../lib/api';

export default function Account() {
  const session = useSession(['borrower', 'lender', 'admin']);
  const [p, setP] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [pwNotice, setPwNotice] = useState('');
  const [pwError, setPwError] = useState('');
  useEffect(() => { if (session) api('/account/profile').then(setP).catch((e) => setError(e.message)); }, [session]);
  if (!session) return <p className="page muted">Loading...</p>;
  const member = session.user.role !== 'admin';

  async function save(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const prefs = {};
    for (const k of Object.keys(p.notification_categories)) if (k !== 'account') prefs[k] = f.get(`pref_${k}`) === 'on';
    setError(''); setNotice('');
    try {
      setP(await api('/account/profile', { method: 'PATCH', body: { full_name: f.get('full_name'), phone: f.get('phone'), organisation: f.get('organisation'), city: f.get('city'), bio: f.get('bio'), notify_prefs: prefs } }));
      setNotice('Saved.');
    } catch (err) { setError(err.message); }
  }
  async function changePassword(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    setPwError(''); setPwNotice('');
    try {
      await api('/account/password', { method: 'POST', body: { current_password: f.get('current_password'), new_password: f.get('new_password') } });
      setPwNotice('Password changed. Use the new one next time you sign in.');
      e.target.reset();
    } catch (err) { setPwError(err.message); }
  }

  return (
    <Shell session={session}>
      <h2>Account</h2>
      {member && (
        <div className="two" style={{ margin: '14px 0' }}>
          <Link className="box" href="/documents" style={{ textDecoration: 'none', color: 'inherit' }}><b>My documents</b><div className="muted">Identity documents and their review status</div></Link>
          <Link className="box" href="/subscription" style={{ textDecoration: 'none', color: 'inherit' }}><b>Subscription</b><div className="muted">Your plan, free month and payments</div></Link>
          <Link className="box" href="/invite" style={{ textDecoration: 'none', color: 'inherit' }}><b>Invite others</b><div className="muted">Share your invite code and see who joined</div></Link>
          <Link className="box" href="/properties/mine" style={{ textDecoration: 'none', color: 'inherit' }}><b>My property listings</b><div className="muted">Properties you are selling</div></Link>
        </div>
      )}
      {p && (
        <form onSubmit={save} className="panel">
          <h3>Your profile</h3>
          <p className="muted" style={{ margin: '4px 0 0' }}>Other members see your name, organisation, city and short bio in the club. Your email and phone stay private. To change your email, ask under Help.</p>
          <div className="fields">
            <label className="field">Full name or institution<input name="full_name" required maxLength={200} defaultValue={p.full_name} /></label>
            <label className="field">Email<input value={p.email} disabled readOnly /></label>
            <label className="field">Phone<input name="phone" type="tel" maxLength={40} defaultValue={p.phone || ''} /></label>
            <label className="field">Business or organisation<input name="organisation" maxLength={120} defaultValue={p.organisation || ''} /></label>
            <label className="field">City or town<input name="city" maxLength={80} defaultValue={p.city || ''} /></label>
            <label className="field wide">Short bio<textarea name="bio" rows={3} maxLength={500} defaultValue={p.bio || ''} placeholder="What you do, in a sentence or two" /></label>
          </div>
          <h3 style={{ marginTop: 18 }}>Notifications</h3>
          <p className="muted" style={{ margin: '4px 0 8px' }}>Choose what you want to hear about. Notices about your identity check, security and plan always arrive.</p>
          <div className="checks">
            {Object.entries(p.notification_categories).map(([k, label]) => (
              <label key={k}><input type="checkbox" name={`pref_${k}`} defaultChecked={p.notify_prefs[k]} disabled={k === 'account'} /> {label}{k === 'account' ? ' (always on)' : ''}</label>
            ))}
          </div>
          {notice && <p className="ok" role="status">{notice}</p>}
          <p className="err" role="alert">{error}</p>
          <button className="btn">Save changes</button>
        </form>
      )}
      <form onSubmit={changePassword} className="panel">
        <h3>Change password</h3>
        <div className="fields">
          <label className="field">Current password<input name="current_password" type="password" required autoComplete="current-password" /></label>
          <label className="field">New password (8 characters or more)<input name="new_password" type="password" minLength={8} required autoComplete="new-password" /></label>
        </div>
        {pwNotice && <p className="ok" role="status">{pwNotice}</p>}
        <p className="err" role="alert">{pwError}</p>
        <button className="btn">Change password</button>
      </form>
    </Shell>
  );
}
