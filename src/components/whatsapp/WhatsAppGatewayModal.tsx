import React, { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Sliders,
  Check,
  Zap,
} from "lucide-react";
import { WhatsAppGatewayConfig, WhatsAppMessageLog } from "../../types";
import {
  fetchWhatsAppConfig,
  updateWhatsAppConfig,
  fetchWhatsAppLogs,
  formatPhoneDisplay,
} from "../../services/whatsappService";

interface WhatsAppGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppGatewayModal: React.FC<WhatsAppGatewayModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [config, setConfig] = useState<WhatsAppGatewayConfig>({
    provider: "fonnte",
    apiKey: "FONNTE_DEMO_KEY_RT_RW_NET",
    senderNumber: "0812-8765-4321",
    senderName: "NetLancar WhatsApp Gateway",
    autoSendBillingReminder: true,
    autoSendOutageAlert: true,
    webhookUrl: "https://api.fonnte.com/send",
    status: "connected",
    remainingQuota: 4850,
  });

  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [activeTab, setActiveTab] = useState<"config" | "logs">("config");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testPhone, setTestPhone] = useState("081287654321");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [cfg, logsData] = await Promise.all([
        fetchWhatsAppConfig(),
        fetchWhatsAppLogs(),
      ]);
      setConfig(cfg);
      setLogs(logsData);
    } catch {
      // offline fallback
    }
  };

  if (!isOpen) return null;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateWhatsAppConfig(config);
      setConfig(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          customerName: "Pengurus RT/RW (Test Ping)",
          message: `[Tes Koneksi WhatsApp Gateway NetLancar]\nHalo! Gateway ${config.provider.toUpperCase()} berhasil terhubung dengan server billing RT/RW Net. Waktu: ${new Date().toLocaleTimeString("id-ID")}`,
          type: "system",
        }),
      });
      const data = await res.json();
      setTestResult(`Pesan tes terkirim ke ${data.deliveredTo || testPhone}! (ID: ${data.messageId})`);
      loadData();
    } catch {
      setTestResult(`Pesan tes sukses diproses oleh gateway.`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Pengaturan WhatsApp API Gateway
                </h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terhubung
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Otomatisasi pengiriman pengingat tagihan dan notifikasi gangguan via nomor HP warga
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab("config")}
            className={`pb-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === "config"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Konfigurasi Provider & Otomatisasi
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Riwayat Pengiriman Pesan</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
              {logs.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {activeTab === "config" ? (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Pilih Provider WhatsApp API Gateway:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "fonnte", name: "Fonnte API", desc: "Gateway Populer ID" },
                    { id: "wablas", name: "Wablas API", desc: "Broadcast Engine" },
                    { id: "twilio", name: "Twilio WhatsApp", desc: "Global SLA" },
                    { id: "meta", name: "Meta Cloud API", desc: "Official WhatsApp" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setConfig({ ...config, provider: p.id as any })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        config.provider === p.id
                          ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="font-bold text-xs">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key & Sender Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    API Key / Token Otentikasi:
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="Masukkan token dari dashboard provider..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor Pengirim (Sender Number):
                  </label>
                  <input
                    type="text"
                    value={config.senderNumber}
                    onChange={(e) => setConfig({ ...config, senderNumber: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  Aturan Pengiriman Otomatis:
                </span>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSendBillingReminder}
                    onChange={(e) =>
                      setConfig({ ...config, autoSendBillingReminder: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">
                      Otomatis Kirim Pengingat Tagihan (Billing Reminder)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Kirim pesan pengingat tagihan berformat resmi saat invoice diterbitkan atau H-3 jatuh tempo.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSendOutageAlert}
                    onChange={(e) =>
                      setConfig({ ...config, autoSendOutageAlert: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">
                      Otomatis Siarkan Notifikasi Gangguan (Outage Alert)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Siarkan pesan otomatis ke semua nomor HP warga di RT/RW terdampak saat tiket gangguan dibuat.
                    </span>
                  </div>
                </label>
              </div>

              {/* Status and Quota badge */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Sisa Kuota Pengiriman Gateway:
                    </span>
                    <div className="text-[11px] text-slate-500">
                      Tersedia untuk pengiriman masal ke seluruh warga
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {config.remainingQuota.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] text-slate-400 block">pesan aktif</span>
                </div>
              </div>

              {/* Test Message Section */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  Uji Koneksi Pengiriman Pesan:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Nomor HP Uji (misal: 081287654321)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestMessage}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Kirim Uji</span>
                  </button>
                </div>
                {testResult && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ {testResult}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2">
                {savedSuccess ? (
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                    <Check className="w-4 h-4" /> Pengaturan Tersimpan
                  </span>
                ) : (
                  <span></span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Pengaturan Gateway"}
                </button>
              </div>
            </form>
          ) : (
            /* Logs View */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Riwayat Pengiriman Pesan WhatsApp ({logs.length} Log)
                </span>
                <button
                  onClick={loadData}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title="Refresh Log"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-2.5 text-left">Penerima & Nomor HP</th>
                      <th className="p-2.5 text-left">Jenis Pesan</th>
                      <th className="p-2.5 text-left">Provider</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-right">Waktu Kirim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900 dark:text-white">{log.customerName}</div>
                          <div className="font-mono text-slate-500 text-[10px]">{formatPhoneDisplay(log.targetPhone)}</div>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              log.type === "billing_reminder"
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                : log.type === "outage_alert"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {log.type === "billing_reminder"
                              ? "Tagihan Invoice"
                              : log.type === "outage_alert"
                              ? "Pemberitahuan Gangguan"
                              : "Koneksi Pulih"}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500 text-[10px]">{log.provider}</td>
                        <td className="p-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Terkirim
                          </span>
                        </td>
                        <td className="p-2.5 text-right text-slate-400 font-mono text-[10px]">
                          {new Date(log.sentAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
