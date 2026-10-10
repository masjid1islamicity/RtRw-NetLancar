import React, { useState } from "react";
import {
  Mail,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  Server,
  Settings,
  Eye,
  RefreshCw,
  Clock,
  Sparkles,
  Download,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Invoice, Customer } from "../../types";
import {
  defaultSmtpConfig,
  SmtpConfig,
  EmailDeliveryReceipt,
  sendInvoiceEmail,
  generateInvoiceHtmlEmail,
} from "../../services/emailService";
import { formatRupiah } from "../../services/storage";

interface EmailDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  customer?: Customer;
  onSuccess?: (receipt: EmailDeliveryReceipt) => void;
}

export const EmailDispatcherModal: React.FC<EmailDispatcherModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customer,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "send" | "smtp">("preview");
  const [recipientEmail, setRecipientEmail] = useState(
    customer?.email || `${customer?.customerCode?.toLowerCase() || "pelanggan"}@warga.netlancar.id`
  );
  const [isSending, setIsSending] = useState(false);
  const [receipt, setReceipt] = useState<EmailDeliveryReceipt | null>(null);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(defaultSmtpConfig);
  const [smtpSavedToast, setSmtpSavedToast] = useState(false);

  if (!isOpen) return null;

  const htmlPreview = generateInvoiceHtmlEmail(invoice, customer);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await sendInvoiceEmail(invoice, customer, recipientEmail);
      setReceipt(res);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      console.error("Failed to send email:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSavedToast(true);
    setTimeout(() => setSmtpSavedToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Layanan Pengiriman e-Invoice (Nodemailer / SMTP)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Cadangan WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kirim invoice digital ke email pelanggan dengan rincian QRIS &amp; tagihan resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab("preview")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "preview"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Pratinjau HTML E-Invoice</span>
          </button>
          <button
            onClick={() => setActiveTab("send")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "send"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Form Pengiriman Email</span>
          </button>
          <button
            onClick={() => setActiveTab("smtp")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "smtp"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Konfigurasi Server SMTP</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeTab === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>
                  Target: <strong>{customer?.name || invoice.customerName}</strong> ({invoice.invoiceNumber})
                </span>
                <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                  {formatRupiah(invoice.totalAmount)}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 max-h-[480px] overflow-y-auto">
                <iframe
                  title="E-Invoice HTML Preview"
                  srcDoc={htmlPreview}
                  className="w-full h-[460px] border-none bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === "send" && (
            <form onSubmit={handleSend} className="space-y-4 max-w-lg mx-auto py-2">
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{invoice.invoiceNumber}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatRupiah(invoice.totalAmount)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Pelanggan: {customer?.name || invoice.customerName} • Paket: {invoice.packageName} ({invoice.bandwidthSpeed})
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Alamat Email Penerima:
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="contoh: budi@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Email e-invoice akan dikirim secara asynchronous dengan tracking delivery status.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Subjek Email:
                </label>
                <input
                  type="text"
                  readOnly
                  value={`[e-Invoice] Tagihan Internet NetLancar Periode ${invoice.periodMonth} - ${invoice.invoiceNumber}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-mono text-[11px]"
                />
              </div>

              {receipt && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1 text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>e-Invoice Berhasil Dikirimkan!</span>
                  </div>
                  <div className="text-[11px] font-mono">
                    ID Bukti: {receipt.id} • Status: {receipt.status}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    Waktu Kirim: {new Date(receipt.sentAt).toLocaleString("id-ID")}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-60 cursor-pointer"
              >
                <Send className={`w-4 h-4 ${isSending ? "animate-spin" : ""}`} />
                <span>{isSending ? "Mengirimkan E-Invoice..." : "Kirimkan e-Invoice Sekarang"}</span>
              </button>
            </form>
          )}

          {activeTab === "smtp" && (
            <form onSubmit={handleSaveSmtp} className="space-y-3.5 max-w-lg mx-auto py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    SMTP Host:
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    SMTP Port:
                  </label>
                  <input
                    type="number"
                    required
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                    placeholder="587"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pengirim Email (Sender Name):
                </label>
                <input
                  type="text"
                  required
                  value={smtpConfig.senderName}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, senderName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Akun Email Pengirim (SMTP User):
                </label>
                <input
                  type="email"
                  required
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Gunakan Enkripsi TLS/STARTTLS:
                </span>
                <input
                  type="checkbox"
                  checked={!smtpConfig.secure}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: !e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              {smtpSavedToast && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-center">
                  Konfigurasi SMTP berhasil disimpan!
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Simpan Konfigurasi SMTP
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
