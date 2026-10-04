// Central configuration. Everything comes from environment variables (see .env.example).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

// Minimal .env loader (no dependency). Real environment variables always win.
function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadDotEnv(path.join(ROOT, '.env'));

const env = process.env;
const bool = (v, d = false) => (v === undefined || v === '' ? d : /^(1|true|yes|on)$/i.test(v));
const int = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);

export const config = {
  env: env.NODE_ENV || 'development',
  isProd: (env.NODE_ENV || 'development') === 'production',
  port: int(env.PORT, 3000),
  host: env.HOST || '0.0.0.0',
  appUrl: (env.APP_URL || `http://localhost:${int(env.PORT, 3000)}`).replace(/\/+$/, ''),
  trustProxy: bool(env.TRUST_PROXY, false),
  secureCookies: bool(env.COOKIE_SECURE, (env.APP_URL || '').startsWith('https://')),
  dbPath: path.resolve(ROOT, env.DATABASE_PATH || 'data/apex.db'),
  backupDir: path.resolve(ROOT, env.BACKUP_DIR || 'data/backups'),
  distDir: path.join(ROOT, 'dist'),
  sessionHours: int(env.SESSION_HOURS, 8),
  brand: env.BRAND_NAME || 'Apex Global Logistics',
  supportEmail: env.SUPPORT_EMAIL || 'support@example.com',
  staffNotifyEmail: env.STAFF_NOTIFY_EMAIL || '',
  email: {
    provider: env.RESEND_API_KEY ? 'resend' : 'log',
    resendApiKey: env.RESEND_API_KEY || '',
    from: env.EMAIL_FROM || 'Apex Logistics <onboarding@resend.dev>',
    maxAttempts: int(env.EMAIL_MAX_ATTEMPTS, 5),
  },
  bootstrapAdmin: {
    username: env.ADMIN_USERNAME || '',
    password: env.ADMIN_PASSWORD || '',
    email: env.ADMIN_EMAIL || '',
    name: env.ADMIN_NAME || 'Administrator',
  },
  seedDemoData: bool(env.SEED_DEMO_DATA, false),
  backupEveryHours: int(env.BACKUP_EVERY_HOURS, 24),
  backupKeep: int(env.BACKUP_KEEP, 14),
};

export function assertProductionConfig() {
  if (!config.isProd) return;
  const problems = [];
  if (!env.APP_URL || !env.APP_URL.startsWith('https://')) problems.push('APP_URL must be set to your public https:// URL');
  if (!config.email.resendApiKey) console.warn('[config] RESEND_API_KEY not set: emails will be logged to the database but NOT delivered.');
  if (problems.length) {
    console.error('[config] Refusing to start in production:\n - ' + problems.join('\n - '));
    process.exit(1);
  }
}
