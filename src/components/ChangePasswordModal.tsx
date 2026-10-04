import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { changePassword } from '../utils/authService';
import { errorMessage } from '../utils/api';

interface Props {
  forced?: boolean;
  onDone: () => void;
  onClose?: () => void;
}

const inputCls =
  'w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white';

export const ChangePasswordModal: React.FC<Props> = ({ forced, onDone, onClose }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) return setError('New passwords do not match.');
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Change password">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700"><KeyRound className="w-4 h-4" /></div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{forced ? 'Set a new password' : 'Change password'}</h3>
            {forced && <p className="text-[11px] text-slate-500">Your temporary password must be replaced before you continue.</p>}
          </div>
        </div>
        <div>
          <label htmlFor="cp-cur" className="block text-xs font-bold text-slate-700 mb-1">Current password</label>
          <input id="cp-cur" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="cp-new" className="block text-xs font-bold text-slate-700 mb-1">New password</label>
          <input id="cp-new" type="password" autoComplete="new-password" required minLength={10} value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
          <p className="text-[10px] text-slate-400 mt-1">At least 10 characters, with letters and a number.</p>
        </div>
        <div>
          <label htmlFor="cp-conf" className="block text-xs font-bold text-slate-700 mb-1">Confirm new password</label>
          <input id="cp-conf" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </div>
        {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs" role="alert">{error}</div>}
        <div className="flex justify-end gap-2">
          {!forced && onClose && (
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer">Cancel</button>
          )}
          <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs cursor-pointer">
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
};
