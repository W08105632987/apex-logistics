import React, { useState } from 'react';
import {
  Search,
  Mail,
  Calculator,
  Globe2,
  Lock,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  User,
} from 'lucide-react';
import { AuthSession, TabKey } from '../types';

interface HeaderProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  emailCount: number;
  onOpenMailbox: () => void;
  onToggleAdmin: () => void;
  isAdminMode: boolean;
  session?: AuthSession;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  emailCount,
  onOpenMailbox,
  onToggleAdmin,
  isAdminMode,
  session,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = session?.isAuthenticated && session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      {/* Top Operations Live Telemetry Ticker */}
      <div className="hidden md:flex items-center justify-between px-6 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300 font-sans">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            GLOBAL LOGISTICS NETWORK: OPERATIONAL &bull; 140+ INTERNATIONAL AIR &amp; SEA HUBS
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-300">24/7 International Desk: +1 (800) 555-0199</span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && session?.user ? (
            <div className="flex items-center gap-3 text-slate-300 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-white">{session.user.name}</span>
                <span className="text-slate-500">({session.user.roleTitle})</span>
              </div>
              <button
                onClick={onOpenMailbox}
                className="text-blue-300 hover:text-white transition-colors flex items-center gap-1 font-sans font-semibold cursor-pointer"
                title="Open email dispatch logs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Logs ({emailCount})</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-rose-400 hover:text-rose-300 transition-colors ml-1 font-semibold flex items-center gap-1 cursor-pointer"
                  title="Lock dispatch session"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Lock</span>
                </button>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-xs">IATA Licensed &bull; ISO 9001 Certified</span>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => {
            if (isAdminMode) {
              onToggleAdmin();
            } else {
              setActiveTab('track');
            }
          }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="bg-blue-700 h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:bg-blue-800 transition-colors">
            <span className="text-base font-bold">▲</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                GLOBEX<span className="font-light text-blue-700">LOGISTICS</span>
              </span>
              {isAdminMode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Admin Portal
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 tracking-wider">
              {isAdminMode ? 'Enterprise Dispatch Control' : 'International Cargo & Freight Tracking'}
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Links based on Mode */}
        {isAdminMode ? (
          /* Admin Navigation Bar */
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>
                {isAuthenticated && session?.user
                  ? `${session.user.name} • ${session.user.badgeNumber}`
                  : 'Dispatch Terminal #089 (Authorized)'}
              </span>
            </div>

            <button
              onClick={onToggleAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Visitor Portal</span>
            </button>
          </div>
        ) : (
          /* Visitor Public Navigation Links */
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('track')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Track Shipment
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Rate Calculator
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              Global Services
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'contact'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Contact
            </button>
          </nav>
        )}

        {/* Right Actions: Staff Portal Link & Mobile Menu */}
        {!isAdminMode && (
          <div className="flex items-center gap-2">
            {/* Staff Portal Link */}
            <button
              onClick={onToggleAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${
                isAuthenticated
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200'
              }`}
              title="Staff & Dispatch Operations Portal"
            >
              {isAuthenticated ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-bold">Staff Portal</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium">Staff Portal</span>
                </>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && !isAdminMode && (
        <div className="md:hidden p-4 bg-white border-b border-slate-200 space-y-1 shadow-md">
          <button
            onClick={() => {
              setActiveTab('track');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <Search className="w-4 h-4 text-blue-700" />
            Track Consignments
          </button>

          <button
            onClick={() => {
              setActiveTab('calculator');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <Calculator className="w-4 h-4 text-blue-700" />
            Rate Calculator
          </button>

          <button
            onClick={() => {
              setActiveTab('services');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <Globe2 className="w-4 h-4 text-blue-700" />
            Global Network Services
          </button>

          <button
            onClick={() => {
              setActiveTab('contact');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <Mail className="w-4 h-4 text-blue-700" />
            Contact &amp; Support
          </button>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onToggleAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <Lock className="w-4 h-4" />
              Staff &amp; Admin Dispatch Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
