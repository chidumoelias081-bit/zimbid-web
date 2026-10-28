'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../../components/Shell';
import { useSession } from '../../lib/useSession';
import { api } from '../../lib/api';
import { ago } from '../../lib/format';

const FAQ = [
  ['How does the identity check work?', 'After you register, upload the documents listed under My documents. An admin reviews them. If something is unclear you will be asked for a better copy, and you are told on your screen. When everything is accepted, you are approved and your free month starts.'],
  ['How do bids work?', 'A borrower publishes a loan request. Banks, microfinance institutions and investors bid with an interest rate and an upfront fee. Each new bid must beat the best rate by at least 0.25 points, and the borrower accepts the one they prefer.'],
  ['Does money really move on ZimBid?', 'Not yet. In this prototype, signing, escrow, release and repayments are recorded but no real money moves. Real payments will go through a licensed partner bank and mobile money.'],
  ['What does the free month include?', 'Full access to everything for 30 days after your identity check is approved. After that, the property marketplace, bidding on loans (for lenders) and posting in the club need a paid month. Everything else stays free.'],
  ['How do I pay for a month?', 'Open Account, then Subscription. Follow the payment steps, then tell us the reference. An admin checks it and adds the days.'],
  ['Is it safe to buy property here?', 'Listings only go live after an admin sees a title deed and photos. That checks the paperwork was supplied. It does not prove ownership, so always use a registered conveyancer and check the title before paying.'],
  ['I forgot my password.', 'Password reset by email is not available yet. Send us a message below and we will help you get back in.'],
];

export default function Help() {
  const session = useSession(['borrower', 'lender']);
  const [tickets, setTickets] = useState([]);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('question');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(() => api('/support/tickets').then((d) => setTickets(d.tickets)).catch(() => {}), []);
  useEffect(() => {
    if (!session) return undefined;
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [session, load]);
  if (!session) return <p className="page muted">Loading...</p>;

  async function send(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    setError(''); setNotice('');
    try {
      await api('/support/tickets', { method: 'POST', body: { category, subject: f.get('subject'), body: f.get('body'), rating: category === 'feedback' && rating ? rating : undefined } });
      setNotice('Sent. We will reply here, and you will get a notification.');
      e.target.reset(); setRating(0); load();
    } catch (err) { setError(err.message); }
  }

  return (
    <Shell session={session}>
      <h2>Help and feedback</h2>
      <section className="box faq" style={{ marginTop: 14 }}>
        <h3>Common questions</h3>
        {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </section>

      <form onSubmit={send} className="panel">
        <h3>Write to us</h3>
        <p className="muted" style={{ margin: '4px 0 0' }}>Ask a question, report a problem, or tell us what would make ZimBid better. Please never send passwords or full ID numbers.</p>
        <div className="fields">
          <label className="field">About<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="question">A question</option><option value="problem">A problem</option><option value="feedback">Feedback</option><option value="suggestion">A suggestion</option></select></label>
          <label className="field wide">Title<input name="subject" required maxLength={120} /></label>
          <label className="field wide">Message<textarea name="body" required rows={5} maxLength={2000} /></label>
        </div>
        {category === 'feedback' && (
          <div className="field">How is ZimBid working for you?
            <div className="stars" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} className={n <= rating ? 'on' : ''} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={n <= rating} onClick={() => setRating(n)}>{'\u2605'}</button>)}</div>
          </div>
        )}
        {notice && <p className="ok" role="status">{notice}</p>}
        <p className="err" role="alert">{error}</p>
        <button className="btn">Send</button>
      </form>

      <h3 style={{ margin: '24px 0 8px' }}>Your messages</h3>
      {tickets.length === 0 ? <p className="empty">You have not written to us yet.</p> : (
        <ul className="rows">{tickets.map((t) => (
          <li key={t.id}><Link href={`/help/${t.id}`} className="row" style={{ gridTemplateColumns: 'minmax(0,2fr) 1fr 1fr 1fr' }}>
            <span className="t">{t.subject}</span>
            <span className="muted">{t.category}</span>
            <span className="pill">{t.status === 'answered' ? 'We replied' : t.status === 'closed' ? 'Closed' : 'Waiting for us'}</span>
            <span className="muted">{ago(t.updated_at)}</span>
          </Link></li>))}</ul>
      )}
    </Shell>
  );
}
