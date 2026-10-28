'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Shell from '../../../components/Shell';
import Ladder from '../../../components/Ladder';
import Countdown from '../../../components/Countdown';
import LoanPanel from '../../../components/LoanPanel';
import { useSession } from '../../../lib/useSession';
import { api, homeFor } from '../../../lib/api';
import { money, pct, STATUS_LABEL } from '../../../lib/format';

export default function ListingPage() {
  const { id } = useParams();
  const session = useSession(['borrower', 'lender', 'admin']);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(() => api(`/listings/${id}`).then(setData).catch((e) => setError(e.message)), [id]);
  useEffect(() => {
    if (!session) return;
    load();
    const t = setInterval(load, 5000); // pick up new bids
    return () => clearInterval(t);
  }, [session, load]);
  if (!session) return <p className="page muted">Loading...</p>;
  const me = session.user;
  if (!data) return <Shell session={session}><p className="err">{error}</p><p className="muted">Loading...</p></Shell>;

  const { listing, bids } = data;
  const best = bids[0];
  const isOwner = me.role === 'borrower' && listing.owner_id === me.id;
  const biddingOpen = listing.status === 'open' && new Date(listing.closes_at) > new Date();

  async function accept(b) {
    if (!window.confirm(`Accept ${b.bidder_name} at ${pct(b.rate)}? Bidding ends immediately.`)) return;
    setError('');
    try { await api(`/listings/${id}/accept`, { method: 'POST', body: { bid_id: b.id } }); setNotice('Bid accepted.'); load(); }
    catch (err) { setError(err.message); }
  }
  async function bid(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    setError(''); setNotice('');
    try {
      const r = await api(`/listings/${id}/bids`, { method: 'POST', body: { rate: Number(f.get('rate')), fee: Number(f.get('fee')) } });
      setNotice(r.held ? 'Bid held for review. The rate is far below usual, so an admin checks it first.' : 'Bid placed.');
      e.target.reset(); load();
    } catch (err) { setError(err.message); }
  }

  return (
    <Shell session={session}>
      <Link href={homeFor(me.role)} className="back">Back to requests</Link>
      <h2>{listing.title}</h2>
      <p className="muted">{listing.sector}</p>
      <dl className="facts">
        <div><dt>Amount</dt><dd className="num">{money(listing.currency, listing.amount)}</dd></div>
        <div><dt>Term</dt><dd>{listing.term_months} months</dd></div>
        <div><dt>Bidding closes in</dt><dd><Countdown closesAt={listing.closes_at} status={listing.status} /></dd></div>
        <div><dt>Best rate</dt><dd className="num">{best ? pct(best.rate) + ' a year' : 'None yet'}</dd></div>
      </dl>
      <div className="sh"><h3>Bids, lowest rate first</h3><span className="muted">{bids.length} {bids.length === 1 ? 'bid' : 'bids'}</span></div>
      <Ladder listing={listing} bids={bids} meId={me.id} canAccept={isOwner && ['open', 'closed'].includes(listing.status)} onAccept={accept} />
      {notice && <p className="ok" role="status">{notice}</p>}
      <p className="err" role="alert">{error}</p>
      {['awarded', 'funded', 'released', 'repaid'].includes(listing.status) && <LoanPanel listingId={id} onChange={load} />}
      {isOwner && ['open', 'closed'].includes(listing.status) && <p className="note">Choose a bid to accept. Accepting ends bidding straight away.</p>}
      {me.role === 'lender' && biddingOpen && (
        <form onSubmit={bid} className="panel">
          <h3>Place a bid</h3>
          <p className="muted">{best ? `Current best rate is ${pct(best.rate)}. Bid ${pct(Number(best.rate) - 0.25)} or lower to take the lead.` : `No bids yet. Opening bids must be ${pct(listing.start_rate)} or lower.`}</p>
          <div className="fields">
            <label className="field">Annual interest rate (%)<input name="rate" type="number" step="0.25" min="1" max="100" required /></label>
            <label className="field">Upfront fee (%)<input name="fee" type="number" step="0.25" min="0" max="5" defaultValue="1" /></label>
          </div>
          <button className="btn">Place bid</button>
        </form>
      )}
      {me.role === 'lender' && !biddingOpen && ['open', 'closed'].includes(listing.status) && <p className="note">Bidding has closed on this request.</p>}
    </Shell>
  );
}
