import React, { useState } from 'react';
import { X, CheckCircle2, Send } from 'lucide-react';
import { ShippingQuoteResult } from '../types';
import { apiPost, errorMessage } from '../utils/api';

interface Props {
  quote: ShippingQuoteResult;
  origin: string;
  dest: string;
  weight: number;
  declaredValue: number;
  cargoCategory: string;
  onClose: () => void;
}

const inputCls =
  'w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white';

export const BookingRequestModal: React.FC<Props> = ({ quote, origin, dest, weight, declaredValue, cargoCategory, onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiPost<{ reference: string }>('/quote-requests', {
        ...form,
        originCountry: origin,
        destCountry: dest,
        weight,
        declaredValue,
        cargoCategory,
        serviceType: quote.serviceType,
      });
      setReference(res.reference);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Request booking">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Request booking</h3>
            <p className="text-xs text-slate-500">
              {quote.serviceName} &middot; {origin} &rarr; {dest} &middot; {weight} kg &middot; est. ${quote.price.toLocaleString('en-US')} {quote.currency}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {reference ? (
          <div className="p-8 text-center space-y-3" role="status">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Request received</h4>
            <p className="text-xs text-slate-500">
              Your reference is <span className="font-mono font-bold text-slate-900">{reference}</span>. A logistics specialist will contact you at {form.email} to confirm collection details.
            </p>
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="b-name" className="block text-xs font-bold text-slate-700 mb-1">Full name</label>
              <input id="b-name" required maxLength={120} value={form.name} onChange={set('name')} className={inputCls} />
            </div>
            <div>
              <label htmlFor="b-email" className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input id="b-email" type="email" required maxLength={254} value={form.email} onChange={set('email')} className={inputCls} />
            </div>
            <div>
              <label htmlFor="b-phone" className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input id="b-phone" maxLength={40} value={form.phone} onChange={set('phone')} className={inputCls} />
            </div>
            <div>
              <label htmlFor="b-company" className="block text-xs font-bold text-slate-700 mb-1">Company (optional)</label>
              <input id="b-company" maxLength={160} value={form.company} onChange={set('company')} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="b-msg" className="block text-xs font-bold text-slate-700 mb-1">Pickup address &amp; notes</label>
              <textarea id="b-msg" rows={4} maxLength={2000} value={form.message} onChange={set('message')} className={inputCls} />
            </div>
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} className="hidden" name="website" />
            {error && <div className="sm:col-span-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs" role="alert">{error}</div>}
            <div className="sm:col-span-2 flex items-center justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer">Cancel</button>
              <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-2">
                <Send className="w-4 h-4" />
                {busy ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
