'use client';
import { useEffect, useState } from 'react';
import { getSession } from '../lib/api';

/** An image that needs the sign-in token to load, so it is fetched first and then shown. */
export default function AuthImage({ fileId, alt, className }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!fileId) return undefined;
    let url; let alive = true;
    const s = getSession();
    fetch(`/api/properties/files/${fileId}`, { headers: s ? { authorization: 'Bearer ' + s.token } : {} })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('no image'))))
      .then((b) => { if (alive) { url = URL.createObjectURL(b); setSrc(url); } })
      .catch(() => {});
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [fileId]);
  if (!fileId || !src) return <div className={`${className || ''} noimg`} role="img" aria-label={alt}>{fileId ? '' : 'No photo'}</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
