import { db } from './db.mjs';
import { config } from './config.mjs';
import { hashPassword, verifyPassword, passwordProblem, newToken, sha256, uid } from './security.mjs';
import { HttpError, str, email as vEmail, oneOf } from './validate.mjs';

export const ROLES = ['admin', 'staff', 'customs'];
const ROLE_TITLES = { admin: 'Operations Administrator', staff: 'Logistics Controller', customs: 'Port Regulatory Inspector' };

export function permissionsFor(role) {
  return {
    canCreateShipments: role === 'admin' || role === 'staff',
    canUpdateCheckpoints: true,
    canDeleteShipments: role === 'admin',
    canBroadcastEmails: role !== 'customs',
    canManageStaff: role === 'admin',
    canClearCustoms: role === 'admin' || role === 'customs',
  };
}

export function publicUser(r) {
  return {
    id: r.id, username: r.username, name: r.name, role: r.role, roleTitle: r.role_title, badgeNumber: r.badge_number,
    stationLocation: r.station_location, token: '', lastLogin: r.last_login || new Date().toISOString(),
    avatarInitials: r.avatar_initials, permissions: permissionsFor(r.role), email: r.email, isActive: !!r.is_active,
    mustChangePassword: !!r.must_change_password, createdAt: r.created_at,
  };
}

const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'U';

export async function createUser(input, { mustChange = false } = {}) {
  const username = str(input.username, { field: 'Username', required: true, min: 3, max: 40 });
  if (!/^[A-Za-z0-9._-]+$/.test(username)) throw new HttpError(400, 'Username may only contain letters, numbers, dots, dashes and underscores.');
  const name = str(input.name, { field: 'Name', required: true, max: 120 });
  const mail = vEmail(input.email, { field: 'Email' });
  const role = oneOf(input.role, ROLES, { field: 'Role', def: 'staff' });
  const problem = passwordProblem(input.password, username);
  if (problem) throw new HttpError(400, problem);
  const now = new Date().toISOString();
  const badge = str(input.badgeNumber, { field: 'Badge number', max: 30 }) || `APX-${role.slice(0, 3).toUpperCase()}-${String(Math.floor(100 + Math.random() * 900))}`;
  const row = {
    id: uid('usr'), username, email: mail, badge, name, role,
    title: str(input.roleTitle, { field: 'Role title', max: 80 }) || ROLE_TITLES[role],
    station: str(input.stationLocation, { field: 'Station', max: 120 }) || 'Head Office',
  };
  try {
    db.prepare(`INSERT INTO users (id, username, email, badge_number, name, role, role_title, station_location, avatar_initials, password_hash, must_change_password, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(row.id, row.username, row.email, row.badge, row.name, row.role, row.title, row.station, initials(name), await hashPassword(input.password), mustChange ? 1 : 0, now, now);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) throw new HttpError(409, 'That username, email or badge number is already in use.');
    throw e;
  }
  return publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(row.id));
}

const DUMMY_HASH = await hashPassword('dummy-password-for-timing');
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function login(identifier, password, { ip, userAgent }) {
  const id = String(identifier || '').trim();
  const row = id ? db.prepare('SELECT * FROM users WHERE username = ? OR email = ? OR badge_number = ?').get(id, id, id) : null;
  const generic = new HttpError(401, 'Invalid credentials.');
  if (!row) { await verifyPassword(String(password || ''), DUMMY_HASH); throw generic; }
  if (row.locked_until > Date.now()) {
    throw new HttpError(429, `Account temporarily locked after repeated failures. Try again in ${Math.ceil((row.locked_until - Date.now()) / 60000)} minute(s).`);
  }
  const ok = await verifyPassword(String(password || ''), row.password_hash);
  if (!ok || !row.is_active) {
    const fails = row.failed_attempts + 1;
    db.prepare('UPDATE users SET failed_attempts=?, locked_until=? WHERE id=?').run(fails >= MAX_FAILS ? 0 : fails, fails >= MAX_FAILS ? Date.now() + LOCK_MS : 0, row.id);
    throw generic;
  }
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET failed_attempts=0, locked_until=0, last_login=? WHERE id=?').run(now, row.id);
  const token = newToken();
  const expires = Date.now() + config.sessionHours * 3600_000;
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, ip, user_agent) VALUES (?,?,?,?,?,?)').run(sha256(token), row.id, Date.now(), expires, ip, String(userAgent || '').slice(0, 200));
  return { token, expires, user: publicUser({ ...row, last_login: now }) };
}

export function userFromToken(token) {
  if (!token) return null;
  const s = db.prepare('SELECT u.*, s.expires_at AS session_expires FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').get(sha256(token));
  if (!s) return null;
  if (s.session_expires < Date.now() || !s.is_active) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
    return null;
  }
  return s;
}
export const destroySession = (token) => token && db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
export const destroyUserSessions = (userId, exceptToken) =>
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, exceptToken ? sha256(exceptToken) : '');
export const purgeExpiredSessions = () => db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());

export async function changePassword(userId, currentPassword, newPassword, currentToken) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row || !(await verifyPassword(String(currentPassword || ''), row.password_hash))) throw new HttpError(400, 'Current password is incorrect.');
  const problem = passwordProblem(newPassword, row.username);
  if (problem) throw new HttpError(400, problem);
  db.prepare('UPDATE users SET password_hash=?, must_change_password=0, updated_at=? WHERE id=?').run(await hashPassword(newPassword), new Date().toISOString(), userId);
  destroyUserSessions(userId, currentToken);
}

export async function adminResetPassword(userId, newPassword) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) throw new HttpError(404, 'User not found.');
  const problem = passwordProblem(newPassword, row.username);
  if (problem) throw new HttpError(400, problem);
  db.prepare('UPDATE users SET password_hash=?, must_change_password=1, failed_attempts=0, locked_until=0, updated_at=? WHERE id=?').run(await hashPassword(newPassword), new Date().toISOString(), userId);
  destroyUserSessions(userId);
}

export const listUsers = () => db.prepare('SELECT * FROM users ORDER BY created_at').all().map(publicUser);
export const countUsers = () => db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
