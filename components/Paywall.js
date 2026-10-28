import Link from 'next/link';

/** Shown instead of a premium page when the member's plan has ended. */
export default function Paywall({ message }) {
  return (
    <section className="panel">
      <h3>This part of ZimBid needs an active plan</h3>
      <p className="muted">{message || 'Your free month has ended.'} Subscribe for a month to carry on, or contact Help if you think this is a mistake.</p>
      <div className="action"><Link className="btn" href="/subscription">See how to subscribe</Link><Link className="btn ghost" href="/help">Ask for help</Link></div>
    </section>
  );
}
