import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  QrCode,
  Clock,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Smartphone,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  RefreshCw,
  Radio,
  Zap,
  CheckCircle,
  Building,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Invoice, PaymentMethod } from "../../types";
import { formatRupiah } from "../../services/storage";
import {
  generateDynamicQrisPayload,
  generateQrDataUrl,
  getUniquePaymentCode,
} from "../../services/qrUtils";
import { Language } from "../../translations";

interface DynamicQrisPaymentProps {
  invoice: Invoice;
  onPaymentSuccess: (invId: string, method: PaymentMethod, ref: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  lang: Language;
}

export const DynamicQrisPayment: React.FC<DynamicQrisPaymentProps> = ({
  invoice,
  onPaymentSuccess,
  isProcessing,
  setIsProcessing,
  lang,
}) => {
  // Unique Nominal Calculation State
  const [seedOffset, setSeedOffset] = useState<number>(0);
  const uniqueCode = getUniquePaymentCode(invoice.id, seedOffset);
  const totalAmountWithUnique = invoice.totalAmount + uniqueCode;

  // QR State
  const [qrisUrl, setQrisUrl] = useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60); // 15 mins validity
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedInvoiceNo, setCopiedInvoiceNo] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string>("bca");
  const [simulatedBank, setSimulatedBank] = useState<string>("BCA Mobile");

  // Auto-Reconcile Live State
  const [reconcileState, setReconcileState] = useState<"listening" | "matching" | "settled">("listening");
  const [matchedMutation, setMatchedMutation] = useState<{
    bank: string;
    amount: number;
    reference: string;
    timestamp: string;
  } | null>(null);

  const isPollingRef = useRef<boolean>(true);
  const hasSettledRef = useRef<boolean>(false);

  // 1. Generate Dynamic QRIS payload whenever unique amount or invoice changes
  useEffect(() => {
    if (!invoice) return;

    const payload = generateDynamicQrisPayload(invoice, "NETLANCAR RT-RW NET", {
      customAmount: totalAmountWithUnique,
      uniqueCode,
    });

    generateQrDataUrl(payload, {
      width: 380,
      darkColor: "#0f172a",
      lightColor: "#ffffff",
    }).then((url) => {
      setQrisUrl(url);
    });

    // Register active QRIS session with backend for auto-reconcile
    fetch("/api/payment-gateway/qris/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        baseAmount: invoice.totalAmount,
        uniqueCode,
      }),
    }).catch(() => {
      // Offline fallback: handled in client
    });

    // Reset countdown
    setSecondsRemaining(15 * 60);
    setReconcileState("listening");
    hasSettledRef.current = false;
    isPollingRef.current = true;
  }, [invoice, totalAmountWithUnique, uniqueCode]);

  // 2. Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // 3. Auto-Reconcile Polling Loop (checks if incoming bank mutation matched)
  const pollSessionStatus = useCallback(async () => {
    if (!isPollingRef.current || hasSettledRef.current) return;

    try {
      const res = await fetch(`/api/payment-gateway/qris/session/${invoice.id}`);
      const data = await res.json();

      if (data?.session?.status === "SETTLED" && !hasSettledRef.current) {
        hasSettledRef.current = true;
        isPollingRef.current = false;

        const mut = data.session.matchedMutation || {
          bank: "QRIS National Switch",
          referenceNumber: `QRIS-AUTO-${Date.now().toString().slice(-8)}`,
          amountMatched: totalAmountWithUnique,
          matchedAt: new Date().toISOString(),
        };

        setMatchedMutation({
          bank: mut.bank,
          amount: mut.amountMatched || totalAmountWithUnique,
          reference: mut.referenceNumber,
          timestamp: mut.matchedAt || new Date().toISOString(),
        });

        setReconcileState("settled");

        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if not supported
        }

        setTimeout(() => {
          onPaymentSuccess(invoice.id, "QRIS", mut.referenceNumber);
        }, 1600);
      }
    } catch {
      // offline silent polling
    }
  }, [invoice.id, onPaymentSuccess, totalAmountWithUnique]);

  useEffect(() => {
    const poller = setInterval(() => {
      pollSessionStatus();
    }, 2500);

    return () => clearInterval(poller);
  }, [pollSessionStatus]);

  // Handle regenerating a different unique code
  const handleRegenerateUniqueCode = () => {
    setSeedOffset((prev) => prev + Math.floor(Math.random() * 50) + 1);
  };

  // Copy exact total amount
  const handleCopyAmount = () => {
    navigator.clipboard.writeText(totalAmountWithUnique.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // Copy invoice number
  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoice.invoiceNumber);
    setCopiedInvoiceNo(true);
    setTimeout(() => setCopiedInvoiceNo(false), 2000);
  };

  // Download QR
  const handleDownloadQrImage = () => {
    if (!qrisUrl) return;
    const link = document.createElement("a");
    link.href = qrisUrl;
    link.download = `QRIS_Dinamis_${invoice.invoiceNumber}_Rp${totalAmountWithUnique}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // 4. Trigger incoming bank mutation simulation (auto-reconciliation)
  const handleTriggerSimulatedBankMutation = async () => {
    setIsProcessing(true);
    setReconcileState("matching");

    try {
      const res = await fetch("/api/payment-gateway/qris/simulate-reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          bank: simulatedBank,
          customRef: `QRIS-REC-${Date.now().toString().slice(-8)}`,
        }),
      });

      const data = await res.json().catch(() => null);
      const refNumber =
        data?.session?.matchedMutation?.referenceNumber ||
        `QRIS-REC-${Date.now().toString().slice(-8)}`;

      setTimeout(() => {
        setIsProcessing(false);
        hasSettledRef.current = true;
        isPollingRef.current = false;

        setMatchedMutation({
          bank: simulatedBank,
          amount: totalAmountWithUnique,
          reference: refNumber,
          timestamp: new Date().toISOString(),
        });

        setReconcileState("settled");

        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        setTimeout(() => {
          onPaymentSuccess(invoice.id, "QRIS", refNumber);
        }, 1600);
      }, 900);
    } catch {
      // Fallback simulation
      setTimeout(() => {
        setIsProcessing(false);
        hasSettledRef.current = true;
        isPollingRef.current = false;

        const refNumber = `QRIS-OFFLINE-${Date.now().toString().slice(-8)}`;
        setMatchedMutation({
          bank: simulatedBank,
          amount: totalAmountWithUnique,
          reference: refNumber,
          timestamp: new Date().toISOString(),
        });

        setReconcileState("settled");

        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {
          // ignore
        }

        setTimeout(() => {
          onPaymentSuccess(invoice.id, "QRIS", refNumber);
        }, 1400);
      }, 800);
    }
  };

  const appGuides: Record<string, { name: string; steps: string[] }> = {
    bca: {
      name: "BCA Mobile / myBCA",
      steps: [
        "Buka BCA Mobile / myBCA, pilih menu QRIS.",
        "Pindai kode QRIS Dinamis di layar atau unggah dari galeri.",
        `Nominal Rp ${totalAmountWithUnique.toLocaleString("id-ID")} otomatis terkunci pas hingga digit unik #${uniqueCode}.`,
        "Konfirmasi dan masukkan PIN m-BCA. Sistem langsung mengenali mutasi secara instan tanpa input referensi.",
      ],
    },
    mandiri: {
      name: "Livin' by Mandiri",
      steps: [
        "Buka Livin' by Mandiri, tekan tombol QR Bayar di beranda.",
        "Scan QRIS Dinamis NetLancar.",
        `Total nominal Rp ${totalAmountWithUnique.toLocaleString("id-ID")} otomatis terisi tanpa perlu ketik manual.`,
        "Masukkan PIN Livin'. Tagihan otomatis lunas dalam hitungan detik.",
      ],
    },
    brimo: {
      name: "BRImo (Bank BRI)",
      steps: [
        "Login ke aplikasi BRImo, pilih fitur QRIS di navigasi utama.",
        "Arahkan kamera ke QRIS di layar ini.",
        `Nominal tagihan terkunci di Rp ${totalAmountWithUnique.toLocaleString("id-ID")}.`,
        "Selesaikan transaksi dengan PIN BRImo Anda.",
      ],
    },
    ewallet: {
      name: "GoPay / DANA / OVO / ShopeePay",
      steps: [
        "Buka e-Wallet pilihan Anda, tekan tombol Scan / Bayar QRIS.",
        "Arahkan kamera ke QR code di atas.",
        "Nominal unik otomatis terkunci dan diverifikasi oleh auto-reconciler sistem.",
        "Masukkan PIN e-Wallet Anda.",
      ],
    },
  };

  return (
    <div id="dynamic-qris-payment-component" className="space-y-4">
      {/* Auto-Reconcile Success Celebration Card */}
      {reconcileState === "settled" && matchedMutation && (
        <div
          id="auto-reconciled-success-banner"
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl animate-in zoom-in-95 duration-200 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white">
                  Auto-Reconcile Berhasil
                </span>
                <span className="text-xs text-emerald-100 font-mono">100% Cocok</span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Mutasi Bank Terdeteksi & Terverifikasi Otomatis!
              </h3>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-emerald-100">Kanal / Bank Pengirim:</span>
              <span className="font-bold text-white">{matchedMutation.bank}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-100">Nominal Transfer Masuk:</span>
              <span className="font-mono font-black text-sm text-white">
                {formatRupiah(matchedMutation.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-100">Nomor Referensi Mutasi:</span>
              <span className="font-mono text-emerald-200 text-[11px]">{matchedMutation.reference}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-emerald-100 pt-1">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              Sistem telah melunasi invoice dan membuka isolir secara otomatis.
            </span>
            <span className="font-bold text-white">Memproses...</span>
          </div>
        </div>
      )}

      {/* Top Banner: Dynamic QRIS indicator & Countdown */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 via-indigo-50 to-emerald-50 dark:from-rose-950/30 dark:via-indigo-950/30 dark:to-emerald-950/30 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
            QRIS
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                QRIS Dinamis (Auto-Reconcile)
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold inline-flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                Nominal Unik Terkunci
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Sistem otomatis memverifikasi mutasi bank masuk tanpa konfirmasi manual.
            </p>
          </div>
        </div>

        {/* Validity Countdown Timer */}
        <div className="shrink-0 text-right bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-[9px] text-slate-400 uppercase font-semibold flex items-center justify-end gap-1">
            <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
            Masa Berlaku
          </div>
          <div
            className={`text-xs font-mono font-black ${
              secondsRemaining < 120
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-800 dark:text-slate-200"
            }`}
          >
            {formattedTime}
          </div>
        </div>
      </div>

      {/* Main Dynamic QR Plate & Specific Amount Lock */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        {/* Authentic ASPI / BI QR Box */}
        <div className="sm:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-[230px] p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center relative text-center">
            {/* Top Red-White ASPI/BI Brand Banner */}
            <div className="w-full pb-2 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-rose-600 tracking-tight">QRIS</span>
                <span className="text-[7.5px] text-slate-600 font-semibold leading-none text-left">
                  Standar Pembayaran Nasional
                </span>
              </div>
              <span className="text-[7px] font-bold text-slate-400">ASPI / BI</span>
            </div>

            {/* Dynamic QR Code Canvas */}
            <div className="relative my-2.5 p-1 bg-white rounded-xl">
              {qrisUrl ? (
                <img
                  src={qrisUrl}
                  alt={`QRIS Dinamis Tagihan ${invoice.invoiceNumber}`}
                  className="w-44 h-44 rounded-lg object-contain mx-auto"
                />
              ) : (
                <div className="w-44 h-44 flex flex-col items-center justify-center bg-slate-50 rounded-lg text-slate-400 gap-1">
                  <QrCode className="w-8 h-8 animate-pulse text-indigo-500" />
                  <span className="text-[10px]">Membuat QRIS Dinamis...</span>
                </div>
              )}

              {/* Center Overlay Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-white px-1.5 py-0.5 rounded text-[8px] font-black text-rose-600 border border-rose-200 shadow-xs">
                  QRIS
                </span>
              </div>
            </div>

            {/* Merchant Details & NMID */}
            <div className="w-full pt-1.5 border-t border-slate-100 text-slate-800 space-y-0.5">
              <div className="text-[9.5px] font-black tracking-tight uppercase">
                NETLANCAR RT-RW NET
              </div>
              <div className="text-[7.5px] text-slate-400 font-mono">
                NMID: ID1020023456789 • {invoice.invoiceNumber}
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadQrImage}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-indigo-500" />
              Unduh QR (PNG)
            </button>
          </div>
        </div>

        {/* Right Info: Unique Nominal Breakdown & Auto-Reconcile Tracker */}
        <div className="sm:col-span-6 space-y-3">
          {/* Unique Amount Breakdown Box */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Tagihan Terkunci di QRIS:
              </span>
              <button
                type="button"
                onClick={handleRegenerateUniqueCode}
                title="Acak ulang kode unik nominal"
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Acak Ulang
              </button>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {formatRupiah(totalAmountWithUnique)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  title="Salin nominal pas"
                  className="p-1 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 text-xs"
                >
                  {copiedAmount ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Wajib Pas
              </span>
            </div>

            {/* Formula Breakdown: Pokok + Kode Unik */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Tagihan Pokok:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {formatRupiah(invoice.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span>Kode Unik Rekonsiliasi:</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                    Otomatis
                  </span>
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  +{formatRupiah(uniqueCode)}
                </span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Total Transfer QRIS:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {formatRupiah(totalAmountWithUnique)}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Kode unik <strong>+{uniqueCode}</strong> otomatis disematkan agar sistem mencocokkan mutasi rekening bank secara instan tanpa input nomor referensi manual.
            </p>
          </div>

          {/* Invoice Summary Data */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Nomor Invoice</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {invoice.invoiceNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyInvoiceNumber}
                  title="Salin Nomor Invoice"
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                >
                  {copiedInvoiceNo ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Pelanggan</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {invoice.customerName}
              </span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Periode Tagihan</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {invoice.periodMonth}
              </span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Batas Jatuh Tempo</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {invoice.dueDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AUTO-RECONCILIATION LIVE STATUS & SIMULATION CONTROLS */}
      <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-blue-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Sistem Auto-Reconcile Aktif
            </span>
          </div>

          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-full font-bold">
            Memantau Mutasi: Rp {totalAmountWithUnique.toLocaleString("id-ID")}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Setelah Anda mentransfer lewat aplikasi m-banking atau e-wallet, sistem perbankan akan mengirim notifikasi mutasi. Sistem NetLancar langsung mencocokkan nominal unik ini dan mengubah tagihan menjadi <strong>LUNAS</strong> tanpa perlu upload struk bukti bayar!
        </p>

        {/* Bank Channel Selector for Quick Simulation */}
        <div className="pt-1 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Uji Kanal Bank Pembayaran:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{simulatedBank}</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {["BCA Mobile", "Livin' Mandiri", "BRImo", "GoPay", "ShopeePay"].map((bank) => (
              <button
                key={bank}
                type="button"
                onClick={() => setSimulatedBank(bank)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center truncate ${
                  simulatedBank === bank
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                {bank}
              </button>
            ))}
          </div>
        </div>

        {/* Instant Auto-Reconcile Simulation Button */}
        <button
          type="button"
          id="simulate-auto-reconcile-btn"
          onClick={handleTriggerSimulatedBankMutation}
          disabled={isProcessing || reconcileState === "settled" || secondsRemaining <= 0}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Mencocokkan Mutasi Rekening Bank Secara Real-time...</span>
            </>
          ) : reconcileState === "settled" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Pembayaran Sukses Terekonsiliasi!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {lang === "id"
                  ? `Simulasikan Mutasi Masuk Bank (Rp ${totalAmountWithUnique.toLocaleString("id-ID")})`
                  : `Simulate Bank Inflow Mutation (Rp ${totalAmountWithUnique.toLocaleString("id-ID")})`}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Accordion / Toggle: Petunjuk Pembayaran Aplikasi */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full p-3 flex items-center justify-between text-left font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Petunjuk Scan QRIS dari Aplikasi Perbankan</span>
          </div>
          {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showGuide && (
          <div className="p-3.5 pt-0 space-y-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap gap-1.5 pt-2">
              {Object.keys(appGuides).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedApp(key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedApp === key
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {appGuides[key].name}
                </button>
              ))}
            </div>

            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {appGuides[selectedApp].steps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Sistem enkripsi 256-bit ASPI QRIS dengan auto-reconciliation webhook & zero manual reference.</span>
      </div>
    </div>
  );
};
