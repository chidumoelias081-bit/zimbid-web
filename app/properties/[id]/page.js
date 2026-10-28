'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Shell from '../../../components/Shell';
import Countdown from '../../../components/Countdown';
import AuthImage from '../../../components/AuthImage';
import PropertyForm from '../../../components/PropertyForm';
import { useSession } from '../../../lib/useSession';
import { api, openProtectedFile, uploadFile } from '../../../lib/api';
import { money, PROPERTY_STATUS, PROPERTY_TYPE, fileSize } from '../../../lib/format';

const MAX = 5 * 1024 * 1024;

export default function PropertyPage() {
  const { id } = useParams();
  const session = useSession(['borrower', 'lender', 'admin']);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => api(`/properties/${id}`).then(setData).catch((e) => setError(e.message)), [id]);
  useEffect(() => {
    if (!session) return undefined;
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [session, load]);
  if (!session) return <p className="page muted">Loading...</p>;
  if (!data) return <Shell session={session}><p className="err">{error}</p><p className="muted">Loading...</p></Shell>;

  const { property: p, you, files, offers, contact } = data;
  const photos = files.filter((f) => f.kind === 'photo');
  const deed = files.find((f) => f.kind === 'title_deed');
  const cur = p.currency;
  const editable = you === 'owner' && ['draft', 'rejected'].includes(p.status);
  const myOffer = offers.find((o) => o.mine);
  const canOffer = (you === 'member') && p.status === 'live' && new Date(p.closes_at) > new Date();

  // Runs an action, shows its result, and reloads.
  const run = async (fn, message) => {
    setBusy(true); setError(''); setNotice('');
    try { const r = await fn(); if (r && r.property) setData(r); if (message) setNotice(message); }
    catch (e) { setError(e.message); }
    setBusy(false);
  };
  const post = (path, body) => api(`/properties/${id}/${path}`, { method: 'POST', body: body || {} });
  const upload = async (kind, fileList) => {
    for (const file of Array.from(fileList)) {
      if (file.size > MAX) { setError(`${file.name} is larger than 5 MB.`); return; }
      await run(() => uploadFile(`/properties/${id}/files/${kind}`, file), kind === 'photo' ? 'Photo added.' : 'Title deed uploaded.');
    }
  };
  const open = (f) => openProtectedFile(`/properties/files/${f.id}`).catch((e) => setError(e.message));
  const adminDecide = (decision) => {
    let note = '';
    if (decision === 'reject') {
      note = (window.prompt('Why is this listing being sent back? The owner will see this.') || '').trim();
      if (!note) return;
    }
    run(() => api(`/admin/properties/${id}`, { method: 'PATCH', body: { decision, note } }).then(load), decision === 'approve' ? 'Listing approved. It is now live.' : 'Listing sent back to the owner.');
  };
  const makeOffer = (e) => {
    e.preventDefault();
    const amount = Number(new FormData(e.target).get('amount'));
    const form = e.target;
    run(async () => { const r = await post('offers', { amount }); form.reset(); return r; }, 'Offer made.');
  };

  return (
    <Shell session={session}>
      <Link href={you === 'admin' ? '/admin' : '/properties'} className="back">Back</Link>
      <div className="sh" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2>{p.title}</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>{PROPERTY_TYPE[p.property_type]}, {[p.suburb, p.city].filter(Boolean).join(', ')}. Listed by {p.owner_name}.</p>
        </div>
        <span className="pill">{PROPERTY_STATUS[p.status]}</span>
      </div>
      {notice && <p className="notice" role="status">{notice}</p>}
      <p className="err" role="alert">{error}</p>

      {p.status === 'pending_review' && <p className="note" style={{ marginTop: 0 }}>{you === 'owner' ? 'Submitted. An admin is reviewing your photos and title deed. You will see the result here.' : 'Waiting for admin review.'}</p>}
      {p.status === 'rejected' && <p className="err">Sent back{p.review_note ? `: ${p.review_note}` : '.'}{you === 'owner' ? ' Fix this below and submit again.' : ''}</p>}

      {photos.length > 0 ? (
        <div className="gallery">
          {photos.map((f, i) => (
            <button key={f.id} className={`thumb${i === 0 ? ' first' : ''}`} onClick={() => open(f)} aria-label={`Open photo ${i + 1} full size`}>
              <AuthImage fileId={f.id} alt={`Photo ${i + 1} of ${p.title}`} className="cover" />
              {editable && <span className="remove" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); run(() => api(`/properties/${id}/files/${f.id}`, { method: 'DELETE' })); }}>Remove</span>}
            </button>
          ))}
        </div>
      ) : <p className="empty">No photos yet.</p>}

      <dl className="facts">
        <div><dt>Asking price</dt><dd className="num">{money(cur, p.asking_price)}</dd></div>
        <div><dt>Best offer</dt><dd className="num">{offers[0] ? money(cur, offers[0].amount) : 'None yet'}</dd></div>
        {p.status === 'live' && <div><dt>Offers close in</dt><dd><Countdown closesAt={p.closes_at} status="open" /></dd></div>}
        {p.bedrooms !== null && <div><dt>Bedrooms</dt><dd>{p.bedrooms}</dd></div>}
        {p.size_sqm && <div><dt>Size</dt><dd className="num">{Number(p.size_sqm).toLocaleString('en-GB')} m²</dd></div>}
      </dl>
      {p.description && <p style={{ whiteSpace: 'pre-wrap' }}>{p.description}</p>}
      {p.address && <p><b>Address:</b> {p.address}</p>}

      {editable && (
        <section className="panel">
          <h3>Get it ready to submit</h3>
          <ol className="steps" style={{ marginTop: 12 }}>
            <li className="done"><span className="mk">{'\u2713'}</span>Details saved</li>
            <li className={photos.length ? 'done' : 'next'}><span className="mk">{photos.length ? '\u2713' : 2}</span>Photos ({photos.length} of 8)</li>
            <li className={deed ? 'done' : photos.length ? 'next' : ''}><span className="mk">{deed ? '\u2713' : 3}</span>Title deed</li>
          </ol>
          <div className="action">
            <span className="btn small filebtn ghost">Add photos (JPG or PNG)
              <input type="file" multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png" aria-label="Add photos" disabled={busy} onChange={(e) => { upload('photo', e.target.files); e.target.value = ''; }} />
            </span>
            <span className="btn small filebtn ghost">{deed ? 'Replace title deed' : 'Upload title deed (PDF, JPG or PNG)'}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-label="Upload title deed" disabled={busy} onChange={(e) => { upload('title_deed', e.target.files); e.target.value = ''; }} />
            </span>
            {deed && <button className="btn ghost small" onClick={() => open(deed)}>View title deed ({fileSize(deed.size_bytes)})</button>}
          </div>
          <p className="muted">Files can be up to 5 MB. Your title deed is only seen by you, the platform admin and the buyer whose offer you accept.</p>
          <div className="action">
            <button className="btn" disabled={busy || !deed || photos.length < 1} onClick={() => run(() => post('submit'), 'Submitted for review.')}>Submit for review</button>
            <button className="btn ghost" onClick={() => setEditing(!editing)}>{editing ? 'Close details' : 'Edit details'}</button>
            <button className="btn ghost" disabled={busy} onClick={() => window.confirm('Withdraw this listing?') && run(() => post('withdraw'), 'Listing withdrawn.')}>Withdraw</button>
          </div>
          {editing && <PropertyForm initial={p} submitLabel="Save changes" onSubmit={async (f) => { const r = await api(`/properties/${id}`, { method: 'PATCH', body: f }); setData(r); setEditing(false); setNotice('Details saved.'); }} />}
        </section>
      )}

      {you === 'admin' && (
        <section className="panel">
          <h3>Review</h3>
          <p className="muted">Check the photos and the title deed. Approving confirms the paperwork was supplied. It does not prove ownership.</p>
          <div className="action">
            {deed ? <button className="btn ghost small" onClick={() => open(deed)}>View title deed</button> : <span className="err" style={{ margin: 0 }}>No title deed uploaded.</span>}
            {p.status === 'pending_review' && <button className="btn" disabled={busy} onClick={() => adminDecide('approve')}>Approve</button>}
            {['pending_review', 'live'].includes(p.status) && <button className="btn ghost" disabled={busy} onClick={() => adminDecide('reject')}>{p.status === 'live' ? 'Pull listing' : 'Send back'}</button>}
          </div>
        </section>
      )}

      {['live', 'under_offer', 'sold'].includes(p.status) && (
        <>
          <div className="sh" style={{ marginTop: 24 }}><h3>Offers, highest first</h3><span className="muted">{offers.length} {offers.length === 1 ? 'offer' : 'offers'}</span></div>
          {offers.length === 0 ? <p className="empty">No offers yet.</p> : (
            <ol className="ladder">
              {offers.map((o, i) => (
                <li key={o.id} className={`bid${i === 0 ? ' best' : ''}${o.mine ? ' mine' : ''}`} style={{ '--w': `${(Number(o.amount) / Number(offers[0].amount)) * 100}%`, gridTemplateColumns: '24px minmax(0,1.6fr) minmax(0,1fr) 110px' }}>
                  <span className="rk">{i + 1}</span>
                  <span className="who"><b>{o.bidder_name}</b>{o.mine && <em className="tag you">Your offer</em>}{o.status === 'accepted' && <em className="tag good">Accepted</em>}{o.bidder_email && <span className="muted sub">{o.bidder_email}</span>}</span>
                  <span className="rate num" style={{ textAlign: 'right' }}>{money(cur, o.amount)}</span>
                  <span className="act">{you === 'owner' && p.status === 'live' && <button className="btn small" disabled={busy} onClick={() => window.confirm(`Accept ${money(cur, o.amount)} from ${o.bidder_name}? Other buyers cannot make offers while it is under offer.`) && run(() => post('accept', { offer_id: o.id }), 'Offer accepted.')}>Accept</button>}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {canOffer && (
        <form onSubmit={makeOffer} className="panel">
          <h3>{myOffer ? 'Raise your offer' : 'Make an offer'}</h3>
          <p className="muted">{offers.length ? `The best offer is ${money(cur, offers[0].amount)}. Offer at least ${money(cur, data.next_minimum, 2)}.` : `No offers yet. The asking price is ${money(cur, p.asking_price)}.`} An offer is not a binding contract.</p>
          <div className="fields"><label className="field">Your offer ({cur === 'USD' ? 'US$' : 'ZiG'})<input name="amount" type="number" min="1" step="0.01" required /></label></div>
          <div className="action">
            <button className="btn" disabled={busy}>{myOffer ? 'Raise offer' : 'Make offer'}</button>
            {myOffer && <button type="button" className="btn ghost" disabled={busy} onClick={() => run(() => api(`/properties/${id}/offers/mine`, { method: 'DELETE' }), 'Offer withdrawn.')}>Withdraw my offer</button>}
          </div>
        </form>
      )}

      {you === 'owner' && p.status === 'live' && <div className="action"><button className="btn ghost" disabled={busy} onClick={() => window.confirm('Withdraw this listing?') && run(() => post('withdraw'), 'Listing withdrawn.')}>Withdraw listing</button></div>}

      {contact && (
        <section className="panel">
          <h3>{p.status === 'sold' ? 'Sold' : 'Under offer: next steps'}</h3>
          <dl className="terms">
            <div><dt>Seller</dt><dd>{contact.seller.name}<span className="muted sub">{contact.seller.email}</span></dd></div>
            <div><dt>Buyer</dt><dd>{contact.buyer.name}<span className="muted sub">{contact.buyer.email}</span></dd></div>
            {deed && <div><dt>Title deed</dt><dd><button className="btn ghost small" onClick={() => open(deed)}>View</button></dd></div>}
          </dl>
          <p className="muted">Contact each other, agree the deposit, and meet a registered conveyancer to check the title and transfer ownership through the Deeds Registry. This platform does not hold the deposit or transfer the property in this version.</p>
          {you === 'owner' && p.status === 'under_offer' && (
            <div className="action">
              <button className="btn" disabled={busy} onClick={() => window.confirm('Mark this property as sold? Do this once ownership has been transferred.') && run(() => post('sold'), 'Marked as sold.')}>Mark as sold</button>
              <button className="btn ghost" disabled={busy} onClick={() => run(() => post('reopen'), 'Listing reopened for offers.')}>The deal fell through: reopen</button>
            </div>
          )}
        </section>
      )}

      <p className="sim" style={{ marginTop: 24 }}>Prototype: offers are not binding and no money moves. The platform checks that a title deed was supplied but does not guarantee ownership. Always verify the title with a registered conveyancer before you pay.</p>
    </Shell>
  );
}
