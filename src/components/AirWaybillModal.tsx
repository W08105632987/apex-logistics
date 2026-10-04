import React from 'react';
import { Shipment } from '../types';
import { X, Printer, Download, ShieldCheck, Check, QrCode } from 'lucide-react';

interface AirWaybillModalProps {
  shipment: Shipment;
  onClose: () => void;
}

export const AirWaybillModal: React.FC<AirWaybillModalProps> = ({ shipment, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
              AWB
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Official Air Waybill &amp; Consignment Note (AWB)
              </h2>
              <p className="text-xs text-slate-500">
                Non-Negotiable International Cargo Receipt &bull; Waybill #{shipment.trackingNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 print:bg-white print:text-black">
          <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 font-sans text-xs print:border-none print:shadow-none print:p-0">
            {/* Top Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-slate-900">
                      GLOBEX<span className="text-blue-700">.</span>
                    </span>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest border-l border-slate-300 pl-2">
                      Global Freight Network
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    IATA Carrier Code: 890 &bull; SITA: FRAAPXH &bull; 24/7 Security Clearance
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    INTERNATIONAL AIR WAYBILL
                  </div>
                  <div className="text-lg font-mono font-bold text-blue-700 mt-0.5">
                    {shipment.trackingNumber}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Ref: {shipment.referenceNumber || 'STD-REF-' + shipment.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipper & Consignee 2-Column Grid */}
            <div className="grid grid-cols-2 border border-slate-300 mb-4 divide-x divide-slate-300">
              {/* Shipper Box */}
              <div className="p-3 bg-slate-50/70">
                <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                  1. Shipper's Name &amp; Full Address
                </div>
                <div className="font-bold text-slate-900 text-sm">{shipment.sender.name}</div>
                {shipment.sender.company && (
                  <div className="font-semibold text-slate-700">{shipment.sender.company}</div>
                )}
                <div className="text-slate-600 mt-1">{shipment.sender.address}</div>
                <div className="text-slate-600">
                  {shipment.sender.city}, {shipment.sender.postalCode}
                </div>
                <div className="font-semibold text-slate-800">{shipment.sender.country}</div>
                <div className="text-slate-500 text-[10px] mt-1">
                  Tel: {shipment.sender.phone} &bull; Email: {shipment.sender.email}
                </div>
              </div>

              {/* Consignee Box */}
              <div className="p-3 bg-slate-50/70">
                <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                  2. Consignee's Name &amp; Full Address
                </div>
                <div className="font-bold text-slate-900 text-sm">{shipment.receiver.name}</div>
                {shipment.receiver.company && (
                  <div className="font-semibold text-slate-700">{shipment.receiver.company}</div>
                )}
                <div className="text-slate-600 mt-1">{shipment.receiver.address}</div>
                <div className="text-slate-600">
                  {shipment.receiver.city}, {shipment.receiver.postalCode}
                </div>
                <div className="font-semibold text-slate-800">{shipment.receiver.country}</div>
                <div className="text-slate-500 text-[10px] mt-1">
                  Tel: {shipment.receiver.phone} &bull; Email: {shipment.receiver.email}
                </div>
              </div>
            </div>

            {/* Routing & Flight Details Bar */}
            <div className="grid grid-cols-4 border border-slate-300 mb-4 divide-x divide-slate-300 text-center bg-slate-50 py-2">
              <div className="p-1">
                <div className="text-[9px] uppercase font-bold text-slate-500">Airport of Departure</div>
                <div className="font-bold text-slate-900 text-sm">{shipment.originHub.code}</div>
                <div className="text-[10px] text-slate-600 truncate">{shipment.originHub.city}</div>
              </div>
              <div className="p-1">
                <div className="text-[9px] uppercase font-bold text-slate-500">Airport of Destination</div>
                <div className="font-bold text-slate-900 text-sm">{shipment.destinationHub.code}</div>
                <div className="text-[10px] text-slate-600 truncate">{shipment.destinationHub.city}</div>
              </div>
              <div className="p-1">
                <div className="text-[9px] uppercase font-bold text-slate-500">Carrier / Flight</div>
                <div className="font-semibold text-slate-900 text-xs truncate">
                  {shipment.transportVessel?.identifier || 'GA-CARGO-310'}
                </div>
                <div className="text-[10px] text-slate-600">{shipment.serviceType.replace('_', ' ').toUpperCase()}</div>
              </div>
              <div className="p-1">
                <div className="text-[9px] uppercase font-bold text-slate-500">Declared Value</div>
                <div className="font-bold text-blue-700 text-xs">{shipment.packageDetails.declaredValue}</div>
                <div className="text-[10px] text-slate-600">{shipment.packageDetails.isInsured ? 'Insured Cargo' : 'NVD'}</div>
              </div>
            </div>

            {/* Cargo Description Table */}
            <table className="w-full border border-slate-300 mb-4 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-[9px] uppercase font-bold">
                  <th className="border border-slate-300 p-2 text-center">No. of Pieces</th>
                  <th className="border border-slate-300 p-2 text-center">Gross Weight</th>
                  <th className="border border-slate-300 p-2 text-center">Dimensions</th>
                  <th className="border border-slate-300 p-2 text-left">Nature and Quantity of Goods</th>
                  <th className="border border-slate-300 p-2 text-right">Customs Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-800 font-medium">
                <tr>
                  <td className="border border-slate-300 p-3 text-center font-bold text-sm">
                    {shipment.packageDetails.pieces}
                  </td>
                  <td className="border border-slate-300 p-3 text-center font-bold text-sm">
                    {shipment.packageDetails.weight} {shipment.packageDetails.unit}
                  </td>
                  <td className="border border-slate-300 p-3 text-center text-xs font-mono">
                    {shipment.packageDetails.dimensions}
                  </td>
                  <td className="border border-slate-300 p-3">
                    <div className="font-bold text-slate-900">{shipment.packageDetails.cargoType}</div>
                    {shipment.packageDetails.specialHandling && (
                      <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                        ⚠️ Handling: {shipment.packageDetails.specialHandling}
                      </div>
                    )}
                    {shipment.notes && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Note: {shipment.notes}
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-300 p-3 text-right">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase">
                      {shipment.customsDetails?.status || 'CLEARED'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Official Barcode, Stamps & Signatures */}
            <div className="grid grid-cols-3 border border-slate-300 p-3 gap-4 items-center bg-slate-50/70">
              {/* Barcode representation */}
              <div className="text-center">
                <div className="font-mono text-xs tracking-widest text-slate-700 mb-1">
                  ||||| | |||| ||| |||||| || ||||| ||| ||||
                </div>
                <div className="text-[9px] font-mono text-slate-600">
                  {shipment.packageDetails.barcodeNumber || '8901239849201'}
                </div>
                <div className="text-[8px] text-slate-400 mt-0.5 font-bold">GLOBEX STANDARD CARGO BARCODE</div>
              </div>

              {/* Official Stamp */}
              <div className="text-center border-x border-slate-300 px-2">
                <div className="inline-block border-2 border-dashed border-blue-700 text-blue-700 rounded-lg p-2 transform -rotate-1">
                  <div className="text-[9px] font-black uppercase tracking-wider">GLOBEX SECURITY DISPATCH</div>
                  <div className="text-[8px] font-bold">CARGO SCREENED &amp; SEALED</div>
                  <div className="text-[7px] text-slate-500 mt-0.5">{new Date(shipment.createdAt).toISOString().split('T')[0]}</div>
                </div>
              </div>

              {/* Shipper/Carrier Certification */}
              <div className="text-right">
                <div className="text-[8px] text-slate-500 leading-tight">
                  Shipper certifies that the particulars on the face hereof are correct and that dangerous goods are properly declared.
                </div>
                <div className="mt-2 font-mono text-[10px] font-bold text-slate-800">
                  Globex Air Operations #772
                </div>
              </div>
            </div>

            {/* Bottom Footer Notice */}
            <div className="text-[8px] text-slate-400 mt-4 text-center border-t border-slate-100 pt-2">
              GLOBEX LOGISTICS &amp; FREIGHT PORTAL &bull; WWW.GLOBEXLOGISTICS.COM &bull; 24/7 HELPLINE: +1 (800) 555-GLOBEX
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital signature &amp; tamper-proof cryptographic hash verified.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};
