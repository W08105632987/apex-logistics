import http from 'node:http';
import { config, assertProductionConfig } from './config.mjs';
import { db, migrate, backupDatabase } from './db.mjs';
import { router, COOKIE } from './routes.mjs';
import { securityHeaders, sendJson, readJson, parseCookies, clientIp, serveStatic } from './http.mjs';
import { HttpError } from './validate.mjs';
import { userFromToken, purgeExpiredSessions, countUsers, createUser } from './users.mjs';
import { startEmailRetryWorker } from './email.mjs';
import { seedDemoData } from './seed.mjs';
import crypto from 'node:crypto';

assertProductionConfig();
migrate();

async function bootstrap() {
  if (countUsers() === 0) {
    const b = config.bootstrapAdmin;
    if (b.username && b.password) {
      await createUser({ username: b.username, password: b.password, email: b.email || `${b.username}@example.com`, name: b.name, role: 'admin' });
      console.log(`[bootstrap] created admin user "${b.username}"`);
    } else if (!config.isProd) {
      const password = crypto.randomBytes(9).toString('base64url') + '7';
      await createUser({ username: 'admin', password, email: 'admin@example.com', name: 'Dev Administrator', role: 'admin' });
      console.log(`\n[bootstrap] DEV ONLY: created user "admin" with password: ${password}\n`);
    } else {
      console.warn('[bootstrap] No users exist. Set ADMIN_USERNAME / ADMIN_PASSWORD (first boot) or run: npm run create-user');
    }
  }
  if (config.seedDemoData) seedDemoData();
}
await bootstrap();
startEmailRetryWorker();
setInterval(purgeExpiredSessions, 3600_000).unref();
if (config.backupEveryHours > 0) {
  setInterval(() => { try { console.log('[backup] wrote', backupDatabase()); } catch (e) { console.error('[backup] failed', e.message); } }, config.backupEveryHours * 3600_000).unref();
}

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  securityHeaders(res);
  const ip = clientIp(req);
  const url = new URL(req.url, 'http://localhost');
  try {
    if (!url.pathname.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.');
      return serveStatic(req, res, url.pathname);
    }
    const m = router.match(req.method, url.pathname);
    if (!m.handler) throw new HttpError(m.pathMatched ? 405 : 404, m.pathMatched ? 'Method not allowed.' : 'Not found.');
    const { opts, fn } = m.handler;

    const token = parseCookies(req)[COOKIE];
    const sessionRow = userFromToken(token);
    const ctx = { req, res, url, ip, params: m.params, body: {}, token, sessionRow, user: sessionRow ? { id: sessionRow.id, username: sessionRow.username, role: sessionRow.role } : null };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // CSRF defence: JSON-only bodies (forces CORS preflight) + same-origin check when an Origin header is present.
      const origin = req.headers.origin;
      if (origin && origin !== config.appUrl && !(origin.startsWith('http://localhost') && !config.isProd)) throw new HttpError(403, 'Cross-origin request blocked.');
      if (req.method === 'POST' || req.method === 'PATCH') ctx.body = await readJson(req);
    }
    if (opts.auth && !ctx.user) throw new HttpError(401, 'Please sign in.');
    if (opts.roles && !opts.roles.includes(ctx.user.role)) throw new HttpError(403, 'You do not have permission to do that.');
    if (ctx.user && sessionRow.must_change_password && opts.auth && !req.url.startsWith('/api/auth/')) {
      throw new HttpError(403, 'You must change your password before continuing.', { code: 'MUST_CHANGE_PASSWORD' });
    }

    const out = await fn(ctx);
    if (!res.headersSent) sendJson(res, out.status, out.body);
  } catch (e) {
    if (res.headersSent) return res.end();
    if (e instanceof HttpError) {
      const headers = e.extra?.retryAfter ? { 'Retry-After': String(e.extra.retryAfter) } : {};
      return sendJson(res, e.status, { error: e.message, ...(e.extra?.code ? { code: e.extra.code } : {}) }, headers);
    }
    console.error('[error]', req.method, url.pathname, e);
    sendJson(res, 500, { error: 'Something went wrong on our side. Please try again.' });
  } finally {
    if (url.pathname.startsWith('/api/') && url.pathname !== '/api/health') {
      console.log(`${req.method} ${url.pathname} ${res.statusCode} ${Date.now() - started}ms`);
    }
  }
});

server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
server.keepAliveTimeout = 5_000;
server.listen(config.port, config.host, () => console.log(`[server] ${config.brand} listening on http://${config.host}:${config.port} (${config.env})`));

function shutdown(sig) {
  console.log(`[server] ${sig} received, shutting down`);
  server.close(() => { try { db.close(); } catch {} process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
