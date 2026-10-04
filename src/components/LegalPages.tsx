import React from 'react';
import { FileText, Lock, ShieldCheck } from 'lucide-react';

// NOTE: This is starter copy describing how the platform actually behaves. Have your own lawyer review and
// adapt it (company name, jurisdiction, liability limits, retention periods) before going live.

type Page = 'terms' | 'privacy' | 'security';
interface Section { h: string; p: string[] }

const COMPANY = 'the Company';
const UPDATED = 'October 2026';

const PAGES: Record<Page, { title: string; icon: React.ElementType; intro: string; sections: Section[] }> = {
  terms: {
    title: 'Conditions of Carriage',
    icon: FileText,
    intro: `These conditions govern the carriage of goods booked through this website and apply to every shipment accepted by ${COMPANY}.`,
    sections: [
      { h: '1. Booking and acceptance', p: ['A booking request submitted online is an enquiry, not a contract. A contract of carriage exists only once we confirm the booking in writing and issue an air waybill or tracking number.', 'Prices shown by the online rate calculator are estimates. The confirmed price depends on verified weight, dimensions, route, service level and any surcharges, duties or taxes.'] },
      { h: '2. Shipper responsibilities', p: ['The shipper must describe goods accurately, pack them suitably for international transport, and provide complete and truthful customs documentation.', 'Dangerous goods, controlled substances, weapons, live animals and items prohibited by law at origin, destination or transit points are not accepted unless expressly agreed in writing.'] },
      { h: '3. Customs and duties', p: ['The consignee is responsible for import duties, taxes and fees unless otherwise agreed. Delays caused by customs inspection, missing paperwork or regulatory holds are outside our control.'] },
      { h: '4. Transit times', p: ['Estimated delivery dates are targets and are not guaranteed unless a guaranteed service was expressly purchased. Events such as weather, strikes, security incidents or force majeure may cause delay.'] },
      { h: '5. Liability and claims', p: ['Our liability for loss or damage is limited by applicable international conventions (such as the Montreal Convention for air carriage) and by the declared value and insurance elected at booking.', 'Visible damage must be noted at delivery. Written claims must be submitted within the period required by the applicable convention or law, together with supporting documents.'] },
      { h: '6. Tracking information', p: ['Tracking data is provided for information. Status events are recorded by our operations staff and partners and may be updated with a delay.'] },
      { h: '7. Governing law', p: ['These conditions are governed by the laws of the jurisdiction in which the carrying company is registered, without prejudice to mandatory consumer or international transport law.'] },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    icon: Lock,
    intro: `This policy explains what personal data ${COMPANY} collects through this website, why, and the choices you have.`,
    sections: [
      { h: '1. Data we collect', p: ['Shipment data: sender and recipient names, addresses, phone numbers, email addresses, and a description of the goods, entered by our staff when a consignment is created.', 'Enquiry data: details you enter in the contact form or booking-request form (name, email, phone, company, message).', 'Notification data: an email address if you subscribe to updates for a tracking number.', 'Technical data: IP address and browser type, held in server logs and security audit logs for security and abuse prevention. We do not use advertising or cross-site tracking cookies.'] },
      { h: '2. How we use it', p: ['To carry and deliver shipments, communicate status updates, respond to your enquiries, prepare quotes, comply with customs and legal obligations, and keep the service secure.'] },
      { h: '3. What the public tracking page shows', p: ['Anyone with a tracking number can see the shipment route and status history. Street addresses are hidden, and email addresses and phone numbers are partially masked, on the public page.'] },
      { h: '4. Sharing', p: ['We share data only with carriers, customs authorities and service providers (for example our email delivery provider) as needed to provide the service, or where required by law. We do not sell personal data.'] },
      { h: '5. Cookies', p: ['Customer pages use no tracking cookies. Staff sign-in uses a single essential, HTTP-only session cookie that expires automatically.'] },
      { h: '6. Retention', p: ['Shipment and enquiry records are kept for as long as needed for the purposes above and to meet accounting, customs and legal requirements, then deleted or anonymised.'] },
      { h: '7. Your rights', p: ['Depending on where you live, you may have the right to access, correct, delete or restrict the use of your personal data, and to object to processing or complain to your data-protection authority. Contact us using the details on the Contact page.'] },
    ],
  },
  security: {
    title: 'Security Compliance',
    icon: ShieldCheck,
    intro: 'How we protect shipment data and the systems that manage it.',
    sections: [
      { h: 'Access control', p: ['Staff accounts use individual credentials with role-based permissions (administrator, logistics staff, customs inspector). Passwords are stored only as salted, memory-hard hashes, and repeated failed sign-ins lock the account temporarily.'] },
      { h: 'Data protection', p: ['All traffic is served over HTTPS. Database access is restricted to the application server, and the database is backed up on a schedule.'] },
      { h: 'Auditability', p: ['Operational changes such as creating shipments, updating checkpoints, deleting records and managing staff accounts are recorded in an audit log with the acting user and time.'] },
      { h: 'Abuse prevention', p: ['Public forms and tracking lookups are rate limited, and inputs are validated and sanitised on the server.'] },
      { h: 'Reporting a vulnerability', p: ['If you believe you have found a security issue, please contact us through the Contact page with the subject "Security" and we will respond promptly.'] },
    ],
  },
};

export const LegalPages: React.FC<{ page: Page }> = ({ page }) => {
  const { title, icon: Icon, intro, sections } = PAGES[page];
  return (
    <article className="w-full max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <Icon className="w-3.5 h-3.5" />
          Legal
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-400">Last updated {UPDATED}</p>
        <p className="text-sm text-slate-600 leading-relaxed">{intro}</p>
      </header>
      <div className="p-6 md:p-8 rounded-xl bg-white border border-slate-200 shadow-sm space-y-6">
        {sections.map((s) => (
          <section key={s.h} className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="text-xs md:text-sm text-slate-600 leading-relaxed">{t}</p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
};
