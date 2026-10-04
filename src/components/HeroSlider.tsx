import React, { useState, useEffect, useRef } from 'react';
import {
  Plane,
  Ship,
  Truck,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Globe2,
  Clock,
  ArrowRight,
  Boxes,
  Thermometer,
  FileCheck,
} from 'lucide-react';

// Real generated high-resolution assets
import airCargoImg from '../assets/images/cargo_plane_hero_1787730752988.jpg';
import oceanCargoImg from '../assets/images/ocean_freight_hero_1787730773821.jpg';
import overlandCargoImg from '../assets/images/express_logistics_hero_1787730786284.jpg';
import warehouseImg from '../assets/images/smart_warehouse_hub_1787732277761.jpg';
import pharmaColdChainImg from '../assets/images/pharma_cold_chain_1787732293031.jpg';
import customsPortImg from '../assets/images/customs_port_terminal_1787732310825.jpg';

interface HeroSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  icon: React.ReactNode;
  highlight: string;
}

interface HeroSliderProps {
  onSearch: (trackingNumber: string) => void;
  activeTrackingNumber: string;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  onSearch,
  activeTrackingNumber,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides: HeroSlide[] = [
    {
      id: 'air-freight',
      tag: 'Priority Air Cargo',
      title: 'Global Air Cargo & Express Charters',
      subtitle: 'Guaranteed aircraft space with direct airport ramp access across 140+ hubs.',
      badge: 'IATA Licensed Agent #890',
      image: airCargoImg,
      icon: <Plane className="w-4 h-4 text-blue-400" />,
      highlight: '24–48h Door-to-Door Delivery',
    },
    {
      id: 'ocean-freight',
      tag: 'Maritime Freight',
      title: 'Deep-Sea Container Shipping (FCL & LCL)',
      subtitle: 'Connecting 850+ global seaports with integrated customs clearance and live telemetry.',
      badge: 'FMC Licensed Carrier',
      image: oceanCargoImg,
      icon: <Ship className="w-4 h-4 text-sky-400" />,
      highlight: '850+ Seaport Global Network',
    },
    {
      id: 'express-overland',
      tag: 'Secured Overland Fleet',
      title: 'Cross-Border Transport & Escort Fleet',
      subtitle: 'GPS-monitored heavy freight network with dedicated ground escort units.',
      badge: 'AEO Certified Logistics',
      image: overlandCargoImg,
      icon: <Truck className="w-4 h-4 text-emerald-400" />,
      highlight: '99.4% On-Time Precision',
    },
    {
      id: 'pharma-cold-chain',
      tag: 'BioPharma Cold-Chain',
      title: 'Temperature-Controlled Pharma Logistics',
      subtitle: 'Active 2°C to 8°C cryogenic transport with continuous real-time IoT temperature logging.',
      badge: 'GDP Pharma Certified',
      image: pharmaColdChainImg,
      icon: <Thermometer className="w-4 h-4 text-purple-400" />,
      highlight: 'Active IoT Sensor Telemetry',
    },
    {
      id: 'smart-warehousing',
      tag: 'Smart Warehousing',
      title: 'Automated High-Density Storage & Cross-Docking',
      subtitle: 'Bonded climate-controlled storage with robotic pick-and-pack and same-day dispatch.',
      badge: '45+ Global Storage Hubs',
      image: warehouseImg,
      icon: <Boxes className="w-4 h-4 text-amber-400" />,
      highlight: 'Real-Time Inventory Sync',
    },
    {
      id: 'customs-brokerage',
      tag: 'Customs & Port Desk',
      title: '24/7 International Port Customs Brokerage',
      subtitle: 'Automated electronic tariff filing, duty prepayment, and rapid port escrow release.',
      badge: 'Licensed Customs Escrow',
      image: customsPortImg,
      icon: <FileCheck className="w-4 h-4 text-indigo-400" />,
      highlight: 'Fast-Track Port Release',
    },
  ];

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slides.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const activeSlide = slides[currentSlide];

  return (
    <div
      id="hero-slider-section"
      className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-slate-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide Image Backgrounds with Smooth Crossfade & Pan */}
      <div className="relative h-[480px] sm:h-[520px] md:h-[560px] w-full overflow-hidden">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
            style={{ transition: 'opacity 1s ease-in-out, transform 7s ease-out' }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            {/* Cinematic dark gradient overlays for rich contrast & legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40" />
          </div>
        ))}

        {/* Content Container */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-between py-8 md:py-10 text-white">
          {/* Top telemetry pill & slide counter */}
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-xs font-semibold text-slate-200 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{activeSlide.tag}</span>
              <span className="text-slate-500 font-mono">&bull;</span>
              <span className="text-emerald-400 font-mono text-[11px]">{activeSlide.highlight}</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-slate-300">
              <span>0{currentSlide + 1}</span>
              <span className="text-slate-500">/</span>
              <span>0{slides.length}</span>
            </div>
          </div>

          {/* Center Main Headline & Punchy Subtitle */}
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
              {activeSlide.icon}
              <span>{activeSlide.badge}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
              {activeSlide.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
              {activeSlide.subtitle}
            </p>
          </div>

          {/* Bottom Integrated Fast Consignment Tracker Bar */}
          <div className="space-y-2">
            <form onSubmit={handleSubmit} className="w-full max-w-2xl">
              <div className="relative flex items-center p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl">
                <div className="pl-3.5 pr-2 text-blue-700">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Enter Tracking or Air Waybill # (e.g. APX-8492-US)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-2 py-2.5 text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:outline-none bg-transparent"
                />
                <button
                  type="submit"
                  className="px-5 sm:px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Track Cargo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Left & Right Slider Controls */}
        <button
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-900/90 text-white flex items-center justify-center border border-white/10 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-900/90 text-white flex items-center justify-center border border-white/10 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Bottom Thumbnail Dot Indicators */}
        <div className="absolute bottom-3 right-6 z-20 hidden md:flex items-center gap-2">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentSlide ? 'w-8 bg-blue-500' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              title={slide.tag}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
