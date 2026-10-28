'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { useSession } from '../../lib/useSession';
import { api } from '../../lib/api';
import { ago } from '../../lib/format';

const STATUS = { pending: 'Waiting for approval', approved: 'Verified member', info_requested: 'Sending documents', rejected: 'Not approved' };

export default function Invite() {
  const session = useSession(['borrower', 'lender']);
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  useEffect(() => {
    if (!session) return undefined;
    const load = () => api('/account/invites').then(setD).catch((e) => setError(e.message));
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [session]);
  if (!session) return <p className="page muted">Loading...</p>;
  const link = d ? `${window.location.origin}${d.path}` : '';
  const message = `Join me on ZimBid, where banks and lenders compete for your business and members buy and sell property. Use my invite code ${d ? d.code : ''}: ${link}`;
  const copy = async (text, what) => { try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 2500); } catch { setError('Could not copy. Select the text and copy it yourself.'); } };

  return (
    <Shell session={session}>
      <h2>Invite others</h2>
      <p className="muted" style={{ margin: '6px 0 16px' }}>Know a business that needs finance, or a lender or investor? Share your invite link. You will see here when they join and when they are approved.</p>
      <p className="err" role="alert">{error}</p>
      {d && (
        <>
          <section className="box">
            <h3>Your invite code</h3>
            <div className="stateline"><span className="big num" style={{ letterSpacing: '.08em' }}>{d.code}</span></div>
            <div className="copyrow" style={{ marginTop: 12 }}>
              <input readOnly value={link} aria-label="Your invite link" onFocus={(e) => e.target.select()} />
              <button className="btn" onClick={() => copy(link, 'link')}>{copied === 'link' ? 'Copied' : 'Copy link'}</button>
              <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
            </div>
          </section>
          <h3 style={{ margin: '22px 0 8px' }}>People you invited ({d.invitees.length})</h3>
          {d.invitees.length === 0 ? <p className="empty">Nobody has used your code yet.</p> : (
            <ul className="rows">{d.invitees.map((i, n) => (
              <li key={n} className="row static" style={{ gridTemplateColumns: 'minmax(0,1.5fr) 1fr 1fr 1fr' }}>
                <span className="t">{i.full_name}</span><span className="muted">{i.role}</span><span className="pill">{STATUS[i.kyc_status]}</span><span className="muted">{ago(i.created_at)}</span>
              </li>))}</ul>
          )}
        </>
      )}
    </Shell>
  );
}
