import React, { useCallback, useEffect, useState } from 'react';
import { Inbox, RefreshCw, MessageSquare, FileText } from 'lucide-react';
import { ContactMessageRecord, QuoteRequestRecord } from '../types';
import { apiGet, apiPatch, errorMessage } from '../utils/api';

const badge: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-amber-100 text-amber-800 border-amber-200',
  converted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  read: 'bg-amber-100 text-amber-800 border-amber-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};
const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const StaffInbox: React.FC = () => {
  const [view, setView] = useState<'requests' | 'messages'>('requests');
  const [requests, setRequests] = useState<QuoteRequestRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, m] = await Promise.all([
        apiGet<{ requests: QuoteRequestRecord[] }>('/quote-requests'),
        apiGet<{ messages: ContactMessageRecord[] }>('/contact-messages'),
      ]);
      setRequests(r.requests);
      setMessages(m.messages);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setRequestStatus = async (id: string, status: QuoteRequestRecord['status']) => {
    try {
      const { request } = await apiPatch<{ request: QuoteRequestRecord }>(`/quote-requests/${id}`, { status });
      setRequests((prev) => prev.map((r) => (r.id === id ? request : r)));
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const setMessageStatus = async (id: string, status: ContactMessageRecord['status']) => {
    try {
      const { message } = await apiPatch<{ message: ContactMessageRecord }>(`/contact-messages/${id}`, { status });
      setMessages((prev) => prev.map((m) => (m.id === id ? message : m)));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const newReq = requests.filter((r) => r.status === 'new').length;
  const newMsg = messages.filter((m) => m.status === 'new').length;

  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-blue-700" />
          <h3 className="text-base font-bold text-slate-900">Customer Inbox</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('requests')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 ${view === 'requests' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            <FileText className="w-3.5 h-3.5" /> Booking requests{newReq ? ` (${newReq} new)` : ''}
          </button>
          <button onClick={() => setView('messages')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 ${view === 'messages' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            <MessageSquare className="w-3.5 h-3.5" /> Messages{newMsg ? ` (${newMsg} new)` : ''}
          </button>
          <button onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer" title="Refresh" aria-label="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs" role="alert">{error}</div>}

      {view === 'requests' ? (
        requests.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">{loading ? 'Loading…' : 'No booking requests yet.'}</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{r.reference}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${badge[r.status]}`}>{r.status}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{fmt(r.createdAt)}</span>
                </div>
                <div className="text-xs text-slate-700">
                  <strong>{r.name}</strong>{r.company ? ` · ${r.company}` : ''} · <a className="text-blue-700 hover:underline" href={`mailto:${r.email}`}>{r.email}</a>{r.phone ? ` · ${r.phone}` : ''}
                </div>
                <div className="text-xs text-slate-600">
                  {r.originCountry} &rarr; {r.destinationCountry} · {r.weightKg} kg · {String(r.serviceType || '').replace(/_/g, ' ')}
                  {r.quotedPrice != null && <> · quoted <strong>${r.quotedPrice.toLocaleString('en-US')}</strong></>}
                </div>
                {r.message && <p className="text-xs text-slate-600 whitespace-pre-wrap border-l-2 border-slate-200 pl-3">{r.message}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(['new', 'contacted', 'converted', 'closed'] as const).map((s) => (
                    <button key={s} disabled={r.status === s} onClick={() => setRequestStatus(r.id, s)} className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-default cursor-pointer capitalize">
                      Mark {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : messages.length === 0 ? (
        <p className="text-xs text-slate-500 py-8 text-center">{loading ? 'Loading…' : 'No messages yet.'}</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 capitalize">{m.topic}</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${badge[m.status]}`}>{m.status}</span>
                  {m.trackingNumber && <span className="font-mono text-[11px] text-slate-500">{m.trackingNumber}</span>}
                </div>
                <span className="text-[11px] text-slate-400">{fmt(m.createdAt)}</span>
              </div>
              <div className="text-xs text-slate-700"><strong>{m.name}</strong> · <a className="text-blue-700 hover:underline" href={`mailto:${m.email}`}>{m.email}</a></div>
              <p className="text-xs text-slate-600 whitespace-pre-wrap border-l-2 border-slate-200 pl-3">{m.message}</p>
              <div className="flex gap-2 pt-1">
                {(['new', 'read', 'resolved'] as const).map((s) => (
                  <button key={s} disabled={m.status === s} onClick={() => setMessageStatus(m.id, s)} className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-default cursor-pointer capitalize">
                    Mark {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
