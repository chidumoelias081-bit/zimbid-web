'use client';
import { useState } from 'react';
import { PROPERTY_TYPE } from '../lib/format';

/** The fields a seller fills in. Used to create a listing and to edit a draft. */
export default function PropertyForm({ initial = {}, submitLabel, onSubmit }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    setBusy(true); setError('');
    try { await onSubmit(f); } catch (err) { setError(err.message); }
    setBusy(false);
  }
  const v = (k, d = '') => (initial[k] ?? d);
  return (
    <form onSubmit={submit} className="panel">
      <div className="fields">
        <label className="field wide">Title<input name="title" required maxLength={120} defaultValue={v('title')} placeholder="For example: Three-bedroom house in Borrowdale" /></label>
        <label className="field">Type<select name="property_type" defaultValue={v('property_type', 'house')}>{Object.entries(PROPERTY_TYPE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="field">City or town<input name="city" required maxLength={80} defaultValue={v('city')} /></label>
        <label className="field">Suburb<input name="suburb" maxLength={80} defaultValue={v('suburb')} /></label>
        <label className="field wide">Street address (buyers only see it after you accept their offer)<input name="address" maxLength={200} defaultValue={v('address')} /></label>
        <label className="field">Bedrooms<input name="bedrooms" type="number" min="0" max="50" defaultValue={v('bedrooms')} /></label>
        <label className="field">Size in square metres<input name="size_sqm" type="number" min="1" defaultValue={v('size_sqm')} /></label>
        <label className="field">Currency<select name="currency" defaultValue={v('currency', 'USD')}><option value="USD">US$</option><option value="ZiG">ZiG</option></select></label>
        <label className="field">Asking price<input name="asking_price" type="number" min="1" step="0.01" required defaultValue={v('asking_price')} /></label>
        <label className="field">Offers stay open for<select name="window_days" defaultValue={String(v('window_days', 14))}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>
        <label className="field wide">Description<textarea name="description" maxLength={2000} rows={4} defaultValue={v('description')} /></label>
      </div>
      <p className="err" role="alert">{error}</p>
      <button className="btn" disabled={busy}>{busy ? 'Saving...' : submitLabel}</button>
    </form>
  );
}
