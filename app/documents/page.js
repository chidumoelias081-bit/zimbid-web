'use client';
import { useCallback, useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { useSession } from '../../lib/useSession';
import { api, openProtectedFile, uploadFile } from '../../lib/api';
import { fileSize } from '../../lib/format';

const STATUS = { uploaded: 'Uploaded, waiting for review', accepted: 'Accepted', rejected: 'Rejected' };
const MAX = 5 * 1024 * 1024;

export default function Documents() {
  const session = useSession(['borrower', 'lender']);
  const [view, setView] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const load = useCallback(() => api('/kyc/requirements').then(setView).catch((e) => setError(e.message)), []);
  useEffect(() => {
    if (!session) return;
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [session, load]);
  if (!session) return <p className="page muted">Loading...</p>;

  async function pick(type, file) {
    if (!file) return;
    setError('');
    if (file.size > MAX) { setError('That file is larger than 5 MB. Choose a smaller file or a lower-quality scan.'); return; }
    setBusy(type);
    try { setView(await uploadFile(`/kyc/documents/${type}`, file)); }
    catch (e) { setError(e.message); }
    setBusy('');
  }
  async function open(d) { setError(''); try { await openProtectedFile(`/kyc/documents/${d.id}/file`); } catch (e) { setError(e.message); } }

  const locked = view && ['approved', 'rejected'].includes(view.status);
  let intro = 'Loading...';
  if (view) {
    if (view.status === 'approved') intro = 'Your identity check is approved. Your documents are kept on file.';
    else if (view.status === 'rejected') intro = `Your identity check was rejected.${view.note ? ' Message: ' + view.note : ''} Contact the admin.`;
    else if (view.status === 'info_requested') intro = `The admin needs more documents.${view.note ? ' Message: ' + view.note : ''} Upload them below and the admin is told automatically.`;
    else if (view.complete) intro = 'All required documents are in. Waiting for the admin to review them.';
    else intro = 'Upload the required documents below. The admin cannot approve you until they are all in.';
  }

  return (
    <Shell session={session}>
      <h2>My documents</h2>
      <p className="note" style={{ margin: '6px 0 18px' }}>{intro}</p>
      <p className="muted" style={{ marginBottom: 14 }}>PDF, JPG or PNG, up to 5 MB each. Only you and the platform admin can open your files.</p>
      <p className="err" role="alert">{error}</p>
      {view && view.requirements.map((r) => {
        const d = r.document;
        return (
          <div key={r.type} className={`doc-card${d && d.status === 'rejected' ? ' rejected' : ''}`}>
            <div>
              <b>{r.label}</b> <em className={`tag ${r.required ? 'warn' : 'req'}`} style={{ marginLeft: 6 }}>{r.required ? 'Required' : 'If it applies'}</em>
              <div className="help">{r.help}</div>
            </div>
            <div>
              {d ? (
                <>
                  <div>{d.original_name} <span className="muted">({fileSize(d.size_bytes)})</span></div>
                  <div className={d.status === 'rejected' ? 'err' : 'muted'} style={{ margin: 0 }}>{STATUS[d.status]}{d.note ? `: ${d.note}` : ''}</div>
                </>
              ) : <span className="muted">Not uploaded yet</span>}
            </div>
            <div className="row-actions">
              {d && <button className="btn ghost small" onClick={() => open(d)}>View</button>}
              {!locked && (
                <span className={`btn small filebtn${d ? ' ghost' : ''}`} aria-busy={busy === r.type}>
                  {busy === r.type ? 'Uploading...' : d ? 'Replace' : 'Upload'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-label={`${d ? 'Replace' : 'Upload'} ${r.label}`} onChange={(e) => { pick(r.type, e.target.files[0]); e.target.value = ''; }} disabled={!!busy} />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </Shell>
  );
}
