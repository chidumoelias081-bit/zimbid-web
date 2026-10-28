'use client';
import { useEffect, useState } from 'react';
import { timeLeft } from '../lib/format';

export default function Countdown({ closesAt, status }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (status !== 'open') return <span>{status === 'closed' ? 'Closed' : 'Ended'}</span>;
  const ms = new Date(closesAt).getTime() - now;
  return <span className={`num${ms < 15 * 60e3 ? ' hot' : ''}`}>{timeLeft(ms)}</span>;
}
