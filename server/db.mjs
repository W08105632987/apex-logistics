// SQLite database (Node's built-in node:sqlite; no native modules to compile).
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.mjs';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
export const db = new DatabaseSync(config.dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

// Ordered, append-only migrations. Never edit an applied migration; add a new one.
const MIGRATIONS = [
  {
    id: 1,
    name: 'initial schema',
    sql: `
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      badge_number TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','staff','customs')),
      role_title TEXT NOT NULL DEFAULT '',
      station_location TEXT NOT NULL DEFAULT '',
      avatar_initials TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0,
      last_login TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT
    );
    CREATE INDEX idx_sessions_user ON sessions(user_id);
    CREATE INDEX idx_sessions_expires ON sessions(expires_at);

    CREATE TABLE shipments (
      id TEXT PRIMARY KEY,
      tracking_number TEXT NOT NULL UNIQUE COLLATE NOCASE,
      reference_number TEXT,
      service_type TEXT NOT NULL,
      status TEXT NOT NULL,
      status_message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      estimated_delivery TEXT NOT NULL,
      actual_delivery TEXT,
      origin_code TEXT NOT NULL,
      destination_code TEXT NOT NULL,
      origin_hub TEXT NOT NULL,
      destination_hub TEXT NOT NULL,
      current_location TEXT NOT NULL,
      sender TEXT NOT NULL,
      receiver TEXT NOT NULL,
      receiver_email TEXT NOT NULL COLLATE NOCASE,
      package_details TEXT NOT NULL,
      transport_vessel TEXT,
      customs_details TEXT,
      signature_proof TEXT,
      assigned_courier TEXT,
      notes TEXT,
      tags TEXT,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_shipments_status ON shipments(status);
    CREATE INDEX idx_shipments_created ON shipments(created_at DESC);
    CREATE INDEX idx_shipments_receiver_email ON shipments(receiver_email);

    CREATE TABLE checkpoints (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      facility_code TEXT,
      lat REAL,
      lng REAL,
      signed_by TEXT,
      completed INTEGER NOT NULL DEFAULT 1,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_checkpoints_shipment ON checkpoints(shipment_id, timestamp DESC);

    CREATE TABLE subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      email TEXT NOT NULL COLLATE NOCASE,
      created_at TEXT NOT NULL,
      UNIQUE (shipment_id, email)
    );

    CREATE TABLE emails (
      id TEXT PRIMARY KEY,
      shipment_id TEXT REFERENCES shipments(id) ON DELETE SET NULL,
      tracking_number TEXT,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      trigger TEXT NOT NULL,
      html TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','logged')),
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      provider_id TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      sent_at TEXT
    );
    CREATE INDEX idx_emails_created ON emails(created_at DESC);
    CREATE INDEX idx_emails_status ON emails(status);

    CREATE TABLE quote_requests (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE,
      phone TEXT,
      company TEXT,
      origin_country TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      cargo_category TEXT,
      declared_value REAL,
      service_type TEXT,
      quoted_price REAL,
      currency TEXT NOT NULL DEFAULT 'USD',
      message TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','closed')),
      handled_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      shipment_id TEXT REFERENCES shipments(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX idx_quotes_status ON quote_requests(status, created_at DESC);

    CREATE TABLE contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE,
      topic TEXT NOT NULL DEFAULT 'general',
      tracking_number TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','resolved')),
      handled_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX idx_contact_status ON contact_messages(status, created_at DESC);

    CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      user_id TEXT,
      username TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      detail TEXT,
      ip TEXT
    );
    CREATE INDEX idx_audit_ts ON audit_log(ts DESC);
    `,
  },
];

export function migrate() {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)`);
  const done = new Set(db.prepare('SELECT id FROM schema_migrations').all().map((r) => r.id));
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    db.exec('BEGIN');
    try {
      db.exec(m.sql);
      db.prepare('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?,?,?)').run(m.id, m.name, new Date().toISOString());
      db.exec('COMMIT');
      console.log(`[db] applied migration ${m.id}: ${m.name}`);
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }
}

export function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch {}
    throw e;
  }
}

export function backupDatabase() {
  fs.mkdirSync(config.backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(config.backupDir, `apex-${stamp}.db`);
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  const files = fs.readdirSync(config.backupDir).filter((f) => /^apex-.*\.db$/.test(f)).sort();
  while (files.length > config.backupKeep) fs.unlinkSync(path.join(config.backupDir, files.shift()));
  return file;
}
