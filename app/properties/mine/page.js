'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../../../components/Shell';
import { useSession } from '../../../lib/useSession';
import { api } from '../../../lib/api';
import { money, PROPERTY_STATUS, PROPERTY_TYPE } from '../../../lib/format';

export default function MyProperties() {
  const session = useSession(['borrower', 'lender']);
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!session) return undefined;
    const load = () => api('/properties/mine').then((d) => setList(d.properties)).catch((e) => setError(e.message));
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [session]);
  if (!session) return <p className="page muted">Loading...</p>;
  return (
    <Shell session={session}>
      <div className="sh"><h2>My listings</h2><span className="row-actions"><Link className="btn ghost small" href="/properties">Browse all</Link><Link className="btn small" href="/properties/new">List a property</Link></span></div>
      <p className="err" role="alert">{error}</p>
      {list && list.length === 0 && <p className="empty">You have not listed anything yet.</p>}
      <ul className="rows">
        {(list || []).map((p) => (
          <li key={p.id}><Link href={`/properties/${p.id}`} className="row">
            <span className="t">{p.title}<span className="muted sub">{PROPERTY_TYPE[p.property_type]}, {p.city}</span></span>
            <b className="num">{money(p.currency, p.asking_price)}</b>
            <span>{p.offer_count ? `${p.offer_count} ${p.offer_count === 1 ? 'offer' : 'offers'}` : 'No offers'}</span>
            <span>{p.best_offer ? 'Best ' + money(p.currency, p.best_offer) : ''}</span>
            <span className="pill">{PROPERTY_STATUS[p.status]}</span>
            <span className="muted">Open</span>
          </Link></li>
        ))}
      </ul>
    </Shell>
  );
}
