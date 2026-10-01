import React, { useEffect, useState } from "react";
import {
  X,
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  CreditCard,
  Building2,
  CheckCircle2,
  Sparkles,
  Wifi,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  ScanLine,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Customer, Invoice, InternetPackage, PaymentMethod } from "../../types";
import { formatRupiah } from "../../services/storage";
import { generateCustomerQrPayload, generateQrDataUrl, generateStaticQrisPayload } from "../../services/qrUtils";
import { Language } from "../../translations";

interface CustomerQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  packageInfo?: InternetPackage;
  activeInvoice?: Invoice | null;
  lang: Language;
  onProcessCashPayment?: (invoice: Invoice) => void;
  onOpenPaymentGateway?: (invoice: Invoice) => void;
}

export const CustomerQrModal: React.FC<CustomerQrModalProps> = ({
  isOpen,
  onClose,
  customer,
  packageInfo,
  activeInvoice,
  lang,
  onProcessCashPayment,
  onOpenPaymentGateway,
}) => {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [qrMode, setQrMode] = useState<"billing" | "static_qris" | "identity">("billing");
  const [copied, setCopied] = useState(false);
  const [isSimulatingCashier, setIsSimulatingCashier] = useState(false);
  const [cashierPaidSuccess, setCashierPaidSuccess] = useState(false);

  useEffect(() => {
    if (!customer || !isOpen) return;

    let payloadString = "";
    if (qrMode === "billing") {
      payloadString = generateCustomerQrPayload(
        customer,
        packageInfo,
        activeInvoice || undefined
      );
    } else if (qrMode === "static_qris") {
      payloadString = generateStaticQrisPayload(
        customer.customerCode,
        "NETLANCAR RT-RW NET"
      );
    } else {
      payloadString = JSON.stringify({
        type: "NETLANCAR_MEMBER_ID",
        version: "1.0",
        customerId: customer.id,
        customerCode: customer.customerCode,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        rtRw: customer.rtRw,
        package: packageInfo?.name || "Paket Internet",
      });
    }

    generateQrDataUrl(payloadString, { width: 340, darkColor: "#0f172a" }).then(
      (url) => {
        setQrUrl(url);
      }
    );
  }, [customer, packageInfo, activeInvoice, qrMode, isOpen]);

  if (!isOpen || !customer) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(customer.customerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `QRCode_NetLancar_${customer.customerCode}_${customer.name.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintCard = () => {
    window.print();
  };

  const handleSimulateCashierPay = () => {
    if (!activeInvoice) return;
    setIsSimulatingCashier(true);
    setTimeout(() => {
      setIsSimulatingCashier(false);
      setCashierPaidSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      if (onProcessCashPayment) {
        onProcessCashPayment(activeInvoice);
      }
    }, 900);
  };

  const billAmount = activeInvoice ? activeInvoice.totalAmount : packageInfo?.price || 150000;
  const isPaid = activeInvoice?.status === "paid" || cashierPaidSuccess;

  return (
    <div
      id="customer-qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in"
    >
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-xs">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  QR Unik Kasir & Gate
                </span>
                <span className="text-[11px] font-mono opacity-80">{customer.customerCode}</span>
              </div>
              <h3 className="font-extrabold text-base leading-tight mt-0.5">
                {customer.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Mode Tabs */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px]">
            <button
              onClick={() => setQrMode("billing")}
              className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                qrMode === "billing"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Tagihan Kasir
            </button>
            <button
              onClick={() => setQrMode("static_qris")}
              className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                qrMode === "static_qris"
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              QRIS Statis
            </button>
            <button
              onClick={() => setQrMode("identity")}
              className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                qrMode === "identity"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              ID Warga
            </button>
          </div>

          {/* QR Container Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-3 relative">
            <div className="relative inline-block mx-auto p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR Code ${customer.name}`}
                  className="w-48 h-48 rounded-lg mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                  <ScanLine className="w-8 h-8 animate-pulse" />
                </div>
              )}

              {/* Center Logo/Label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {qrMode === "static_qris" ? (
                  <span className="bg-white px-1.5 py-0.5 rounded text-[8px] font-black text-rose-600 border border-rose-200 shadow-xs">
                    QRIS
                  </span>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black shadow-md border-2 border-white">
                    NL
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                  {customer.customerCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                  title="Salin Kode Pelanggan"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {qrMode === "static_qris"
                  ? "QRIS Statis Toko/Merchant: Dapat di-scan oleh pelanggan dari m-Banking atau E-Wallet apa pun tanpa perlu memilih invoice."
                  : qrMode === "billing"
                  ? "Scan QR ini di loket kasir RT/RW atau gerbang pembayaran untuk verifikasi tagihan instan."
                  : "QR identitas keanggotaan tetap warga RT/RW Net untuk verifikasi staf & kasir."}
              </p>
            </div>
          </div>

          {/* Billing & Subscription Info */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                Paket Berlangganan:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {packageInfo?.name || "Paket Warga Hemat"}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Status Tagihan Bulan Ini:
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {isPaid ? "Lunas" : "Belum Dibayar"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-slate-500 font-medium">Nominal Tagihan:</span>
              <span className="text-sm font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {formatRupiah(billAmount)}
              </span>
            </div>
          </div>

          {/* Cashier Direct Action Simulation */}
          {!isPaid && activeInvoice && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                <ScanLine className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Simulasi Loket Kasir RT/RW (Scan Terdeteksi)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={handleSimulateCashierPay}
                  disabled={isSimulatingCashier}
                  className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isSimulatingCashier ? "Memproses..." : "Terima Tunai di Kasir"}
                </button>

                {onOpenPaymentGateway && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPaymentGateway(activeInvoice);
                    }}
                    className="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Buka QRIS / VA
                  </button>
                )}
              </div>
            </div>
          )}

          {isPaid && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tagihan periode ini telah lunas tercatat di sistem kasir.</span>
            </div>
          )}

          {/* Download & Print Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleDownloadQr}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              Unduh QR (PNG)
            </button>
            <button
              onClick={handlePrintCard}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Cetak Kartu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
