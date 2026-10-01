import React, { useState } from "react";
import {
  X,
  ScanLine,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  CreditCard,
  Banknote,
  ArrowRight,
  User,
  Wifi,
} from "lucide-react";
import { Customer, Invoice, InternetPackage } from "../../types";
import { formatRupiah } from "../../services/storage";
import { parseCustomerQrPayload } from "../../services/qrUtils";
import { Language } from "../../translations";

interface CashierScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  packages: InternetPackage[];
  invoices: Invoice[];
  onSelectCustomerQr: (customer: Customer) => void;
  onPayInvoiceCash: (invoice: Invoice) => void;
  onOpenPaymentGateway: (invoice: Invoice) => void;
  lang: Language;
}

export const CashierScannerModal: React.FC<CashierScannerModalProps> = ({
  isOpen,
  onClose,
  customers,
  packages,
  invoices,
  onSelectCustomerQr,
  onPayInvoiceCash,
  onOpenPaymentGateway,
  lang,
}) => {
  const [scanInput, setScanInput] = useState("");
  const [scannedCustomer, setScannedCustomer] = useState<Customer | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanningSim, setIsScanningSim] = useState(false);

  if (!isOpen) return null;

  const handleLookup = (query: string) => {
    setScanError(null);
    const parsed = parseCustomerQrPayload(query);

    let targetCust: Customer | undefined;
    if (parsed && parsed.customerId) {
      targetCust = customers.find(
        (c) =>
          c.id === parsed.customerId ||
          c.customerCode.toLowerCase() === parsed.customerCode.toLowerCase()
      );
    }

    if (!targetCust) {
      const q = query.trim().toLowerCase();
      targetCust = customers.find(
        (c) =>
          c.customerCode.toLowerCase() === q ||
          c.id.toLowerCase() === q ||
          c.phone === q ||
          c.name.toLowerCase().includes(q)
      );
    }

    if (targetCust) {
      setScannedCustomer(targetCust);
    } else {
      setScanError("Data pelanggan tidak ditemukan. Pastikan QR code atau kode pelanggan valid.");
    }
  };

  const handleSimulateScan = (customer: Customer) => {
    setIsScanningSim(true);
    setScanInput(customer.customerCode);
    setTimeout(() => {
      setIsScanningSim(false);
      setScannedCustomer(customer);
      setScanError(null);
    }, 500);
  };

  const customerPkg = packages.find((p) => p.id === scannedCustomer?.packageId);
  const unpaidInvoice = scannedCustomer
    ? invoices.find((i) => i.customerId === scannedCustomer.id && (i.status === "unpaid" || i.status === "overdue"))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Scanner Kasir RT/RW Net & Gerbang Pembayaran
              </h3>
              <p className="text-[11px] text-slate-400">
                Pindai QR pelanggan untuk verifikasi tagihan dan penerimaan kasir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Scanner Visual Camera Simulation */}
          <div className="relative p-6 rounded-2xl bg-slate-950 text-white text-center border border-slate-800 overflow-hidden">
            {/* Corner guides */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-indigo-500"></div>
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-indigo-500"></div>
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-indigo-500"></div>
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-indigo-500"></div>

            {/* Red laser animation line */}
            <div className="absolute left-4 right-4 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-bounce"></div>

            <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-2 animate-pulse" />
            <div className="text-[11px] font-medium text-slate-300">
              Arahkan QR Code Kartu Pelanggan ke kamera scanner kasir
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Atau masukkan kode pelanggan di kolom bawah ini
            </div>
          </div>

          {/* Quick Simulation Buttons */}
          <div>
            <label className="text-slate-500 block mb-1.5 font-medium">
              Simulasi Cepat Pindai QR Pelanggan:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {customers.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSimulateScan(c)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 font-medium transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3 h-3 text-indigo-500" />
                  {c.customerCode} - {c.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Search/Input Form */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && scanInput) {
                    handleLookup(scanInput);
                  }
                }}
                placeholder="Paste payload QR atau ketik kode (CUST-001)..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
              />
              <button
                onClick={() => handleLookup(scanInput)}
                disabled={!scanInput || isScanningSim}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                Cari
              </button>
            </div>

            {scanError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}
          </div>

          {/* Scanned Customer Result Card */}
          {scannedCustomer && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {scannedCustomer.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                      {scannedCustomer.customerCode}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    {scannedCustomer.address} • {scannedCustomer.rtRw}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onSelectCustomerQr(scannedCustomer);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  Lihat QR Penuh
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Package & Invoice Status */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Paket Berlangganan</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {customerPkg?.name || "Paket Internet"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Tagihan Saat Ini</div>
                  <div className="font-bold font-mono text-sm text-indigo-600 dark:text-indigo-400">
                    {formatRupiah(unpaidInvoice ? unpaidInvoice.totalAmount : customerPkg?.price || 150000)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {unpaidInvoice ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      onPayInvoiceCash(unpaidInvoice);
                      onClose();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Terima Tunai (Kasir)
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPaymentGateway(unpaidInvoice);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Bayar QRIS / VA
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tidak ada tagihan tertunggak. Pelanggan ini berstatus Lunas!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
