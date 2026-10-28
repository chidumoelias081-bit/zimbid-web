'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../../components/Shell';
import Countdown from '../../components/Countdown';
import AuthImage from '../../components/AuthImage';
import Paywall from '../../components/Paywall';
import { useSession } from '../../lib/useSession';
import { api } from '../../lib/api';
import { money, PROPERTY_TYPE } from '../../lib/format';

export default function Properties() {
  const session = useSession(['borrower', 'lender', 'admin']);
  const [list, setList] = useState(null);
  const [type, setType] = useState('');
  const [currency, setCurrency] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [locked, setLocked] = useState('');
  useEffect(() => {
    if (!session) return undefined;
    const q = new URLSearchParams();
    if (type) q.set('type', type);
    if (currency) q.set('currency', currency);
    if (city.trim()) q.set('city', city.trim());
    const load = () => api(`/properties?${q}`).then((d) => { setList(d.properties); setLocked(''); }).catch((e) => (e.status === 402 ? setLocked(e.message) : setError(e.message)));
    const t0 = setTimeout(load, 250); // wait a moment while the visitor is still typing
    const t = setInterval(load, 10000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [session, type, currency, city]);
  if (!session) return <p className="page muted">Loading...</p>;
  const member = session.user.role !== 'admin';
  return (
    <Shell session={session}>
      <div className="sh"><h2>Properties for sale</h2>
        {member && <span className="row-actions"><Link className="btn ghost small" href="/properties/mine">My listings</Link><Link className="btn small" href="/properties/new">List a property</Link></span>}
      </div>
      {locked ? <Paywall message={locked} /> : <>
      <p className="sim">Prototype: offers here are not binding and no money moves. Always verify the title and use a registered conveyancer before paying for any property.</p>
      <div className="fields" style={{ marginTop: 0 }}>
        <label className="field">Type<select value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{Object.entries(PROPERTY_TYPE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="field">Currency<select value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="">All</option><option value="USD">US$</option><option value="ZiG">ZiG</option></select></label>
        <label className="field">City or suburb<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="For example: Harare" /></label>
      </div>
      <p className="err" role="alert">{error}</p>
      {list && list.length === 0 && <p className="empty">No properties match. Try different filters, or list the first one.</p>}
      <div className="cards">
        {(list || []).map((p) => (
          <Link key={p.id} href={`/properties/${p.id}`} className="pcard">
            <AuthImage fileId={p.cover_file_id} alt={p.title} className="cover" />
            <div className="pbody">
              <div className="pprice num">{money(p.currency, p.asking_price)} {p.status === 'under_offer' && <em className="tag warn">Under offer</em>}</div>
              <div className="t">{p.title}</div>
              <div className="muted">{PROPERTY_TYPE[p.property_type]}, {[p.suburb, p.city].filter(Boolean).join(', ')}{p.bedrooms !== null && p.bedrooms !== undefined ? `, ${p.bedrooms} bed` : ''}</div>
              <div className="pmeta">
                <span>{p.offer_count ? `${p.offer_count} ${p.offer_count === 1 ? 'offer' : 'offers'}, best ${money(p.currency, p.best_offer)}` : 'No offers yet'}</span>
                {p.status === 'live' && <span className="pill"><Countdown closesAt={p.closes_at} status="open" /></span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
      </>}
    </Shell>
  );
}
