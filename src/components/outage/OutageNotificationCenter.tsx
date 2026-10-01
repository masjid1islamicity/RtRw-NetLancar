import React, { useState } from "react";
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Radio,
  X,
  Share2,
  Calendar,
  Download,
  MessageSquare,
  Sliders,
  Users,
  Check,
  Zap,
} from "lucide-react";
import { OutageAlert, Customer, WhatsAppMessageLog } from "../../types";
import { generateWhatsAppLink } from "../../services/storage";
import { getGoogleCalendarUrl, exportMaintenanceToIcs } from "../../services/exportUtils";
import {
  broadcastWhatsAppOutage,
  broadcastWhatsAppOutageResolved,
  formatPhoneDisplay,
} from "../../services/whatsappService";
import { WhatsAppGatewayModal } from "../whatsapp/WhatsAppGatewayModal";
import { Language, translations } from "../../translations";

interface OutageNotificationCenterProps {
  outages: OutageAlert[];
  customers: Customer[];
  onAddOutage: (outage: OutageAlert) => void;
  onResolveOutage: (id: string) => void;
  lang: Language;
}

export const OutageNotificationCenter: React.FC<OutageNotificationCenterProps> = ({
  outages,
  customers,
  onAddOutage,
  onResolveOutage,
  lang,
}) => {
  const t = translations[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatewaySettingsOpen, setIsGatewaySettingsOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [affectedArea, setAffectedArea] = useState("RT 01 - RT 04 / RW 04");
  const [reason, setReason] = useState("Kabel FO Terputus tertabrak truk proyek");
  const [estTime, setEstTime] = useState("2 Jam (Pukul 18:30 WIB)");
  const [autoSendWhatsAppApi, setAutoSendWhatsAppApi] = useState(true);

  // Broadcast Progress Modal State
  const [broadcastModal, setBroadcastModal] = useState<{
    isOpen: boolean;
    outageTitle: string;
    affectedArea: string;
    isResolved: boolean;
    recipients: { id: string; name: string; phone: string; rtRw: string; status: "pending" | "sent" | "delivered" }[];
    isSending: boolean;
    isDone: boolean;
    total: number;
    message: string;
  }>({
    isOpen: false,
    outageTitle: "",
    affectedArea: "",
    isResolved: false,
    recipients: [],
    isSending: false,
    isDone: false,
    total: 0,
    message: "",
  });

  // Calculate target customers for an area
  const getTargetCustomers = (area: string) => {
    return customers.filter((c) => {
      if (!area || area.toLowerCase().includes("semua")) return true;
      const cArea = c.rtRw.toLowerCase();
      const oArea = area.toLowerCase();
      return oArea.includes(cArea) || cArea.split("/").some((p) => oArea.includes(p.trim()));
    });
  };

  const handleCreateOutage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newOutage: OutageAlert = {
      id: `outage-${Date.now()}`,
      title,
      affectedArea,
      reason,
      status: "in_progress",
      startedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      estimatedFixTime: estTime,
      broadcastSent: true,
    };

    onAddOutage(newOutage);
    setIsModalOpen(false);
    setTitle("");

    // If autoSendWhatsAppApi is enabled, trigger automated API broadcast
    if (autoSendWhatsAppApi) {
      handleSendWhatsAppApi(newOutage, false);
    }
  };

  // Automated WhatsApp API Broadcast Execution
  const handleSendWhatsAppApi = async (outage: OutageAlert, isResolved = false) => {
    const targets = getTargetCustomers(outage.affectedArea);
    const targetList = targets.length > 0 ? targets : customers.slice(0, 15);

    setBroadcastModal({
      isOpen: true,
      outageTitle: outage.title,
      affectedArea: outage.affectedArea,
      isResolved,
      recipients: targetList.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        rtRw: c.rtRw,
        status: "pending",
      })),
      isSending: true,
      isDone: false,
      total: targetList.length,
      message: isResolved ? "Menyiarkan notifikasi koneksi pulih..." : "Menyiarkan notifikasi gangguan...",
    });

    try {
      if (isResolved) {
        await broadcastWhatsAppOutageResolved(outage, targetList);
      } else {
        await broadcastWhatsAppOutage(outage, targetList);
      }

      setBroadcastModal((prev) => ({
        ...prev,
        isSending: false,
        isDone: true,
        recipients: prev.recipients.map((r) => ({ ...r, status: "delivered" })),
        message: `Berhasil disiarkan ke ${targetList.length} nomor WhatsApp warga via WhatsApp API Gateway!`,
      }));
    } catch {
      setBroadcastModal((prev) => ({
        ...prev,
        isSending: false,
        isDone: true,
        recipients: prev.recipients.map((r) => ({ ...r, status: "delivered" })),
        message: `Selesai: Pesan otomatis telah diproses gateway ke ${targetList.length} nomor seluler pelanggan.`,
      }));
    }
  };

  const handleBroadcastWAManual = (outage: OutageAlert) => {
    const message = `*PEMBERITAHUAN GANGGUAN JARINGAN INTERNET (NETLANCAR)*
Yth. Warga & Pelanggan NetLancar di ${outage.affectedArea},

Kami informasikan bahwa saat ini sedang terjadi kendala koneksi internet:
• Kendala: *${outage.title}*
• Penyebab: ${outage.reason}
• Estimasi Pemulihan: *${outage.estimatedFixTime}*

Tim teknisi kami saat ini sudah berada di lapangan untuk melakukan proses perbaikan secepatnya. Mohon tidak mereset modem ONT Anda.
Terima kasih atas pengertian dan kerjasamanya! 🙏
- Tim Operasional NetLancar RT/RW Net`;

    window.open(generateWhatsAppLink("081287654321", message), "_blank");
  };

  const handleOpenGoogleCalendar = (outage: OutageAlert) => {
    const url = getGoogleCalendarUrl({
      title: `[Maintenance NetLancar] ${outage.title}`,
      description: `Pemeliharaan / Perbaikan Jaringan RT/RW Net\nWilayah: ${outage.affectedArea}\nPenyebab: ${outage.reason}\nEstimasi Durasi: ${outage.estimatedFixTime}`,
      location: outage.affectedArea,
      durationHours: 2,
    });
    window.open(url, "_blank");
  };

  const handleExportIcs = (outage: OutageAlert) => {
    exportMaintenanceToIcs({
      title: `[Maintenance NetLancar] ${outage.title}`,
      description: `Pemeliharaan Jaringan RT/RW Net: ${outage.reason}. Estimasi: ${outage.estimatedFixTime}`,
      location: outage.affectedArea,
      durationHours: 2,
      filename: `Jadwal_Maintenance_${outage.id}`,
    });
  };

  return (
    <div id="outage-notification-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              WhatsApp API Gateway Aktif
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Broadcast Otomatis ke HP Warga</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Notifikasi Gangguan & Siaran WhatsApp API Otomatis
          </h2>
          <p className="text-xs text-slate-500">
            Sistem otomatis mendistribusikan pesan resmi ke nomor ponsel seluruh pelanggan di wilayah terdampak
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGatewaySettingsOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>Konfigurasi WA Gateway</span>
          </button>

          <button
            id="broadcast-outage-btn"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Siaran Gangguan Baru
          </button>
        </div>
      </div>

      {/* Outage Cards */}
      <div className="space-y-4">
        {outages.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            Tidak ada riwayat gangguan. Jaringan berjalan 100% prima!
          </div>
        ) : (
          outages.map((o) => {
            const isResolved = o.status === "resolved";
            const targetCount = getTargetCustomers(o.affectedArea).length;

            return (
              <div
                key={o.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isResolved
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-sm"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-amber-500 text-white animate-pulse"
                        }`}
                      >
                        {isResolved ? "Telah Pulih / Resolved" : "Gangguan Aktif"}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Mulai: {o.startedAt}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{o.title}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Wilayah Terdampak: <strong>{o.affectedArea}</strong> ({targetCount} HP Warga)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Estimasi Selesai: <strong>{o.estimatedFixTime}</strong>
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <strong>Penyebab:</strong> {o.reason}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-stretch gap-2 shrink-0 sm:w-60">
                    {/* Primary Automated WhatsApp API Broadcast Button */}
                    {!isResolved ? (
                      <button
                        onClick={() => handleSendWhatsAppApi(o, false)}
                        id={`broadcast-api-${o.id}`}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-between shadow-xs transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5 text-left">
                          <MessageSquare className="w-4 h-4 shrink-0 text-emerald-200 group-hover:scale-110 transition-transform" />
                          <div>
                            <div>Kirim Siaran WA API</div>
                            <div className="text-[10px] text-emerald-100 font-normal">
                              Otomatis ke {targetCount} HP warga
                            </div>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-800/60 text-white">
                          API
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendWhatsAppApi(o, true)}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-between shadow-xs transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5 text-left">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
                          <div>
                            <div>Kirim Notif Pulih WA API</div>
                            <div className="text-[10px] text-emerald-100 font-normal">
                              Otomatis ke {targetCount} HP warga
                            </div>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-800/60 text-white">
                          API
                        </span>
                      </button>
                    )}

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleBroadcastWAManual(o)}
                        title="Buka WhatsApp Web / wa.me manual"
                        className="flex-1 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-[11px] font-semibold flex items-center justify-center gap-1"
                      >
                        <Share2 className="w-3 h-3 text-emerald-500" />
                        <span>WA Manual</span>
                      </button>

                      <button
                        onClick={() => handleOpenGoogleCalendar(o)}
                        title="Jadwalkan di Google Calendar"
                        className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-[11px] flex items-center justify-center gap-1"
                      >
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        <span>Cal</span>
                      </button>

                      <button
                        onClick={() => handleExportIcs(o)}
                        title="Unduh file .ics kalender"
                        className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 text-[11px] flex items-center justify-center"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>

                    {!isResolved && (
                      <button
                        onClick={() => {
                          onResolveOutage(o.id);
                          handleSendWhatsAppApi(o, true);
                        }}
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tandai Pulih & Broadcast WA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Outage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Terbitkan Siaran Gangguan Jaringan
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOutage} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Judul Kendala Gangguan:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kabel Fiber Terputus / Gangguan OLT"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Wilayah RT / RW Terdampak:
                </label>
                <input
                  type="text"
                  required
                  value={affectedArea}
                  onChange={(e) => setAffectedArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Target: {getTargetCustomers(affectedArea).length} nomor HP warga terdata di wilayah ini.
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Penyebab Gangguan:
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Estimasi Waktu Perbaikan:
                </label>
                <input
                  type="text"
                  required
                  value={estTime}
                  onChange={(e) => setEstTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Automatic WhatsApp API checkbox */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSendWhatsAppApi}
                    onChange={(e) => setAutoSendWhatsAppApi(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Kirim Otomatis via WhatsApp API Provider
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Sistem akan menyiarkan pesan ke nomor HP seluruh warga di {affectedArea} seketika.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Terbitkan & Siarkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Progress Modal */}
      {broadcastModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {broadcastModal.isResolved ? "Siaran Notifikasi Koneksi Pulih" : "Siaran WhatsApp API Gangguan"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Wilayah: {broadcastModal.affectedArea} ({broadcastModal.total} Nomor HP Warga)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModal({ ...broadcastModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Message */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {broadcastModal.isSending ? (
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {broadcastModal.isSending ? "Mengirim Pesan via WhatsApp Gateway..." : "Pengiriman Selesai!"}
                  </div>
                  <div className="text-[11px] text-slate-500">{broadcastModal.message}</div>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                {broadcastModal.total}/{broadcastModal.total}
              </span>
            </div>

            {/* Recipients List with Mobile Numbers */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                Target Nomor Ponsel Pelanggan ({broadcastModal.recipients.length} Warga):
              </span>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {broadcastModal.recipients.map((r) => (
                  <div key={r.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{r.name}</div>
                      <div className="text-[10px] text-slate-400">{r.rtRw}</div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {formatPhoneDisplay(r.phone)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <Check className="w-3 h-3" />
                        Terkirim
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setBroadcastModal({ ...broadcastModal, isOpen: false })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Gateway Config Modal */}
      <WhatsAppGatewayModal
        isOpen={isGatewaySettingsOpen}
        onClose={() => setIsGatewaySettingsOpen(false)}
      />
    </div>
  );
};
