'use client';
import { api } from '../../lib/api';
import { money, ago, PLAN_STATE } from '../../lib/format';

export default function SubscriptionsTab({ data, reload, onNotice, onError }) {
  if (!data) return <p className="muted">Loading...</p>;
  const decide = async (p, decision) => {
    let note = '';
    if (decision === 'reject') { note = (window.prompt('Why could the payment not be confirmed? The member will see this.') || '').trim(); if (!note) return; }
    onError('');
    try { await api(`/admin/subscription-payments/${p.id}`, { method: 'PATCH', body: { decision, note } }); onNotice(decision === 'confirm' ? `Confirmed. 30 days were added for ${p.full_name}.` : 'Payment not confirmed. The member is told why.'); reload(); }
    catch (e) { onError(e.message); }
  };
  return (
    <>
      <div className="two" style={{ marginBottom: 16 }}>
        {['trial', 'active', 'expired', 'waiting'].map((k) => (
          <div key={k} className="box" style={{ marginBottom: 0 }}><div className="muted">{PLAN_STATE[k]}</div><div className="big num" style={{ fontSize: 26, fontWeight: 700 }}>{data.summary[k]}</div></div>
        ))}
      </div>
      <h3 style={{ margin: '0 0 8px' }}>Payments</h3>
      {data.payments.length === 0 ? <p className="empty">No payments yet.</p> : (
        <ul className="rows">{data.payments.map((p) => (
          <li key={p.id} className="row static" style={{ gridTemplateColumns: 'minmax(0,1.5fr) 1fr minmax(0,1.3fr) auto' }}>
            <span className="t">{p.full_name}<span className="muted sub">{p.email}, {p.role}</span></span>
            <span><b className="num">{money(p.currency, p.amount, 2)}</b> by {p.method}<span className="muted sub">{ago(p.created_at)}</span></span>
            <span>Reference: <b>{p.reference}</b>{p.note && <span className="muted sub">{p.note}</span>}</span>
            <span className="row-actions">
              {p.status === 'pending' ? (<><button className="btn small" onClick={() => decide(p, 'confirm')}>Confirm</button><button className="btn ghost small" onClick={() => decide(p, 'reject')}>Not received</button></>) : <span className="pill">{p.status === 'confirmed' ? 'Confirmed' : 'Not confirmed'}</span>}
            </span>
          </li>))}</ul>
      )}
    </>
  );
}
