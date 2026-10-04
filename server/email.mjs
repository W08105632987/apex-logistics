// Transactional email: every message is written to the `emails` table first (outbox pattern),
// then delivered through Resend's HTTPS API. Failed sends are retried automatically.
import { db } from './db.mjs';
import { config } from './config.mjs';
import { escapeHtml as h, uid } from './security.mjs';

export const STATUS_LABELS = {
  manifest_created: 'Manifest Created & Registered',
  picked_up: 'Consignment Collected',
  received_at_facility: 'Received at Sorting Hub',
  in_transit: 'In Global Transit',
  customs_clearance: 'Customs Cleared & Processed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered & Signed',
  exception_hold: 'Exception / On Hold',
};

function layout({ subject, badge, headline, sub, note, rows = [], ctaUrl, ctaLabel, footerTo }) {
  const brand = h(config.brand);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${h(subject)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:600px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
<tr><td style="background:#1e3a8a;padding:24px 32px;border-bottom:3px solid #1d4ed8;"><div style="font-size:20px;font-weight:800;color:#fff;">${brand}</div>
<div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#bfdbfe;margin-top:2px;">Global Freight &amp; Courier Portal</div></td></tr>
<tr><td style="padding:32px 32px 12px 32px;">
${badge ? `<div style="display:inline-block;background:#dbeafe;color:#1d4ed8;padding:4px 12px;border-radius:9999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">${h(badge)}</div>` : ''}
<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${h(headline)}</h1>
<p style="margin:0;font-size:14px;color:#64748b;line-height:1.5;">${h(sub)}</p>
${note ? `<div style="margin-top:16px;padding:12px 16px;background:#f1f5f9;border-left:4px solid #1d4ed8;border-radius:4px;font-size:13px;color:#334155;"><strong>Note:</strong> ${h(note)}</div>` : ''}
</td></tr>
${rows.length ? `<tr><td style="padding:12px 32px;"><table role="presentation" width="100%" style="border:1px solid #e2e8f0;border-radius:8px;font-size:13px;">${rows
    .map(([k, v]) => `<tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #f1f5f9;width:38%;">${h(k)}</td><td style="padding:10px 14px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9;">${h(v)}</td></tr>`)
    .join('')}</table></td></tr>` : ''}
${ctaUrl ? `<tr><td style="padding:12px 32px 28px 32px;"><a href="${h(ctaUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px;">${h(ctaLabel || 'Open')}</a></td></tr>` : ''}
<tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;line-height:1.6;">
${footerTo ? `This message was sent to ${h(footerTo)}. ` : ''}Need help? Contact ${h(config.supportEmail)}.<br>&copy; ${new Date().getFullYear()} ${brand}. All rights reserved.</td></tr>
</table></td></tr></table></body></html>`;
}

export function shipmentEmail(shipment, checkpoints, trigger, customNote, toEmail) {
  const status = STATUS_LABELS[shipment.status] || shipment.status;
  const tn = shipment.trackingNumber;
  const loc = shipment.currentLocation || {};
  const latest = checkpoints[0];
  const est = new Date(shipment.estimatedDelivery).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const copy = {
    manifest_created: ['🛫 Shipment booked', `Shipment Booked #${tn}`, 'Your Shipment is Booked & Registered', `Air waybill generated for consignment to ${shipment.receiver.city}, ${shipment.receiver.country}.`],
    picked_up: ['Collected', `Update #${tn}: Collected`, 'Your Shipment Has Been Collected', 'Your consignment was picked up and checked in at the local freight centre.'],
    received_at_facility: ['Transit update', `Update #${tn}: Arrived at ${loc.city || 'hub'}`, 'Shipment is On the Move', `Your package has arrived at ${loc.description || 'a sorting hub'}.`],
    in_transit: ['Transit update', `Update #${tn}: In transit`, 'Shipment is On the Move', `Your package is travelling to ${shipment.destinationHub.city}.`],
    customs_clearance: ['Customs notice', `Customs #${tn} cleared in ${loc.country || 'destination country'}`, 'Customs Inspection & Duty Cleared', 'International freight release completed. Handing over to the local delivery network.'],
    out_for_delivery: ['Delivery today', `#${tn} is out for delivery`, 'Courier is Out For Delivery', `Estimated delivery today. Courier: ${shipment.assignedCourier?.name || 'Apex delivery driver'}.`],
    delivered: ['Delivered', `Delivered: #${tn}`, 'Package Successfully Delivered', `Signed for by ${shipment.signatureProof?.signedBy || shipment.receiver.name} in ${shipment.receiver.city}.`],
    exception_hold: ['Action required', `Action required on #${tn}`, 'Shipment On Temporary Hold', 'A logistics exception occurred. Our priority desk is assisting.'],
    custom_broadcast: [status, `Status update #${tn}: ${status}`, `Status: ${status}`, `Latest checkpoint at ${loc.city || ''}, ${loc.country || ''}.`],
  };
  const [badge, subj, headline, sub] = copy[trigger] || copy.custom_broadcast;
  const subject = `[${config.brand}] ${subj}`;
  const html = layout({
    subject, badge, headline, sub, note: customNote,
    rows: [
      ['Tracking ID', tn],
      ['Status', status],
      ['Latest event', latest ? `${latest.title}` : shipment.statusMessage],
      ['Location', `${loc.city || ''}, ${loc.country || ''}`],
      ['Estimated delivery', est],
    ],
    ctaUrl: `${config.appUrl}/#/track/${encodeURIComponent(tn)}`, ctaLabel: 'Track shipment live',
    footerTo: toEmail,
  });
  return { subject, html };
}

export function simpleEmail({ subject, badge, headline, sub, rows, note, ctaUrl, ctaLabel, to }) {
  return { subject: `[${config.brand}] ${subject}`, html: layout({ subject, badge, headline, sub, rows, note, ctaUrl, ctaLabel, footerTo: to }) };
}

const insertEmail = () => db.prepare(`INSERT INTO emails (id, shipment_id, tracking_number, recipient_email, recipient_name, subject, trigger, html, status, created_at)
  VALUES (?,?,?,?,?,?,?,?, 'queued', ?)`);

/** Queue an email (synchronous DB write) and kick off delivery in the background. */
export function queueEmail({ shipmentId = null, trackingNumber = null, to, toName = '', subject, html, trigger }) {
  const id = 'EML-' + uid('x').slice(2, 10).toUpperCase();
  insertEmail().run(id, shipmentId, trackingNumber, to, toName, subject, trigger, html, new Date().toISOString());
  setImmediate(() => deliver(id).catch((e) => console.error('[email] deliver error', e)));
  return id;
}

async function deliver(id) {
  const row = db.prepare('SELECT * FROM emails WHERE id = ?').get(id);
  if (!row || row.status === 'sent' || row.status === 'logged') return;
  const now = () => new Date().toISOString();
  if (config.email.provider === 'log') {
    db.prepare("UPDATE emails SET status='logged', attempts=attempts+1, sent_at=? WHERE id=?").run(now(), id);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.email.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: config.email.from, to: [row.recipient_email], subject: row.subject, html: row.html }),
      signal: AbortSignal.timeout(15000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Resend ${res.status}: ${body.message || JSON.stringify(body)}`.slice(0, 300));
    db.prepare("UPDATE emails SET status='sent', attempts=attempts+1, provider_id=?, sent_at=?, last_error=NULL WHERE id=?").run(body.id || null, now(), id);
  } catch (e) {
    db.prepare("UPDATE emails SET status='failed', attempts=attempts+1, last_error=? WHERE id=?").run(String(e.message).slice(0, 300), id);
  }
}

export function startEmailRetryWorker() {
  const tick = () => {
    const rows = db.prepare("SELECT id FROM emails WHERE status IN ('queued','failed') AND attempts < ? ORDER BY created_at LIMIT 20").all(config.email.maxAttempts);
    for (const r of rows) deliver(r.id).catch(() => {});
  };
  setInterval(tick, 60_000).unref();
  setTimeout(tick, 5_000).unref();
}
