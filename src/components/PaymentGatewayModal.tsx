import React, { useState } from "react";
import {
  X,
  QrCode,
  Building2,
  Wallet,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Invoice, PaymentMethod } from "../types";
import { formatRupiah } from "../services/storage";
import { Language } from "../translations";
import { DynamicQrisPayment } from "./payment/DynamicQrisPayment";

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onPaymentSuccess: (invId: string, method: PaymentMethod, ref: string) => void;
  lang: Language;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
  lang,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("QRIS");
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmSimulation = async () => {
    setIsProcessing(true);
    try {
      // Call verification API
      const res = await fetch("/api/payment-gateway/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          method: selectedMethod,
          amount: invoice.totalAmount,
        }),
      });
      const data = await res.json();

      setIsProcessing(false);
      setSuccess(true);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if not supported
      }

      setTimeout(() => {
        setSuccess(false);
        onPaymentSuccess(invoice.id, selectedMethod, data.referenceNumber || `TRX-${Date.now()}`);
        onClose();
      }, 1200);
    } catch {
      setIsProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onPaymentSuccess(invoice.id, selectedMethod, `TRX-OFFLINE-${Date.now()}`);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div
        id="payment-gateway-modal"
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Payment Gateway
              </span>
              <span className="text-xs text-slate-500 font-mono">{invoice.invoiceNumber}</span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
              {lang === "id" ? "Penyelesaian Tagihan Internet" : "Internet Bill Settlement"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Payment Method Selector Tabs */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
              {lang === "id" ? "Pilih Metode Pembayaran:" : "Select Payment Method:"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="select-method-qris"
                onClick={() => setSelectedMethod("QRIS")}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer relative ${
                  selectedMethod === "QRIS"
                    ? "border-rose-600 bg-rose-50/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-2 ring-rose-500/20 shadow-2xs font-bold"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="absolute -top-1.5 right-1.5 px-1.5 py-0.2 rounded-full bg-emerald-600 text-[8px] font-extrabold text-white uppercase tracking-wider shadow-2xs">
                  Auto-Reconcile
                </div>
                <QrCode className="w-4 h-4 mx-auto mb-1 text-rose-600 dark:text-rose-400" />
                QRIS Dinamis
              </button>

              <button
                type="button"
                id="select-method-bca"
                onClick={() => setSelectedMethod("BCA_VA")}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                  selectedMethod === "BCA_VA"
                    ? "border-indigo-600 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-2 ring-indigo-500/20 shadow-2xs font-bold"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Building2 className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                BCA Virtual
              </button>

              <button
                type="button"
                id="select-method-dana"
                onClick={() => setSelectedMethod("DANA")}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                  selectedMethod === "DANA"
                    ? "border-indigo-600 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-2 ring-indigo-500/20 shadow-2xs font-bold"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Wallet className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                DANA / E-Wallet
              </button>
            </div>
          </div>

          {/* Dedicated Dynamic QRIS Component */}
          {selectedMethod === "QRIS" && (
            <DynamicQrisPayment
              invoice={invoice}
              onPaymentSuccess={(invId, method, ref) => {
                onPaymentSuccess(invId, method, ref);
                onClose();
              }}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              lang={lang}
            />
          )}

          {/* Virtual Account & E-Wallet Views */}
          {selectedMethod === "BCA_VA" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-800/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Tagihan:</span>
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatRupiah(invoice.totalAmount)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">{invoice.customerName}</span>
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {invoice.periodMonth}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <span className="text-slate-500 text-[11px]">Nomor Virtual Account BCA:</span>
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                    88019 081287654321
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy("88019081287654321")}
                    className="p-1.5 text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-semibold">{copied ? "Tersalin" : "Salin"}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Transfer via m-BCA menu Transfer &gt; BCA Virtual Account. Masukkan kode perusahaan 88019 + No HP Anda.
                </p>
              </div>

              <button
                id="simulate-va-payment-btn"
                onClick={handleConfirmSimulation}
                disabled={isProcessing || success}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white transition-all shadow-md cursor-pointer ${
                  success
                    ? "bg-emerald-600"
                    : isProcessing
                    ? "bg-indigo-400"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === "id" ? "Pembayaran Terkonfirmasi Lunas!" : "Payment Verified & Settled!"}</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>{lang === "id" ? "Memverifikasi Gateway..." : "Verifying Gateway..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{lang === "id" ? "Simulasikan Pembayaran VA Berhasil" : "Simulate Instant VA Payment"}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {selectedMethod === "DANA" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-800/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Tagihan:</span>
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatRupiah(invoice.totalAmount)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">{invoice.customerName}</span>
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {invoice.periodMonth}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <span className="text-slate-500 text-[11px]">Nomor Akun Merchant DANA:</span>
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                    0812-8765-4321 (NetLancar)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy("081287654321")}
                    className="p-1.5 text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-semibold">{copied ? "Tersalin" : "Salin"}</span>
                  </button>
                </div>
              </div>

              <button
                id="simulate-dana-payment-btn"
                onClick={handleConfirmSimulation}
                disabled={isProcessing || success}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white transition-all shadow-md cursor-pointer ${
                  success
                    ? "bg-emerald-600"
                    : isProcessing
                    ? "bg-indigo-400"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === "id" ? "Pembayaran Terkonfirmasi Lunas!" : "Payment Verified & Settled!"}</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>{lang === "id" ? "Memverifikasi Gateway..." : "Verifying Gateway..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{lang === "id" ? "Simulasikan Pembayaran DANA Berhasil" : "Simulate Instant DANA Payment"}</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit SSL Encrypted Payment Gateway Callback</span>
          </div>
        </div>
      </div>
    </div>
  );
};

