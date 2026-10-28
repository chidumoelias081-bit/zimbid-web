'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearSession, getSession, homeFor, saveSession } from './api';

/**
 * Loads the signed-in user, or sends the visitor to sign in.
 * It re-checks the account every few seconds, so a change made by the admin
 * (approved, more documents needed, rejected) shows up without a refresh.
 */
export function useSession(roles) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    if (roles && !roles.includes(s.user.role)) { router.replace(homeFor(s.user.role)); return; }
    let alive = true;
    const refresh = () =>
      api('/auth/me')
        .then(({ user }) => {
          if (!alive) return;
          const next = { ...(getSession() || s), user };
          saveSession(next);
          setSession((prev) => (prev && JSON.stringify(prev.user) === JSON.stringify(user) ? prev : next));
        })
        .catch((err) => {
          if (err.status === 401) { clearSession(); router.replace('/login'); } // a network blip must not sign you out
        });
    refresh();
    const timer = setInterval(refresh, 8000);
    return () => { alive = false; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return session;
}
