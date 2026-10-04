import React from 'react';
import { Plane, Ship, Truck, Thermometer, ShieldCheck, FileCheck, Globe2, Boxes, ArrowRight, CheckCircle } from 'lucide-react';

// Real generated high-resolution assets
import airCargoImg from '../assets/images/cargo_plane_hero_1787730752988.jpg';
import oceanCargoImg from '../assets/images/ocean_freight_hero_1787730773821.jpg';
import overlandCargoImg from '../assets/images/express_logistics_hero_1787730786284.jpg';
import warehouseImg from '../assets/images/smart_warehouse_hub_1787732277761.jpg';
import pharmaColdChainImg from '../assets/images/pharma_cold_chain_1787732293031.jpg';
import customsPortImg from '../assets/images/customs_port_terminal_1787732310825.jpg';

export const GlobalServices: React.FC = () => {
  const services = [
    {
      image: airCargoImg,
      icon: <Plane className="w-4 h-4 text-blue-600" />,
      tag: 'Air Express',
      title: 'Priority Air Freight',
      desc: 'Charter, priority consol, and scheduled intercontinental air cargo with guaranteed aircraft space.',
      stats: '24–48h Delivery',
      coverage: '140+ Direct Airport Hubs',
    },
    {
      image: oceanCargoImg,
      icon: <Ship className="w-4 h-4 text-sky-600" />,
      tag: 'Maritime Corridors',
      title: 'Ocean Cargo (FCL & LCL)',
      desc: 'Full-container and consolidated maritime shipping connecting all major deep-sea global trade corridors.',
      stats: 'Deep-Sea Global Reach',
      coverage: '850+ Seaport Connections',
    },
    {
      image: overlandCargoImg,
      icon: <Truck className="w-4 h-4 text-emerald-600" />,
      tag: 'Ground Escort',
      title: 'Overland Fleet & Transport',
      desc: 'Dedicated heavy tractor-trailers, bonded box vans, and secured couriers with live GPS telemetry.',
      stats: '99.4% On-Time Precision',
      coverage: 'Dedicated Ground Escort',
    },
    {
      image: pharmaColdChainImg,
      icon: <Thermometer className="w-4 h-4 text-purple-600" />,
      tag: 'Cold Chain',
      title: 'Pharma & Cryogenic Logistics',
      desc: 'Active temperature-controlled handling (2°C to 8°C / -20°C / -80°C) with continuous IoT telemetry.',
      stats: 'GDP Pharma Certified',
      coverage: 'IoT Sensor Monitored',
    },
    {
      image: customsPortImg,
      icon: <FileCheck className="w-4 h-4 text-indigo-600" />,
      tag: 'Customs Desk',
      title: 'Customs Clearance & Brokerage',
      desc: 'Electronic tariff classification, biosecurity permits, duty prepayment, and customs escrow release.',
      stats: '24/7 Port Customs Release',
      coverage: 'Automated IATA Filing',
    },
    {
      image: warehouseImg,
      icon: <Boxes className="w-4 h-4 text-amber-600" />,
      tag: 'Bonded Storage',
      title: 'Smart Warehousing & Fulfillment',
      desc: 'Climate-controlled bonded storage, automated robotic pick-and-pack, and same-day cargo dispatch.',
      stats: 'Same-Day Dispatch',
      coverage: '45+ Global Storage Hubs',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <Globe2 className="w-3.5 h-3.5" />
          <span>Enterprise Freight Capabilities</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          World-Class Multi-Modal Logistics
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Connecting over 220 countries and territories with unified tracking, electronic Air Waybills, and real-time checkpoint telemetry.
        </p>
      </div>

      {/* Services Grid with Visual Photo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((svc) => (
          <div
            key={svc.title}
            className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col group"
          >
            {/* Photo Header with subtle zoom */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-950">
              <img
                src={svc.image}
                alt={svc.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              
              {/* Floating Tag */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
                {svc.icon}
                <span>{svc.tag}</span>
              </div>

              {/* Stat Pill */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {svc.stats}
                </span>
                <span className="text-[11px] text-slate-300 font-mono">{svc.coverage}</span>
              </div>
            </div>

            {/* Concise Description */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {svc.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  {svc.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                <span>Verified Carrier Corridor</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global Hubs Statistics */}
      <div className="p-8 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
          <div className="p-3">
            <div className="text-3xl font-black text-blue-400 font-mono">220+</div>
            <div className="text-xs text-slate-300 mt-1 uppercase font-bold tracking-wider">Countries Connected</div>
          </div>
          <div className="p-3">
            <div className="text-3xl font-black text-emerald-400 font-mono">1.4M+</div>
            <div className="text-xs text-slate-300 mt-1 uppercase font-bold tracking-wider">Consignments Handled</div>
          </div>
          <div className="p-3">
            <div className="text-3xl font-black text-amber-400 font-mono">99.8%</div>
            <div className="text-xs text-slate-300 mt-1 uppercase font-bold tracking-wider">Clearance Precision</div>
          </div>
          <div className="p-3">
            <div className="text-3xl font-black text-purple-400 font-mono">24/7/365</div>
            <div className="text-xs text-slate-300 mt-1 uppercase font-bold tracking-wider">Operations Desk</div>
          </div>
        </div>
      </div>
    </div>
  );
};
