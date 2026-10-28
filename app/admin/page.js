'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../../components/Shell';
import MembersTab from '../../components/admin/MembersTab';
import SubscriptionsTab from '../../components/admin/SubscriptionsTab';
import SupportTab from '../../components/admin/SupportTab';
import ClubTab from '../../components/admin/ClubTab';
import { useSession } from '../../lib/useSession';
import { api, openProtectedFile } from '../../lib/api';
import { money, pct, STATUS_LABEL, fileSize, PROPERTY_STATUS } from '../../lib/format';

const DOC_STATUS = { uploaded: 'Uploaded', accepted: 'Accepted', rejected: 'Rejected' };
const nice = (t) => String(t || '').replace(/_/g, ' ');
const KYC_LABEL = { pending: 'Waiting for review', info_requested: 'Documents requested', rejected: 'Rejected', approved: 'Approved' };

function describe(a) {
  const d = a.detail || {};
  const target = a.target_name ? ` for ${a.target_name}` : '';
  const on = d.title ? ` on "${d.title}"` : '';
  switch (a.action) {
    case 'user.registered': return `registered as a ${d.role}`;
    case 'listing.created': return `published a request for ${d.currency === 'USD' ? 'US$' : 'ZiG'} ${Number(d.amount).toLocaleString('en-GB')}: "${d.title}"`;
    case 'bid.placed': return `placed a bid of ${pct(d.rate)}${on}`;
    case 'bid.held': return `placed a bid of ${pct(d.rate)}${on}, held for review`;
    case 'bid.accepted': return `accepted a bid of ${pct(d.rate)}${on}`;
    case 'bid.approved': return 'approved a held bid';
    case 'bid.rejected': return 'rejected a held bid';
    case 'kyc.approved': return `approved an identity check${target}`;
    case 'kyc.rejected': return `rejected an identity check${target}`;
    case 'kyc.info_requested': return `asked for more documents${target}`;
    case 'agreement.signed': return `signed the loan agreement for "${d.title}"`;
    case 'escrow.funded': return `funded escrow with ${d.currency === 'USD' ? 'US$' : 'ZiG'} ${Number(d.amount).toLocaleString('en-GB')} for "${d.title}"`;
    case 'escrow.released': return `confirmed the terms were met and released the funds (${d.method}) for "${d.title}"`;
    case 'repayment.paid': return `paid instalment ${d.instalment} of ${d.of} on "${d.title}"`;
    case 'kyc.document_uploaded': return `uploaded a document (${nice(d.doc_type)})`;
    case 'kyc.document_accepted': return `accepted a document (${nice(d.doc_type)})${target}`;
    case 'kyc.document_rejected': return `rejected a document (${nice(d.doc_type)})${target}${d.note ? ': ' + d.note : ''}`;
    case 'property.created': return `started a property listing: "${d.title}"`;
    case 'property.photo_added': return `added a photo to "${d.title}"`;
    case 'property.title_deed_uploaded': return `uploaded a title deed for "${d.title}"`;
    case 'property.submitted': return `submitted "${d.title}" for review`;
    case 'property.approved': return `approved the property listing "${d.title}"`;
    case 'property.rejected': return `sent back the property listing "${d.title}"${d.note ? ': ' + d.note : ''}`;
    case 'property.withdrawn': return `withdrew the property listing "${d.title}"`;
    case 'property.offer_made': return `made an offer of ${d.currency === 'USD' ? 'US$' : 'ZiG'} ${Number(d.amount).toLocaleString('en-GB')} on "${d.title}"`;
    case 'property.offer_withdrawn': return `withdrew an offer on "${d.title}"`;
    case 'property.offer_accepted': return `accepted an offer of ${d.currency === 'USD' ? 'US$' : 'ZiG'} ${Number(d.amount).toLocaleString('en-GB')} on "${d.title}"`;
    case 'property.reopened': return `reopened "${d.title}" for offers`;
    case 'property.sold': return `marked "${d.title}" as sold`;
    case 'account.profile_updated': return 'updated their profile';
    case 'account.password_changed': return 'changed their password';
    case 'subscription.payment_submitted': return `said they paid for a month (${d.method})`;
    case 'subscription.payment_confirmed': return `confirmed a subscription payment${target}`;
    case 'subscription.payment_rejected': return `could not confirm a subscription payment${target}`;
    case 'subscription.granted': return `added ${d.days} days to a plan${target}`;
    case 'member.suspended': return `suspended a member${target}`;
    case 'member.restored': return `restored a member${target}`;
    case 'club.post_removed': return `removed a club post${target}${d.excerpt ? ': ' + d.excerpt : ''}`;
    case 'support.replied': return `replied to "${d.subject}"${target}`;
    case 'admin.created': return 'was created as an admin';
    default: return a.action;
  }
}

export default function Admin() {
  const session = useSession(['admin']);
  const [tab, setTab] = useState('kyc');
  const [users, setUsers] = useState([]);
  const [held, setHeld] = useState([]);
  const [listings, setListings] = useState([]);
  const [activity, setActivity] = useState([]);
  const [props, setProps] = useState([]);
  const [subs, setSubs] = useState(null);
  const [support, setSupport] = useState(null);
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    try {
      const [k, h, l, a, pr, sb, sp, rp] = await Promise.all([api('/admin/kyc'), api('/admin/held-bids'), api('/admin/listings'), api('/admin/activity'), api('/admin/properties'), api('/admin/subscriptions'), api('/support/admin/tickets'), api('/club/reports')]);
      setUsers(k.users); setHeld(h.bids); setListings(l.listings); setActivity(a.activity); setProps(pr.properties); setSubs(sb); setSupport(sp); setReports(rp.reports);
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => {
    if (!session) return;
    load();
    const t = setInterval(load, 5000); // new bids and sign-ups appear by themselves
    return () => clearInterval(t);
  }, [session, load]);
  if (!session) return <p className="page muted">Loading...</p>;

  const act = (fn, message) => async () => {
    setError(''); setNotice('');
    try { await fn(); setNotice(message); load(); } catch (e) { setError(e.message); }
  };
  const kyc = (u, status, message) => act(() => api(`/admin/users/${u.id}/kyc`, { method: 'PATCH', body: { status, note: notes[u.id] || '' } }), message);
  const view = async (d) => { setError(''); try { await openProtectedFile(`/kyc/documents/${d.id}/file`); } catch (e) { setError(e.message); } };
  const rejectDoc = (d) => {
    const note = window.prompt(`Why is the ${d.label} rejected? The applicant will see this.`);
    if (!note || !note.trim()) return;
    act(() => api(`/admin/kyc-documents/${d.id}`, { method: 'PATCH', body: { status: 'rejected', note: note.trim() } }), 'Document rejected. The applicant is asked to upload a new one.')();
  };

  return (
    <Shell session={session}>
      <h2>Admin</h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'kyc'} onClick={() => setTab('kyc')}>Identity checks ({users.length})</button>
        <button role="tab" aria-selected={tab === 'requests'} onClick={() => setTab('requests')}>Requests and bids ({listings.length})</button>
        <button role="tab" aria-selected={tab === 'properties'} onClick={() => setTab('properties')}>Properties ({props.filter((x) => x.status === 'pending_review').length} to review)</button>
        <button role="tab" aria-selected={tab === 'held'} onClick={() => setTab('held')}>Held bids ({held.length})</button>
        <button role="tab" aria-selected={tab === 'members'} onClick={() => setTab('members')}>Members</button>
        <button role="tab" aria-selected={tab === 'subs'} onClick={() => setTab('subs')}>Subscriptions{subs && subs.payments.filter((p) => p.status === 'pending').length ? ` (${subs.payments.filter((p) => p.status === 'pending').length} to check)` : ''}</button>
        <button role="tab" aria-selected={tab === 'support'} onClick={() => setTab('support')}>Support{support && support.tickets.filter((t) => t.status === 'open').length ? ` (${support.tickets.filter((t) => t.status === 'open').length} open)` : ''}</button>
        <button role="tab" aria-selected={tab === 'club'} onClick={() => setTab('club')}>Club{reports && reports.length ? ` (${reports.length} reported)` : ''}</button>
        <button role="tab" aria-selected={tab === 'activity'} onClick={() => setTab('activity')}>Activity log</button>
      </div>
      {notice && <p className="notice" role="status">{notice}</p>}
      <p className="err" role="alert">{error}</p>

      {tab === 'kyc' && (users.length === 0 ? <p className="empty">No identity checks waiting.</p> : (
        <ul className="rows" style={{ borderTop: 0 }}>{users.map((u) => (
          <li key={u.id} className="applicant">
            <div className="applicant-head">
              <span className="t">{u.full_name}<span className="muted sub">{u.email}, {u.role}</span></span>
              <span className="pill">{KYC_LABEL[u.kyc_status]}</span>
            </div>
            {u.missing.length > 0 && <p className="err">Missing: {u.missing.join(', ')}</p>}
            {u.documents.length === 0 && <p className="muted">No documents uploaded yet.</p>}
            <ul className="docs">{u.documents.map((d) => (
              <li key={d.id}>
                <span><b>{d.label}</b><span className="muted sub">{d.original_name}, {fileSize(d.size_bytes)}</span></span>
                <span className="muted">{DOC_STATUS[d.status]}{d.note ? `: ${d.note}` : ''}</span>
                <span className="row-actions">
                  <button className="btn ghost small" onClick={() => view(d)}>View</button>
                  <button className="btn ghost small" onClick={act(() => api(`/admin/kyc-documents/${d.id}`, { method: 'PATCH', body: { status: 'accepted' } }), 'Document accepted.')}>Accept</button>
                  <button className="btn ghost small" onClick={() => rejectDoc(d)}>Reject</button>
                </span>
              </li>))}</ul>
            {u.kyc_note && <p className="muted">Last message sent: {u.kyc_note}</p>}
            <label className="field">Message to the applicant (shown on their screen when you ask for documents or reject)
              <input value={notes[u.id] || ''} maxLength={500} onChange={(e) => setNotes({ ...notes, [u.id]: e.target.value })} placeholder="For example: please upload a clearer copy of your ID" /></label>
            <div className="row-actions" style={{ marginTop: 10 }}>
              <button className="btn small" disabled={!u.complete} title={u.complete ? '' : 'Every required document must be uploaded first'} onClick={kyc(u, 'approved', `Approved ${u.full_name}. They are told on their screen within a few seconds.`)}>Approve</button>
              <button className="btn ghost small" onClick={kyc(u, 'info_requested', `Asked ${u.full_name} for more documents. Their screen now shows your message.`)}>Ask for documents</button>
              <button className="btn ghost small" onClick={kyc(u, 'rejected', `Rejected ${u.full_name}.`)}>Reject</button>
            </div>
          </li>))}</ul>))}

      {tab === 'requests' && (listings.length === 0 ? <p className="empty">No loan requests yet.</p> : (
        <ul className="rows">{listings.map((l) => (
          <li key={l.id}><Link href={`/listings/${l.id}`} className="row">
            <span className="t">{l.title}<span className="muted sub">{l.owner_name}</span></span>
            <b className="num">{money(l.currency, l.amount)}</b>
            <span className="muted">{STATUS_LABEL[l.status]}</span>
            <span>{l.bid_count} {l.bid_count === 1 ? 'bid' : 'bids'}{l.held_count ? `, ${l.held_count} held` : ''}</span>
            <span>{l.best_rate ? 'Best ' + pct(l.best_rate) : 'No bids yet'}</span>
            <span className="muted">Open</span>
          </Link></li>))}</ul>))}

      {tab === 'properties' && (props.length === 0 ? <p className="empty">No property listings yet.</p> : (
        <ul className="rows">{props.map((x) => (
          <li key={x.id}><Link href={`/properties/${x.id}`} className="row">
            <span className="t">{x.title}<span className="muted sub">{x.owner_name}, {x.city}</span></span>
            <b className="num">{money(x.currency, x.asking_price)}</b>
            <span className="muted">{x.photo_count} photos, {x.title_deed_id ? 'deed uploaded' : 'no deed'}</span>
            <span>{x.offer_count ? `${x.offer_count} offers` : 'No offers'}</span>
            <span className="pill" style={x.status === 'pending_review' ? { background: 'var(--gold-soft)', color: 'var(--gold)' } : undefined}>{PROPERTY_STATUS[x.status]}</span>
            <span className="muted">{x.status === 'pending_review' ? 'Review' : 'Open'}</span>
          </Link></li>))}</ul>))}

      {tab === 'held' && (held.length === 0 ? <p className="empty">No bids waiting for review.</p> : (
        <ul className="rows">{held.map((b) => (
          <li key={b.id} className="row static">
            <span className="t">{b.bidder_name} at <span className="num">{pct(b.rate)}</span><span className="muted sub">{b.title}</span></span>
            <span className="muted">{(Number(b.floor_rate) - Number(b.rate)).toFixed(2)} points below the usual floor of {pct(b.floor_rate)}</span>
            <span className="row-actions">
              <button className="btn small" onClick={act(() => api(`/admin/bids/${b.id}`, { method: 'PATCH', body: { decision: 'approve' } }), 'Bid approved. It now shows to the borrower.')}>Approve</button>
              <button className="btn ghost small" onClick={act(() => api(`/admin/bids/${b.id}`, { method: 'PATCH', body: { decision: 'reject' } }), 'Bid rejected.')}>Reject</button>
            </span>
          </li>))}</ul>))}

      {tab === 'members' && <MembersTab onNotice={setNotice} onError={setError} />}
      {tab === 'subs' && <SubscriptionsTab data={subs} reload={load} onNotice={setNotice} onError={setError} />}
      {tab === 'support' && <SupportTab data={support} />}
      {tab === 'club' && <ClubTab reports={reports} reload={load} onNotice={setNotice} onError={setError} />}

      {tab === 'activity' && (activity.length === 0 ? <p className="empty">Nothing has happened yet.</p> : (
        <ul className="rows">{activity.map((a) => (
          <li key={a.id} className="row static" style={{ gridTemplateColumns: 'auto 1fr' }}>
            <span className="when num">{new Date(a.created_at).toLocaleString('en-GB')}</span>
            <span><b>{a.actor_name || 'System'}</b> {describe(a)}</span>
          </li>))}</ul>))}
    </Shell>
  );
}
