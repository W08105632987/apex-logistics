export type ShipmentStatus =
  | 'manifest_created'
  | 'picked_up'
  | 'received_at_facility'
  | 'in_transit'
  | 'customs_clearance'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception_hold';

export type ServiceType =
  | 'express_air'
  | 'priority_ocean'
  | 'international_freight'
  | 'cold_chain'
  | 'same_day_courier'
  | 'heavy_cargo';

export interface LocationInfo {
  code: string;
  name: string;
  city: string;
  country: string;
  coordinates: [number, number]; // [lat, lng]
}

export interface PartyDetails {
  name: string;
  company?: string;
  address: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

export interface PackageDetails {
  weight: number;
  unit: 'kg' | 'lbs';
  dimensions: string; // e.g. "45 x 30 x 25 cm"
  pieces: number;
  cargoType: string; // e.g. "High-Value Electronics", "Medical Supplies", "Industrial Machinery", "Documents & Contracts"
  declaredValue: string;
  currency: string;
  isInsured: boolean;
  insurancePolicyNumber?: string;
  specialHandling?: string;
  barcodeNumber: string;
}

export interface Checkpoint {
  id: string;
  timestamp: string; // ISO string
  location: string;
  city: string;
  country: string;
  status: ShipmentStatus;
  title: string;
  description: string;
  facilityCode?: string;
  coordinates?: [number, number];
  signedBy?: string;
  completed: boolean;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  referenceNumber?: string;
  serviceType: ServiceType;
  status: ShipmentStatus;
  statusMessage: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  originHub: LocationInfo;
  destinationHub: LocationInfo;
  currentLocation: {
    city: string;
    country: string;
    description: string;
    coordinates: [number, number];
    updatedAt: string;
  };
  sender: PartyDetails;
  receiver: PartyDetails;
  packageDetails: PackageDetails;
  checkpoints: Checkpoint[];
  transportVessel?: {
    type: 'flight' | 'vessel' | 'truck';
    identifier: string; // e.g. "Apex Flight AF-709", "MV Pacific Titan"
    carrier: string;
  };
  customsDetails?: {
    declarationNumber: string;
    status: 'pending' | 'cleared' | 'inspected' | 'exempt';
    dutyAmount?: string;
    clearedDate?: string;
  };
  signatureProof?: {
    signedBy: string;
    timestamp: string;
    relation: string; // e.g. "Recipient Direct", "Authorized Receptionist", "Mailroom"
  };
  assignedCourier?: {
    name: string;
    id: string;
    phone: string;
    vehiclePlate: string;
    rating: number;
  };
  notes?: string;
  tags?: string[];
  subscribers?: string[]; // Email addresses receiving automatic updates
}

export interface EmailLog {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  statusTrigger: ShipmentStatus | 'booking_created' | 'custom_broadcast';
  sentAt: string;
  htmlContent: string;
  status: 'delivered' | 'queued' | 'simulated';
  deliveryStatus?: 'queued' | 'sent' | 'failed' | 'logged';
  lastError?: string;
  isRead?: boolean;
}

export interface ShippingQuoteRequest {
  originCountry: string;
  destinationCountry: string;
  weight: number;
  unit: 'kg' | 'lbs';
  packageType: string;
  declaredValue: number;
  speed: 'standard' | 'express' | 'overnight';
}

export interface ShippingQuoteResult {
  serviceName: string;
  serviceType: ServiceType;
  estimatedDays: string;
  price: number;
  currency: string;
  features: string[];
}

export type StaffRole = 'admin' | 'staff' | 'customs';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: StaffRole;
  roleTitle: string;
  badgeNumber: string;
  stationLocation: string;
  token: string;
  lastLogin: string;
  avatarInitials: string;
  email?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  permissions: {
    canCreateShipments: boolean;
    canUpdateCheckpoints: boolean;
    canDeleteShipments: boolean;
    canBroadcastEmails: boolean;
    canManageStaff: boolean;
    canClearCustoms: boolean;
  };
}

export interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginTime: string | null;
  expiresAt: number | null;
}

export type TabKey = 'track' | 'admin' | 'calculator' | 'services' | 'contact' | 'terms' | 'privacy' | 'security';

export interface QuoteRequestRecord {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  originCountry: string;
  destinationCountry: string;
  weightKg: number;
  cargoCategory: string;
  declaredValue: number | null;
  serviceType: ServiceType | null;
  quotedPrice: number | null;
  currency: string;
  message: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  topic: string;
  trackingNumber: string;
  message: string;
  status: 'new' | 'read' | 'resolved';
  createdAt: string;
  updatedAt: string;
}
