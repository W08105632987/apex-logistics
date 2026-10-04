// Integration tests: boots the real server against a throwaway database.
// Run with: npm test   (requires Node >= 22.5)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'Test-Passw0rd-123';
let proc, tmp, cookie = '';

async function call(method, url, body, { auth = true, headers = {} } = {}) {
  const res = await fetch(BASE + url, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(auth && cookie ? { Cookie: cookie } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get('set-cookie');
  if (set && url.includes('/auth/login')) cookie = set.split(';')[0];
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'apex-test-'));
  proc = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server/index.mjs'], {
    env: { ...process.env, PORT, HOST: '127.0.0.1', NODE_ENV: 'development', APP_URL: BASE, DATABASE_PATH: path.join(tmp, 't.db'), BACKUP_DIR: path.join(tmp, 'bk'), ADMIN_USERNAME: 'tester', ADMIN_PASSWORD: PASSWORD, ADMIN_EMAIL: 't@example.com', SEED_DEMO_DATA: 'false', RESEND_API_KEY: '' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE + '/api/health')).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start');
});
after(async () => { if (proc) { proc.kill(); await new Promise(r => proc.on('exit', r)); } try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {} });

const newShipment = (extra = {}) => ({
  originHubCode: 'FRA', destHubCode: 'JFK', serviceType: 'express_air',
  sender: { name: 'Acme <script>', country: 'Germany', email: 'a@acme.de' },
  receiver: { name: 'Jane', country: 'United States', email: 'jane@example.com', city: 'New York' },
  package: { weight: 5, pieces: 1, cargoType: 'Docs' }, ...extra,
});

test('staff endpoints require authentication', async () => {
  assert.equal((await call('GET', '/api/shipments', undefined, { auth: false })).status, 401);
  assert.equal((await call('POST', '/api/shipments', newShipment(), { auth: false })).status, 401);
});

test('old hard-coded demo credentials do not work', async () => {
  for (const [u, p] of [['admin', 'admin'], ['staff', 'staff123'], ['customs', 'password']]) {
    assert.equal((await call('POST', '/api/auth/login', { identifier: u, password: p }, { auth: false })).status, 401);
  }
});

test('login, create, advance, public tracking is masked', async () => {
  const login = await call('POST', '/api/auth/login', { identifier: 'tester', password: PASSWORD });
  assert.equal(login.status, 200);
  const created = await call('POST', '/api/shipments', newShipment());
  assert.equal(created.status, 201);
  const s = created.data.shipment;
  assert.match(s.trackingNumber, /^APX-\d{6}-US$/);

  const adv = await call('POST', `/api/shipments/${s.id}/advance`, {});
  assert.equal(adv.data.shipment.status, 'picked_up');
  assert.equal(adv.data.shipment.checkpoints.length, 2);

  const pub = await call('GET', `/api/track/${s.trackingNumber.toLowerCase()}`, undefined, { auth: false });
  assert.equal(pub.status, 200);
  assert.equal(pub.data.shipment.receiver.address, 'Address on file');
  assert.ok(!pub.data.shipment.receiver.email.includes('jane@'));
  assert.equal(pub.data.shipment.subscribers, undefined);
  assert.equal((await call('GET', '/api/track/APX-NOPE', undefined, { auth: false })).status, 404);
});

test('duplicate tracking numbers and bad input are rejected', async () => {
  const a = await call('POST', '/api/shipments', newShipment({ trackingNumber: 'TEST-123456' }));
  assert.equal(a.status, 201);
  assert.equal((await call('POST', '/api/shipments', newShipment({ trackingNumber: 'TEST-123456' }))).status, 409);
  const bad = newShipment(); bad.receiver.email = 'not-an-email';
  assert.equal((await call('POST', '/api/shipments', bad)).status, 400);
});

test('emails are queued, HTML-escaped, and logged when no provider is configured', async () => {
  await new Promise((r) => setTimeout(r, 300));
  const { data } = await call('GET', '/api/emails');
  assert.ok(data.emails.length > 0);
  assert.ok(data.emails.every((e) => !e.htmlContent.includes('<script>')));
  assert.ok(data.emails.every((e) => e.deliveryStatus === 'logged'));
});

test('public forms validate, store, and are visible to staff', async () => {
  const q = await call('POST', '/api/quote-requests', { name: 'Bob', email: 'bob@example.com', originCountry: 'Germany', destCountry: 'Japan', weight: 20, serviceType: 'express_air' }, { auth: false });
  assert.equal(q.status, 201);
  assert.equal((await call('POST', '/api/quote-requests', { name: 'Bob', email: 'bad', originCountry: 'Germany', destCountry: 'Japan', weight: 20 }, { auth: false })).status, 400);
  assert.equal((await call('POST', '/api/contact', { name: 'Bob', email: 'bob@example.com', message: 'short' }, { auth: false })).status, 400);
  const list = await call('GET', '/api/quote-requests');
  assert.ok(list.data.requests.some((r) => r.reference === q.data.reference));
});

test('roles are enforced, new users must change temporary password', async () => {
  const created = await call('POST', '/api/users', { username: 'insp', name: 'Insp Ector', email: 'i@example.com', role: 'customs', password: 'Temp-Passw0rd-9' });
  assert.equal(created.status, 201);
  assert.equal((await call('POST', '/api/users', { username: 'weak', name: 'W', email: 'w@example.com', role: 'staff', password: 'admin123' })).status, 400);

  const adminCookie = cookie;
  const l = await call('POST', '/api/auth/login', { identifier: 'insp', password: 'Temp-Passw0rd-9' });
  assert.equal(l.status, 200);
  const blocked = await call('GET', '/api/shipments');
  assert.equal(blocked.status, 403);
  assert.equal(blocked.data.code, 'MUST_CHANGE_PASSWORD');
  assert.equal((await call('POST', '/api/auth/change-password', { currentPassword: 'Temp-Passw0rd-9', newPassword: 'Another-Passw0rd-1' })).status, 200);
  assert.equal((await call('GET', '/api/shipments')).status, 200);
  assert.equal((await call('POST', '/api/shipments', newShipment())).status, 403);
  const id = (await call('GET', '/api/shipments?limit=1')).data.shipments[0].id;
  assert.equal((await call('DELETE', `/api/shipments/${id}`)).status, 403);
  cookie = adminCookie;
});

test('cross-origin writes are blocked and non-JSON bodies rejected', async () => {
  assert.equal((await call('POST', '/api/contact', {}, { auth: false, headers: { Origin: 'https://evil.example' } })).status, 403);
  const res = await fetch(BASE + '/api/contact', { method: 'POST', body: 'a=b' });
  assert.equal(res.status, 415);
});

test('accounts lock after repeated failures', async () => {
  let last;
  for (let i = 0; i < 6; i++) last = await call('POST', '/api/auth/login', { identifier: 'insp', password: 'wrong-password-1' }, { auth: false });
  assert.equal(last.status, 429);
});

test('admin can delete shipments; audit log records actions', async () => {
  const id = (await call('GET', '/api/shipments?limit=1')).data.shipments[0].id;
  assert.equal((await call('DELETE', `/api/shipments/${id}`)).status, 200);
  const audit = await call('GET', '/api/audit?limit=50');
  assert.ok(audit.data.entries.some((e) => e.action === 'shipment.delete'));
});
