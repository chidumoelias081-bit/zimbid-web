'use client';
import { money, pct } from '../lib/format';

export default function Ladder({ listing, bids, meId, canAccept, onAccept }) {
  if (!bids.length) return <p className="empty">No bids yet. Lenders can bid until bidding closes.</p>;
  const max = Math.max(1, ...bids.map((b) => Number(b.rate)));
  return (
    <ol className="ladder">
      {bids.map((b, i) => (
        <li key={b.id} className={`bid${i === 0 ? ' best' : ''}${b.bidder_id === meId ? ' mine' : ''}`} style={{ '--w': `${(Number(b.rate) / max) * 100}%` }}>
          <span className="rk">{i + 1}</span>
          <span className="who"><b>{b.bidder_name}</b>{b.bidder_id === meId && <em className="tag you">Your bid</em>}{listing.winner_bid_id === b.id && <em className="tag good">Selected</em>}</span>
          <span className="rate num">{pct(b.rate)}</span>
          <span className="sm"><span className="muted">Upfront fee</span>{Number(b.fee).toFixed(2)}%</span>
          <span className="sm"><span className="muted">Monthly repayment</span><span className="num">{money(listing.currency, b.monthly, 2)}</span></span>
          <span className="act">{canAccept && <button className="btn small" onClick={() => onAccept(b)}>Accept</button>}</span>
        </li>
      ))}
    </ol>
  );
}
