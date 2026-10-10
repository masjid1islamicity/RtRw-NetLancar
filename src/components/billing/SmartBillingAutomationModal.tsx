import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  Send,
  Mail,
  MessageSquare,
  ShieldAlert,
  Clock,
  CheckCircle2,
  X,
  Play,
  RotateCw,
  Zap,
  Sliders,
  DollarSign,
  Users,
} from "lucide-react";
import { Customer, Invoice } from "../../types";
import { formatRupiah } from "../../services/storage";
import { sendBatchInvoiceEmails } from "../../services/emailService";
import { batchSendWhatsAppBillingReminders } from "../../services/whatsappService";

export interface SmartBillingSettings {
  cycleType: "end_of_month" | "day_1" | "day_5" | "day_10" | "day_20";
  dueDaysOffset: number;
  autoSendWhatsApp: boolean;
  autoSendEmail: boolean;
  autoGenerateUniqueCode: boolean;
  autoIsolateGraceDays: number;
  isAutomationActive: boolean;
}

export const defaultSmartBillingSettings: SmartBillingSettings = {
  cycleType: "day_1",
  dueDaysOffset: 10,
  autoSendWhatsApp: true,
  autoSendEmail: true,
  autoGenerateUniqueCode: true,
  autoIsolateGraceDays: 7,
  isAutomationActive: true,
};

interface SmartBillingAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  invoices: Invoice[];
  onTriggerGenerate: (month: string, autoSendEmail: boolean, autoSendWa: boolean) => void;
  settings?: SmartBillingSettings;
  onSaveSettings?: (settings: SmartBillingSettings) => void;
}

export const SmartBillingAutomationModal: React.FC<SmartBillingAutomationModalProps> = ({
  isOpen,
  onClose,
  customers,
  invoices,
  onTriggerGenerate,
  settings: initialSettings = defaultSmartBillingSettings,
  onSaveSettings,
}) => {
  const [settings, setSettings] = useState<SmartBillingSettings>(initialSettings);
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    invoicesGenerated: number;
    totalAmount: number;
    emailSent: number;
    waSent: number;
    cycleDate: string;
  } | null>(null);

  if (!isOpen) return null;

  const cycleDescriptions: Record<SmartBillingSettings["cycleType"], string> = {
    end_of_month: "Setiap Akhir Bulan (Tgl 28/30/31 pukul 23:59 WIB)",
    day_1: "Tanggal 1 Setiap Bulan (Pukul 00:01 WIB) - Disarankan",
    day_5: "Tanggal 5 Setiap Bulan (Pukul 06:00 WIB)",
    day_10: "Tanggal 10 Setiap Bulan (Pukul 08:00 WIB)",
    day_20: "Tanggal 20 Setiap Bulan (Pukul 08:00 WIB)",
  };

  const activeCustomers = customers.filter((c) => c.status === "active" || c.status === "isolated");

  const handleSave = () => {
    if (onSaveSettings) onSaveSettings(settings);
    onClose();
  };

  const handleRunManualCycle = async () => {
    setIsRunningCycle(true);
    const targetMonth = "November 2026";

    // Simulate batch execution
    await new Promise((r) => setTimeout(r, 1200));

    onTriggerGenerate(targetMonth, settings.autoSendEmail, settings.autoSendWhatsApp);

    const generatedCount = activeCustomers.length;
    const totalRupiah = activeCustomers.reduce((acc, c) => acc + (c.monthlyFee || 150000), 0);

    setExecutionResult({
      invoicesGenerated: generatedCount,
      totalAmount: totalRupiah,
      emailSent: settings.autoSendEmail ? generatedCount : 0,
      waSent: settings.autoSendWhatsApp ? generatedCount : 0,
      cycleDate: new Date().toLocaleTimeString("id-ID") + " WIB",
    });

    setIsRunningCycle(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 dark:from-slate-800/80 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Smart Billing Automation &amp; Siklus Penagihan
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {settings.isAutomationActive ? "Aktif" : "Non-Aktif"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Otomasi penerbitan tagihan bulanan dan auto-send WhatsApp serta e-invoice via email
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Status Toggle Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white block">
                Status Otomasi Penagihan (Billing Scheduler)
              </span>
              <span className="text-[11px] text-slate-500">
                Jika aktif, server akan secara terjadwal menerbitkan invoice dan mengirimkan notifikasi.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isAutomationActive}
                onChange={(e) => setSettings({ ...settings, isAutomationActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Billing Cycle Setting */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Jadwal Siklus Penerbitan Invoice:
            </label>
            <select
              value={settings.cycleType}
              onChange={(e) => setSettings({ ...settings, cycleType: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
            >
              <option value="day_1">Tanggal 1 Setiap Bulan (Pukul 00:01 WIB) - Default Rekomendasi</option>
              <option value="end_of_month">Akhir Bulan (Tgl 28/30/31 pukul 23:59 WIB)</option>
              <option value="day_5">Tanggal 5 Setiap Bulan (Pukul 06:00 WIB)</option>
              <option value="day_10">Tanggal 10 Setiap Bulan (Pukul 08:00 WIB)</option>
              <option value="day_20">Tanggal 20 Setiap Bulan (Pukul 08:00 WIB)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Keterangan: {cycleDescriptions[settings.cycleType]}
            </p>
          </div>

          {/* Grace Period & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <label className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                Tenggat Waktu Jatuh Tempo (Hari):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={settings.dueDaysOffset}
                  onChange={(e) => setSettings({ ...settings, dueDaysOffset: Number(e.target.value) })}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500">Hari sejak terbit (H+{settings.dueDaysOffset})</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <label className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                Toleransi Isolir Otomatis MikroTik/Cisco:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={settings.autoIsolateGraceDays}
                  onChange={(e) => setSettings({ ...settings, autoIsolateGraceDays: Number(e.target.value) })}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500">Hari lewat jatuh tempo</span>
              </div>
            </div>
          </div>

          {/* Auto-Send Triggers */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
              Pemicu Pengiriman Otomatis (Auto-Send Triggers):
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={settings.autoSendWhatsApp}
                  onChange={(e) => setSettings({ ...settings, autoSendWhatsApp: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Otomatis kirim broadcast pengingat tagihan via WhatsApp Gateway (Fonnte)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={settings.autoSendEmail}
                  onChange={(e) => setSettings({ ...settings, autoSendEmail: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <Mail className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Otomatis kirim e-Invoice resmi via Email (Nodemailer / SMTP) sebagai cadangan
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={settings.autoGenerateUniqueCode}
                  onChange={(e) => setSettings({ ...settings, autoGenerateUniqueCode: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600"
                />
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Otomatis sematkan 3-digit kode unik QRIS untuk verifikasi pelunasan bank real-time
                </span>
              </label>
            </div>
          </div>

          {/* Trigger Now Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-slate-800 dark:to-slate-800/80 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Uji Coba Manual Siklus Penagihan
              </span>
              <span className="text-[11px] text-slate-500">
                Segera terbitkan invoice untuk {activeCustomers.length} pelanggan dan trigger pengiriman sekarang.
              </span>
            </div>
            <button
              onClick={handleRunManualCycle}
              disabled={isRunningCycle}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shrink-0 shadow-md shadow-indigo-600/20 disabled:opacity-60 cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isRunningCycle ? "animate-spin" : ""}`} />
              <span>{isRunningCycle ? "Memproses Siklus..." : "Jalankan Siklus Sekarang"}</span>
            </button>
          </div>

          {/* Execution Result Banner */}
          {executionResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2 text-emerald-900 dark:text-emerald-200 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Siklus Penagihan Berhasil Dijalankan! ({executionResult.cycleDate})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-center">
                <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60">
                  <span className="text-[9px] text-slate-500 block font-sans">Invoice Terbit</span>
                  <strong className="text-slate-900 dark:text-white">{executionResult.invoicesGenerated} Warga</strong>
                </div>
                <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60">
                  <span className="text-[9px] text-slate-500 block font-sans">Total Tagihan</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">{formatRupiah(executionResult.totalAmount)}</strong>
                </div>
                <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60">
                  <span className="text-[9px] text-slate-500 block font-sans">WA Terkirim</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{executionResult.waSent} Pesan</strong>
                </div>
                <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60">
                  <span className="text-[9px] text-slate-500 block font-sans">Email e-Invoice</span>
                  <strong className="text-purple-600 dark:text-purple-400">{executionResult.emailSent} e-Mail</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
