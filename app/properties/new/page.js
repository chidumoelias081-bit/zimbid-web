'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Shell from '../../../components/Shell';
import PropertyForm from '../../../components/PropertyForm';
import { useSession } from '../../../lib/useSession';
import { api } from '../../../lib/api';

export default function NewProperty() {
  const session = useSession(['borrower', 'lender']);
  const router = useRouter();
  if (!session) return <p className="page muted">Loading...</p>;
  return (
    <Shell session={session}>
      <Link href="/properties" className="back">Back to properties</Link>
      <h2>List a property</h2>
      <p className="muted" style={{ margin: '6px 0 14px' }}>Step 1 of 3: describe it. Next you add photos and the title deed, then an admin reviews the listing before it goes live.</p>
      <PropertyForm submitLabel="Save and continue" onSubmit={async (f) => { const d = await api('/properties', { method: 'POST', body: f }); router.push(`/properties/${d.property.id}`); }} />
    </Shell>
  );
}
