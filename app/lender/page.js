'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../../components/Shell';
import Countdown from '../../components/Countdown';
import { useSession } from '../../lib/useSession';
import { api } from '../../lib/api';
import { money, pct, STATUS_LABEL } from '../../lib/format';

export default function Lender() {
  const session = useSession(['lender']);
  const [listings, setListings] = useState(null);
  const [won, setWon] = useState([]);
  const [cur, setCur] = useState('all');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!session) return;
    const load = () => {
      api('/listings').then((d) => setListings(d.listings)).catch((e) => setError(e.message));
      api('/listings/won').then((d) => setWon(d.loans)).catch(() => {});
    };
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [session]);
  if (!session) return <p className="page muted">Loading...</p>;
  const shown = (listings || []).filter((l) => cur === 'all' || l.currency === cur);
  return (
    <Shell session={session}>
      <p className="promo"><Link href="/properties">Properties for sale</Link> Browse listings and make offers, or list your own.</p>
      {won.length > 0 && (
        <>
          <div className="sh"><h2>My loans</h2></div>
          <ul className="rows" style={{ marginBottom: 32 }}>
            {won.map((l) => (
              <li key={l.id}><Link href={`/listings/${l.id}`} className="row">
                <span className="t">{l.title}<span className="muted sub">{l.borrower_name}</span></span>
                <b className="num">{money(l.currency, l.amount)}</b>
                <span className="muted">{l.term_months} months</span>
                <span>{pct(l.rate)}</span>
                <span className="pill">{STATUS_LABEL[l.status]}</span>
                <span className="muted">Open</span>
              </Link></li>
            ))}
          </ul>
        </>
      )}
      <div className="sh"><h2>Open requests</h2>
        <select value={cur} onChange={(e) => setCur(e.target.value)} aria-label="Currency"><option value="all">All currencies</option><option value="USD">US$</option><option value="ZiG">ZiG</option></select></div>
      <p className="err" role="alert">{error}</p>
      {listings && shown.length === 0 && <p className="empty">No open requests right now.</p>}
      <ul className="rows">
        {shown.map((l) => (
          <li key={l.id}><Link href={`/listings/${l.id}`} className="row">
            <span className="t">{l.title}<span className="muted sub">{l.sector}</span></span>
            <b className="num">{money(l.currency, l.amount)}</b>
            <span className="muted">{l.term_months} months</span>
            <span>{l.best_rate ? 'Best ' + pct(l.best_rate) : 'No bids yet'}</span>
            <span className="pill"><Countdown closesAt={l.closes_at} status={l.status} /></span>
          </Link></li>
        ))}
      </ul>
    </Shell>
  );
}
