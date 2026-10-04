import React, { useState } from 'react';
import { ServiceType, ShippingQuoteResult } from '../types';
import { Calculator, ArrowRight, ShieldCheck, Clock, Check, Sparkles } from 'lucide-react';
import { apiPost, errorMessage } from '../utils/api';
import { BookingRequestModal } from './BookingRequestModal';

interface RateCalculatorProps {
  onBookNow?: (quote: ShippingQuoteResult, origin: string, dest: string, weight: number) => void;
}

export const RateCalculator: React.FC<RateCalculatorProps> = ({ onBookNow }) => {
  const [originCountry, setOriginCountry] = useState('Germany');
  const [destCountry, setDestCountry] = useState('United States');
  const [weight, setWeight] = useState('15');
  const [cargoCategory, setCargoCategory] = useState('General Commercial Goods');
  const [declaredVal, setDeclaredVal] = useState('5000');
  const [quotes, setQuotes] = useState<ShippingQuoteResult[] | null>(null);

  const [calcBusy, setCalcBusy] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [booking, setBooking] = useState<ShippingQuoteResult | null>(null);

  // Pricing is calculated on the server so the quote a customer sees is the one staff can verify.
  const calculateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalcBusy(true);
    setCalcError(null);
    try {
      const res = await apiPost<{ quotes: ShippingQuoteResult[] }>('/quotes/calculate', {
        originCountry,
        destCountry,
        weight: parseFloat(weight),
        declaredValue: parseFloat(declaredVal) || 0,
      });
      setQuotes(res.quotes);
    } catch (err) {
      setQuotes(null);
      setCalcError(errorMessage(err));
    } finally {
      setCalcBusy(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <Calculator className="w-3.5 h-3.5" />
          Global Freight &amp; Courier Rate Engine
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
          Instant Freight Transit &amp; Cost Estimation
        </h2>
        <p className="text-xs md:text-sm text-slate-500">
          Get real-time guaranteed international shipping rates across air, ocean, and express networks.
        </p>
      </div>

      <div className="p-6 md:p-8 rounded-xl bg-white border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={calculateRates} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Origin Country</label>
            <select
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="Germany">Germany (FRA Hub)</option>
              <option value="United States">United States (JFK/LAX)</option>
              <option value="United Kingdom">United Kingdom (LHR Hub)</option>
              <option value="Japan">Japan (NRT Hub)</option>
              <option value="United Arab Emirates">United Arab Emirates (DXB)</option>
              <option value="Singapore">Singapore (SIN Hub)</option>
              <option value="France">France (CDG Hub)</option>
              <option value="Australia">Australia (SYD Hub)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Destination Country</label>
            <select
              value={destCountry}
              onChange={(e) => setDestCountry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="United States">United States (JFK/LAX)</option>
              <option value="United Kingdom">United Kingdom (LHR Hub)</option>
              <option value="Germany">Germany (FRA Hub)</option>
              <option value="Japan">Japan (NRT Hub)</option>
              <option value="Australia">Australia (SYD Hub)</option>
              <option value="United Arab Emirates">United Arab Emirates (DXB)</option>
              <option value="Singapore">Singapore (SIN Hub)</option>
              <option value="Canada">Canada (YYZ Hub)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cargo Weight (KG)</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={calcBusy}
              className="w-full py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs transition-colors shadow-md shadow-blue-100 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {calcBusy ? 'Calculating…' : 'Calculate Live Rates'}
            </button>
          </div>
        </form>

        {calcError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs" role="alert">{calcError}</div>
        )}

        {/* Calculated Results */}
        {quotes && (
          <div className="space-y-4 pt-6 border-t border-slate-100 animate-slide-up">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Available Shipping Options ({originCountry} &rarr; {destCountry})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quotes.map((q, idx) => (
                <div
                  key={q.serviceName}
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                    idx === 0
                      ? 'bg-blue-50/30 border-blue-600 shadow-sm ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    {idx === 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 inline-block">
                        Recommended Express
                      </span>
                    )}
                    <h4 className="text-base font-bold text-slate-900">{q.serviceName}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{q.estimatedDays}</span>
                    </div>

                    <div className="text-2xl font-black text-slate-900">
                      ${q.price.toLocaleString()}{' '}
                      <span className="text-xs text-slate-500 font-normal">USD</span>
                    </div>

                    <ul className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      {q.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setBooking(q);
                        onBookNow?.(q, originCountry, destCountry, parseFloat(weight));
                      }}
                      className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Request Booking &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {booking && (
        <BookingRequestModal
          quote={booking}
          origin={originCountry}
          dest={destCountry}
          weight={parseFloat(weight)}
          declaredValue={parseFloat(declaredVal) || 0}
          cargoCategory={cargoCategory}
          onClose={() => setBooking(null)}
        />
      )}
    </div>
  );
};
