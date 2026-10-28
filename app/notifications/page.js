'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '../../components/Shell';
import { useSession } from '../../lib/useSession';
import { api } from '../../lib/api';
import { ago } from '../../lib/format';

export default function Notifications() {
  const session = useSession(['borrower', 'lender', 'admin']);
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api('/notifications').then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => {
    if (!session) return undefined;
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [session, load]);
  if (!session) return <p className="page muted">Loading...</p>;

  async function open(n) {
    if (!n.read_at) await api('/notifications/read', { method: 'POST', body: { ids: [n.id] } }).catch(() => {});
    if (n.link) router.push(n.link); else load();
  }
  async function markAll() { setError(''); try { await api('/notifications/read', { method: 'POST', body: {} }); load(); } catch (e) { setError(e.message); } }

  return (
    <Shell session={session}>
      <div className="sh"><h2>Notifications</h2>{data && data.unread > 0 && <button className="btn ghost small" onClick={markAll}>Mark all as read ({data.unread})</button>}</div>
      <p className="err" role="alert">{error}</p>
      {data && data.notifications.length === 0 && <p className="empty">Nothing yet. You will be told here when something happens: bids, loan steps, properties, replies and more. You can choose what you hear about under Account.</p>}
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {(data ? data.notifications : []).map((n) => (
          <button key={n.id} className={`nrow${n.read_at ? '' : ' unread'}`} onClick={() => open(n)}>
            <span className="dot" aria-hidden="true" />
            <span><span className="nt">{n.title}</span>{n.body && <span className="nb" style={{ display: 'block' }}>{n.body}</span>}</span>
            <span className="when muted">{ago(n.created_at)}</span>
          </button>
        ))}
      </div>
    </Shell>
  );
}
