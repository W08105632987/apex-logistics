#!/usr/bin/env node
// Admin command line: node server/cli.mjs <command>
import readline from 'node:readline/promises';
import { migrate, db, backupDatabase } from './db.mjs';
import { createUser, adminResetPassword, listUsers } from './users.mjs';
import { seedDemoData } from './seed.mjs';

migrate();
const [cmd, ...args] = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };

async function ask(q, hidden = false) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) { rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); }; }
  const a = await rl.question(q);
  rl.close();
  if (hidden) console.log();
  return a.trim();
}

try {
  if (cmd === 'create-user') {
    const user = await createUser({
      username: flag('username') ?? (await ask('Username: ')),
      name: flag('name') ?? (await ask('Full name: ')),
      email: flag('email') ?? (await ask('Email: ')),
      role: (flag('role') ?? (await ask('Role (admin/staff/customs) [staff]: '))) || 'staff',
      password: flag('password') ?? (await ask('Password (min 10 chars, letters+numbers): ', true)),
    });
    console.log(`Created ${user.role} "${user.username}" (${user.badgeNumber})`);
  } else if (cmd === 'reset-password') {
    const username = flag('username') ?? (await ask('Username: '));
    const row = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!row) throw new Error('No such user');
    await adminResetPassword(row.id, flag('password') ?? (await ask('New password: ', true)));
    console.log('Password updated; user must change it at next login and all sessions were revoked.');
  } else if (cmd === 'list-users') {
    console.table(listUsers().map((u) => ({ username: u.username, role: u.role, email: u.email, active: u.isActive, lastLogin: u.lastLogin })));
  } else if (cmd === 'seed-demo') {
    seedDemoData();
  } else if (cmd === 'backup') {
    console.log('Backup written to', backupDatabase());
  } else {
    console.log('Commands: create-user | reset-password | list-users | seed-demo | backup');
    process.exitCode = 1;
  }
} catch (e) {
  console.error('Error:', e.message);
  process.exitCode = 1;
}
