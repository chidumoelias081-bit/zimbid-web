'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../../components/Shell';
import Paywall from '../../components/Paywall';
import { useSession } from '../../lib/useSession';
import { api } from '../../lib/api';
import { ago, CLUB_CATEGORY } from '../../lib/format';

function Post({ post, me, admin, onChange, onError }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState(null);
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.like_count);
  const [locked, setLocked] = useState('');
  const loadComments = useCallback(() => api(`/club/posts/${post.id}/comments`).then((d) => setComments(d.comments)).catch((e) => onError(e.message)), [post.id, onError]);
  useEffect(() => { if (open) loadComments(); }, [open, loadComments]);

  const like = async () => { try { const r = await api(`/club/posts/${post.id}/like`, { method: 'POST', body: {} }); setLiked(r.liked); setLikes(r.like_count); } catch (e) { onError(e.message); } };
  const comment = async (e) => {
    e.preventDefault();
    const form = e.target; const body = new FormData(form).get('body');
    setLocked('');
    try { await api(`/club/posts/${post.id}/comments`, { method: 'POST', body: { body } }); form.reset(); loadComments(); onChange(); }
    catch (err) { if (err.status === 402) setLocked(err.message); else onError(err.message); }
  };
  const remove = async () => { if (!window.confirm(admin && !post.mine ? 'Remove this post as an admin?' : 'Delete your post?')) return; try { await api(`/club/posts/${post.id}`, { method: 'DELETE' }); onChange(); } catch (e) { onError(e.message); } };
  const report = async () => { const reason = window.prompt('Why are you reporting this post? (optional)'); if (reason === null) return; try { await api(`/club/posts/${post.id}/report`, { method: 'POST', body: { reason } }); window.alert('Thank you. An admin will look at it.'); } catch (e) { onError(e.message); } };
  const delComment = async (c) => { try { await api(`/club/comments/${c.id}`, { method: 'DELETE' }); loadComments(); onChange(); } catch (e) { onError(e.message); } };

  return (
    <article className="post">
      <div className="who">
        <Link href={`/members/${post.author.id}`}><b>{post.author.name}</b></Link>
        <span className="muted">{post.author.role === 'lender' ? 'Lender' : 'Borrower'}{post.author.organisation ? `, ${post.author.organisation}` : ''}</span>
        {post.author.verified && <em className="tag good" style={{ marginLeft: 0 }}>Verified</em>}
        <em className="tag req" style={{ marginLeft: 0 }}>{CLUB_CATEGORY[post.category]}</em>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 13 }}>{ago(post.created_at)}</span>
      </div>
      <p className="body">{post.body}</p>
      <div className="acts">
        <button className={`linkbtn${liked ? ' on' : ''}`} onClick={like} aria-pressed={liked}>{liked ? 'Liked' : 'Like'} ({likes})</button>
        <button className="linkbtn" onClick={() => setOpen(!open)}>{open ? 'Hide comments' : `Comments (${post.comment_count})`}</button>
        {!post.mine && !admin && <button className="linkbtn" onClick={report}>Report</button>}
        {(post.mine || admin) && <button className="linkbtn" style={{ color: 'var(--red)' }} onClick={remove}>{post.mine ? 'Delete' : 'Remove'}</button>}
      </div>
      {open && (
        <div className="comments">
          {comments === null ? <span className="muted">Loading...</span> : comments.length === 0 ? <span className="muted">No comments yet.</span> : comments.map((c) => (
            <div key={c.id} className="comment"><b>{c.author.name}</b> <span className="muted">{ago(c.created_at)}</span><br />{c.body}{(c.mine || admin) && <button className="linkbtn" style={{ marginLeft: 8, color: 'var(--red)' }} onClick={() => delComment(c)}>Delete</button>}</div>
          ))}
          {!admin && (locked ? <Paywall message={locked} /> : (
            <form onSubmit={comment} className="copyrow" style={{ marginTop: 8 }}>
              <input name="body" required maxLength={500} placeholder="Write a comment" aria-label="Write a comment" />
              <button className="btn small">Comment</button>
            </form>
          ))}
        </div>
      )}
    </article>
  );
}

export default function Club() {
  const session = useSession(['borrower', 'lender', 'admin']);
  const [posts, setPosts] = useState(null);
  const [more, setMore] = useState(false);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [locked, setLocked] = useState('');
  const [notice, setNotice] = useState('');
  const query = (before) => { const q = new URLSearchParams(); if (category) q.set('category', category); if (before) q.set('before', before); return q.toString(); };
  const load = useCallback(() => api(`/club/posts?${query()}`).then((d) => { setPosts(d.posts); setMore(d.has_more); }).catch((e) => setError(e.message)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category]);
  useEffect(() => {
    if (!session) return undefined;
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [session, load]);
  if (!session) return <p className="page muted">Loading...</p>;
  const admin = session.user.role === 'admin';

  async function loadMore() {
    const last = posts[posts.length - 1];
    try { const d = await api(`/club/posts?${query(last.created_at)}`); setPosts([...posts, ...d.posts]); setMore(d.has_more); } catch (e) { setError(e.message); }
  }
  async function publish(e) {
    e.preventDefault();
    const form = e.target; const f = new FormData(form);
    setError(''); setNotice(''); setLocked('');
    try { await api('/club/posts', { method: 'POST', body: { category: f.get('category'), body: f.get('body') } }); form.reset(); setNotice('Posted.'); load(); }
    catch (err) { if (err.status === 402) setLocked(err.message); else setError(err.message); }
  }

  return (
    <Shell session={session}>
      <h2>Social club</h2>
      <p className="muted" style={{ margin: '6px 0 14px' }}>A place for ZimBid members to share what is happening with their customers and clients: updates, tips, questions, events and success stories. Be respectful and honest. Never post passwords, bank details or ID numbers.</p>
      {!admin && (locked ? <Paywall message={locked} /> : (
        <form onSubmit={publish} className="panel" style={{ marginTop: 0 }}>
          <div className="fields" style={{ marginTop: 0 }}>
            <label className="field">What are you sharing?<select name="category" defaultValue="update">{Object.entries(CLUB_CATEGORY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label className="field wide">Your post<textarea name="body" required minLength={3} maxLength={2000} rows={3} placeholder="For example: A customer repaid their loan two months early, here is what helped them." /></label>
          </div>
          {notice && <p className="ok" role="status">{notice}</p>}
          <button className="btn">Post</button>
        </form>
      ))}
      <p className="err" role="alert">{error}</p>
      <div className="filters" style={{ margin: '14px 0', flexWrap: 'wrap' }}>
        <button className={`btn small${category ? ' ghost' : ''}`} onClick={() => setCategory('')}>All</button>
        {Object.entries(CLUB_CATEGORY).map(([k, l]) => <button key={k} className={`btn small${category === k ? '' : ' ghost'}`} onClick={() => setCategory(k)}>{l}</button>)}
      </div>
      {posts && posts.length === 0 && <p className="empty">Nothing here yet. Be the first to share something.</p>}
      {(posts || []).map((p) => <Post key={p.id} post={p} me={session.user.id} admin={admin} onChange={load} onError={setError} />)}
      {more && <button className="btn ghost" onClick={loadMore}>Show older posts</button>}
    </Shell>
  );
}
