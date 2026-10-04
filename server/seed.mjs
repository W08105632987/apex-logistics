import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.mjs';
import { importShipment } from './domain.mjs';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed', 'demo-shipments.json');

/** Inserts the 4 sample shipments once (idempotent). Intended for demos/staging only. */
export function seedDemoData() {
  const shipments = JSON.parse(fs.readFileSync(file, 'utf8'));
  let n = 0;
  for (const s of shipments) {
    if (db.prepare('SELECT 1 FROM shipments WHERE tracking_number = ?').get(s.trackingNumber)) continue;
    importShipment(s);
    n++;
  }
  if (n) console.log(`[seed] inserted ${n} demo shipments`);
}
