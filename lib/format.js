export const money = (cur, n, d = 0) =>
  (cur === 'USD' ? 'US$ ' : 'ZiG ') + Number(n).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });

export const pct = (n) => Number(n).toFixed(2) + '%';

export function timeLeft(ms) {
  if (ms <= 0) return 'Closed';
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h >= 48) return Math.floor(h / 24) + ' days ' + (h % 24) + ' h';
  if (h > 0) return h + ' h ' + String(m).padStart(2, '0') + ' min';
  return m + ' min ' + String(sec).padStart(2, '0') + ' s';
}

export const STATUS_LABEL = {
  open: 'Bidding open', closed: 'Bidding closed', awarded: 'Bid accepted', funded: 'Escrow funded',
  released: 'Funds released', repaid: 'Repaid', cancelled: 'Cancelled',
};

export const fileSize = (bytes) => (bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB');

export const PROPERTY_TYPE = { house: 'House', stand: 'Stand', flat: 'Flat', commercial: 'Commercial', farm: 'Farm' };
export const PROPERTY_STATUS = {
  draft: 'Draft', pending_review: 'Waiting for admin review', live: 'Open for offers', under_offer: 'Under offer',
  sold: 'Sold', rejected: 'Sent back', withdrawn: 'Withdrawn',
};

/** "5 min ago", "3 h ago", "2 days ago". */
export function ago(date) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
export const fullDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const CLUB_CATEGORY = { update: 'Activity update', tip: 'Tip', question: 'Question', event: 'Event', success: 'Success story' };
export const PLAN_STATE = { trial: 'Free month', active: 'Subscribed', expired: 'Plan ended', waiting: 'Waiting for approval', admin: 'Admin' };
