import React, { useState } from "react";
import {
  CheckSquare,
  Clock,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  Wrench,
  X,
  Phone,
  Calendar,
} from "lucide-react";
import { OperationalTask, Customer } from "../../types";
import { Language, translations } from "../../translations";
import { getGoogleCalendarUrl, exportMaintenanceToIcs } from "../../services/exportUtils";

interface OperationalTasksProps {
  tasks: OperationalTask[];
  customers: Customer[];
  onAddTask: (task: OperationalTask) => void;
  onUpdateTaskStatus: (id: string, status: OperationalTask["status"]) => void;
  lang: Language;
}

export const OperationalTasks: React.FC<OperationalTasksProps> = ({
  tasks,
  customers,
  onAddTask,
  onUpdateTaskStatus,
  lang,
}) => {
  const t = translations[lang];
  const [filter, setFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<OperationalTask["type"]>("installation");
  const [priority, setPriority] = useState<OperationalTask["priority"]>("medium");
  const [assignee, setAssignee] = useState("Teknisi Dani");
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cust = customers.find((c) => c.id === customerId);

    const newTask: OperationalTask = {
      id: `task-${Date.now()}`,
      title,
      description: desc,
      type,
      priority,
      status: "pending",
      assignee,
      customerId: cust?.id,
      customerName: cust?.name,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onAddTask(newTask);
    setIsModalOpen(false);
    setTitle("");
    setDesc("");
  };

  return (
    <div id="operational-tasks-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Surat Perintah Kerja (SPK) & Tugas Teknisi Lapangan
          </h2>
          <p className="text-xs text-slate-500">
            Pemasangan baru (PSB), perbaikan kabel dropcore, dan pembaruan status pesanan real-time
          </p>
        </div>

        <button
          id="add-task-btn"
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Tugas SPK Baru
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["all", "pending", "in_progress", "completed"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${
              filter === st
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            }`}
          >
            {st === "all" ? "Semua Tugas" : st.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-2 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            Tidak ada tugas teknisi di kategori ini.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isCompleted = t.status === "completed";
            return (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        t.priority === "urgent"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : t.priority === "high"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      Prioritas: {t.priority}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : t.status === "in_progress"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{t.description}</p>

                  {t.customerName && (
                    <div className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Pelanggan: {t.customerName}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t.assignee}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const url = getGoogleCalendarUrl({
                          title: `[SPK NetLancar] ${t.title}`,
                          description: `${t.description}\nTeknisi: ${t.assignee}\nPrioritas: ${t.priority.toUpperCase()}${t.customerName ? `\nPelanggan: ${t.customerName}` : ""}`,
                          location: t.customerName ? `Lokasi Pelanggan: ${t.customerName}` : "Wilayah NetLancar",
                          durationHours: 2,
                        });
                        window.open(url, "_blank");
                      }}
                      title="Simpan Jadwal ke Google Calendar (Tanpa Login API)"
                      className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>

                    {t.status !== "completed" && (
                      <button
                        onClick={() => onUpdateTaskStatus(t.id, "completed")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Tandai Selesai
                      </button>
                    )}
                    {t.status === "pending" && (
                      <button
                        onClick={() => onUpdateTaskStatus(t.id, "in_progress")}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold text-[11px] hover:bg-blue-700"
                      >
                        Mulai Kerjakan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Buat Surat Perintah Kerja (SPK) Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Judul SPK / Pekerjaan *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pasang Baru ONT & Tarik Kabel Dropcore 120m"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Jenis Tugas
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="installation">Pasang Baru (PSB)</option>
                    <option value="repair">Perbaikan Gangguan</option>
                    <option value="maintenance">Maintenance Rutin</option>
                    <option value="dismantle">Bongkar / Cabut Perangkat</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="low">Rendah (Low)</option>
                    <option value="medium">Sedang (Medium)</option>
                    <option value="high">Tinggi (High)</option>
                    <option value="urgent">Mendesak (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Terkait Pelanggan
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.rtRw})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Teknisi yang Ditugaskan
                </label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Nama teknisi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Rincian Deskripsi / Instruksi Tambahan
                </label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Gunakan ODP-MWR-01 Port 3. Pasang ONT di ruang tamu..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Terbitkan SPK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
