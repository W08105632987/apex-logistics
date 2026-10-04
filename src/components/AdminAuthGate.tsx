import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
} from 'lucide-react';
import { authenticateUser } from '../utils/authService';
import { AuthUser } from '../types';

interface AdminAuthGateProps {
  onAuthenticated: (user: AuthUser) => void;
  onCancel: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  onAuthenticated,
  onCancel,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Brute-force lockout is enforced by the server; its message is shown in the error banner.
  const lockoutSecs = 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !passkey.trim()) {
      setErrorMessage('Please provide both your Personnel ID and Security Passkey.');
      return;
    }

    setIsSubmitting(true);
    authenticateUser(identifier, passkey).then((result) => {
      setIsSubmitting(false);
      if (result.success && result.user) {
        onAuthenticated(result.user);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
      }
    });
  };

  const isLocked = lockoutSecs > 0;

  return (
    <div className="w-full max-w-lg mx-auto my-8 sm:my-12">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-slate-900 px-6 py-6 text-white text-center relative">
          <button
            onClick={onCancel}
            className="absolute left-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Return to Visitor Portal"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight">
            Restricted Operations &amp; Dispatch Terminal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Official Personnel Identity &amp; Access Control Verification
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-emerald-400 font-mono mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SECURE 256-BIT DISPATCH GATEWAY</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Lockout Notice */}
          {isLocked && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Terminal Security Lockdown:</strong> Multiple invalid passkey attempts detected. Access suspended for{' '}
                <span className="font-mono font-bold text-amber-900">{lockoutSecs}s</span>.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personnel Identifier */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Personnel ID / Officer Badge Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  disabled={isLocked || isSubmitting}
                  placeholder="Enter employee ID or badge code"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono disabled:bg-slate-100 transition-all"
                />
              </div>
            </div>

            {/* Passkey */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Security Access Passkey
                </label>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLocked || isSubmitting}
                  placeholder="Enter authorized passkey"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono disabled:bg-slate-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked || isSubmitting}
              className="w-full py-3 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate &amp; Access Terminal</span>
                </>
              )}
            </button>
          </form>

          {/* Security Compliance Footnote */}
          <div className="pt-2 text-center">
            <p className="text-[10px] text-slate-400 leading-normal">
              All terminal session access, IP addresses, and consignment modifications are recorded under international freight compliance standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
