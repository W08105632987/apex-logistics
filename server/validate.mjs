// Tiny validation helpers. All user input goes through these before touching the DB.
export class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function str(v, { field, min = 0, max = 500, required = false, trim = true } = {}) {
  if (v === undefined || v === null || v === '') {
    if (required) throw new HttpError(400, `${field} is required.`);
    return '';
  }
  if (typeof v !== 'string') throw new HttpError(400, `${field} must be text.`);
  const s = trim ? v.trim() : v;
  if (required && !s) throw new HttpError(400, `${field} is required.`);
  if (s.length < min) throw new HttpError(400, `${field} must be at least ${min} characters.`);
  if (s.length > max) throw new HttpError(400, `${field} must be at most ${max} characters.`);
  return s;
}
export function email(v, { field = 'Email', required = true } = {}) {
  const s = str(v, { field, max: 254, required }).toLowerCase();
  if (s && !EMAIL_RE.test(s)) throw new HttpError(400, `${field} is not a valid email address.`);
  return s;
}
export function num(v, { field, min = -Infinity, max = Infinity, required = false, def } = {}) {
  if (v === undefined || v === null || v === '') {
    if (required) throw new HttpError(400, `${field} is required.`);
    return def;
  }
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[, $]/g, ''));
  if (!Number.isFinite(n)) throw new HttpError(400, `${field} must be a number.`);
  if (n < min || n > max) throw new HttpError(400, `${field} must be between ${min} and ${max}.`);
  return n;
}
export function oneOf(v, allowed, { field, def } = {}) {
  if ((v === undefined || v === '') && def !== undefined) return def;
  if (!allowed.includes(v)) throw new HttpError(400, `${field} is invalid.`);
  return v;
}
