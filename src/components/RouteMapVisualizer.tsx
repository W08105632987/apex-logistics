import React from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { Plane, Ship, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RouteMapVisualizerProps {
  shipment: Shipment;
}

export const RouteMapVisualizer: React.FC<RouteMapVisualizerProps> = ({ shipment }) => {
  // Convert lat/lng to simple Mercator SVG projection
  // Lat: -85 to 85 -> Y: 400 to 0
  // Lng: -180 to 180 -> X: 0 to 900
  const projectCoords = (coords: [number, number]): { x: number; y: number } => {
    const lat = coords[0];
    const lng = coords[1];
    const x = ((lng + 180) / 360) * 860 + 20;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = 220 - (mercN / Math.PI) * 120;
    // clamp y
    const clampedY = Math.max(30, Math.min(380, y));
    return { x, y: clampedY };
  };

  const originPoint = projectCoords(shipment.originHub.coordinates);
  const destPoint = projectCoords(shipment.destinationHub.coordinates);
  const currentPoint = projectCoords(shipment.currentLocation.coordinates);

  // Calculate arc control point for great-circle curve
  const midX = (originPoint.x + destPoint.x) / 2;
  const midY = Math.min(originPoint.y, destPoint.y) - Math.abs(destPoint.x - originPoint.x) * 0.18;
  const curvePath = `M ${originPoint.x} ${originPoint.y} Q ${midX} ${midY} ${destPoint.x} ${destPoint.y}`;

  // Estimate progress along path (0 to 100%)
  const getProgressPercentage = (status: ShipmentStatus): number => {
    switch (status) {
      case 'manifest_created':
        return 5;
      case 'picked_up':
        return 18;
      case 'received_at_facility':
        return 35;
      case 'in_transit':
        return 60;
      case 'customs_clearance':
        return 80;
      case 'out_for_delivery':
        return 92;
      case 'delivered':
        return 100;
      case 'exception_hold':
        return 50;
      default:
        return 10;
    }
  };

  const progress = getProgressPercentage(shipment.status);

  // Pick transport vehicle icon
  const renderVehicleIcon = () => {
    if (shipment.serviceType === 'priority_ocean') {
      return <Ship className="w-5 h-5 text-amber-300" />;
    }
    if (shipment.status === 'out_for_delivery') {
      return <Truck className="w-5 h-5 text-amber-300 animate-bounce" />;
    }
    return <Plane className="w-5 h-5 text-amber-300 transform -rotate-12" />;
  };

  return (
    <div id="route-map-container" className="relative w-full rounded-xl bg-slate-900 border border-slate-800 p-4 md:p-6 overflow-hidden shadow-sm">
      {/* Top telemetry bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Live Global Route Telemetry
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>
            <span className="text-slate-500">Vessel:</span>{' '}
            <span className="text-slate-200 font-medium">
              {shipment.transportVessel?.identifier || 'Globex Air Cargo GA-310'}
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-500">Route:</span>{' '}
            <span className="text-blue-400 font-bold">
              {shipment.originHub.code} &rarr; {shipment.destinationHub.code}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Progress:</span>{' '}
            <span className="text-emerald-400 font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 my-3 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-lg overflow-hidden border border-slate-800">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#64748b 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px',
          }}
        />

        <svg
          viewBox="0 0 900 420"
          className="w-full h-full object-contain"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradient for route path */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Stylized world land masses contours */}
          <g opacity="0.10" fill="#60a5fa">
            {/* North America */}
            <path d="M 120 70 Q 180 60 230 110 Q 250 160 200 200 Q 150 210 110 160 Z" />
            {/* South America */}
            <path d="M 210 220 Q 280 240 260 330 Q 220 370 190 280 Z" />
            {/* Europe */}
            <path d="M 430 70 Q 510 60 500 130 Q 450 140 420 100 Z" />
            {/* Africa */}
            <path d="M 430 150 Q 520 160 500 280 Q 450 320 410 220 Z" />
            {/* Asia */}
            <path d="M 520 70 Q 720 50 740 180 Q 640 210 540 140 Z" />
            {/* Australia */}
            <path d="M 680 260 Q 780 270 760 340 Q 690 350 670 290 Z" />
          </g>

          {/* Planned flight/vessel trajectory path */}
          <path
            d={curvePath}
            fill="none"
            stroke="#334155"
            strokeWidth="3"
            strokeDasharray="6 6"
          />

          {/* Active completed route path */}
          <path
            d={curvePath}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3.5"
            filter="url(#glow)"
            strokeDasharray="1000"
            strokeDashoffset={1000 - 1000 * (progress / 100)}
            className="transition-all duration-1000 ease-out"
          />

          {/* Origin Marker */}
          <g transform={`translate(${originPoint.x}, ${originPoint.y})`}>
            <circle r="8" fill="#2563eb" fillOpacity="0.3" className="animate-ping" />
            <circle r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
            <text
              y="-12"
              textAnchor="middle"
              className="fill-slate-200 text-[11px] font-bold tracking-wider uppercase font-mono"
            >
              {shipment.originHub.code}
            </text>
            <text
              y="18"
              textAnchor="middle"
              className="fill-slate-400 text-[9px] font-sans"
            >
              {shipment.originHub.city}
            </text>
          </g>

          {/* Destination Marker */}
          <g transform={`translate(${destPoint.x}, ${destPoint.y})`}>
            <circle r="9" fill="#10b981" fillOpacity="0.3" className="animate-ping" />
            <circle r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
            <text
              y="-12"
              textAnchor="middle"
              className="fill-slate-200 text-[11px] font-bold tracking-wider uppercase font-mono"
            >
              {shipment.destinationHub.code}
            </text>
            <text
              y="18"
              textAnchor="middle"
              className="fill-slate-400 text-[9px] font-sans"
            >
              {shipment.destinationHub.city}
            </text>
          </g>

          {/* Current Live Position Marker */}
          <g
            transform={`translate(${currentPoint.x}, ${currentPoint.y})`}
            className="transition-all duration-700 ease-out"
          >
            <circle r="16" fill="#3b82f6" fillOpacity="0.25" className="animate-pulse" />
            <circle r="8" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
            <text
              y="-20"
              textAnchor="middle"
              className="fill-blue-300 text-[10px] font-semibold bg-slate-900 font-mono"
            >
              📍 {shipment.currentLocation.city}
            </text>
          </g>
        </svg>

        {/* Live floating HUD inside map */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg p-3 flex items-center gap-3 shadow-lg">
          <div className="p-2.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            {renderVehicleIcon()}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              <span>{shipment.currentLocation.description}</span>
              {shipment.status === 'delivered' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {shipment.status === 'exception_hold' && (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Current: <span className="text-slate-300 font-medium">{shipment.currentLocation.city}, {shipment.currentLocation.country}</span> &bull; Coords: {shipment.currentLocation.coordinates[0].toFixed(2)}, {shipment.currentLocation.coordinates[1].toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Origin -> Transit -> Destination Status Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-2">
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Origin Facility</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">{shipment.originHub.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{shipment.originHub.city}, {shipment.originHub.country} ({shipment.originHub.code})</div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current Transit Point</div>
          <div className="text-sm font-bold text-blue-400 mt-0.5">{shipment.currentLocation.city}</div>
          <div className="text-xs text-slate-400 mt-0.5">{shipment.currentLocation.description}</div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Destination Hub</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">{shipment.destinationHub.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{shipment.destinationHub.city}, {shipment.destinationHub.country} ({shipment.destinationHub.code})</div>
        </div>
      </div>
    </div>
  );
};
