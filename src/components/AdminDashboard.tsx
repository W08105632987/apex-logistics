import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus, ServiceType, LocationInfo, EmailLog, AuthUser, StaffRole } from '../types';
import { getStatusColor, formatStatusLabel } from '../utils/emailService';
import { apiGet, apiPost, apiPatch, apiDelete, errorMessage } from '../utils/api';
import { StaffInbox } from './StaffInbox';
import { ChangePasswordModal } from './ChangePasswordModal';
import {
  Inbox,
  Plus,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Send,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  User,
  Shield,
  Trash2,
  Eye,
  Mail,
  Zap,
  Check,
  Lock,
  LogOut,
  Users,
  KeyRound,
  ShieldCheck,
  BadgeAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  shipments: Shipment[];
  emailLogs: EmailLog[];
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onAddShipment: (newShipment: Shipment) => void;
  onUpdateShipment: (updatedShipment: Shipment) => void;
  onDeleteShipment: (id: string) => void;
  onViewWaybill: (shipment: Shipment) => void;
  onTrackShipment: (trackingNumber: string) => void;
  onOpenMailbox: () => void;
}

const GLOBAL_HUBS: LocationInfo[] = [
  { code: 'FRA', name: 'Frankfurt Global Freight Hub', city: 'Frankfurt', country: 'Germany', coordinates: [50.0379, 8.5622] },
  { code: 'JFK', name: 'New York JFK Cargo Terminal', city: 'New York', country: 'United States', coordinates: [40.6413, -73.7781] },
  { code: 'LHR', name: 'London Heathrow World Cargo', city: 'London', country: 'United Kingdom', coordinates: [51.4700, -0.4543] },
  { code: 'NRT', name: 'Tokyo Narita Air Cargo Center', city: 'Tokyo', country: 'Japan', coordinates: [35.772, 140.3929] },
  { code: 'DWC', name: 'Dubai Logistics City Port', city: 'Dubai', country: 'United Arab Emirates', coordinates: [25.2048, 55.2708] },
  { code: 'SIN', name: 'Singapore Changi Airfreight', city: 'Singapore', country: 'Singapore', coordinates: [1.3644, 103.9915] },
  { code: 'CDG', name: 'Paris Charles de Gaulle Cargo', city: 'Paris', country: 'France', coordinates: [49.0097, 2.5479] },
  { code: 'SYD', name: 'Sydney Port Botany Logistics', city: 'Sydney', country: 'Australia', coordinates: [-33.8688, 151.2093] },
  { code: 'HKG', name: 'Hong Kong SuperTerminal 1', city: 'Hong Kong', country: 'Hong Kong', coordinates: [22.3080, 113.9185] },
  { code: 'LAX', name: 'Los Angeles Air Cargo Center', city: 'Los Angeles', country: 'United States', coordinates: [33.9416, -118.4085] },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  shipments,
  emailLogs,
  currentUser,
  onLogout,
  onAddShipment,
  onUpdateShipment,
  onDeleteShipment,
  onViewWaybill,
  onTrackShipment,
  onOpenMailbox,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'emails' | 'personnel' | 'inbox'>('manage');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedShipmentForCheckpoint, setSelectedShipmentForCheckpoint] = useState<Shipment | null>(null);

  // Staff & Personnel State (Admin only)
  const [staffAccounts, setStaffAccounts] = useState<AuthUser[]>([]);
  const refreshStaff = async () => {
    try {
      const res = await apiGet<{ users: AuthUser[] }>('/users');
      setStaffAccounts(res.users);
    } catch (e) {
      showToast(errorMessage(e), 'info');
    }
  };
  useEffect(() => {
    if (currentUser?.role === 'admin') refreshStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffBadge, setNewStaffBadge] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('staff');
  const [newStaffStation, setNewStaffStation] = useState('Frankfurt HQ (FRA-01)');
  const [newStaffPasskey, setNewStaffPasskey] = useState('');

  // Password reset state
  const [selectedOfficerForPasswordReset, setSelectedOfficerForPasswordReset] = useState<string | null>(null);
  const [updatedPasskeyInput, setUpdatedPasskeyInput] = useState('');

  // New Shipment Form State
  const [trackingNumber, setTrackingNumber] = useState(
    'APX-' + Math.floor(100000 + Math.random() * 900000) + '-GL'
  );
  const [serviceType, setServiceType] = useState<ServiceType>('express_air');
  const [originHubCode, setOriginHubCode] = useState('FRA');
  const [destHubCode, setDestHubCode] = useState('JFK');
  
  // Shipper details
  const [senderName, setSenderName] = useState('');
  const [senderCompany, setSenderCompany] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderCity, setSenderCity] = useState('');
  const [senderCountry, setSenderCountry] = useState('Germany');
  const [senderPhone, setSenderPhone] = useState('+49 69 123456');
  const [senderEmail, setSenderEmail] = useState('sender@enterprise.com');

  // Receiver details
  const [receiverName, setReceiverName] = useState('');
  const [receiverCompany, setReceiverCompany] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverCity, setReceiverCity] = useState('');
  const [receiverCountry, setReceiverCountry] = useState('United States');
  const [receiverPhone, setReceiverPhone] = useState('+1 (555) 890-1234');
  const [receiverEmail, setReceiverEmail] = useState('');

  // Cargo specs
  const [cargoWeight, setCargoWeight] = useState('12.5');
  const [cargoPieces, setCargoPieces] = useState('1');
  const [cargoDimensions, setCargoDimensions] = useState('50 x 35 x 25 cm');
  const [cargoType, setCargoType] = useState('High-Value Electronics & Technology');
  const [declaredValue, setDeclaredValue] = useState('$15,000.00');
  const [isInsured, setIsInsured] = useState(true);
  const [carrierNotes, setCarrierNotes] = useState('');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleGenerateTrackingNumber = () => {
    const prefixes = ['APX', 'VEX', 'GLO', 'EXP'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const countryCode = destHubCode === 'JFK' ? 'US' : destHubCode === 'LHR' ? 'GB' : destHubCode === 'NRT' ? 'JP' : 'GL';
    setTrackingNumber(`${randomPrefix}-${randomNum}-${countryCode}`);
  };

  const handleFillQuickDemo = () => {
    setTrackingNumber('APX-' + Math.floor(100000 + Math.random() * 900000) + '-US');
    setSenderName('AeroTech Global Systems');
    setSenderCompany('Munich Aviation Logistics Hub');
    setSenderAddress('Terminalstr. Mitte 18');
    setSenderCity('Munich');
    setSenderCountry('Germany');
    setSenderPhone('+49 89 975 00');
    setSenderEmail('dispatch@aerotech-munich.de');

    setReceiverName('Horizon Data Centers Inc.');
    setReceiverCompany('Pacific Gateway Technology Park');
    setReceiverAddress('800 Silicon Parkway, Suite 400');
    setReceiverCity('San Francisco');
    setReceiverCountry('United States');
    setReceiverPhone('+1 (415) 555-0921');
    setReceiverEmail('supplies@horizondatacenters.com');

    setCargoWeight('24.0');
    setCargoPieces('2');
    setCargoDimensions('60 x 40 x 40 cm');
    setCargoType('Optical Fiber Switching Gear & Server Nodes');
    setDeclaredValue('$38,000.00');
    setIsInsured(true);
    setCarrierNotes('Fragile optical calibration. Keep upright during transit.');
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !receiverName || !receiverEmail) {
      alert('Please fill in required Sender Name, Receiver Name, and Receiver Email.');
      return;
    }
    setIsSaving(true);
    try {
      const { shipment } = await apiPost<{ shipment: Shipment }>('/shipments', {
        trackingNumber,
        serviceType,
        originHubCode,
        destHubCode,
        sendWelcomeEmail,
        sender: { name: senderName, company: senderCompany, address: senderAddress, city: senderCity, country: senderCountry, phone: senderPhone, email: senderEmail },
        receiver: { name: receiverName, company: receiverCompany, address: receiverAddress, city: receiverCity, country: receiverCountry, phone: receiverPhone, email: receiverEmail },
        package: { weight: cargoWeight, pieces: cargoPieces, dimensions: cargoDimensions, cargoType, declaredValue, isInsured, specialHandling: carrierNotes },
      });
      onAddShipment(shipment);
      showToast(
        `Shipment #${shipment.trackingNumber} successfully created! ${
          sendWelcomeEmail ? `Automated dispatch email queued for ${shipment.receiver.email}.` : ''
        }`
      );
      handleGenerateTrackingNumber();
      setActiveTab('manage');
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Display-only: which step the "advance" button will perform. The server enforces the real progression.
  const getNextStatus = (current: ShipmentStatus): { nextStatus: ShipmentStatus; title: string } => {
    const steps: Partial<Record<ShipmentStatus, [ShipmentStatus, string]>> = {
      manifest_created: ['picked_up', 'Consignment Collected by Apex Courier'],
      picked_up: ['received_at_facility', 'Received & Processed at Sorting Hub'],
      received_at_facility: ['in_transit', 'Departed on International Transit Flight'],
      in_transit: ['customs_clearance', 'Customs Clearance Approved & Duty Cleared'],
      customs_clearance: ['out_for_delivery', 'Loaded on Courier Van for Delivery Today'],
      out_for_delivery: ['delivered', 'Delivered & Signed by Recipient'],
    };
    const step = steps[current];
    return step ? { nextStatus: step[0], title: step[1] } : { nextStatus: 'delivered', title: 'Delivered' };
  };

  const handleAdvanceStatus = async (shipment: Shipment) => {
    try {
      const { shipment: updated } = await apiPost<{ shipment: Shipment }>(`/shipments/${shipment.id}/advance`);
      if (updated.status === 'delivered') {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
      onUpdateShipment(updated);
      showToast(`Updated #${shipment.trackingNumber} to "${formatStatusLabel(updated.status)}"! Notification emails queued.`);
    } catch (err) {
      showToast(errorMessage(err), 'info');
    }
  };

  // Add custom checkpoint state
  const [customCheckpointTitle, setCustomCheckpointTitle] = useState('');
  const [customCheckpointLocation, setCustomCheckpointLocation] = useState('');
  const [customCheckpointDesc, setCustomCheckpointDesc] = useState('');
  const [customCheckpointStatus, setCustomCheckpointStatus] = useState<ShipmentStatus>('in_transit');

  const handleAddCustomCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentForCheckpoint || !customCheckpointTitle) return;
    try {
      const { shipment: updated } = await apiPost<{ shipment: Shipment }>(
        `/shipments/${selectedShipmentForCheckpoint.id}/checkpoints`,
        {
          title: customCheckpointTitle,
          location: customCheckpointLocation,
          description: customCheckpointDesc,
          status: customCheckpointStatus,
        }
      );
      onUpdateShipment(updated);
      showToast(`Added checkpoint & queued email alerts for #${updated.trackingNumber}.`);
      setSelectedShipmentForCheckpoint(null);
      setCustomCheckpointTitle('');
      setCustomCheckpointLocation('');
      setCustomCheckpointDesc('');
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  // Filtered shipments
  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.receiver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.receiver.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.originHub.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-amber-500/50 shadow-2xl text-white text-xs font-medium animate-slide-up">
          <div className="p-1 rounded-full bg-amber-500/20 text-amber-400">
            <Send className="w-4 h-4" />
          </div>
          <div>{toastMessage.text}</div>
          <button
            onClick={() => onOpenMailbox()}
            className="ml-2 px-2 py-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 cursor-pointer"
          >
            View In Mailbox &rarr;
          </button>
        </div>
      )}

      {/* Admin Top Navigation & KPI Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {currentUser ? currentUser.roleTitle : 'Operations Control Desk'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Badge: {currentUser ? currentUser.badgeNumber : 'APX-HQ-01'}
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-xs text-emerald-400 font-medium">
              Station: {currentUser ? currentUser.stationLocation : 'Frankfurt HQ (FRA-01)'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Consignment Generator &amp; Dispatch Terminal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create tracking waybills, manage real-time checkpoint progressions, and trigger automated customer email dispatches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            New Consignment
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Active Shipments ({shipments.length})
          </button>

          {currentUser?.role !== 'customs' && (
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inbox'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Inbox className="w-4 h-4 text-amber-400" />
              Customer Inbox
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('personnel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'personnel'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              Staff &amp; Access ({staffAccounts.length})
            </button>
          )}

          <button
            onClick={onOpenMailbox}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-amber-400" />
            <span>Customer Mailbox</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
              {emailLogs.length}
            </span>
          </button>

          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Change your password"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Password</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold transition-colors cursor-pointer"
              title="Lock dispatch terminal session"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Lock Session</span>
            </button>
          )}
        </div>
      </div>

      {showChangePassword && (
        <ChangePasswordModal
          onDone={() => {
            setShowChangePassword(false);
            showToast('Password updated. Other sessions were signed out.');
          }}
          onClose={() => setShowChangePassword(false)}
        />
      )}

      {activeTab === 'inbox' && <StaffInbox />}

      {/* TAB 1: CREATE NEW SHIPMENT GENERATOR */}
      {activeTab === 'create' && (
        <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Generate New Waybill &amp; Tracking Record
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter shipment parameters to generate live tracking numbers and initialize tracking checkpoints.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFillQuickDemo}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                ✨ Load Sample Cargo Details
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateShipment} className="space-y-6">
            {/* Tracking Code & Service Level */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tracking Code (AWB Number) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm uppercase focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateTrackingNumber}
                    title="Generate New Code"
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Service Speed Tier
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="express_air">Apex Express Priority Air (1-2 Days)</option>
                  <option value="priority_ocean">Apex Global Maritime Cargo (10-15 Days)</option>
                  <option value="international_freight">International Heavy Freight (3-5 Days)</option>
                  <option value="cold_chain">Pharma &amp; Cold-Chain Priority (Refrigerated)</option>
                  <option value="same_day_courier">Same-Day Dedicated Diplomatic Courier</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Origin Departure Hub &rarr; Destination Hub
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={originHubCode}
                    onChange={(e) => setOriginHubCode(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  >
                    {GLOBAL_HUBS.map((h) => (
                      <option key={h.code} value={h.code}>
                        {h.code} - {h.city}
                      </option>
                    ))}
                  </select>
                  <select
                    value={destHubCode}
                    onChange={(e) => setDestHubCode(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  >
                    {GLOBAL_HUBS.map((h) => (
                      <option key={h.code} value={h.code}>
                        {h.code} - {h.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2 Columns: Shipper & Consignee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipper Box */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-400 tracking-wider">
                  <User className="w-4 h-4" />
                  Shipper / Sender Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Sender Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Klaus Hoffman"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Company (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. EuroTech Precision"
                      value={senderCompany}
                      onChange={(e) => setSenderCompany(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Sender Address &amp; City</label>
                  <input
                    type="text"
                    placeholder="Street Address, City, Country"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Sender Email</label>
                    <input
                      type="email"
                      placeholder="shipper@company.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Sender Phone</label>
                    <input
                      type="text"
                      placeholder="+49 69 12345"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Consignee Box */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-400 tracking-wider">
                  <User className="w-4 h-4" />
                  Consignee / Receiver Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Receiver Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Sarah Jenkins"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Company (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Mount Sinai Medical"
                      value={receiverCompany}
                      onChange={(e) => setReceiverCompany(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Delivery Address &amp; City</label>
                  <input
                    type="text"
                    placeholder="1425 Madison Ave, New York, NY 10029"
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Customer Notification Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="customer@email.com"
                      value={receiverEmail}
                      onChange={(e) => setReceiverEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Receiver Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (212) 555-0198"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo Specs & Declared Value */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                Cargo Specifications &amp; Handling Instructions
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Gross Weight (kg)</label>
                  <input
                    type="text"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Package Pieces</label>
                  <input
                    type="number"
                    min="1"
                    value={cargoPieces}
                    onChange={(e) => setCargoPieces(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Dimensions (L x W x H)</label>
                  <input
                    type="text"
                    value={cargoDimensions}
                    onChange={(e) => setCargoDimensions(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Declared Value</label>
                  <input
                    type="text"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cargo Classification / Description</label>
                  <input
                    type="text"
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Special Handling / Courier Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Temperature Controlled 2-8°C, Direct Signature"
                    value={carrierNotes}
                    onChange={(e) => setCarrierNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Email automation trigger checkbox */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendWelcomeEmail"
                  checked={sendWelcomeEmail}
                  onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <label htmlFor="sendWelcomeEmail" className="text-xs text-slate-200 cursor-pointer">
                  <strong className="text-amber-400">Automated Dispatch:</strong> Send official booking confirmation email with Air Waybill attachment to <span className="font-mono text-slate-300">{receiverEmail || 'customer email'}</span> immediately.
                </label>
              </div>
              <Mail className="w-5 h-5 text-amber-400 hidden sm:block" />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Issue Waybill &amp; Register Consignment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MANAGE ACTIVE SHIPMENTS */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search tracking, recipient, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              {[
                { id: 'all', label: 'All Statuses' },
                { id: 'out_for_delivery', label: 'Out for Delivery' },
                { id: 'in_transit', label: 'In Transit' },
                { id: 'customs_clearance', label: 'Customs' },
                { id: 'delivered', label: 'Delivered' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Consignments List Cards */}
          <div className="space-y-3">
            {filteredShipments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No shipments match current filters.</p>
              </div>
            ) : (
              filteredShipments.map((shipment) => {
                const color = getStatusColor(shipment.status);
                const nextAction = getNextStatus(shipment.status);

                return (
                  <div
                    key={shipment.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-md"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            onClick={() => onTrackShipment(shipment.trackingNumber)}
                            className="font-mono text-sm font-bold text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{shipment.trackingNumber}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </button>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${color.badgeBg} ${color.text} border ${color.badgeBorder}`}
                          >
                            {formatStatusLabel(shipment.status)}
                          </span>

                          <span className="text-xs text-slate-400 font-medium">
                            {shipment.serviceType.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        {/* Origin -> Dest */}
                        <div className="flex items-center gap-3 text-xs text-slate-300">
                          <span className="font-semibold">{shipment.originHub.city} ({shipment.originHub.code})</span>
                          <span className="text-slate-500">&rarr;</span>
                          <span className="font-semibold text-emerald-400">{shipment.destinationHub.city} ({shipment.destinationHub.code})</span>
                          <span className="text-slate-600">&bull;</span>
                          <span className="text-slate-400">Recipient: <strong className="text-slate-200">{shipment.receiver.name}</strong></span>
                        </div>

                        {/* Current milestone message */}
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="text-slate-500">Latest:</span>
                          <span className="text-slate-300 font-medium">{shipment.statusMessage}</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1-Click Advance Status Button */}
                        {shipment.status !== 'delivered' && (
                          <button
                            onClick={() => handleAdvanceStatus(shipment)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Advance: {formatStatusLabel(nextAction.nextStatus)}</span>
                          </button>
                        )}

                        {/* Add Custom Checkpoint */}
                        <button
                          onClick={() => setSelectedShipmentForCheckpoint(shipment)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Checkpoint
                        </button>

                        {/* View AWB Document */}
                        <button
                          onClick={() => onViewWaybill(shipment)}
                          title="View Official Air Waybill"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          AWB
                        </button>

                        {/* Track in Viewer */}
                        <button
                          onClick={() => onTrackShipment(shipment.trackingNumber)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Open Live Tracking Screen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Delete (Admin Only) */}
                        {(currentUser?.role === 'admin' || currentUser?.permissions?.canDeleteShipments) && (
                          <button
                            onClick={async () => {
                              if (confirm(`Permanently delete shipment #${shipment.trackingNumber}? This cannot be undone.`)) {
                                try {
                                  await apiDelete(`/shipments/${shipment.id}`);
                                  onDeleteShipment(shipment.id);
                                } catch (err) {
                                  alert(errorMessage(err));
                                }
                              }
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Shipment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & PERSONNEL ACCESS MANAGEMENT (ADMIN ONLY) */}
      {activeTab === 'personnel' && currentUser?.role === 'admin' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Authorized Personnel &amp; Terminal Access Control
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage operational accounts, assign logistics station roles, and rotate encrypted security passkeys.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Credentials: {staffAccounts.length} Verified Officers</span>
              </div>
            </div>

            {/* Officer Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {staffAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-sm">
                        {acc.avatarInitials || acc.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{acc.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {acc.username}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        acc.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : acc.role === 'customs'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {acc.role}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-slate-300 font-medium text-[11px]">{acc.roleTitle}</div>
                    <div className="text-slate-500 text-[10px] font-mono">Badge: {acc.badgeNumber}</div>
                    <div className="text-slate-400 text-[10px]">Station: {acc.stationLocation}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Verified Active
                    </span>

                    <button
                      onClick={() => {
                        setSelectedOfficerForPasswordReset(acc.id);
                        setUpdatedPasskeyInput('');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Rotate Passkey</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Change Passkey Form if Selected */}
            {selectedOfficerForPasswordReset && (
              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    <span>Rotate Passkey for Officer ID: {selectedOfficerForPasswordReset}</span>
                  </div>
                  <button
                    onClick={() => setSelectedOfficerForPasswordReset(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="password"
                    placeholder="Enter new secure passkey"
                    value={updatedPasskeyInput}
                    onChange={(e) => setUpdatedPasskeyInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={async () => {
                      if (!updatedPasskeyInput.trim()) {
                        alert('Please enter a valid passkey.');
                        return;
                      }
                      try {
                        await apiPatch(`/users/${selectedOfficerForPasswordReset}`, { password: updatedPasskeyInput });
                        setSelectedOfficerForPasswordReset(null);
                        setUpdatedPasskeyInput('');
                        showToast('Temporary passkey set. The officer must choose a new one at next sign-in.');
                      } catch (err) {
                        alert(errorMessage(err));
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Save New Passkey
                  </button>
                </div>
              </div>
            )}

            {/* Register New Officer Form */}
            <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Register New Dispatch Officer
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newStaffUsername || !newStaffName || !newStaffPasskey) {
                    alert('Please provide username, officer name, and passkey.');
                    return;
                  }
                  try {
                    await apiPost('/users', {
                      username: newStaffUsername.trim().toLowerCase(),
                      name: newStaffName.trim(),
                      badgeNumber: newStaffBadge || undefined,
                      email: newStaffEmail.trim(),
                      password: newStaffPasskey,
                      role: newStaffRole,
                      stationLocation: newStaffStation,
                    });
                    await refreshStaff();
                    setNewStaffUsername('');
                    setNewStaffName('');
                    setNewStaffBadge('');
                    setNewStaffEmail('');
                    setNewStaffPasskey('');
                    showToast(`New officer ${newStaffName} registered. They must change the temporary passkey at first sign-in.`);
                  } catch (err) {
                    alert(errorMessage(err));
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Personnel Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. jmiller"
                      value={newStaffUsername}
                      onChange={(e) => setNewStaffUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Full Officer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Miller"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Department Role *</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="staff">Logistics Controller (Staff)</option>
                      <option value="admin">Operations Director (Admin)</option>
                      <option value="customs">Customs &amp; Border Inspector</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Assigned Station / Hub</label>
                    <input
                      type="text"
                      placeholder="e.g. Tokyo Cargo Port (NRT-03)"
                      value={newStaffStation}
                      onChange={(e) => setNewStaffStation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Officer Email</label>
                    <input
                      type="email"
                      placeholder="officer@globexlogistics.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Security Passkey *</label>
                    <input
                      type="password"
                      required
                      placeholder="Set access passkey"
                      value={newStaffPasskey}
                      onChange={(e) => setNewStaffPasskey(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Register Personnel Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CHECKPOINT MODAL */}
      {selectedShipmentForCheckpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Add Real-time Checkpoint Event
                </h3>
                <p className="text-xs text-amber-400 font-mono">
                  Consignment #{selectedShipmentForCheckpoint.trackingNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedShipmentForCheckpoint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCustomCheckpoint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status Category
                </label>
                <select
                  value={customCheckpointStatus}
                  onChange={(e) => setCustomCheckpointStatus(e.target.value as ShipmentStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  <option value="in_transit">In Transit / Vessel Movement</option>
                  <option value="received_at_facility">Received at Intermediate Sorting Hub</option>
                  <option value="customs_clearance">Customs Inspection / Clearance</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered &amp; Signed</option>
                  <option value="exception_hold">⚠️ Exception / Weather Delay / On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scanned into Regional Courier Depot"
                  value={customCheckpointTitle}
                  onChange={(e) => setCustomCheckpointTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location / Facility Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Terminal 2 Logistics Center, JFK"
                  value={customCheckpointLocation}
                  onChange={(e) => setCustomCheckpointLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Activity Details &amp; Courier Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed notes explaining checkpoint progress..."
                  value={customCheckpointDesc}
                  onChange={(e) => setCustomCheckpointDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>
                  Adding this checkpoint will automatically trigger an email notification to{' '}
                  <strong className="text-white">{selectedShipmentForCheckpoint.receiver.email}</strong>.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedShipmentForCheckpoint(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  Publish Checkpoint &amp; Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
