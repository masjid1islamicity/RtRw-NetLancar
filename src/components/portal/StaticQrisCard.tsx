import React, { useEffect, useState } from "react";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Customer, InternetPackage, Invoice } from "../../types";
import { formatRupiah, generateWhatsAppLink } from "../../services/storage";
import { generateQrDataUrl, generateStaticQrisPayload } from "../../services/qrUtils";
import { Language } from "../../translations";

interface StaticQrisCardProps {
  customer: Customer;
  currentPackage?: InternetPackage;
  activeInvoice?: Invoice | null;
  onSimulatePay?: (invoice: Invoice) => void;
  lang: Language;
}

export const StaticQrisCard: React.FC<StaticQrisCardProps> = ({
  customer,
  currentPackage,
  activeInvoice,
  onSimulatePay,
  lang,
}) => {
  const [qrisUrl, setQrisUrl] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const monthlyPrice = currentPackage?.price || 150000;
  const transferNote = `NETLANCAR-${customer.customerCode}`;

  useEffect(() => {
    const payload = generateStaticQrisPayload(customer.customerCode, "NETLANCAR RT-RW NET");
    generateQrDataUrl(payload, { width: 340, darkColor: "#0f172a" }).then((url) => {
      setQrisUrl(url);
    });
  }, [customer.customerCode]);

  const handleCopyNote = () => {
    navigator.clipboard.writeText(transferNote);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadQris = () => {
    if (!qrisUrl) return;
    const link = document.createElement("a");
    link.href = qrisUrl;
    link.download = `QRIS_Statis_NetLancar_${customer.customerCode}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSendProofWA = () => {
    const amountStr = formatRupiah(activeInvoice ? activeInvoice.totalAmount : monthlyPrice);
    const message = `Halo Admin NetLancar RT/RW Net,\n\nSaya ${customer.name} (Kode Pelanggan: ${customer.customerCode}) telah melakukan transfer via *QRIS Statis* sebesar *${amountStr}*.\n\nBerikut bukti transaksi dari aplikasi m-banking / e-wallet saya. Mohon dibantu verifikasi dan aktivasi sistem. Terima kasih!`;
    window.open(generateWhatsAppLink("081287654321", message), "_blank");
  };

  const handleSimulateInstantVerify = () => {
    if (!activeInvoice) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      if (onSimulatePay) {
        onSimulatePay(activeInvoice);
      }
    }, 1000);
  };

  return (
    <div
      id="static-qris-profile-card"
      className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/90 border-2 border-indigo-100 dark:border-indigo-950/60 shadow-lg space-y-5 relative overflow-hidden"
    >
      {/* Top Accent Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
              QRIS Statis
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
              Tanpa Pilih Invoice
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Pembayaran Cepat QRIS Pelanggan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scan langsung dari aplikasi m-Banking atau E-Wallet apa pun tanpa perlu memilih tagihan secara manual.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-right">
          <div className="hidden sm:block">
            <div className="text-[10px] text-slate-400">Nominal Tagihan Paket</div>
            <div className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
              {formatRupiah(monthlyPrice)} / bln
            </div>
          </div>
        </div>
      </div>

      {/* Main QRIS Layout: QR Display & Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left / Center QR Plate */}
        <div className="md:col-span-5 flex flex-col items-center">
          {/* Authentic QRIS Box Frame */}
          <div className="w-full max-w-[240px] bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-md flex flex-col items-center text-center relative">
            {/* Header Brand Bar */}
            <div className="w-full pb-2 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-rose-600 tracking-tight">QRIS</span>
                <span className="text-[8px] text-slate-500 font-semibold leading-none">
                  Standar Pembayaran Nasional
                </span>
              </div>
              <span className="text-[7px] font-bold text-slate-400">ASPI / BI</span>
            </div>

            {/* QR Image */}
            <div className="relative my-3 p-1 bg-white rounded-xl">
              {qrisUrl ? (
                <img
                  src={qrisUrl}
                  alt={`QRIS Statis ${customer.name}`}
                  className="w-48 h-48 rounded-lg mx-auto object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400">
                  <span className="text-xs animate-pulse">Memuat QRIS...</span>
                </div>
              )}

              {/* Center Logo Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-white px-1.5 py-0.5 rounded text-[8px] font-black text-rose-600 border border-rose-200 shadow-xs">
                  QRIS
                </span>
              </div>
            </div>

            {/* Merchant Details */}
            <div className="w-full pt-1.5 border-t border-slate-100 space-y-0.5">
              <div className="text-[10px] font-black text-slate-800 tracking-tight uppercase">
                NETLANCAR RT/RW NET
              </div>
              <div className="text-[8px] text-slate-400 font-mono">NMID: ID1020023456789</div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={handleDownloadQris}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-indigo-500" />
              Unduh QRIS (PNG)
            </button>
          </div>
        </div>

        {/* Right: Payment Instructions, Transfer Note, and Verification */}
        <div className="md:col-span-7 space-y-3.5 text-xs">
          {/* How to Pay Steps */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Cara Membayar Menggunakan QRIS Statis:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              <li>
                Buka aplikasi perbankan (BCA, Mandiri Livin, BRImo, BNI) atau E-Wallet (GoPay, OVO, DANA, ShopeePay).
              </li>
              <li>
                Pilih menu <strong className="font-bold text-slate-800 dark:text-slate-200">Scan QRIS</strong> dan arahkan kamera ke kode di sebelah kiri.
              </li>
              <li>
                Ketik nominal tagihan: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(monthlyPrice)}</span>.
              </li>
              <li>
                Sertakan kode pelanggan <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{customer.customerCode}</span> pada kolom catatan transaksi.
              </li>
            </ol>
          </div>

          {/* Transfer Reference Box */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400">Catatan Transfer / Berita:</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                {transferNote}
              </div>
            </div>
            <button
              onClick={handleCopyNote}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? "Tersalin" : "Salin Catatan"}</span>
            </button>
          </div>

          {/* Supported Apps Badges */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 mb-1.5">
              Mendukung Seluruh Pembayaran Indonesia (BI-QRIS):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["BCA", "Mandiri Livin", "BRImo", "BNI", "GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"].map(
                (brand) => (
                  <span
                    key={brand}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-400"
                  >
                    {brand}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Quick Confirmation Actions */}
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendProofWA}
              className="flex-1 min-w-[150px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Kirim Bukti Bayar via WA
            </button>

            {activeInvoice && activeInvoice.status !== "paid" && !verifiedSuccess && (
              <button
                onClick={handleSimulateInstantVerify}
                disabled={isVerifying}
                className="py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {isVerifying ? "Memverifikasi..." : "Verifikasi Otomatis"}
              </button>
            )}

            {verifiedSuccess && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pembayaran Berhasil Diverifikasi!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
