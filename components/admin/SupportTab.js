'use client';
import Link from 'next/link';
import { ago } from '../../lib/format';

export default function SupportTab({ data }) {
  if (!data) return <p className="muted">Loading...</p>;
  const { tickets, ratings } = data;
  return (
    <>
      {ratings.count > 0 && <p className="note" style={{ marginTop: 0 }}>Feedback rating: <b>{ratings.average} out of 5</b> from {ratings.count} {ratings.count === 1 ? 'rating' : 'ratings'}.</p>}
      {tickets.length === 0 ? <p className="empty">No messages yet.</p> : (
        <ul className="rows">{tickets.map((t) => (
          <li key={t.id}><Link href={`/help/${t.id}`} className="row" style={{ gridTemplateColumns: 'minmax(0,2fr) 1fr 1fr 1fr' }}>
            <span className="t">{t.subject}<span className="muted sub">{t.user_name}, {t.user_role}</span></span>
            <span className="muted">{t.category}{t.rating ? `, ${'\u2605'.repeat(t.rating)}` : ''}</span>
            <span className="pill" style={t.status === 'open' ? { background: 'var(--gold-soft)', color: 'var(--gold)' } : undefined}>{t.status === 'open' ? 'Needs a reply' : t.status === 'answered' ? 'Replied' : 'Closed'}</span>
            <span className="muted">{ago(t.updated_at)}</span>
          </Link></li>))}</ul>
      )}
    </>
  );
}
