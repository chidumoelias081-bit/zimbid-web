'use client';
import { useCallback, useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { useSession } from '../../lib/useSession';
import { api } from '../../lib/api';
import { money, fullDate, ago, PLAN_STATE } from '../../lib/format';

const PAY_STATUS = { pending: 'Waiting for the admin to check', confirmed: 'Confirmed', rejected: 'Not confirmed' };

export default function Subscription() {
  const session = useSession(['borrower', 'lender']);
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(() => api('/account/subscription').then(setS).catch((e) => setError(e.message)), []);
  useEffect(() => {
    if (!session) return undefined;
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [session, load]);
  if (!session) return <p className="page muted">Loading...</p>;

  async function claim(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    setError(''); setNotice('');
    try {
      setS(await api('/account/subscription/payments', { method: 'POST', body: { method: f.get('method'), reference: f.get('reference') } }));
      setNotice('Thank you. The admin will check your payment and add your month.');
      e.target.reset();
    } catch (err) { setError(err.message); }
  }

  return (
    <Shell session={session}>
      <h2>Subscription</h2>
      {s && (
        <>
          <section className="box" style={{ marginTop: 14 }}>
            <div className="stateline">
              <span className="big">{PLAN_STATE[s.state]}</span>
              {['trial', 'active'].includes(s.state) && <span>{s.days_left} {s.days_left === 1 ? 'day' : 'days'} left, until {fullDate(s.access_until)}</span>}
              {s.state === 'expired' && <span className="err" style={{ margin: 0 }}>Ended {s.access_until ? fullDate(s.access_until) : ''}</span>}
            </div>
            <p className="muted" style={{ margin: '8px 0 0' }}>
              {s.state === 'waiting' && s.message}
              {s.state === 'trial' && `Every member gets ${s.trial_days} days of full access, free. It started when your identity check was approved.`}
              {s.state === 'active' && 'Thank you for subscribing. Paying again adds another month on top of what is left.'}
              {s.state === 'expired' && s.message}
            </p>
            {!s.enforced && <p className="sim">Testing mode: the plan is not being enforced, so everything is open.</p>}
          </section>

          <div className="two">
            <section className="box">
              <h3>What the plan covers</h3>
              <ul style={{ margin: '6px 0 10px', paddingLeft: 18 }}>{s.premium.map((f) => <li key={f}>{f}</li>)}</ul>
              <p className="muted" style={{ margin: 0 }}>Everything else stays free: your account, documents, loan requests, notifications, Help and reading the club.</p>
            </section>
            <section className="box">
              <h3>Price</h3>
              <div className="stateline"><span className="big">{money(s.price.currency, s.price.amount, 2)}</span><span className="muted">for {s.paid_days} days</span></div>
              <p className="muted" style={{ margin: '8px 0 0' }}>Payments add to the time you have left, so paying early never wastes days.</p>
            </section>
          </div>

          <form onSubmit={claim} className="panel">
            <h3>Pay for a month</h3>
            <ol style={{ paddingLeft: 18 }}>
              <li>{s.how_to_pay}</li>
              <li>Come back here and tell us how you paid and the payment reference.</li>
              <li>An admin checks it and adds {s.paid_days} days to your plan.</li>
            </ol>
            <div className="fields">
              <label className="field">How you paid<select name="method">{s.methods.map((m) => <option key={m}>{m}</option>)}</select></label>
              <label className="field">Payment reference or transaction code<input name="reference" required minLength={4} maxLength={100} /></label>
            </div>
            {notice && <p className="ok" role="status">{notice}</p>}
            <p className="err" role="alert">{error}</p>
            <button className="btn">I have paid</button>
          </form>

          {s.payments.length > 0 && (
            <>
              <h3 style={{ margin: '24px 0 8px' }}>Your payments</h3>
              <ul className="rows">{s.payments.map((p) => (
                <li key={p.id} className="row static" style={{ gridTemplateColumns: 'minmax(0,1.4fr) 1fr minmax(0,1.4fr)' }}>
                  <span><b className="num">{money(p.currency, p.amount, 2)}</b> by {p.method}<span className="muted sub">{p.reference}, {ago(p.created_at)}</span></span>
                  <span className="pill">{PAY_STATUS[p.status]}</span>
                  <span className="muted">{p.note}</span>
                </li>))}</ul>
            </>
          )}
        </>
      )}
      <p className="err" role="alert">{!s ? error : ''}</p>
    </Shell>
  );
}
