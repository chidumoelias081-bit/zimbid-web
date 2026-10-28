'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearSession, homeFor } from '../lib/api';

const kycText = (user) => {
  if (user.kyc_status === 'pending') return 'Your identity check is waiting for admin review. You cannot borrow or bid until it is approved.';
  if (user.kyc_status === 'info_requested') return `The admin has asked for more documents.${user.kyc_note ? ' Message: ' + user.kyc_note : ''}`;
  if (user.kyc_status === 'rejected') return `Your identity check was rejected.${user.kyc_note ? ' Message: ' + user.kyc_note : ''} Contact the admin.`;
  return null;
};

export default function Shell({ session, children }) {
  const router = useRouter();
  const { user } = session;
  const sub = user.subscription || {};
  const seen = useRef(user.kyc_status);
  const [flash, setFlash] = useState('');
  useEffect(() => {
    if (seen.current !== user.kyc_status && user.kyc_status === 'approved') {
      setFlash(`Your identity check was approved. Your free month of full access starts today.`);
    }
    seen.current = user.kyc_status;
  }, [user.kyc_status]);
  const member = user.role !== 'admin';
  const kyc = member && user.kyc_status !== 'approved' ? kycText(user) : null;
  return (
    <>
      <header className="top">
        <Link href={homeFor(user.role)} className="brand">ZimBid<small>prototype</small></Link>
        <nav className="nav" aria-label="Main">
          <Link href={homeFor(user.role)} className="navlink">Home</Link>
          <Link href="/properties" className="navlink">Properties</Link>
          <Link href="/club" className="navlink">Club</Link>
          <Link href="/notifications" className="navlink">Notifications{user.unread > 0 && <span className="count" aria-label={`${user.unread} unread`}>{user.unread > 99 ? '99+' : user.unread}</span>}</Link>
          <Link href="/help" className="navlink">Help</Link>
          <Link href="/account" className="navlink">Account</Link>
        </nav>
        <div className="tools">
          <span className="muted">{user.full_name}, {user.role}</span>
          <button className="btn ghost small" onClick={() => { clearSession(); router.replace('/login'); }}>Sign out</button>
        </div>
      </header>
      {kyc && <div className="banner" role="status">{kyc} {user.kyc_status !== 'rejected' && <Link href="/documents">Upload or check your documents</Link>}</div>}
      {member && sub.state === 'trial' && sub.days_left <= 7 && <div className="banner" role="status">Your free month ends in {sub.days_left} {sub.days_left === 1 ? 'day' : 'days'}. <Link href="/subscription">See how to subscribe</Link></div>}
      {member && sub.state === 'expired' && <div className="banner bad" role="status">Your plan has ended, so the property marketplace, bidding and posting in the club are paused. <Link href="/subscription">Subscribe to continue</Link></div>}
      {flash && <div className="banner ok" role="status">{flash} <button onClick={() => setFlash('')}>Dismiss</button></div>}
      <main className="page">{children}</main>
    </>
  );
}
