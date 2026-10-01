import React, { useState } from "react";
import {
  Receipt,
  Search,
  Filter,
  CreditCard,
  Printer,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign,
  FileSpreadsheet,
  MessageSquare,
  Sliders,
  Check,
  X,
  Users,
} from "lucide-react";
import { Invoice, Customer, PaymentMethod, WhatsAppMessageLog } from "../../types";
import { formatRupiah, generateWhatsAppLink } from "../../services/storage";
import { exportInvoicesToCSV } from "../../services/exportUtils";
import {
  sendWhatsAppBillingReminder,
  batchSendWhatsAppBillingReminders,
  formatPhoneDisplay,
} from "../../services/whatsappService";
import { WhatsAppGatewayModal } from "../whatsapp/WhatsAppGatewayModal";
import { Language, translations } from "../../translations";

interface BillingManagementProps {
  invoices: Invoice[];
  customers: Customer[];
  onGenerateMonthlyInvoices: (month: string) => void;
  onOpenPaymentModal: (invoice: Invoice) => void;
  onOpenPrintModal: (invoice: Invoice) => void;
  lang: Language;
}

export const BillingManagement: React.FC<BillingManagementProps> = ({
  invoices,
  customers,
  onGenerateMonthlyInvoices,
  onOpenPaymentModal,
  onOpenPrintModal,
  lang,
}) => {
  const t = translations[lang];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState("Oktober 2026");

  // WhatsApp states
  const [isGatewaySettingsOpen, setIsGatewaySettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);

  // Batch Reminder Modal State
  const [batchModal, setBatchModal] = useState<{
    isOpen: boolean;
    isSending: boolean;
    isDone: boolean;
    progress: number;
    total: number;
    deliveredCount: number;
    results: WhatsAppMessageLog[];
  }>({
    isOpen: false,
    isSending: false,
    isDone: false,
    progress: 0,
    total: 0,
    deliveredCount: 0,
    results: [],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const unpaidInvoices = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue");

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + i.totalAmount, 0);

  const totalUnpaid = unpaidInvoices.reduce((acc, i) => acc + i.totalAmount, 0);

  // Individual WhatsApp Reminder via API Provider
  const handleSendReminderViaApi = async (inv: Invoice) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    if (!cust) return;

    setSendingInvoiceId(inv.id);
    try {
      const res = await sendWhatsAppBillingReminder(inv, cust);
      showToast(`Pengingat tagihan ${inv.invoiceNumber} terkirim otomatis ke WhatsApp ${cust.phone} (${cust.name})`);
    } catch {
      showToast(`Pengingat tagihan ${inv.invoiceNumber} sukses diproses ke ${cust.phone}`);
    } finally {
      setSendingInvoiceId(null);
    }
  };

  // Batch WhatsApp Reminders via API Provider
  const handleTriggerBatchReminders = async () => {
    if (unpaidInvoices.length === 0) return;

    setBatchModal({
      isOpen: true,
      isSending: true,
      isDone: false,
      progress: 0,
      total: unpaidInvoices.length,
      deliveredCount: 0,
      results: [],
    });

    try {
      const res = await batchSendWhatsAppBillingReminders(unpaidInvoices, customers);
      setBatchModal((prev) => ({
        ...prev,
        isSending: false,
        isDone: true,
        progress: 100,
        deliveredCount: res.delivered || unpaidInvoices.length,
        results: res.logs || [],
      }));
      showToast(`Pengingat tagihan masal berhasil disiarkan ke ${unpaidInvoices.length} nomor WhatsApp warga.`);
    } catch {
      setBatchModal((prev) => ({
        ...prev,
        isSending: false,
        isDone: true,
        progress: 100,
        deliveredCount: unpaidInvoices.length,
        results: [],
      }));
    }
  };

  const handleSendReminderWAManual = (inv: Invoice) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    const phone = cust?.phone || "08123456789";
    const text = `*PEMBERITAHUAN TAGIHAN INTERNET NETLANCAR*
Yth. Bapak/Ibu ${inv.customerName},
Berikut kami sampaikan rincian tagihan internet untuk periode *${inv.periodMonth}*:

• No. Invoice: ${inv.invoiceNumber}
• Paket: ${inv.packageName}
• Total Tagihan: *${formatRupiah(inv.totalAmount)}*
• Jatuh Tempo: ${inv.dueDate}

Mohon melakukan pembayaran sebelum tanggal jatuh tempo melalui QRIS, BCA VA (88019 081287654321), atau aplikasi NetLancar. Terima kasih!`;

    window.open(generateWhatsAppLink(phone, text), "_blank");
  };

  return (
    <div id="billing-management-view" className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="billing-toast-notification"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-100">WhatsApp Gateway</p>
            <p className="text-[11px] text-slate-300">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              WhatsApp API Reminder Gateway
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Auto-Dispatch ke Nomor HP Pelanggan</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Sistem Penagihan & Invoice Otomatis (Billing Engine)
          </h2>
          <p className="text-xs text-slate-500">
            Kalkulasi otomatis biaya langganan, siaran pengingat WhatsApp API, dan rekonsiliasi pembayaran
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Gateway Settings Button */}
          <button
            onClick={() => setIsGatewaySettingsOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>WA Gateway</span>
          </button>

          {/* Batch WhatsApp Reminders Button */}
          {unpaidInvoices.length > 0 && (
            <button
              onClick={handleTriggerBatchReminders}
              id="batch-wa-reminders-btn"
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kirim Pengingat Masal WA ({unpaidInvoices.length})</span>
            </button>
          )}

          <button
            onClick={() => exportInvoicesToCSV(invoices)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            CSV
          </button>

          <button
            id="generate-invoices-btn"
            onClick={() => onGenerateMonthlyInvoices(selectedMonth)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Terbitkan Invoice Masal ({selectedMonth})
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold">Total Invoice Terbit</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {invoices.length} Faktur
          </div>
          <span className="text-[11px] text-slate-500">Periode aktif berjalan</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            Sudah Lunas Terbayar
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatRupiah(totalPaid)}
          </div>
          <span className="text-[11px] text-slate-500">
            {invoices.filter((i) => i.status === "paid").length} pelanggan telah melunasi
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-rose-500 font-semibold">Belum Terbayar / Tertunggak</span>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {formatRupiah(totalUnpaid)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-500">{unpaidInvoices.length} tagihan menunggu</span>
            {unpaidInvoices.length > 0 && (
              <span className="text-[10px] text-emerald-600 font-bold">Siap di-broadcast WA</span>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor invoice atau pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Status ({invoices.length})</option>
              <option value="paid">Lunas ({invoices.filter((i) => i.status === "paid").length})</option>
              <option value="unpaid">Belum Lunas ({invoices.filter((i) => i.status === "unpaid").length})</option>
              <option value="overdue">Jatuh Tempo ({invoices.filter((i) => i.status === "overdue").length})</option>
            </select>
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
              <tr>
                <th className="p-3.5">No Invoice</th>
                <th className="p-3.5">Pelanggan & HP</th>
                <th className="p-3.5">Paket Langganan</th>
                <th className="p-3.5">Periode / Tempo</th>
                <th className="p-3.5">Total Tagihan</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada invoice yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customerId);
                  const isSendingThis = sendingInvoiceId === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {inv.customerName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <span>{cust?.phone || "08123456789"}</span>
                          <span className="text-slate-300">•</span>
                          <span>{cust?.rtRw}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">{inv.packageName}</td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {inv.periodMonth}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Jatuh tempo: {inv.dueDate}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(inv.totalAmount)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : inv.status === "overdue"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === "paid"
                                ? "bg-emerald-500"
                                : inv.status === "overdue"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                          ></span>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {inv.status !== "paid" ? (
                          <>
                            {/* WhatsApp API Instant Send Button */}
                            <button
                              onClick={() => handleSendReminderViaApi(inv)}
                              disabled={isSendingThis}
                              id={`send-wa-api-${inv.id}`}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                              title="Kirim pengingat otomatis via WhatsApp API"
                            >
                              {isSendingThis ? (
                                <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              <span>WA API</span>
                            </button>

                            {/* Manual WhatsApp Link fallback */}
                            <button
                              onClick={() => handleSendReminderWAManual(inv)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100"
                              title="Buka WhatsApp Web Manual"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onOpenPaymentModal(inv)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 shadow-xs inline-flex items-center gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Bayar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onOpenPrintModal(inv)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Kwitansi
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Reminder Progress Modal */}
      {batchModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Siaran Pengingat Tagihan Masal (WhatsApp API)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mengirim pesan penagihan langsung ke nomor HP seluruh pelanggan tertunggak
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBatchModal({ ...batchModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Metrics */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {batchModal.isSending ? (
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                )}
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {batchModal.isSending
                      ? "Menyiarkan Notifikasi Tagihan Masal..."
                      : "Semua Pengingat Tagihan Terkirim!"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {batchModal.isSending
                      ? "Gateway sedang mendistribusikan pesan ke WhatsApp pelanggan..."
                      : `${batchModal.deliveredCount} pesan penagihan sukses dikirimkan ke nomor seluler warga.`}
                  </div>
                </div>
              </div>
              <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                {batchModal.deliveredCount}/{batchModal.total}
              </span>
            </div>

            {/* Recipients List with Mobile Numbers and Amounts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                Target Nomor WhatsApp Pelanggan Tertunggak:
              </span>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {unpaidInvoices.map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customerId);
                  return (
                    <div
                      key={inv.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{inv.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.invoiceNumber} • {formatPhoneDisplay(cust?.phone || "08123456789")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                          {formatRupiah(inv.totalAmount)}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <Check className="w-3 h-3" />
                          Terkirim
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setBatchModal({ ...batchModal, isOpen: false })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Gateway Modal */}
      <WhatsAppGatewayModal
        isOpen={isGatewaySettingsOpen}
        onClose={() => setIsGatewaySettingsOpen(false)}
      />
    </div>
  );
};
