'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Shell from '../../../components/Shell';
import { useSession } from '../../../lib/useSession';
import { api } from '../../../lib/api';
import { fullDate } from '../../../lib/format';

export default function Member() {
  const { id } = useParams();
  const session = useSession(['borrower', 'lender', 'admin']);
  const [m, setM] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { if (session) api(`/club/members/${id}`).then(setM).catch((e) => setError(e.message)); }, [session, id]);
  if (!session) return <p className="page muted">Loading...</p>;
  return (
    <Shell session={session}>
      <Link href="/club" className="back">Back to the club</Link>
      <p className="err" role="alert">{error}</p>
      {m && (
        <section className="box">
          <h2>{m.name} {m.verified && <em className="tag good">Verified</em>}</h2>
          <p className="muted" style={{ margin: '4px 0 10px' }}>{m.role === 'lender' ? 'Lender or investor' : 'Borrower or business owner'}{m.organisation ? `, ${m.organisation}` : ''}{m.city ? `, ${m.city}` : ''}</p>
          {m.bio && <p style={{ whiteSpace: 'pre-wrap' }}>{m.bio}</p>}
          <p className="muted" style={{ marginBottom: 0 }}>Member since {fullDate(m.member_since)}</p>
        </section>
      )}
    </Shell>
  );
}
