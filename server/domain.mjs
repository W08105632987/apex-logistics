// Business logic: shipments, status progression, quotes. Mirrors the shapes in src/types.ts.
import { db, tx } from './db.mjs';
import { uid, randInt } from './security.mjs';
import { HttpError, str, email, num, oneOf } from './validate.mjs';
import { queueEmail, shipmentEmail } from './email.mjs';

export const STATUSES = ['manifest_created', 'picked_up', 'received_at_facility', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'exception_hold'];
export const SERVICE_TYPES = ['express_air', 'priority_ocean', 'international_freight', 'cold_chain', 'same_day_courier', 'heavy_cargo'];

export const HUBS = [
  { code: 'FRA', name: 'Frankfurt Global Freight Hub', city: 'Frankfurt', country: 'Germany', coordinates: [50.0379, 8.5622] },
  { code: 'JFK', name: 'New York JFK Cargo Terminal', city: 'New York', country: 'United States', coordinates: [40.6413, -73.7781] },
  { code: 'LHR', name: 'London Heathrow World Cargo', city: 'London', country: 'United Kingdom', coordinates: [51.47, -0.4543] },
  { code: 'NRT', name: 'Tokyo Narita Air Cargo Center', city: 'Tokyo', country: 'Japan', coordinates: [35.772, 140.3929] },
  { code: 'DWC', name: 'Dubai Logistics City Port', city: 'Dubai', country: 'United Arab Emirates', coordinates: [25.2048, 55.2708] },
  { code: 'SIN', name: 'Singapore Changi Airfreight', city: 'Singapore', country: 'Singapore', coordinates: [1.3644, 103.9915] },
  { code: 'CDG', name: 'Paris Charles de Gaulle Cargo', city: 'Paris', country: 'France', coordinates: [49.0097, 2.5479] },
  { code: 'SYD', name: 'Sydney Port Botany Logistics', city: 'Sydney', country: 'Australia', coordinates: [-33.8688, 151.2093] },
  { code: 'HKG', name: 'Hong Kong SuperTerminal 1', city: 'Hong Kong', country: 'Hong Kong', coordinates: [22.308, 113.9185] },
  { code: 'LAX', name: 'Los Angeles Air Cargo Center', city: 'Los Angeles', country: 'United States', coordinates: [33.9416, -118.4085] },
];

const J = (v) => (v === undefined || v === null ? null : JSON.stringify(v));
const P = (s) => (s ? JSON.parse(s) : undefined);

// ---------- row <-> object mapping ----------
export function checkpointFromRow(r) {
  return {
    id: r.id, timestamp: r.timestamp, location: r.location, city: r.city, country: r.country, status: r.status,
    title: r.title, description: r.description, facilityCode: r.facility_code ?? undefined,
    coordinates: r.lat != null && r.lng != null ? [r.lat, r.lng] : undefined, signedBy: r.signed_by ?? undefined,
    completed: !!r.completed,
  };
}

export function shipmentFromRow(r, checkpointRows, subscriberRows) {
  return {
    id: r.id, trackingNumber: r.tracking_number, referenceNumber: r.reference_number ?? undefined,
    serviceType: r.service_type, status: r.status, statusMessage: r.status_message,
    createdAt: r.created_at, updatedAt: r.updated_at, estimatedDelivery: r.estimated_delivery,
    actualDelivery: r.actual_delivery ?? undefined,
    originHub: P(r.origin_hub), destinationHub: P(r.destination_hub), currentLocation: P(r.current_location),
    sender: P(r.sender), receiver: P(r.receiver), packageDetails: P(r.package_details),
    transportVessel: P(r.transport_vessel), customsDetails: P(r.customs_details), signatureProof: P(r.signature_proof),
    assignedCourier: P(r.assigned_courier), notes: r.notes ?? undefined, tags: P(r.tags),
    checkpoints: checkpointRows.map(checkpointFromRow),
    subscribers: subscriberRows.map((s) => s.email),
  };
}

export function getShipmentById(id) {
  const r = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id);
  return r ? hydrate(r) : null;
}
export function getShipmentByTracking(tn) {
  const r = db.prepare('SELECT * FROM shipments WHERE tracking_number = ?').get(tn);
  return r ? hydrate(r) : null;
}
function hydrate(r) {
  const cps = db.prepare('SELECT * FROM checkpoints WHERE shipment_id = ? ORDER BY timestamp DESC, rowid DESC').all(r.id);
  const subs = db.prepare('SELECT email FROM subscribers WHERE shipment_id = ? ORDER BY id').all(r.id);
  return shipmentFromRow(r, cps, subs);
}

export function listShipments({ q = '', status = '', limit = 200, offset = 0 } = {}) {
  const where = [];
  const args = [];
  if (status && STATUSES.includes(status)) { where.push('status = ?'); args.push(status); }
  if (q) {
    const like = `%${q.replace(/[%_]/g, (c) => '\\' + c)}%`;
    where.push(`(tracking_number LIKE ? ESCAPE '\\' OR receiver LIKE ? ESCAPE '\\' OR origin_hub LIKE ? ESCAPE '\\' OR destination_hub LIKE ? ESCAPE '\\')`);
    args.push(like, like, like, like);
  }
  const sql = `SELECT * FROM shipments ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(...args, Math.min(limit, 500), offset);
  return rows.map(hydrate);
}

// ---------- public (customer-facing) view: contact details are masked ----------
const maskEmail = (e = '') => { const [u, d] = e.split('@'); return d ? `${u.slice(0, 1)}***@${d}` : '***'; };
const maskPhone = (p = '') => (p.length > 4 ? `${'•'.repeat(Math.max(p.length - 4, 3))}${p.slice(-2)}` : '••••');
function maskParty(p) {
  return { ...p, address: 'Address on file', email: maskEmail(p.email), phone: maskPhone(p.phone) };
}
export function toPublicShipment(s) {
  const { subscribers, notes, ...rest } = s;
  return {
    ...rest,
    sender: maskParty(s.sender),
    receiver: maskParty(s.receiver),
    assignedCourier: s.assignedCourier ? { ...s.assignedCourier, phone: maskPhone(s.assignedCourier.phone) } : undefined,
  };
}

// ---------- creation ----------
const COUNTRY_CODES = { 'United States': 'US', Germany: 'DE', 'United Kingdom': 'GB', Japan: 'JP', 'United Arab Emirates': 'AE', Singapore: 'SG', France: 'FR', Australia: 'AU', 'Hong Kong': 'HK', Canada: 'CA' };

function generateTrackingNumber(destCountry) {
  const cc = COUNTRY_CODES[destCountry] || 'GL';
  for (let i = 0; i < 20; i++) {
    const tn = `APX-${randInt(100000, 999999)}-${cc}`;
    if (!db.prepare('SELECT 1 FROM shipments WHERE tracking_number = ?').get(tn)) return tn;
  }
  throw new HttpError(500, 'Could not allocate a tracking number.');
}

function party(b, label) {
  if (!b || typeof b !== 'object') throw new HttpError(400, `${label} details are required.`);
  return {
    name: str(b.name, { field: `${label} name`, required: true, max: 120 }),
    company: str(b.company, { field: `${label} company`, max: 160 }) || undefined,
    address: str(b.address, { field: `${label} address`, max: 240 }),
    city: str(b.city, { field: `${label} city`, max: 120 }),
    stateProvince: str(b.stateProvince, { field: `${label} state`, max: 120 }) || undefined,
    postalCode: str(b.postalCode, { field: `${label} postal code`, max: 30 }),
    country: str(b.country, { field: `${label} country`, required: true, max: 80 }),
    phone: str(b.phone, { field: `${label} phone`, max: 40 }),
    email: email(b.email, { field: `${label} email`, required: label === 'Receiver' }),
  };
}

export function createShipment(input, user) {
  const originHub = HUBS.find((h) => h.code === input.originHubCode);
  const destinationHub = HUBS.find((h) => h.code === input.destHubCode);
  if (!originHub || !destinationHub) throw new HttpError(400, 'Choose valid origin and destination hubs.');
  const serviceType = oneOf(input.serviceType, SERVICE_TYPES, { field: 'Service type', def: 'express_air' });
  const sender = party(input.sender, 'Sender');
  const receiver = party(input.receiver, 'Receiver');
  const pk = input.package || {};
  const weight = num(pk.weight, { field: 'Weight', min: 0.1, max: 100000, def: 10 });
  const pieces = Math.round(num(pk.pieces, { field: 'Pieces', min: 1, max: 10000, def: 1 }));
  const isInsured = !!pk.isInsured;

  let tracking = str(input.trackingNumber, { field: 'Tracking number', max: 30 }).toUpperCase();
  if (tracking) {
    if (!/^[A-Z0-9][A-Z0-9-]{5,28}[A-Z0-9]$/.test(tracking)) throw new HttpError(400, 'Tracking number may only contain letters, numbers and dashes (7-30 characters).');
  } else tracking = generateTrackingNumber(destinationHub.country);

  const now = new Date();
  const est = new Date(now.getTime() + (serviceType === 'express_air' || serviceType === 'same_day_courier' ? 2 : serviceType === 'priority_ocean' ? 16 : 5) * 86400000);
  const id = uid('shp');
  const shipment = {
    id, trackingNumber: tracking, referenceNumber: 'REF-' + randInt(100000, 999999), serviceType, status: 'manifest_created',
    statusMessage: 'Electronic manifest created. Consignment registered with global courier network.',
    createdAt: now.toISOString(), updatedAt: now.toISOString(), estimatedDelivery: est.toISOString(),
    originHub, destinationHub,
    currentLocation: { city: originHub.city, country: originHub.country, description: `${originHub.name} - Registered`, coordinates: originHub.coordinates, updatedAt: now.toISOString() },
    sender: { ...sender, address: sender.address || `${originHub.city} Industrial Park`, city: sender.city || originHub.city },
    receiver: { ...receiver, address: receiver.address || `${destinationHub.city} Center`, city: receiver.city || destinationHub.city },
    packageDetails: {
      weight, unit: 'kg', dimensions: str(pk.dimensions, { field: 'Dimensions', max: 80 }), pieces,
      cargoType: str(pk.cargoType, { field: 'Cargo type', max: 160 }) || 'General Cargo',
      declaredValue: str(pk.declaredValue, { field: 'Declared value', max: 40 }) || '$0.00', currency: 'USD', isInsured,
      insurancePolicyNumber: isInsured ? 'POL-APX-' + randInt(100000, 999999) : undefined,
      specialHandling: str(pk.specialHandling, { field: 'Special handling', max: 400 }) || undefined,
      barcodeNumber: '890' + randInt(1000000000, 9999999999),
    },
    transportVessel: { type: serviceType === 'priority_ocean' ? 'vessel' : serviceType === 'same_day_courier' ? 'truck' : 'flight', identifier: `Apex Express AF-${randInt(100, 999)}`, carrier: 'Apex Global Logistics' },
    notes: str(input.notes, { field: 'Notes', max: 1000 }) || undefined,
  };
  const checkpoint = {
    id: uid('chk'), timestamp: now.toISOString(), location: originHub.name, city: originHub.city, country: originHub.country,
    status: 'manifest_created', title: 'Air Waybill Created & Registered',
    description: `Consignment registered by shipper. Waybill #${tracking} issued for priority transport to ${destinationHub.city}.`,
    facilityCode: `${originHub.code}-EDI`, coordinates: originHub.coordinates, completed: true,
  };

  try {
    tx(() => {
      insertShipmentRow(shipment, user?.id);
      insertCheckpoint(id, checkpoint, user?.id);
      for (const e of new Set([receiver.email, sender.email].filter(Boolean))) {
        db.prepare('INSERT OR IGNORE INTO subscribers (shipment_id, email, created_at) VALUES (?,?,?)').run(id, e, now.toISOString());
      }
    });
  } catch (e) {
    if (String(e.message).includes('UNIQUE') && String(e.message).includes('tracking_number')) throw new HttpError(409, `Tracking number ${tracking} already exists.`);
    throw e;
  }
  const full = getShipmentById(id);
  const emailIds = input.sendWelcomeEmail === false ? [] : notifySubscribers(full, 'manifest_created');
  return { shipment: full, emailIds };
}

function insertShipmentRow(s, userId) {
  db.prepare(`INSERT INTO shipments (id, tracking_number, reference_number, service_type, status, status_message, created_at, updated_at,
    estimated_delivery, actual_delivery, origin_code, destination_code, origin_hub, destination_hub, current_location, sender, receiver,
    receiver_email, package_details, transport_vessel, customs_details, signature_proof, assigned_courier, notes, tags, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    s.id, s.trackingNumber, s.referenceNumber ?? null, s.serviceType, s.status, s.statusMessage, s.createdAt, s.updatedAt,
    s.estimatedDelivery, s.actualDelivery ?? null, s.originHub.code, s.destinationHub.code, J(s.originHub), J(s.destinationHub),
    J(s.currentLocation), J(s.sender), J(s.receiver), (s.receiver.email || '').toLowerCase(), J(s.packageDetails),
    J(s.transportVessel), J(s.customsDetails), J(s.signatureProof), J(s.assignedCourier), s.notes ?? null, J(s.tags), userId ?? null);
}
function insertCheckpoint(shipmentId, c, userId) {
  db.prepare(`INSERT INTO checkpoints (id, shipment_id, timestamp, location, city, country, status, title, description, facility_code, lat, lng, signed_by, completed, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    c.id, shipmentId, c.timestamp, c.location, c.city || '', c.country || '', c.status, c.title, c.description || '',
    c.facilityCode ?? null, c.coordinates?.[0] ?? null, c.coordinates?.[1] ?? null, c.signedBy ?? null, c.completed === false ? 0 : 1, userId ?? null);
}

/** Used by the demo seeder: inserts a fully-formed shipment object. */
export function importShipment(s) {
  tx(() => {
    insertShipmentRow(s, null);
    for (const c of [...s.checkpoints].reverse()) insertCheckpoint(s.id, c, null);
    for (const e of s.subscribers || []) db.prepare('INSERT OR IGNORE INTO subscribers (shipment_id, email, created_at) VALUES (?,?,?)').run(s.id, e, s.createdAt);
  });
}

// ---------- progression ----------
const NEXT = {
  manifest_created: ['picked_up', 'Consignment Collected by Apex Courier', 'Package picked up from shipper premises and checked in at local freight center.'],
  picked_up: ['received_at_facility', 'Received & Processed at Sorting Hub', 'Barcodes verified, security x-ray screened, and palletized for departure.'],
  received_at_facility: ['in_transit', 'Departed on International Transit Flight', 'Consignment departed origin international airport en route to destination.'],
  in_transit: ['customs_clearance', 'Customs Clearance Approved & Duty Cleared', 'Import declaration approved by customs authorities. Ready for local handover.'],
  customs_clearance: ['out_for_delivery', 'Loaded on Courier Van for Delivery Today', 'Dispatched with regional delivery courier. Expected delivery today.'],
  out_for_delivery: ['delivered', 'Delivered & Signed by Recipient', 'Successfully delivered in good order. Signed digital delivery receipt logged.'],
};

function applyCheckpoint(s, cp, locationPatch, userId) {
  const now = cp.timestamp;
  const delivered = cp.status === 'delivered';
  tx(() => {
    insertCheckpoint(s.id, cp, userId);
    db.prepare(`UPDATE shipments SET status=?, status_message=?, updated_at=?, current_location=?, actual_delivery=COALESCE(?, actual_delivery), signature_proof=COALESCE(?, signature_proof)${
      cp.status === 'customs_clearance' ? ', customs_details=?' : ''} WHERE id=?`).run(
      cp.status, cp.description || cp.title, now, J(locationPatch), delivered ? now : null,
      delivered ? J({ signedBy: s.receiver.name, timestamp: now, relation: 'Direct Recipient' }) : null,
      ...(cp.status === 'customs_clearance' ? [J({ ...(s.customsDetails || { declarationNumber: 'DECL-' + randInt(100000, 999999) }), status: 'cleared', clearedDate: now })] : []),
      s.id);
  });
}

export function advanceShipment(id, user) {
  const s = getShipmentById(id);
  if (!s) throw new HttpError(404, 'Shipment not found.');
  const step = NEXT[s.status];
  if (!step) throw new HttpError(409, s.status === 'delivered' ? 'Shipment is already delivered.' : 'Shipment is on hold; add a checkpoint to change its status.');
  const [next, title, desc] = step;
  if (next === 'customs_clearance' && !['admin', 'customs'].includes(user.role)) throw new HttpError(403, 'Only customs officers or admins can clear customs.');
  const now = new Date().toISOString();
  const loc = locationFor(s, next, now);
  const cp = { id: uid('chk'), timestamp: now, location: loc.description, city: loc.city, country: loc.country, status: next, title, description: desc, coordinates: loc.coordinates, completed: true, signedBy: next === 'delivered' ? s.receiver.name : undefined };
  applyCheckpoint(s, cp, loc, user.id);
  const updated = getShipmentById(id);
  return { shipment: updated, emailIds: notifySubscribers(updated, next) };
}

function locationFor(s, next, now) {
  if (next === 'in_transit') return { city: 'International Air Corridor', country: 'En Route', description: `${s.transportVessel?.identifier || 'Apex flight'} en route to ${s.destinationHub.city}`, coordinates: [(s.originHub.coordinates[0] + s.destinationHub.coordinates[0]) / 2, (s.originHub.coordinates[1] + s.destinationHub.coordinates[1]) / 2], updatedAt: now };
  if (next === 'customs_clearance' || next === 'received_at_facility') return { city: s.destinationHub.city, country: s.destinationHub.country, description: `${s.destinationHub.name} (Customs Clearance Terminal)`, coordinates: s.destinationHub.coordinates, updatedAt: now };
  if (next === 'out_for_delivery') return { city: s.receiver.city, country: s.receiver.country, description: `Local Courier Van en route to ${s.receiver.address}`, coordinates: s.destinationHub.coordinates, updatedAt: now };
  if (next === 'delivered') return { city: s.receiver.city, country: s.receiver.country, description: `Delivered at ${s.receiver.address}`, coordinates: s.destinationHub.coordinates, updatedAt: now };
  return { ...s.currentLocation, updatedAt: now };
}

export function addCheckpoint(id, input, user) {
  const s = getShipmentById(id);
  if (!s) throw new HttpError(404, 'Shipment not found.');
  const status = oneOf(input.status, STATUSES, { field: 'Status' });
  if (status === 'customs_clearance' && !['admin', 'customs'].includes(user.role)) throw new HttpError(403, 'Only customs officers or admins can record customs clearance.');
  const now = new Date().toISOString();
  const title = str(input.title, { field: 'Title', required: true, max: 160 });
  const description = str(input.description, { field: 'Description', max: 600 }) || 'Milestone logged by freight administrator.';
  const location = str(input.location, { field: 'Location', max: 200 }) || s.currentLocation.description;
  const loc = { ...s.currentLocation, description: location, updatedAt: now };
  const cp = { id: uid('chk'), timestamp: now, location, city: s.currentLocation.city, country: s.currentLocation.country, status, title, description, coordinates: s.currentLocation.coordinates, completed: true };
  applyCheckpoint(s, cp, loc, user.id);
  const updated = getShipmentById(id);
  return { shipment: updated, emailIds: notifySubscribers(updated, status, description) };
}

export function deleteShipment(id) {
  const r = db.prepare('DELETE FROM shipments WHERE id = ?').run(id);
  if (!r.changes) throw new HttpError(404, 'Shipment not found.');
}

export function subscribeEmail(trackingNumber, rawEmail) {
  const s = getShipmentByTracking(trackingNumber);
  const addr = email(rawEmail);
  if (!s) return { ok: true }; // do not reveal whether a tracking number exists
  const r = db.prepare('INSERT OR IGNORE INTO subscribers (shipment_id, email, created_at) VALUES (?,?,?)').run(s.id, addr, new Date().toISOString());
  if (r.changes) {
    const { subject, html } = shipmentEmail(s, s.checkpoints, 'custom_broadcast', `Subscription confirmed: you will now receive automatic updates for consignment #${s.trackingNumber}.`, addr);
    queueEmail({ shipmentId: s.id, trackingNumber: s.trackingNumber, to: addr, toName: '', subject, html, trigger: 'booking_created' });
  }
  return { ok: true };
}

function notifySubscribers(s, trigger, note) {
  const recipients = [...new Set([s.receiver.email, ...s.subscribers].filter(Boolean).map((e) => e.toLowerCase()))].slice(0, 25);
  return recipients.map((to) => {
    const { subject, html } = shipmentEmail(s, s.checkpoints, trigger, note, to);
    return queueEmail({ shipmentId: s.id, trackingNumber: s.trackingNumber, to, toName: to === s.receiver.email?.toLowerCase() ? s.receiver.name : '', subject, html, trigger });
  });
}

// ---------- quote engine (authoritative pricing lives on the server) ----------
export const QUOTE_COUNTRIES = ['Germany', 'United States', 'United Kingdom', 'Japan', 'United Arab Emirates', 'Singapore', 'France', 'Australia', 'Canada'];
export function calculateQuotes({ originCountry, destCountry, weight, declaredValue }) {
  const o = oneOf(originCountry, QUOTE_COUNTRIES, { field: 'Origin country' });
  const d = oneOf(destCountry, QUOTE_COUNTRIES, { field: 'Destination country' });
  const w = num(weight, { field: 'Weight', min: 0.5, max: 50000, required: true });
  const val = num(declaredValue, { field: 'Declared value', min: 0, max: 100000000, def: 1000 });
  const m = o === d ? 4.5 : 9.8;
  return [
    { serviceName: 'Apex Priority Air Express', serviceType: 'express_air', estimatedDays: '1 - 2 Business Days', price: Math.round(w * m * 2.2 + 85 + val * 0.005), currency: 'USD', features: ['Guaranteed next-flight-out dispatch', '24/7 dedicated courier support', 'Full customs priority clearance', 'Live GPS satellite telemetry'] },
    { serviceName: 'Apex International Air Freight', serviceType: 'international_freight', estimatedDays: '3 - 5 Business Days', price: Math.round(w * m * 1.3 + 45 + val * 0.003), currency: 'USD', features: ['Airport-to-airport or door-to-door delivery', 'Consolidated air cargo efficiency', 'Standard customs clearance', 'Automated milestone email updates'] },
    { serviceName: 'Apex Global Ocean Cargo (FCL/LCL)', serviceType: 'priority_ocean', estimatedDays: '12 - 18 Days', price: Math.round(w * m * 0.5 + 30 + val * 0.002), currency: 'USD', features: ['Optimal for large volume / heavy containers', 'Port-to-port maritime transit', 'Customs brokerage & documentation', 'Complete voyage vessel tracking'] },
  ];
}
