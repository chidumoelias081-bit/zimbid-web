'use client';
import Link from 'next/link';
import { api } from '../../lib/api';
import { ago, CLUB_CATEGORY } from '../../lib/format';

export default function ClubTab({ reports, reload, onNotice, onError }) {
  if (!reports) return <p className="muted">Loading...</p>;
  const remove = async (r) => {
    if (!window.confirm('Remove this post? The author is told.')) return;
    onError('');
    try { await api(`/club/posts/${r.id}`, { method: 'DELETE' }); onNotice('Post removed.'); reload(); } catch (e) { onError(e.message); }
  };
  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}>Posts members have reported, most reported first. You can also remove any post straight from the <Link href="/club">club</Link>.</p>
      {reports.length === 0 ? <p className="empty">Nothing has been reported.</p> : (
        <ul className="rows">{reports.map((r) => (
          <li key={r.id} className="row static" style={{ gridTemplateColumns: 'minmax(0,2fr) 1fr auto' }}>
            <span><b>{r.author_name}</b> <em className="tag req" style={{ marginLeft: 4 }}>{CLUB_CATEGORY[r.category]}</em><span className="muted sub">{ago(r.created_at)}</span><span style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{r.body}</span></span>
            <span><span className="pill">{r.reports} {r.reports === 1 ? 'report' : 'reports'}</span>{r.reasons && <span className="muted sub">{r.reasons}</span>}</span>
            <span className="row-actions"><button className="btn small" onClick={() => remove(r)}>Remove post</button></span>
          </li>))}</ul>
      )}
    </>
  );
}
