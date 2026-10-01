import React, { useState } from "react";
import {
  Wifi,
  Receipt,
  CreditCard,
  Phone,
  Bot,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Download,
  Share2,
  Lock,
  RotateCw,
  Clock,
  Sparkles,
  QrCode,
} from "lucide-react";
import { Customer, Invoice, InternetPackage, PaymentMethod } from "../../types";
import { formatRupiah, generateWhatsAppLink } from "../../services/storage";
import { Language, translations } from "../../translations";
import { CustomerQrModal } from "../customers/CustomerQrModal";
import { StaticQrisCard } from "./StaticQrisCard";
import { CustomerTransactionHistory } from "./CustomerTransactionHistory";

interface CustomerPortalProps {
  customer: Customer;
  currentPackage?: InternetPackage;
  invoices: Invoice[];
  onOpenPaymentModal: (invoice: Invoice) => void;
  onOpenPrintModal: (invoice: Invoice) => void;
  onOpenAiChat: () => void;
  onSimulateDirectPayment?: (invoice: Invoice) => void;
  lang: Language;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customer,
  currentPackage,
  invoices,
  onOpenPaymentModal,
  onOpenPrintModal,
  onOpenAiChat,
  onSimulateDirectPayment,
  lang,
}) => {
  const t = translations[lang];
  const [isRestartingModem, setIsRestartingModem] = useState(false);
  const [modemRestarted, setModemRestarted] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
  const activeInvoice = customerInvoices.find(
    (i) => i.status === "unpaid" || i.status === "overdue"
  );
  const paidInvoices = customerInvoices.filter((i) => i.status === "paid");

  const handleSimulateModemRestart = () => {
    setIsRestartingModem(true);
    setTimeout(() => {
      setIsRestartingModem(false);
      setModemRestarted(true);
      setTimeout(() => setModemRestarted(false), 4000);
    }, 2000);
  };

  const handleContactAdminWA = () => {
    const text = `Halo Admin NetLancar, saya ${customer.name} (Kode: ${customer.customerCode}). Saya ingin menanyakan layanan internet saya.`;
    window.open(generateWhatsAppLink("081287654321", text), "_blank");
  };

  return (
    <div id="customer-portal-view" className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Welcome Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold">
                {t.portalTitle}
              </span>
              <span className="text-white/70 text-xs font-mono">{customer.customerCode}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">Halo, {customer.name}</h2>
            <p className="text-xs text-indigo-100">
              Alamat: {customer.address} ({customer.rtRw})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-white" />
              QR Bayar Kasir
            </button>
            <button
              onClick={onOpenAiChat}
              className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              Tanya NetLancar AI
            </button>
            <button
              onClick={handleContactAdminWA}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Bantuan WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Isolation Warning Alert if isolated */}
      {customer.status === "isolated" && (
        <div className="p-4 rounded-2xl bg-rose-500 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 animate-bounce shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Layanan Anda Sedang Diisolir Sementara</h4>
              <p className="text-xs text-rose-100">
                Silakan lakukan pelunasan tagihan melalui QRIS atau Virtual Account di bawah ini untuk membuka isolir otomatis dalam 1 menit.
              </p>
            </div>
          </div>
          {activeInvoice && (
            <button
              onClick={() => onOpenPaymentModal(activeInvoice)}
              className="px-4 py-2 rounded-xl bg-white text-rose-600 font-bold text-xs hover:bg-rose-50 shadow-md shrink-0"
            >
              Bayar Sekarang
            </button>
          )}
        </div>
      )}

      {/* Visual Component: Static QRIS in Customer Profile */}
      <StaticQrisCard
        customer={customer}
        currentPackage={currentPackage}
        activeInvoice={activeInvoice || null}
        onSimulatePay={(inv) => {
          if (onSimulateDirectPayment) {
            onSimulateDirectPayment(inv);
          } else {
            onOpenPaymentModal(inv);
          }
        }}
        lang={lang}
      />

      {/* Main Grid: Subscription Info & Active Invoice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Package & Modem Info */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-indigo-500" />
              Paket Internet Anda
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                customer.status === "active"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              }`}
            >
              Status: {customer.status}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Nama Paket</div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                {currentPackage?.name || "Paket Standar"}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                Kecepatan: {currentPackage?.speedDownload} Mbps Download / {currentPackage?.speedUpload} Mbps Upload
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Biaya Bulanan</div>
              <div className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {formatRupiah(currentPackage?.price || 150000)}
              </div>
              <div className="text-[10px] text-slate-400">Unlimited Tanpa Kuota</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">IP Address Perangkat</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {customer.ipAddress}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">PPPoE Username</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {customer.pppoeUsername}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Model Modem Router</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {customer.ontModel}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Tanggal Jatuh Tempo</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Setiap Tanggal {customer.dueDate}
              </span>
            </div>
          </div>

          <button
            onClick={handleSimulateModemRestart}
            disabled={isRestartingModem}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRestartingModem ? "animate-spin text-indigo-600" : ""}`} />
            {isRestartingModem
              ? "Mengirim Sinyal Restart ke OLT..."
              : modemRestarted
              ? "Sinyal Reset Berhasil Dikirim! ✅"
              : "Restart Modem Jarak Jauh (Reboot)"}
          </button>
        </div>

        {/* Active Bill & Payment */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-500" />
              Tagihan Aktif Bulan Ini
            </h3>
            {activeInvoice && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase">
                Menunggu Pembayaran
              </span>
            )}
          </div>

          {activeInvoice ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Invoice</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {activeInvoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Periode Pemakaian</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeInvoice.periodMonth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jatuh Tempo</span>
                  <span className="font-medium text-rose-600">{activeInvoice.dueDate}</span>
                </div>
                <div className="pt-2 border-t border-amber-500/20 flex justify-between items-baseline">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Total Tagihan:</span>
                  <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                    {formatRupiah(activeInvoice.totalAmount)}
                  </span>
                </div>
              </div>

              <button
                id="portal-pay-now-btn"
                onClick={() => onOpenPaymentModal(activeInvoice)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                Bayar Sekarang (QRIS / VA Mandiri / BCA)
              </button>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Tunjukkan QR Tagihan ke Kasir RT/RW
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Tidak Ada Tagihan Tertunggak
              </h4>
              <p className="text-xs text-slate-500">
                Terima kasih! Semua tagihan internet Anda untuk periode ini telah lunas.
              </p>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                Tampilkan QR Kartu Warga Tetap
              </button>
            </div>
          )}

          {/* Quick FAQ / Tips */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              💡 Tips Koneksi Lancar:
            </span>
            <p>• Letakkan modem router di tempat terbuka, minimal 1 meter dari lantai.</p>
            <p>• Jika internet terasa lambat, coba matikan WiFi di HP Anda selama 10 detik lalu sambungkan kembali.</p>
          </div>
        </div>
      </div>

      {/* Customer Transaction History Component (Chronological & Detailed) */}
      <CustomerTransactionHistory
        customer={customer}
        invoices={invoices}
        onOpenPrintModal={onOpenPrintModal}
        onOpenPaymentModal={onOpenPaymentModal}
        lang={lang}
      />

      {/* Customer QR Modal */}
      <CustomerQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        customer={customer}
        packageInfo={currentPackage}
        activeInvoice={activeInvoice || null}
        lang={lang}
        onOpenPaymentGateway={(inv) => {
          setIsQrModalOpen(false);
          onOpenPaymentModal(inv);
        }}
      />
    </div>
  );
};
