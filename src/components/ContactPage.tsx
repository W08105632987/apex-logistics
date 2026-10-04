import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock } from 'lucide-react';
import { apiPost, errorMessage } from '../utils/api';

const TOPICS = [
  { id: 'general', label: 'General enquiry' },
  { id: 'tracking', label: 'Tracking / delivery status' },
  { id: 'quote', label: 'Quotes & booking' },
  { id: 'customs', label: 'Customs & documentation' },
  { id: 'claims', label: 'Claims & damaged goods' },
  { id: 'billing', label: 'Billing & invoices' },
];

const inputCls =
  'w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white';

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', topic: 'general', trackingNumber: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiPost('/contact', form);
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <Mail className="w-3.5 h-3.5" />
          Contact &amp; Support
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">How can we help?</h2>
        <p className="text-xs md:text-sm text-slate-500">
          Send a message to our support desk and we will reply by email, usually within one business day.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-3">
          {[
            { icon: Phone, title: '24/7 International Desk', lines: ['+1 (800) 555-0199', '+49 69 900 120'] },
            { icon: Mail, title: 'Email', lines: ['dispatch@globexlogistics.com'] },
            { icon: MapPin, title: 'Head Office', lines: ['Cargo City South', '60549 Frankfurt, Germany'] },
            { icon: Clock, title: 'Response time', lines: ['Urgent shipment issues: call the desk', 'Email: within 1 business day'] },
          ].map(({ icon: Icon, title, lines }) => (
            <div key={title} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700 h-fit">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{title}</div>
                {lines.map((l) => (
                  <div key={l} className="text-xs text-slate-500">
                    {l}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 p-6 md:p-8 rounded-xl bg-white border border-slate-200 shadow-sm">
          {done ? (
            <div className="text-center py-10 space-y-3" role="status">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Message sent</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thank you, we have received your message and sent a confirmation to {form.email}.
              </p>
              <button
                onClick={() => {
                  setDone(false);
                  setForm({ name: '', email: '', topic: 'general', trackingNumber: '', message: '', website: '' });
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="c-name" className="block text-xs font-bold text-slate-700 mb-1">Full name</label>
                <input id="c-name" required maxLength={120} value={form.name} onChange={set('name')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="c-email" className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input id="c-email" type="email" required maxLength={254} value={form.email} onChange={set('email')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="c-topic" className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
                <select id="c-topic" value={form.topic} onChange={set('topic')} className={inputCls}>
                  {TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="c-tn" className="block text-xs font-bold text-slate-700 mb-1">Tracking number (optional)</label>
                <input id="c-tn" maxLength={40} value={form.trackingNumber} onChange={set('trackingNumber')} placeholder="APX-000000-US" className={`${inputCls} font-mono`} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-msg" className="block text-xs font-bold text-slate-700 mb-1">Message</label>
                <textarea id="c-msg" required minLength={10} maxLength={4000} rows={6} value={form.message} onChange={set('message')} className={inputCls} />
              </div>
              {/* honeypot: hidden from people, filled by bots */}
              <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} className="hidden" name="website" />
              {error && (
                <div className="sm:col-span-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs" role="alert">{error}</div>
              )}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {busy ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
