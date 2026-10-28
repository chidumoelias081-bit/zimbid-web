'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { money, pct } from '../lib/format';

const STEPS = ['Bid accepted', 'Agreement signed', 'Escrow funded', 'Funds released', 'Repaid'];
const DONE = { accepted: 1, signed: 2, funded: 3, released: 4, repaid: 5 }; // steps finished at each stage
const METHODS = ['EcoCash', 'OneMoney', 'InnBucks', 'Bank transfer'];
const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Everything that happens after a bid is accepted: sign, fund escrow, release, repay. */
export default function LoanPanel({ listingId, onChange }) {
  const [loan, setLoan] = useState(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);
  const [method, setMethod] = useState('EcoCash');
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => api(`/listings/${listingId}/loan`).then((d) => { setLoan(d); setMissing(false); }).catch((e) => { if (e.status === 404) setMissing(true); else setError(e.message); }),
    [listingId]
  );
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function act(path, body) {
    setBusy(true); setError('');
    try { setLoan(await api(`/listings/${listingId}/${path}`, { method: 'POST', body })); if (onChange) onChange(); }
    catch (e) { setError(e.message); }
    setBusy(false);
  }

  if (missing) return <p className="note">This request has been awarded to another lender.</p>;
  if (!loan) return <p className="muted">Loading the loan...</p>;

  const { you, stage, terms, listing, escrow, schedule } = loan;
  const cur = listing.currency;
  const paid = schedule.filter((r) => r.status === 'paid').length;
  const waiting = (who) => <span className="muted">Waiting for {who}.</span>;

  let action = null;
  if (stage === 'accepted') {
    action = you === 'borrower' ? (
      <>
        <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I have read the terms above and agree to repay this loan.</label>
        <button className="btn" disabled={!agree || busy} onClick={() => act('sign', {})}>Sign agreement</button>
      </>
    ) : waiting('the borrower to sign the agreement');
  } else if (stage === 'signed') {
    action = you === 'lender'
      ? <><button className="btn" disabled={busy} onClick={() => act('fund', {})}>Fund escrow with {money(cur, listing.amount)}</button><span className="muted">The money is held in escrow until the borrower confirms.</span></>
      : waiting(`${loan.lender.full_name} to fund escrow`);
  } else if (stage === 'funded') {
    action = you === 'borrower' ? (
      <>
        <label className="field">Receive the money by<select value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></label>
        <button className="btn" disabled={busy} onClick={() => act('release', { method })}>Confirm and release funds</button>
      </>
    ) : waiting('the borrower to confirm and release the funds');
  } else if (stage === 'released') {
    action = you === 'borrower' ? (
      <>
        <label className="field">Pay with<select value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></label>
        <button className="btn" disabled={busy} onClick={() => act('pay', { method })}>Pay next instalment ({money(cur, terms.monthly, 2)})</button>
      </>
    ) : <span className="muted">Instalments are paid to the lender as they fall due.</span>;
  } else if (stage === 'repaid') {
    action = <strong>Loan fully repaid.</strong>;
  }

  return (
    <section className="panel" aria-label="Loan">
      <h3>{you === 'lender' ? 'You won this request' : 'Loan agreement'}</h3>
      <p className="sim">Prototype: these steps are recorded but no real money moves. Real escrow and payments will go through a licensed partner bank and mobile money. Have a lawyer review the agreement before using it for real loans.</p>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i < DONE[stage] ? 'done' : i === DONE[stage] ? 'next' : ''}><span className="mk">{i < DONE[stage] ? '\u2713' : i + 1}</span>{s}</li>
        ))}
      </ol>
      <dl className="terms">
        <div><dt>Borrower</dt><dd>{loan.borrower.full_name}</dd></div>
        <div><dt>Lender</dt><dd>{loan.lender.full_name}</dd></div>
        <div><dt>Principal</dt><dd className="num">{money(cur, listing.amount)}</dd></div>
        <div><dt>Interest rate</dt><dd className="num">{pct(terms.rate)} a year</dd></div>
        <div><dt>Upfront fee</dt><dd className="num">{pct(terms.fee)} ({money(cur, terms.fee_amount, 2)})</dd></div>
        <div><dt>Borrower receives</dt><dd className="num">{money(cur, terms.net_payout, 2)}</dd></div>
        <div><dt>Monthly repayment</dt><dd className="num">{money(cur, terms.monthly, 2)} for {listing.term_months} months</dd></div>
        <div><dt>Total cost of credit</dt><dd className="num">{money(cur, terms.total_cost_of_credit, 2)}</dd></div>
        {loan.payout_method && <div><dt>Paid out by</dt><dd>{loan.payout_method}</dd></div>}
        {escrow && <div><dt>Escrow</dt><dd className="num">{escrow.status === 'held' ? `${money(cur, escrow.balance, 2)} held` : 'Released'}</dd></div>}
      </dl>
      {you === 'admin' && <p className="muted">Viewing as admin, read only.</p>}
      {you !== 'admin' && <div className="action">{action}</div>}
      <p className="err" role="alert">{error}</p>
      {schedule.length > 0 && (
        <>
          <h3 style={{ margin: '8px 0' }}>Repayment schedule <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{paid} of {schedule.length} paid</span></h3>
          <div className="sched"><table><thead><tr><th>Instalment</th><th>Due</th><th>Amount</th><th>Status</th></tr></thead><tbody>
            {schedule.map((r) => (<tr key={r.instalment}><td>{r.instalment}</td><td>{fmtDate(r.due_date)}</td><td className="num">{money(cur, r.amount, 2)}</td><td>{r.status === 'paid' ? 'Paid' : 'Due'}</td></tr>))}
          </tbody></table></div>
        </>
      )}
    </section>
  );
}
