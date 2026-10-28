'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Shell from '../../../components/Shell';
import { useSession } from '../../../lib/useSession';
import { api } from '../../../lib/api';
import { ago } from '../../../lib/format';

export default function Ticket() {
  const { id } = useParams();
  const session = useSession(['borrower', 'lender', 'admin']);
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api(`/support/tickets/${id}`).then(setD).catch((e) => setError(e.message)), [id]);
  useEffect(() => {
    if (!session) return undefined;
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [session, load]);
  if (!session) return <p className="page muted">Loading...</p>;
  const admin = session.user.role === 'admin';

  async function reply(e) {
    e.preventDefault();
    const form = e.target;
    setError('');
    try { setD(await api(`/support/tickets/${id}/messages`, { method: 'POST', body: { body: new FormData(form).get('body') } })); form.reset(); }
    catch (err) { setError(err.message); }
  }
  async function close() { setError(''); try { setD(await api(`/support/tickets/${id}/close`, { method: 'POST', body: {} })); } catch (err) { setError(err.message); } }

  return (
    <Shell session={session}>
      <Link href={admin ? '/admin' : '/help'} className="back">Back</Link>
      <p className="err" role="alert">{error}</p>
      {d && (
        <>
          <div className="sh" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2>{d.ticket.subject}</h2>
              <p className="muted" style={{ margin: '4px 0 0' }}>{d.ticket.category}{admin ? `, from ${d.ticket.user_name} (${d.ticket.user_role}, ${d.ticket.user_email})` : ''}{d.ticket.rating ? `, rated ${'\u2605'.repeat(d.ticket.rating)}` : ''}</p>
            </div>
            <span className="pill">{d.ticket.status === 'answered' ? 'Replied' : d.ticket.status === 'closed' ? 'Closed' : 'Open'}</span>
          </div>
          <div style={{ margin: '16px 0' }}>
            {d.messages.map((m) => (
              <div key={m.id} className={`msg ${m.is_staff ? 'staff' : 'you'}`} style={!m.is_staff && admin ? undefined : undefined}>
                <div className="meta">{m.is_staff ? 'ZimBid team' : m.sender_name}, {ago(m.created_at)}</div>
                <p>{m.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={reply} className="panel" style={{ marginTop: 0 }}>
            <label className="field">{d.ticket.status === 'closed' ? 'This message is closed. Writing again reopens it.' : 'Your reply'}<textarea name="body" required rows={3} maxLength={2000} /></label>
            <div className="action" style={{ marginTop: 10 }}>
              <button className="btn">{admin ? 'Send reply' : 'Send'}</button>
              {d.ticket.status !== 'closed' && <button type="button" className="btn ghost" onClick={close}>Mark as closed</button>}
            </div>
          </form>
        </>
      )}
    </Shell>
  );
}
