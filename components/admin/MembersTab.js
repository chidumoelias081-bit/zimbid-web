'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { fullDate, PLAN_STATE } from '../../lib/format';

export default function MembersTab({ onNotice, onError }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const load = useCallback(() => api(`/admin/members?search=${encodeURIComponent(q)}`).then((d) => setList(d.members)).catch((e) => onError(e.message)), [q, onError]);
  useEffect(() => {
    const t0 = setTimeout(load, 250);
    const t = setInterval(load, 8000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [load]);

  const act = async (fn, message) => { onError(''); try { await fn(); onNotice(message); load(); } catch (e) { onError(e.message); } };
  const suspend = (m) => window.confirm(`Suspend ${m.full_name}? They are signed out straight away and cannot sign in.`) && act(() => api(`/admin/members/${m.id}`, { method: 'PATCH', body: { action: 'suspend' } }), `${m.full_name} is suspended.`);
  const restore = (m) => act(() => api(`/admin/members/${m.id}`, { method: 'PATCH', body: { action: 'restore' } }), `${m.full_name} can sign in again.`);
  const grant = (m) => {
    const days = Number(window.prompt(`How many days should be added to ${m.full_name}'s plan? (1 to 365)`, '30'));
    if (!days) return;
    act(() => api(`/admin/members/${m.id}/grant`, { method: 'POST', body: { days } }), `Added ${days} days to ${m.full_name}.`);
  };

  return (
    <>
      <label className="field" style={{ maxWidth: 420, marginBottom: 12 }}>Search by name, email or organisation<input value={q} onChange={(e) => setQ(e.target.value)} /></label>
      {list.length === 0 ? <p className="empty">No members found.</p> : (
        <ul className="rows">{list.map((m) => (
          <li key={m.id} className="row static" style={{ gridTemplateColumns: 'minmax(0,1.6fr) 0.7fr 1fr 1.1fr auto' }}>
            <span className="t">{m.full_name} {m.suspended_at && <em className="tag warn">Suspended</em>}<span className="muted sub">{m.email}{m.organisation ? `, ${m.organisation}` : ''}</span></span>
            <span className="muted">{m.role}</span>
            <span>{m.kyc_status === 'approved' ? 'Verified' : m.kyc_status}<span className="muted sub">Joined {fullDate(m.created_at)}</span></span>
            <span>{PLAN_STATE[m.plan.state]}{['trial', 'active'].includes(m.plan.state) ? ` (${m.plan.days_left} days left)` : ''}</span>
            <span className="row-actions">
              <button className="btn ghost small" onClick={() => grant(m)}>Add days</button>
              {m.suspended_at ? <button className="btn small" onClick={() => restore(m)}>Restore</button> : <button className="btn ghost small" onClick={() => suspend(m)}>Suspend</button>}
            </span>
          </li>))}</ul>
      )}
    </>
  );
}
