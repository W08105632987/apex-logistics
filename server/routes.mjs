import { db } from './db.mjs';
import { config } from './config.mjs';
import { Router, readJson, sendJson, setCookie, clientIp } from './http.mjs';
import { HttpError, str, email as vEmail, num, oneOf } from './validate.mjs';
import { rateLimit, uid, randInt } from './security.mjs';
import * as U from './users.mjs';
import * as D from './domain.mjs';
import { queueEmail, simpleEmail } from './email.mjs';

export const router = new Router();
export const COOKIE = 'apex_sid';

// ---- route registration helpers ----
const wrap = (opts, fn) => ({ opts, fn });
function route(method, pattern, opts, fn) {
  router.add(method, pattern, wrap(opts, fn));
}
const limit = (ctx, bucket, max, windowMs) => {
  const r = rateLimit(`${bucket}:${ctx.ip}`, max, windowMs);
  if (!r.ok) throw new HttpError(429, 'Too many requests. Please slow down and try again shortly.', { retryAfter: r.retryAfter });
};
const audit = (ctx, action, entity, entityId, detail) =>
  db.prepare('INSERT INTO audit_log (ts, user_id, username, action, entity, entity_id, detail, ip) VALUES (?,?,?,?,?,?,?,?)')
    .run(new Date().toISOString(), ctx.user?.id ?? null, ctx.user?.username ?? null, action, entity ?? null, entityId ?? null, detail ? JSON.stringify(detail) : null, ctx.ip);
const paging = (url, def = 100, max = 500) => ({
  limit: Math.min(Math.max(parseInt(url.searchParams.get('limit') || def, 10) || def, 1), max),
  offset: Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0),
});

// ===================== PUBLIC =====================
route('GET', '/api/health', {}, () => {
  db.prepare('SELECT 1').get();
  return { status: 200, body: { ok: true, time: new Date().toISOString() } };
});

route('GET', '/api/config', {}, () => ({
  status: 200,
  body: { brand: config.brand, hubs: D.HUBS, countries: D.QUOTE_COUNTRIES, supportEmail: config.supportEmail },
}));

route('GET', '/api/track/:tn', {}, (ctx) => {
  limit(ctx, 'track', 60, 60_000);
  const tn = ctx.params.tn.trim().toUpperCase();
  if (tn.length > 40) throw new HttpError(404, 'Tracking number not found.');
  const s = D.getShipmentByTracking(tn);
  if (!s) throw new HttpError(404, 'Tracking number not found.');
  return { status: 200, body: { shipment: D.toPublicShipment(s) } };
});

route('POST', '/api/track/:tn/subscribe', {}, (ctx) => {
  limit(ctx, 'subscribe', 10, 3600_000);
  return { status: 200, body: D.subscribeEmail(ctx.params.tn.trim().toUpperCase(), ctx.body.email) };
});

route('POST', '/api/quotes/calculate', {}, (ctx) => {
  limit(ctx, 'quote-calc', 60, 60_000);
  return { status: 200, body: { quotes: D.calculateQuotes(ctx.body) } };
});

route('POST', '/api/quote-requests', {}, (ctx) => {
  limit(ctx, 'quote-req', 8, 3600_000);
  const b = ctx.body;
  if (b.website) return { status: 201, body: { ok: true, reference: 'QR-0000' } }; // honeypot: silently drop bots
  const origin = oneOf(b.originCountry, D.QUOTE_COUNTRIES, { field: 'Origin country' });
  const dest = oneOf(b.destCountry, D.QUOTE_COUNTRIES, { field: 'Destination country' });
  const weight = num(b.weight, { field: 'Weight', min: 0.5, max: 50000, required: true });
  const value = num(b.declaredValue, { field: 'Declared value', min: 0, max: 100000000, def: 0 });
  const serviceType = oneOf(b.serviceType, D.SERVICE_TYPES, { field: 'Service', def: 'express_air' });
  const quote = D.calculateQuotes({ originCountry: origin, destCountry: dest, weight, declaredValue: value }).find((q) => q.serviceType === serviceType);
  const row = {
    id: uid('qr'), reference: 'QR-' + randInt(100000, 999999),
    name: str(b.name, { field: 'Name', required: true, max: 120 }),
    email: vEmail(b.email),
    phone: str(b.phone, { field: 'Phone', max: 40 }),
    company: str(b.company, { field: 'Company', max: 160 }),
    message: str(b.message, { field: 'Message', max: 2000 }),
    cargo: str(b.cargoCategory, { field: 'Cargo', max: 160 }),
  };
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO quote_requests (id, reference, name, email, phone, company, origin_country, destination_country, weight_kg, cargo_category, declared_value, service_type, quoted_price, message, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(row.id, row.reference, row.name, row.email, row.phone, row.company, origin, dest, weight, row.cargo, value, serviceType, quote?.price ?? null, row.message, now, now);

  const cust = simpleEmail({
    subject: `Booking request received (${row.reference})`, badge: 'Request received', headline: 'We have your booking request',
    sub: 'A logistics specialist will contact you shortly to confirm details and arrange collection.',
    rows: [['Reference', row.reference], ['Route', `${origin} → ${dest}`], ['Weight', `${weight} kg`], ['Estimated price', quote ? `$${quote.price.toLocaleString('en-US')} USD` : 'On confirmation']], to: row.email,
  });
  queueEmail({ to: row.email, toName: row.name, subject: cust.subject, html: cust.html, trigger: 'booking_created' });
  notifyStaff(`New booking request ${row.reference}`, 'New booking request', `${row.name} requested a ${serviceType.replace(/_/g, ' ')} shipment`, [['Reference', row.reference], ['Customer', `${row.name} <${row.email}>`], ['Route', `${origin} → ${dest}`], ['Weight', `${weight} kg`], ['Quoted', quote ? `$${quote.price}` : '—'], ['Message', row.message || '—']]);
  return { status: 201, body: { ok: true, reference: row.reference } };
});

route('POST', '/api/contact', {}, (ctx) => {
  limit(ctx, 'contact', 5, 3600_000);
  const b = ctx.body;
  if (b.website) return { status: 201, body: { ok: true } };
  const m = {
    id: uid('msg'), name: str(b.name, { field: 'Name', required: true, max: 120 }), email: vEmail(b.email),
    topic: oneOf(b.topic, ['general', 'tracking', 'quote', 'claims', 'customs', 'billing'], { field: 'Topic', def: 'general' }),
    tracking: str(b.trackingNumber, { field: 'Tracking number', max: 40 }).toUpperCase(),
    message: str(b.message, { field: 'Message', required: true, min: 10, max: 4000 }),
  };
  const now = new Date().toISOString();
  db.prepare('INSERT INTO contact_messages (id, name, email, topic, tracking_number, message, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)').run(m.id, m.name, m.email, m.topic, m.tracking || null, m.message, now, now);
  const ack = simpleEmail({ subject: 'We received your message', badge: 'Message received', headline: 'Thanks for contacting us', sub: 'Our support desk will reply by email, usually within one business day.', to: m.email });
  queueEmail({ to: m.email, toName: m.name, subject: ack.subject, html: ack.html, trigger: 'custom_broadcast' });
  notifyStaff(`New support message (${m.topic})`, 'Support message', `${m.name} wrote in about ${m.topic}`, [['From', `${m.name} <${m.email}>`], ['Tracking', m.tracking || '—'], ['Message', m.message.slice(0, 600)]]);
  return { status: 201, body: { ok: true } };
});

function notifyStaff(subject, badge, headline, rows) {
  if (!config.staffNotifyEmail) return;
  const e = simpleEmail({ subject, badge, headline, sub: 'Open the staff portal inbox to respond.', rows, ctaUrl: `${config.appUrl}/#admin`, ctaLabel: 'Open staff portal', to: config.staffNotifyEmail });
  queueEmail({ to: config.staffNotifyEmail, subject: e.subject, html: e.html, trigger: 'custom_broadcast' });
}

// ===================== AUTH =====================
route('POST', '/api/auth/login', {}, async (ctx) => {
  limit(ctx, 'login', 20, 15 * 60_000);
  const { token, expires, user } = await U.login(ctx.body.identifier, ctx.body.password, { ip: ctx.ip, userAgent: ctx.req.headers['user-agent'] });
  setCookie(ctx.res, COOKIE, token, { maxAgeSec: Math.floor((expires - Date.now()) / 1000) });
  ctx.user = user;
  audit(ctx, 'auth.login', 'user', user.id);
  return { status: 200, body: { user, expiresAt: expires } };
});

route('POST', '/api/auth/logout', {}, (ctx) => {
  if (ctx.token) U.destroySession(ctx.token);
  setCookie(ctx.res, COOKIE, '', { clear: true });
  if (ctx.user) audit(ctx, 'auth.logout', 'user', ctx.user.id);
  return { status: 200, body: { ok: true } };
});

route('GET', '/api/auth/me', {}, (ctx) => ({
  status: 200,
  body: ctx.user ? { user: U.publicUser(ctx.sessionRow), expiresAt: ctx.sessionRow.session_expires } : { user: null },
}));

route('POST', '/api/auth/change-password', { auth: true }, async (ctx) => {
  limit(ctx, 'chpw', 10, 3600_000);
  await U.changePassword(ctx.user.id, ctx.body.currentPassword, ctx.body.newPassword, ctx.token);
  audit(ctx, 'auth.password_changed', 'user', ctx.user.id);
  return { status: 200, body: { ok: true } };
});

// ===================== STAFF: SHIPMENTS =====================
route('GET', '/api/shipments', { auth: true }, (ctx) => {
  const { limit: lim, offset } = paging(ctx.url, 200, 500);
  const shipments = D.listShipments({ q: ctx.url.searchParams.get('q') || '', status: ctx.url.searchParams.get('status') || '', limit: lim, offset });
  const total = db.prepare('SELECT COUNT(*) AS n FROM shipments').get().n;
  return { status: 200, body: { shipments, total } };
});

route('GET', '/api/shipments/:id', { auth: true }, (ctx) => {
  const s = D.getShipmentById(ctx.params.id);
  if (!s) throw new HttpError(404, 'Shipment not found.');
  return { status: 200, body: { shipment: s } };
});

route('POST', '/api/shipments', { auth: true, roles: ['admin', 'staff'] }, (ctx) => {
  const { shipment, emailIds } = D.createShipment(ctx.body, ctx.user);
  audit(ctx, 'shipment.create', 'shipment', shipment.id, { tracking: shipment.trackingNumber });
  return { status: 201, body: { shipment, emailsQueued: emailIds.length } };
});

route('POST', '/api/shipments/:id/advance', { auth: true }, (ctx) => {
  const { shipment, emailIds } = D.advanceShipment(ctx.params.id, ctx.user);
  audit(ctx, 'shipment.advance', 'shipment', shipment.id, { status: shipment.status });
  return { status: 200, body: { shipment, emailsQueued: emailIds.length } };
});

route('POST', '/api/shipments/:id/checkpoints', { auth: true }, (ctx) => {
  const { shipment, emailIds } = D.addCheckpoint(ctx.params.id, ctx.body, ctx.user);
  audit(ctx, 'shipment.checkpoint', 'shipment', shipment.id, { status: shipment.status, title: ctx.body.title });
  return { status: 200, body: { shipment, emailsQueued: emailIds.length } };
});

route('DELETE', '/api/shipments/:id', { auth: true, roles: ['admin'] }, (ctx) => {
  const s = D.getShipmentById(ctx.params.id);
  D.deleteShipment(ctx.params.id);
  audit(ctx, 'shipment.delete', 'shipment', ctx.params.id, { tracking: s?.trackingNumber });
  return { status: 200, body: { ok: true } };
});

route('GET', '/api/stats', { auth: true }, () => {
  const byStatus = Object.fromEntries(db.prepare('SELECT status, COUNT(*) n FROM shipments GROUP BY status').all().map((r) => [r.status, r.n]));
  return {
    status: 200,
    body: {
      shipments: byStatus,
      newQuoteRequests: db.prepare("SELECT COUNT(*) n FROM quote_requests WHERE status='new'").get().n,
      newMessages: db.prepare("SELECT COUNT(*) n FROM contact_messages WHERE status='new'").get().n,
      failedEmails: db.prepare("SELECT COUNT(*) n FROM emails WHERE status='failed'").get().n,
    },
  };
});

// ===================== STAFF: EMAIL LOG =====================
const emailOut = (r) => ({
  id: r.id, shipmentId: r.shipment_id || '', trackingNumber: r.tracking_number || '', recipientEmail: r.recipient_email,
  recipientName: r.recipient_name, subject: r.subject, statusTrigger: r.trigger, sentAt: r.sent_at || r.created_at,
  htmlContent: r.html, status: r.status === 'sent' || r.status === 'logged' ? 'delivered' : r.status === 'failed' ? 'queued' : 'queued',
  deliveryStatus: r.status, lastError: r.last_error || undefined, isRead: !!r.is_read,
});
route('GET', '/api/emails', { auth: true }, (ctx) => {
  const { limit: lim, offset } = paging(ctx.url, 100, 300);
  const rows = db.prepare('SELECT * FROM emails ORDER BY created_at DESC LIMIT ? OFFSET ?').all(lim, offset);
  return { status: 200, body: { emails: rows.map(emailOut), total: db.prepare('SELECT COUNT(*) n FROM emails').get().n } };
});
route('DELETE', '/api/emails', { auth: true, roles: ['admin'] }, (ctx) => {
  db.prepare('DELETE FROM emails').run();
  audit(ctx, 'emails.clear', 'emails');
  return { status: 200, body: { ok: true } };
});

// ===================== STAFF: INBOX =====================
const qrOut = (r) => ({
  id: r.id, reference: r.reference, name: r.name, email: r.email, phone: r.phone || '', company: r.company || '',
  originCountry: r.origin_country, destinationCountry: r.destination_country, weightKg: r.weight_kg, cargoCategory: r.cargo_category || '',
  declaredValue: r.declared_value, serviceType: r.service_type, quotedPrice: r.quoted_price, currency: r.currency, message: r.message || '',
  status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
});
route('GET', '/api/quote-requests', { auth: true, roles: ['admin', 'staff'] }, (ctx) => {
  const { limit: lim, offset } = paging(ctx.url);
  return { status: 200, body: { requests: db.prepare('SELECT * FROM quote_requests ORDER BY created_at DESC LIMIT ? OFFSET ?').all(lim, offset).map(qrOut) } };
});
route('PATCH', '/api/quote-requests/:id', { auth: true, roles: ['admin', 'staff'] }, (ctx) => {
  const status = oneOf(ctx.body.status, ['new', 'contacted', 'converted', 'closed'], { field: 'Status' });
  const r = db.prepare('UPDATE quote_requests SET status=?, handled_by=?, updated_at=? WHERE id=?').run(status, ctx.user.id, new Date().toISOString(), ctx.params.id);
  if (!r.changes) throw new HttpError(404, 'Request not found.');
  audit(ctx, 'quote_request.update', 'quote_request', ctx.params.id, { status });
  return { status: 200, body: { request: qrOut(db.prepare('SELECT * FROM quote_requests WHERE id=?').get(ctx.params.id)) } };
});

const msgOut = (r) => ({ id: r.id, name: r.name, email: r.email, topic: r.topic, trackingNumber: r.tracking_number || '', message: r.message, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at });
route('GET', '/api/contact-messages', { auth: true, roles: ['admin', 'staff'] }, (ctx) => {
  const { limit: lim, offset } = paging(ctx.url);
  return { status: 200, body: { messages: db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ? OFFSET ?').all(lim, offset).map(msgOut) } };
});
route('PATCH', '/api/contact-messages/:id', { auth: true, roles: ['admin', 'staff'] }, (ctx) => {
  const status = oneOf(ctx.body.status, ['new', 'read', 'resolved'], { field: 'Status' });
  const r = db.prepare('UPDATE contact_messages SET status=?, handled_by=?, updated_at=? WHERE id=?').run(status, ctx.user.id, new Date().toISOString(), ctx.params.id);
  if (!r.changes) throw new HttpError(404, 'Message not found.');
  audit(ctx, 'contact_message.update', 'contact_message', ctx.params.id, { status });
  return { status: 200, body: { message: msgOut(db.prepare('SELECT * FROM contact_messages WHERE id=?').get(ctx.params.id)) } };
});

// ===================== ADMIN: USERS & AUDIT =====================
route('GET', '/api/users', { auth: true, roles: ['admin'] }, () => ({ status: 200, body: { users: U.listUsers() } }));
route('POST', '/api/users', { auth: true, roles: ['admin'] }, async (ctx) => {
  const user = await U.createUser(ctx.body, { mustChange: true });
  audit(ctx, 'user.create', 'user', user.id, { username: user.username, role: user.role });
  return { status: 201, body: { user } };
});
route('PATCH', '/api/users/:id', { auth: true, roles: ['admin'] }, async (ctx) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(ctx.params.id);
  if (!row) throw new HttpError(404, 'User not found.');
  const b = ctx.body;
  if (typeof b.password === 'string' && b.password) {
    await U.adminResetPassword(row.id, b.password);
    audit(ctx, 'user.password_reset', 'user', row.id);
  }
  if (b.role !== undefined || b.isActive !== undefined) {
    const role = b.role !== undefined ? oneOf(b.role, U.ROLES, { field: 'Role' }) : row.role;
    const active = b.isActive !== undefined ? (b.isActive ? 1 : 0) : row.is_active;
    if (row.id === ctx.user.id && (role !== 'admin' || !active)) throw new HttpError(400, 'You cannot demote or deactivate your own account.');
    db.prepare('UPDATE users SET role=?, is_active=?, updated_at=? WHERE id=?').run(role, active, new Date().toISOString(), row.id);
    if (!active) U.destroyUserSessions(row.id);
    audit(ctx, 'user.update', 'user', row.id, { role, active });
  }
  return { status: 200, body: { user: U.publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(row.id)) } };
});
route('GET', '/api/audit', { auth: true, roles: ['admin'] }, (ctx) => {
  const { limit: lim, offset } = paging(ctx.url, 100, 500);
  return { status: 200, body: { entries: db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ? OFFSET ?').all(lim, offset) } };
});

export { sendJson, readJson, clientIp };
