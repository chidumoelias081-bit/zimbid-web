const KEY = 'zimbid.session';

export function getSession() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}
export const saveSession = (s) => localStorage.setItem(KEY, JSON.stringify(s));
export const clearSession = () => localStorage.removeItem(KEY);

export const homeFor = (role) => (role === 'admin' ? '/admin' : role === 'lender' ? '/lender' : '/borrower');

/** Call the API through the /api proxy, sending the saved token. Throws Error(message) on failure. */
export async function api(path, { method = 'GET', body } = {}) {
  const s = getSession();
  const res = await fetch('/api' + path, {
    method,
    headers: { 'content-type': 'application/json', ...(s ? { authorization: 'Bearer ' + s.token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 403 && data.code === 'suspended') { clearSession(); if (typeof window !== 'undefined') window.location.href = '/login'; }
    const err = new Error(data.error || 'Something went wrong. Try again.');
    err.status = res.status;
    err.code = data.code; // for example "subscription_required"
    throw err;
  }
  return data;
}

const guessType = (name) => (/\.pdf$/i.test(name) ? 'application/pdf' : /\.png$/i.test(name) ? 'image/png' : /\.jpe?g$/i.test(name) ? 'image/jpeg' : 'application/octet-stream');

/** Upload a file as the request body (PDF, JPG or PNG). Returns the server's JSON answer. */
export async function uploadFile(path, file) {
  const s = getSession();
  const res = await fetch('/api' + path, {
    method: 'POST',
    headers: { 'content-type': file.type || guessType(file.name), 'x-filename': encodeURIComponent(file.name), ...(s ? { authorization: 'Bearer ' + s.token } : {}) },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(data.error || 'Upload failed. Try again.'); err.status = res.status; throw err; }
  return data;
}

/** Open a protected file (it needs the sign-in token, so a plain link would not work). */
export async function openProtectedFile(path) {
  const s = getSession();
  const tab = window.open('about:blank', '_blank');
  try {
    const res = await fetch('/api' + path, { headers: { authorization: 'Bearer ' + s.token } });
    if (!res.ok) throw new Error('Could not open the document.');
    const url = URL.createObjectURL(await res.blob());
    if (tab) tab.location.href = url; else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60e3);
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
}
