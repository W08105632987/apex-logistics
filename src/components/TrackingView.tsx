import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { getStatusColor, formatStatusLabel } from '../utils/emailService';
import { apiGet, ApiError } from '../utils/api';
import { RouteMapVisualizer } from './RouteMapVisualizer';
import { HeroSlider } from './HeroSlider';
import {
  Search,
  Package,
  Calendar,
  Clock,
  MapPin,
  Truck,
  Plane,
  Ship,
  CheckCircle2,
  FileText,
  Bell,
  Mail,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Globe2,
  Thermometer,
  FileCheck,
  Boxes,
  Award,
  Users,
  Headphones,
  Star,
  X,
  Sparkles,
  Building2,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

// Real generated high-resolution assets
import airCargoImg from '../assets/images/cargo_plane_hero_1787730752988.jpg';
import oceanCargoImg from '../assets/images/ocean_freight_hero_1787730773821.jpg';
import overlandCargoImg from '../assets/images/express_logistics_hero_1787730786284.jpg';
import warehouseImg from '../assets/images/smart_warehouse_hub_1787732277761.jpg';
import pharmaColdChainImg from '../assets/images/pharma_cold_chain_1787732293031.jpg';
import customsPortImg from '../assets/images/customs_port_terminal_1787732310825.jpg';

interface TrackingViewProps {
  initialTrackingNumber?: string;
  onViewWaybill: (shipment: Shipment) => void;
  onSubscribeEmail: (trackingNumber: string, email: string) => void | Promise<void>;
  onNavigateTab?: (tab: 'calculator' | 'services') => void;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  initialTrackingNumber,
  onViewWaybill,
  onSubscribeEmail,
  onNavigateTab,
}) => {
  // Only set activeTrackingNumber if initialTrackingNumber is explicitly provided
  const [activeTrackingNumber, setActiveTrackingNumber] = useState<string>(
    initialTrackingNumber ? initialTrackingNumber.trim() : ''
  );
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribedToast, setSubscribedToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (initialTrackingNumber) {
      setActiveTrackingNumber(initialTrackingNumber.trim());
    }
  }, [initialTrackingNumber]);

  // Look the shipment up on the server whenever the tracking number changes
  const hasSearched = Boolean(activeTrackingNumber.trim());
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    const tn = activeTrackingNumber.trim();
    if (!tn) {
      setActiveShipment(null);
      setLookupError(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setLookupError(null);
    apiGet<{ shipment: Shipment }>(`/track/${encodeURIComponent(tn)}`)
      .then((res) => {
        if (!cancelled) setActiveShipment(res.shipment);
      })
      .catch((e) => {
        if (cancelled) return;
        setActiveShipment(null);
        if (!(e instanceof ApiError && e.status === 404)) {
          setLookupError(e instanceof Error ? e.message : 'Lookup failed. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTrackingNumber]);

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      setActiveTrackingNumber(query.trim().toUpperCase());
      setTimeout(() => {
        const element = document.getElementById('tracking-result-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleQuickSelect = (trackingNum: string) => {
    setActiveTrackingNumber(trackingNum.trim().toUpperCase());
    setTimeout(() => {
      const element = document.getElementById('tracking-result-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleCloseTracking = () => {
    setActiveTrackingNumber('');
    window.location.hash = '#track';
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail || !activeShipment) return;
    try {
      await onSubscribeEmail(activeShipment.trackingNumber, subscribeEmail);
      setSubscribedToast(true);
      setSubscribeEmail('');
      setTimeout(() => setSubscribedToast(false), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not subscribe. Please try again.');
    }
  };

  const handleCopyTrackingNumber = () => {
    if (activeShipment) {
      navigator.clipboard?.writeText(activeShipment.trackingNumber);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Status Milestones Array
  const MILESTONES: { key: ShipmentStatus; label: string; icon: string }[] = [
    { key: 'manifest_created', label: 'Booked', icon: '📝' },
    { key: 'picked_up', label: 'Collected', icon: '📦' },
    { key: 'received_at_facility', label: 'Hub Sorting', icon: '🏢' },
    { key: 'in_transit', label: 'In Transit', icon: '🛫' },
    { key: 'customs_clearance', label: 'Customs', icon: '🛂' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '✅' },
  ];

  const getMilestoneIndex = (status: ShipmentStatus): number => {
    switch (status) {
      case 'manifest_created':
        return 0;
      case 'picked_up':
        return 1;
      case 'received_at_facility':
        return 2;
      case 'in_transit':
        return 3;
      case 'customs_clearance':
        return 4;
      case 'out_for_delivery':
        return 5;
      case 'delivered':
        return 6;
      default:
        return 3;
    }
  };

  const currentMilestoneIdx = activeShipment ? getMilestoneIndex(activeShipment.status) : 0;
  const color = activeShipment ? getStatusColor(activeShipment.status) : getStatusColor('in_transit');

  // Rich Visual Services List with High-Resolution Photography
  const SERVICES = [
    {
      image: airCargoImg,
      icon: <Plane className="w-4 h-4 text-blue-600" />,
      tag: 'Air Express',
      title: 'Priority Air Freight',
      desc: 'Next-flight-out express charters with guaranteed ramp allocation across 140+ international airport hubs.',
      stats: '24–48h Delivery',
      coverage: '140+ Airport Hubs',
    },
    {
      image: oceanCargoImg,
      icon: <Ship className="w-4 h-4 text-sky-600" />,
      tag: 'Maritime',
      title: 'Ocean Cargo (FCL & LCL)',
      desc: 'Deep-sea container freight connecting 850+ global seaports with smart container tracking and customs clearance.',
      stats: 'Global Sea Corridors',
      coverage: '850+ Ports',
    },
    {
      image: overlandCargoImg,
      icon: <Truck className="w-4 h-4 text-emerald-600" />,
      tag: 'Overland Fleet',
      title: 'Cross-Border Transport',
      desc: 'GPS-monitored high-capacity heavy freight tractor-trailers and secured bonded overland couriers.',
      stats: '99.4% On-Time SLA',
      coverage: 'Dedicated Escort',
    },
    {
      image: pharmaColdChainImg,
      icon: <Thermometer className="w-4 h-4 text-purple-600" />,
      tag: 'Cold Chain',
      title: 'Pharma & Cryogenic Logistics',
      desc: 'Active temperature-controlled transport (2°C to 8°C / -20°C / -80°C) with continuous IoT telemetry.',
      stats: 'GDP Certified',
      coverage: 'IoT Sensor Telemetry',
    },
    {
      image: customsPortImg,
      icon: <FileCheck className="w-4 h-4 text-indigo-600" />,
      tag: 'Customs Desk',
      title: 'Port Customs Brokerage',
      desc: 'Electronic tariff filing, duty prepayment, biosecurity permits, and cross-border customs escrow release.',
      stats: '24/7 Port Clearance',
      coverage: 'IATA Automated',
    },
    {
      image: warehouseImg,
      icon: <Boxes className="w-4 h-4 text-amber-600" />,
      tag: 'Fulfillment',
      title: 'Smart Warehousing',
      desc: 'Bonded climate-controlled storage, automated robotic pick-and-pack, and same-day cargo dispatch.',
      stats: 'Same-Day Dispatch',
      coverage: '45+ Global Hubs',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12">
      {/* 1. Welcoming Hero Slider & Fast Search Banner */}
      <HeroSlider
        onSearch={handleSearchSubmit}
        activeTrackingNumber={activeTrackingNumber}
      />

      {/* 2. ON-DEMAND TRACKING TELEMETRY (SHOWN ONLY WHEN USER SEARCHES) */}
      {hasSearched && (
        <div id="tracking-result-section" className="space-y-6 scroll-mt-20">
          {isLoading ? (
            <div className="p-10 text-center rounded-3xl bg-white border border-slate-200 shadow-sm text-sm text-slate-500" role="status">
              Locating consignment {activeTrackingNumber}&hellip;
            </div>
          ) : activeShipment ? (
            <div className="space-y-6">
              {/* Quick Bar with Active Search & Close/Clear Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider">
                      Live Consignment Telemetry
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Query: <span className="text-emerald-400 font-bold">{activeShipment.trackingNumber}</span> &bull; {activeShipment.originHub.city} &rarr; {activeShipment.receiver.city}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseTracking}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                    title="Clear search and return to home view"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close Tracking Results</span>
                  </button>
                </div>
              </div>

              {/* Main Status & Action Card */}
              <div className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                {/* Top Bar with Tracking ID, Status Badge & Quick Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-2xl md:text-3xl font-mono font-bold text-slate-900 tracking-tight">
                        {activeShipment.trackingNumber}
                      </span>
                      <button
                        onClick={handleCopyTrackingNumber}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Copy Tracking Number"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${color.badgeBg} ${color.text} border ${color.badgeBorder}`}
                      >
                        {formatStatusLabel(activeShipment.status)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Service: <strong className="text-slate-800">{activeShipment.serviceType.replace('_', ' ').toUpperCase()}</strong> &bull; Waybill Ref: {activeShipment.referenceNumber || 'N/A'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => onViewWaybill(activeShipment)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Air Waybill (AWB)</span>
                    </button>
                  </div>
                </div>

                {/* Status Box */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                        Live Status Summary
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        {activeShipment.statusMessage}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Route: <strong className="text-slate-800">{activeShipment.originHub.city}, {activeShipment.originHub.country}</strong> &rarr; <strong className="text-slate-800">{activeShipment.receiver.city}, {activeShipment.receiver.country}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="py-2">
                  <div className="relative">
                    <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 -z-0">
                      <div
                        className="h-full bg-blue-600 transition-all duration-700"
                        style={{
                          width: `${(currentMilestoneIdx / (MILESTONES.length - 1)) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between relative z-10">
                      {MILESTONES.map((milestone, idx) => {
                        const isPassed = idx <= currentMilestoneIdx;
                        const isCurrent = idx === currentMilestoneIdx;

                        return (
                          <div key={milestone.key} className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                                isCurrent
                                  ? 'bg-blue-700 text-white ring-4 ring-blue-100 scale-110'
                                  : isPassed
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}
                            >
                              {milestone.icon}
                            </div>
                            <span
                              className={`text-[11px] font-semibold mt-2 hidden sm:block text-center max-w-[80px] ${
                                isCurrent
                                  ? 'text-blue-700 font-bold'
                                  : isPassed
                                  ? 'text-slate-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              {milestone.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3 Telemetry Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-blue-700" />
                      Estimated Delivery
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-1">
                      {new Date(activeShipment.estimatedDelivery).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-blue-700 font-semibold mt-0.5">
                      {activeShipment.status === 'delivered' ? 'Completed & Signed' : 'On Schedule'}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <MapPin className="w-4 h-4 text-sky-700" />
                      Active Hub Location
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-1 truncate">
                      {activeShipment.currentLocation.city}, {activeShipment.currentLocation.country}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {activeShipment.currentLocation.description}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Truck className="w-4 h-4 text-emerald-700" />
                      Carrier / Transit Unit
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-1 truncate">
                      {activeShipment.assignedCourier?.name || activeShipment.transportVessel?.identifier || 'Globex Air Cargo GA-310'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {activeShipment.assignedCourier?.vehiclePlate ? `Vehicle Plate: ${activeShipment.assignedCourier.vehiclePlate}` : 'Monitored Cargo Flight'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Global Route Map */}
              <RouteMapVisualizer shipment={activeShipment} />

              {/* 2 Column Layout: Checkpoint History & Consignment Specs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Chronological Checkpoint Timeline */}
                <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-700" />
                        Shipment Journey &amp; Milestones Log
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Official timestamps registered across international transport and customs hubs
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {activeShipment.checkpoints.length} Recorded Events
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {activeShipment.checkpoints.map((chk, index) => {
                      const isLatest = index === 0;
                      const chkColor = getStatusColor(chk.status);

                      return (
                        <div key={chk.id} className="relative group">
                          <div
                            className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full transition-transform ${
                              isLatest
                                ? 'bg-blue-700 ring-4 ring-blue-100 scale-125'
                                : 'bg-slate-300'
                            }`}
                          />

                          <div
                            className={`p-4 rounded-xl border transition-all ${
                              isLatest
                                ? 'bg-blue-50/40 border-blue-200 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${chkColor.badgeBg} ${chkColor.text}`}
                                >
                                  {formatStatusLabel(chk.status)}
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {chk.title}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                {new Date(chk.timestamp).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZoneName: 'short',
                                })}
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed mt-1">
                              {chk.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                              <span>📍 {chk.location}</span>
                              {chk.facilityCode && <span>&bull; Hub: {chk.facilityCode}</span>}
                              {chk.signedBy && (
                                <span className="text-emerald-700 font-semibold">
                                  &bull; Signed by: {chk.signedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 1 Col: Package Details & Notifications Signup */}
                <div className="space-y-6">
                  {/* Package Specifications Box */}
                  <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Package className="w-4 h-4 text-blue-700" />
                      Freight Specifications
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Weight</span>
                        <span className="font-bold text-slate-900">
                          {activeShipment.packageDetails.weight} {activeShipment.packageDetails.unit}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Pieces</span>
                        <span className="font-bold text-slate-900">
                          {activeShipment.packageDetails.pieces} Unit(s)
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Dimensions</span>
                        <span className="font-medium text-slate-800 font-mono">
                          {activeShipment.packageDetails.dimensions}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Cargo Type</span>
                        <span className="font-medium text-slate-800 text-right max-w-[150px] truncate">
                          {activeShipment.packageDetails.cargoType}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Declared Value</span>
                        <span className="font-bold text-blue-700">
                          {activeShipment.packageDetails.declaredValue}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Insurance</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {activeShipment.packageDetails.isInsured ? 'Underwritten' : 'Standard'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Shipper</div>
                        <div className="font-semibold text-slate-900">{activeShipment.sender.name}</div>
                        <div className="text-slate-500 text-[11px]">{activeShipment.sender.city}, {activeShipment.sender.country}</div>
                      </div>
                      <div className="pt-2">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Recipient</div>
                        <div className="font-semibold text-slate-900">{activeShipment.receiver.name}</div>
                        <div className="text-slate-500 text-[11px]">{activeShipment.receiver.address}, {activeShipment.receiver.city}</div>
                      </div>
                    </div>
                  </div>

                  {/* Automatic Email Update Subscription */}
                  <div className="rounded-3xl bg-blue-50/50 border border-blue-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Bell className="w-4 h-4 text-blue-700" />
                      <span>Live Email Alerts</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Get instant automated status notifications when this consignment clears customs or arrives.
                    </p>

                    {subscribedToast ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Subscribed! Alerts will be sent for #{activeShipment.trackingNumber}.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSubscribe} className="space-y-2">
                        <input
                          type="email"
                          required
                          placeholder="Enter email address"
                          value={subscribeEmail}
                          onChange={(e) => setSubscribeEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                        />
                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          Subscribe for Alerts
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Not Found Screen */
            <div className="p-10 text-center rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {lookupError ? 'Tracking is temporarily unavailable' : `No Consignment Found for "${activeTrackingNumber}"`}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {lookupError ? `${lookupError} ` : ''}Please verify your Air Waybill or Consignment Reference Number and try again. For urgent inquiries, our 24/7 International Dispatch Desk is available at +1 (800) 555-0199.
              </p>
              <div className="pt-3">
                <button
                  onClick={handleCloseTracking}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Return to Home Overview
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. VISUAL CUSTOMER HOME SERVICES GRID WITH HIGH-RES PHOTOGRAPHY */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Globe2 className="w-3.5 h-3.5" />
              <span>Global Freight Network</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Worldwide Shipping Solutions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Multi-modal freight forwarding across 220+ countries with active telemetry and customs escrow.
            </p>
          </div>
        </div>

        {/* 6 Visual Photo Service Cards with Clean, Minimal Text */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((svc) => (
            <div
              key={svc.title}
              className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col group"
            >
              {/* Photo Banner with Zoom effect and floating tag */}
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

                {/* Bottom Photo Stat Pill */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {svc.stats}
                  </span>
                  <span className="text-[11px] text-slate-300 font-mono">{svc.coverage}</span>
                </div>
              </div>

              {/* Concise Content Body */}
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
                  <span>Verified Carrier Network</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. VISUAL HERO SHOWCASE: MODERN INFRASTRUCTURE & CERTIFICATIONS */}
      <div className="rounded-3xl bg-slate-950 text-white overflow-hidden border border-slate-800 shadow-2xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Visual Collage */}
          <div className="lg:col-span-6 relative min-h-[300px] lg:min-h-[420px] overflow-hidden">
            <img
              src={warehouseImg}
              alt="Globex Global Logistics Hub"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/40 to-slate-950" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent lg:hidden" />

            {/* Floating Live Telemetry Badge */}
            <div className="absolute bottom-6 left-6 p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs space-y-1 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Hub Telemetry</span>
              </div>
              <div className="text-slate-300 font-medium">Tokyo &bull; Frankfurt &bull; New York &bull; London</div>
            </div>
          </div>

          {/* Right Punchy Metrics & Description */}
          <div className="lg:col-span-6 p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Welcome to Globex Worldwide</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Global Infrastructure. Real-Time Precision.
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Four decades of dedicated freight forwarding across 220+ territories. Certified aircraft space, deep-sea maritime capacity, and GDP-audited pharmaceutical cold storage.
              </p>
            </div>

            {/* 4 Crisp Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-black text-blue-400 font-mono">220+</div>
                <div className="text-[11px] font-bold text-slate-300">Countries Served</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-black text-emerald-400 font-mono">99.8%</div>
                <div className="text-[11px] font-bold text-slate-300">On-Time Clearance</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-black text-amber-400 font-mono">1.4M+</div>
                <div className="text-[11px] font-bold text-slate-300">Annual Shipments</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-black text-purple-400 font-mono">24/7</div>
                <div className="text-[11px] font-bold text-slate-300">Live Dispatch Desk</div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-semibold text-slate-300 border-t border-slate-800/80">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> IATA Licensed #890
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> AEO Certified
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> GDP Pharma Cold-Chain
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. HOW IT WORKS: 3 CRISP VISUAL STEPS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-100">
            01
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Enter Waybill Code</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Search any AWB or booking code in the header bar for instant telemetry.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-100">
            02
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Live GPS &amp; Customs</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              View transit milestones, international airport hubs, and estimated arrival windows.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-100">
            03
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">AWB &amp; Email Alerts</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate standardized IATA Air Waybills and subscribe to milestone emails.
            </p>
          </div>
        </div>
      </div>

      {/* 6. VERIFIED TESTIMONIALS WITH CLEAN AVATARS */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Customer Testimonials</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            Trusted by Commercial Shippers Globally
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "Globex delivered our sensitive clinical trial pharmaceuticals across Frankfurt to New York with continuous temperature logging and zero delays."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                DK
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Dr. Karen Vance</div>
                <div className="text-[10px] text-slate-400">BioMed Global Research</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "Instant electronic Air Waybill generation and automated port customs clearance saved our manufacturing plant dozens of production hours."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                MS
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Marcus Sterling</div>
                <div className="text-[10px] text-slate-400">AeroDrive Precision Motors</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "The live email notification telemetry keeps our wholesale retail partners updated automatically. Flawless international shipping partner."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0">
                EL
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Elena Rostova</div>
                <div className="text-[10px] text-slate-400">Nordic Luxury Exporters</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
