'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../../components/Shell';
import Countdown from '../../components/Countdown';
import { useSession } from '../../lib/useSession';
import { api } from '../../lib/api';
import { money, pct, STATUS_LABEL } from '../../lib/format';

export default function Borrower() {
  const session = useSession(['borrower']);
  const [listings, setListings] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => api('/listings/mine').then((d) => setListings(d.listings)).catch((e) => setError(e.message)), []);
  useEffect(() => {
    if (!session) return;
    load();
    const t = setInterval(load, 5000); // pick up new bids without a refresh
    return () => clearInterval(t);
  }, [session, load]);
  if (!session) return <p className="page muted">Loading...</p>;

  async function create(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    setError('');
    try {
      await api('/listings', { method: 'POST', body: { title: f.title, sector: f.sector, currency: f.currency, amount: Number(f.amount), term_months: Number(f.term_months), window_hours: Number(f.window_hours) } });
      setOpen(false); load();
    } catch (err) { setError(err.message); }
  }

  return (
    <Shell session={session}>
      <p className="promo"><Link href="/properties">Properties for sale</Link> Browse listings and make offers, or list your own.</p>
      <div className="sh"><h2>My loan requests</h2><button className="btn" onClick={() => setOpen(!open)}>{open ? 'Cancel' : 'New loan request'}</button></div>
      {open && (
        <form onSubmit={create} className="panel">
          <div className="fields">
            <label className="field wide">What is the money for?<input name="title" required maxLength={60} placeholder="For example: Cold room for tomato exports" /></label>
            <label className="field">Sector<select name="sector"><option>Agriculture</option><option>Retail</option><option>Transport</option><option>Manufacturing</option><option>Services</option><option>Other</option></select></label>
            <label className="field">Currency<select name="currency"><option value="USD">US$</option><option value="ZiG">ZiG</option></select></label>
            <label className="field">Amount<input name="amount" type="number" min="1" required /></label>
            <label className="field">Term<select name="term_months" defaultValue="24"><option value="6">6 months</option><option value="12">12 months</option><option value="18">18 months</option><option value="24">24 months</option><option value="36">36 months</option></select></label>
            <label className="field">Bidding stays open for<select name="window_hours" defaultValue="24"><option value="1">1 hour</option><option value="24">24 hours</option><option value="72">3 days</option></select></label>
          </div>
          <button className="btn">Publish request</button>
        </form>
      )}
      <p className="err" role="alert">{error}</p>
      {listings && listings.length === 0 && <p className="empty">No requests yet. Publish one and lenders can start bidding.</p>}
      <ul className="rows">
        {(listings || []).map((l) => (
          <li key={l.id}><Link href={`/listings/${l.id}`} className="row">
            <span className="t">{l.title}</span>
            <b className="num">{money(l.currency, l.amount)}</b>
            <span className="muted">{l.term_months} months</span>
            <span>{l.best_rate ? 'Best ' + pct(l.best_rate) : 'No bids yet'}</span>
            <span className="pill"><Countdown closesAt={l.closes_at} status={l.status} /></span>
            <span className="muted">{STATUS_LABEL[l.status]}</span>
          </Link></li>
        ))}
      </ul>
    </Shell>
  );
}
