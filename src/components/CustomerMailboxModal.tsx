import React, { useState } from 'react';
import { EmailLog } from '../types';
import { Mail, X, CheckCircle2, Clock, Inbox, Send, RefreshCw, Trash2, ChevronRight, Eye } from 'lucide-react';

interface CustomerMailboxModalProps {
  emailLogs: EmailLog[];
  onClose: () => void;
  onClearLogs?: () => void;
}

export const CustomerMailboxModal: React.FC<CustomerMailboxModalProps> = ({
  emailLogs,
  onClose,
  onClearLogs,
}) => {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    emailLogs.length > 0 ? emailLogs[0].id : null
  );
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'unread'>('all');

  const filteredLogs = emailLogs.filter((log) => {
    if (activeTabFilter === 'unread') return !log.isRead;
    return true;
  });

  const selectedEmail = emailLogs.find((e) => e.id === selectedEmailId) || emailLogs[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-5xl h-[90vh] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Titlebar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <Mail className="w-5 h-5" />
              {emailLogs.some((e) => !e.isRead) && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Customer Email Dispatch &amp; Live Inbox
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Dispatch Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official customer status notifications dispatched automatically upon checkpoint updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Panel Email Client (Left: List, Right: HTML Preview) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Email List */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50/70">
            {/* Inbox header & filter */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Inbox className="w-4 h-4 text-slate-500" />
                <span>Outbound Dispatches ({emailLogs.length})</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTabFilter('all')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    activeTabFilter === 'all'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTabFilter('unread')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    activeTabFilter === 'unread'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Recent
                </button>
              </div>
            </div>

            {/* Scrollable Email Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No automated emails logged yet. Create a shipment or advance status in Admin!
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isSelected = selectedEmail?.id === log.id;
                  const timeFormatted = new Date(log.sentAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={log.id}
                      onClick={() => {
                        setSelectedEmailId(log.id);
                        log.isRead = true;
                      }}
                      className={`p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-blue-700'
                          : 'hover:bg-slate-100/70 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {log.recipientName}
                        </div>
                        <div className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                          {timeFormatted}
                        </div>
                      </div>

                      <div className="text-xs font-medium text-slate-700 truncate mb-1">
                        {log.subject}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-mono text-slate-600 font-medium">{log.trackingNumber}</span>
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Dispatched
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Left footer status */}
            <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between bg-white">
              <span>Automatic Dispatch: Active</span>
              <span className="text-emerald-700 font-mono font-bold">200 OK</span>
            </div>
          </div>

          {/* Right HTML Email Preview */}
          <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
            {selectedEmail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Email Meta Bar */}
                <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {selectedEmail.subject}
                    </h3>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span>
                        To: <strong className="text-slate-800">{selectedEmail.recipientEmail}</strong> ({selectedEmail.recipientName})
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-600">
                        {new Date(selectedEmail.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1 ${
                        selectedEmail.deliveryStatus === 'sent'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : selectedEmail.deliveryStatus === 'failed'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                      title={selectedEmail.lastError || undefined}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedEmail.deliveryStatus === 'sent'
                        ? 'Sent to customer'
                        : selectedEmail.deliveryStatus === 'failed'
                        ? 'Send failed (retrying)'
                        : selectedEmail.deliveryStatus === 'logged'
                        ? 'Logged only (no email provider configured)'
                        : 'Queued'}
                    </span>
                  </div>
                </div>

                {/* Rendered HTML Container via iframe */}
                <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-slate-100">
                  <div className="w-full max-w-2xl bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                    <iframe
                      title="Email Preview"
                      srcDoc={selectedEmail.htmlContent}
                      sandbox=""
                      className="w-full h-[600px] border-none bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Mail className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">Select an email to view preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div>
            Tip: When you advance a shipment's status in the <strong>Admin Dashboard</strong>, an updated email is automatically dispatched!
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Close Mailbox
          </button>
        </div>
      </div>
    </div>
  );
};
