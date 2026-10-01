import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Terminal,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  X,
  FileSpreadsheet,
  Clock,
  Laptop,
  Network,
  Trash2,
  UserX,
  Sliders,
  Send,
  Zap,
} from "lucide-react";
import { AuditLogEntry, AuditActionType, AuditSeverity } from "../../types";
import { formatDate } from "../../services/storage";
import { Language, translations } from "../../translations";

interface AuditTrailProps {
  logs: AuditLogEntry[];
  onAddLog?: (entry: Omit<AuditLogEntry, "id" | "timestamp">) => void;
  lang: Language;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs, onAddLog, lang }) => {
  const t = translations[lang];

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Selected Log for JSON Payload / State Diff Inspector Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Meta configuration for action types
  const actionMeta: Record<
    AuditActionType,
    { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    customer_isolation_toggle: {
      label: "Isolasi Pelanggan",
      icon: UserX,
      color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    },
    customer_deletion: {
      label: "Penghapusan Pelanggan",
      icon: Trash2,
      color: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    },
    customer_creation: {
      label: "Pendaftaran Pelanggan",
      icon: User,
      color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    },
    customer_update: {
      label: "Perubahan Pelanggan",
      icon: Sliders,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800",
    },
    system_config_change: {
      label: "Konfigurasi Sistem / Router",
      icon: Terminal,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    },
    gateway_config_change: {
      label: "Konfigurasi Gateway",
      icon: Zap,
      color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
    },
    manual_fund_transfer: {
      label: "Transfer Kas Manual",
      icon: Activity,
      color: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800",
    },
    invoice_manual_override: {
      label: "Koreksi Invoice",
      icon: ShieldAlert,
      color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800",
    },
    outage_broadcast: {
      label: "Siaran Darurat WA",
      icon: Send,
      color: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800",
    },
  };

  // Severity Meta
  const severityMeta: Record<AuditSeverity, { label: string; badge: string }> = {
    critical: {
      label: "Kritis",
      badge: "bg-rose-500 text-white font-black",
    },
    warning: {
      label: "Peringatan",
      badge: "bg-amber-500 text-white font-bold",
    },
    info: {
      label: "Informasi",
      badge: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-semibold",
    },
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    const critical = logs.filter((l) => l.severity === "critical").length;
    const warning = logs.filter((l) => l.severity === "warning").length;
    const isolationChanges = logs.filter((l) => l.action === "customer_isolation_toggle").length;
    const deletions = logs.filter((l) => l.action === "customer_deletion").length;
    const configChanges = logs.filter(
      (l) => l.action === "system_config_change" || l.action === "gateway_config_change"
    ).length;

    return { total, critical, warning, isolationChanges, deletions, configChanges };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        log.actionTitle.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.targetResource.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q);

      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;

      return matchesSearch && matchesAction && matchesSeverity;
    });
  }, [logs, searchQuery, actionFilter, severityFilter]);

  // Export Audit Logs to CSV
  const handleExportCSV = () => {
    const headers = [
      "ID Audit",
      "Timestamp (ISO)",
      "Jenis Aksi",
      "Judul Aksi",
      "Tingkat Kepentingan",
      "Target Sumber Daya",
      "Nama Operator",
      "Role Operator",
      "IP Address",
      "Perangkat",
      "Deskripsi Lengkap",
      "Status",
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.action,
      `"${l.actionTitle}"`,
      l.severity,
      `"${l.targetResource}"`,
      `"${l.actorName}"`,
      `"${l.actorRole}"`,
      `"${l.ipAddress}"`,
      `"${l.deviceInfo || "-"}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      l.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Audit_Trail_Keamanan_NetLancar_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Format Relative Timestamp
  const formatTimeAgo = (isoString: string) => {
    const diffSeconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSeconds < 60) return "Baru saja";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} menit lalu`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} jam lalu`;
    return `${Math.floor(diffSeconds / 86400)} hari lalu`;
  };

  return (
    <div id="audit-trail-container" className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner Security Compliance */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                Audit Trail & Jejak Keamanan Operator (Immutable Log)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                Terverifikasi
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Merekam secara kronologis setiap intervensi manual: perubahan isolasi, penghapusan data, dan modifikasi router MikroTik untuk transparansi pengurus.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ekspor Log Audit (.CSV)</span>
        </button>
      </div>

      {/* Snapshot KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Log Tercatat</span>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white">{metrics.total} Aksi</div>
          <span className="text-[10px] text-slate-500">Tersimpan dalam ledger lokal</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
            Aksi Isolasi Pelanggan
          </span>
          <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
            {metrics.isolationChanges} Event
          </div>
          <span className="text-[10px] text-slate-500">Buka / tutup akses PPPoE</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
            Penghapusan Pelanggan
          </span>
          <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
            {metrics.deletions} Aksi
          </div>
          <span className="text-[10px] text-slate-500">Aksi permanen tingkat tinggi</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
            Konfigurasi Sistem & Router
          </span>
          <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {metrics.configChanges} Modifikasi
          </div>
          <span className="text-[10px] text-slate-500">MikroTik, Gateway, Saldo</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari aksi, operator, IP, atau target warga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Action Type Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="all">Semua Kategori Aksi</option>
            <option value="customer_isolation_toggle">Isolasi Pelanggan</option>
            <option value="customer_deletion">Penghapusan Pelanggan</option>
            <option value="system_config_change">Konfigurasi Sistem / Router</option>
            <option value="customer_creation">Pendaftaran Pelanggan Baru</option>
            <option value="gateway_config_change">Konfigurasi Gateway</option>
            <option value="manual_fund_transfer">Transfer Saldo Kas</option>
            <option value="outage_broadcast">Siaran Darurat WhatsApp</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="all">Semua Tingkat (Severity)</option>
            <option value="critical">Kritis (Critical)</option>
            <option value="warning">Peringatan (Warning)</option>
            <option value="info">Informasi (Info)</option>
          </select>
        </div>
      </div>

      {/* Main Audit Trail Log Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
            <tr>
              <th className="p-3.5">Waktu & ID Event</th>
              <th className="p-3.5">Kategori & Aksi Krusial</th>
              <th className="p-3.5">Target Sumber Daya</th>
              <th className="p-3.5">Operator & Identitas</th>
              <th className="p-3.5">IP Address & Lingkungan</th>
              <th className="p-3.5 text-right">Rincian State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Tidak ada catatan audit yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const meta = actionMeta[log.action] || actionMeta.customer_isolation_toggle;
                const Icon = meta.icon;
                const severity = severityMeta[log.severity];

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                        {formatDate(log.timestamp.slice(0, 10))}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB ({formatTimeAgo(log.timestamp)})
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">{log.id}</span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300 mt-0.5">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white text-[11.5px]">
                              {log.actionTitle}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[8.5px] uppercase ${severity.badge}`}
                            >
                              {severity.label}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {log.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {log.targetResource}
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-mono">
                        {log.targetId || "Global System"}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          {log.actorName}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{log.actorRole}</div>
                    </td>

                    <td className="p-3.5 font-mono text-[10px]">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Network className="w-3 h-3 text-indigo-500" />
                        <span>{log.ipAddress}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate max-w-[140px]">
                        {log.deviceInfo || "Web Browser"}
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspeksi</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: STATE DIFF & PAYLOAD INSPECTOR */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Inspeksi Jejak Audit #{selectedLog.id}
                    </h3>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] uppercase ${
                        severityMeta[selectedLog.severity].badge
                      }`}
                    >
                      {severityMeta[selectedLog.severity].label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{selectedLog.actionTitle}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3.5 text-xs overflow-y-auto">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Operator Pelaksana</span>
                  <strong className="text-slate-900 dark:text-white font-sans">{selectedLog.actorName}</strong>
                  <span className="text-[10px] text-slate-500 block">{selectedLog.actorRole}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Waktu Presisi</span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {new Date(selectedLog.timestamp).toLocaleString("id-ID")}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">{formatTimeAgo(selectedLog.timestamp)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Sumber Daya</span>
                  <strong className="text-slate-900 dark:text-white font-sans">{selectedLog.targetResource}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">IP Address & Terminal</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{selectedLog.ipAddress}</strong>
                  <span className="text-[9.5px] text-slate-400 block truncate">{selectedLog.deviceInfo}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Narasi Tindakan Operator:
                </span>
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed">
                  {selectedLog.description}
                </div>
              </div>

              {/* State Diff (Previous vs New State) */}
              {(selectedLog.previousState || selectedLog.newState) && (
                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Perubahan Data Konfigurasi (State Diff):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[10.5px]">
                    {/* Previous State */}
                    <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20">
                      <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 mb-1 flex items-center gap-1 font-sans">
                        <span>Kondisi Sebelum (Previous State):</span>
                      </div>
                      <pre className="whitespace-pre-wrap text-rose-900 dark:text-rose-200 overflow-x-auto text-[10px]">
                        {selectedLog.previousState
                          ? JSON.stringify(selectedLog.previousState, null, 2)
                          : "// (Belum ada state sebelumnya / data baru)"}
                      </pre>
                    </div>

                    {/* New State */}
                    <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1 font-sans">
                        <span>Kondisi Sesudah (New State):</span>
                      </div>
                      <pre className="whitespace-pre-wrap text-emerald-900 dark:text-emerald-200 overflow-x-auto text-[10px]">
                        {selectedLog.newState
                          ? JSON.stringify(selectedLog.newState, null, 2)
                          : "// (State dihapus)"}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.notes && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[10.5px] text-amber-800 dark:text-amber-300">
                  <strong>Catatan Tambahan: </strong>
                  {selectedLog.notes}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
