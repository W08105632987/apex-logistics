import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin, Lock } from 'lucide-react';
import { TabKey } from '../types';

interface FooterProps {
  onNavigate?: (tab: TabKey) => void;
  onToggleAdmin?: () => void;
  isAdminMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onToggleAdmin, isAdminMode, onNavigate }) => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 text-slate-500 text-xs mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-700 h-7 w-7 rounded flex items-center justify-center text-white shadow-sm">
                <span className="text-sm font-bold">▲</span>
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">
                GLOBEX<span className="font-light text-blue-700">LOGISTICS</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Premier international air cargo, ocean container shipping, priority courier, and customs clearance logistics provider.
            </p>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>AEO &amp; C-TPAT Certified Global Freight Security</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Freight Solutions
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li>Air Priority Express (Next-Flight)</li>
              <li>FCL / LCL Ocean Container Freight</li>
              <li>Cold-Chain Pharmaceutical Logistics</li>
              <li>Automated Customs Brokerage</li>
              <li>Diplomatic &amp; Armored Escort Courier</li>
            </ul>
          </div>

          {/* Global Operations Hubs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Primary Regional Hubs
            </h4>
            <ul className="space-y-1.5 font-mono text-[11px] text-slate-600">
              <li>FRA &bull; Frankfurt Airport Gateway</li>
              <li>JFK &bull; New York Air Cargo Center</li>
              <li>LHR &bull; London Heathrow World Cargo</li>
              <li>NRT &bull; Tokyo Narita Air Logistics</li>
              <li>DWC &bull; Dubai Logistics City Port</li>
              <li>SIN &bull; Singapore Changi Freight</li>
            </ul>
          </div>

          {/* 24/7 Priority Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              24/7 International Desk
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-blue-700" />
                <span>+1 (800) 555-GLOBEX / +49 69 900 120</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-blue-700" />
                <span>dispatch@globexlogistics.com</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-blue-700" />
                <span>Cargo City South, 60549 Frankfurt, Germany</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} Globex Logistics Corp. All worldwide tracking records encrypted and protected.
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => onNavigate?.('terms')} className="hover:text-slate-600 cursor-pointer">Conditions of Carriage</button>
            <span>&bull;</span>
            <button type="button" onClick={() => onNavigate?.('security')} className="hover:text-slate-600 cursor-pointer">Security Compliance</button>
            <span>&bull;</span>
            <button type="button" onClick={() => onNavigate?.('privacy')} className="hover:text-slate-600 cursor-pointer">Privacy Policy</button>
            {onToggleAdmin && (
              <>
                <span>&bull;</span>
                <button
                  onClick={onToggleAdmin}
                  className="text-slate-400 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  <span>{isAdminMode ? 'Return to Visitor Portal' : 'Staff Portal'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
