import { ShipmentStatus } from '../types';

export function getStatusColor(status: ShipmentStatus): {
  bg: string;
  text: string;
  badgeBg: string;
  badgeBorder: string;
  hex: string;
} {
  switch (status) {
    case 'delivered':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        badgeBg: 'bg-emerald-100',
        badgeBorder: 'border-emerald-200',
        hex: '#059669',
      };
    case 'out_for_delivery':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        badgeBg: 'bg-blue-100',
        badgeBorder: 'border-blue-200',
        hex: '#1d4ed8',
      };
    case 'in_transit':
    case 'received_at_facility':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        badgeBg: 'bg-sky-100',
        badgeBorder: 'border-sky-200',
        hex: '#0284c7',
      };
    case 'customs_clearance':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        badgeBg: 'bg-purple-100',
        badgeBorder: 'border-purple-200',
        hex: '#7e22ce',
      };
    case 'exception_hold':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        badgeBg: 'bg-rose-100',
        badgeBorder: 'border-rose-200',
        hex: '#e11d48',
      };
    case 'manifest_created':
    case 'picked_up':
    default:
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        badgeBg: 'bg-blue-100',
        badgeBorder: 'border-blue-200',
        hex: '#1d4ed8',
      };
  }
}

export function formatStatusLabel(status: ShipmentStatus): string {
  switch (status) {
    case 'manifest_created':
      return 'Manifest Created & Registered';
    case 'picked_up':
      return 'Consignment Collected';
    case 'received_at_facility':
      return 'Received at Sorting Hub';
    case 'in_transit':
      return 'In Global Transit';
    case 'customs_clearance':
      return 'Customs Cleared & Processed';
    case 'out_for_delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered & Signed';
    case 'exception_hold':
      return 'Exception / On Hold';
    default:
      return status;
  }
}

// Email generation and delivery now happen on the server (server/email.mjs).
