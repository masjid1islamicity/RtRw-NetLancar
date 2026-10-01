import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Send,
  Trash2,
  Edit2,
  FileDown,
  Globe,
  Radio,
  Clock,
  Phone,
  CheckCircle2,
  X,
  QrCode,
  ScanLine,
} from "lucide-react";
import { Customer, CustomerStatus, InternetPackage, Invoice } from "../../types";
import { generateWhatsAppLink } from "../../services/storage";
import { exportCustomersToCSV } from "../../services/exportUtils";
import { Language, translations } from "../../translations";
import { CustomerQrModal } from "./CustomerQrModal";
import { CashierScannerModal } from "./CashierScannerModal";

interface CustomerManagementProps {
  customers: Customer[];
  packages: InternetPackage[];
  invoices?: Invoice[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onToggleIsolation: (id: string) => void;
  onProcessCashPayment?: (invoice: Invoice) => void;
  onOpenPaymentGateway?: (invoice: Invoice) => void;
  lang: Language;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  packages,
  invoices = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onToggleIsolation,
  onProcessCashPayment,
  onOpenPaymentGateway,
  lang,
}) => {
  const t = translations[lang];
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedQrCustomer, setSelectedQrCustomer] = useState<Customer | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [rtRw, setRtRw] = useState("RT 02 / RW 04");
  const [packageId, setPackageId] = useState(packages[0]?.id || "pkg-1");
  const [ipAddress, setIpAddress] = useState(`192.168.10.${Math.floor(10 + Math.random() * 80)}`);
  const [pppoeUser, setPppoeUser] = useState("");
  const [oltPort, setOltPort] = useState("PON-1/Slot-2 (ODP-01)");
  const [ontModel, setOntModel] = useState("ZTE F609 GPON");
  const [dueDate, setDueDate] = useState<number>(10);

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.ipAddress.includes(search) ||
      c.pppoeUsername.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setAddress("");
    setRtRw("RT 02 / RW 04");
    setPackageId(packages[0]?.id || "pkg-1");
    setIpAddress(`192.168.10.${Math.floor(10 + Math.random() * 80)}`);
    setPppoeUser("");
    setOltPort("PON-1/Slot-2 (ODP-01)");
    setOntModel("ZTE F609 GPON");
    setDueDate(10);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setRtRw(c.rtRw);
    setPackageId(c.packageId);
    setIpAddress(c.ipAddress);
    setPppoeUser(c.pppoeUsername);
    setOltPort(c.oltPort);
    setOntModel(c.ontModel);
    setDueDate(c.dueDate);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name,
        phone,
        address,
        rtRw,
        packageId,
        ipAddress,
        pppoeUsername: pppoeUser || name.toLowerCase().replace(/\s+/g, "_"),
        oltPort,
        ontModel,
        dueDate,
      });
    } else {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        customerCode: `NET-${String(customers.length + 1).padStart(3, "0")}`,
        name,
        phone,
        address,
        rtRw,
        packageId,
        status: "active",
        ipAddress: ipAddress || `192.168.10.${Math.floor(10 + Math.random() * 80)}`,
        macAddress: `E8:94:F6:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
        pppoeUsername: pppoeUser || name.toLowerCase().replace(/\s+/g, "_"),
        oltPort,
        ontModel,
        joinDate: new Date().toISOString().slice(0, 10),
        dueDate,
        autoIsolateEnabled: true,
        totalPaidCount: 0,
      };
      onAddCustomer(newCustomer);
    }
    setIsModalOpen(false);
  };

  const handleSendWhatsAppChat = (c: Customer) => {
    const text = `Halo Bapak/Ibu ${c.name} (${c.customerCode}), layanan internet NetLancar Anda terhubung normal. Ada yang bisa kami bantu seputar koneksi WiFi atau tagihan bulanan?`;
    window.open(generateWhatsAppLink(c.phone, text), "_blank");
  };

  return (
    <div id="customer-management-view" className="space-y-5 pb-12">
      {/* Action and Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Manajemen Data Pelanggan RT/RW Net
          </h2>
          <p className="text-xs text-slate-500">
            Total {customers.length} pelanggan terdaftar • OLT MikroTik PPPoE Sync
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ScanLine className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Scan QR Kasir
          </button>
          <button
            onClick={() => exportCustomersToCSV(customers)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            CSV
          </button>
          <button
            id="add-new-customer-btn"
            onClick={openAddModal}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.addCustomer}
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, No WA, IP, PPPoE username..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {["all", "active", "isolated", "pending"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${
                filterStatus === st
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {st === "all" ? t.all : st}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">Paket & IP</th>
                <th className="p-3.5">Port OLT & ONT</th>
                <th className="p-3.5">Jatuh Tempo</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ada pelanggan yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const pkg = packages.find((p) => p.id === c.packageId);
                  const isIsolated = c.status === "isolated";
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Name & Phone */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{c.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">
                                ({c.customerCode})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-500" />
                              <span>{c.phone}</span>
                              <span>•</span>
                              <span>{c.rtRw}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Package & IP */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {pkg?.name || "Paket Standar"}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>{c.ipAddress}</span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{c.pppoeUsername}</span>
                        </div>
                      </td>

                      {/* Port OLT */}
                      <td className="p-3.5">
                        <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                          {c.oltPort}
                        </div>
                        <div className="text-[10px] text-slate-400">{c.ontModel}</div>
                      </td>

                      {/* Due Date */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tgl {c.dueDate} Tiap Bulan</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {c.totalPaidCount}x lunas berturut
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : c.status === "isolated"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.status === "active"
                                ? "bg-emerald-500"
                                : c.status === "isolated"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                          ></span>
                          {c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1">
                        {/* Toggle Isolation Button */}
                        <button
                          onClick={() => onToggleIsolation(c.id)}
                          title={isIsolated ? "Buka Isolir Layanan" : "Isolir Koneksi Internet"}
                          className={`p-1.5 rounded-lg border text-xs transition-colors ${
                            isIsolated
                              ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                              : "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
                          }`}
                        >
                          {isIsolated ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Customer Unique QR Code */}
                        <button
                          onClick={() => setSelectedQrCustomer(c)}
                          title="Lihat & Cetak QR Code Unik Pelanggan (Kasir / Pembayaran)"
                          className="p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Direct Chat */}
                        <button
                          onClick={() => handleSendWhatsAppChat(c)}
                          title="Hubungi via WhatsApp"
                          className="p-1.5 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(c)}
                          title="Ubah Data"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteCustomer(c.id)}
                          title="Hapus Pelanggan"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingCustomer ? "Ubah Data Pelanggan" : "Tambah Pelanggan Baru RT/RW Net"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Lengkap Pelanggan *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Alamat Lengkap Rumah
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Melati No. 12"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    RT / RW
                  </label>
                  <input
                    type="text"
                    value={rtRw}
                    onChange={(e) => setRtRw(e.target.value)}
                    placeholder="RT 02 / RW 04"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Pilihan Paket Internet
                  </label>
                  <select
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.speedDownload} Mbps)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    IP Address Static
                  </label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-3 py-2 font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    PPPoE Username
                  </label>
                  <input
                    type="text"
                    value={pppoeUser}
                    onChange={(e) => setPppoeUser(e.target.value)}
                    placeholder="user_rt02"
                    className="w-full px-3 py-2 font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tgl Jatuh Tempo
                  </label>
                  <select
                    value={dueDate}
                    onChange={(e) => setDueDate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value={5}>Tanggal 5</option>
                    <option value={10}>Tanggal 10</option>
                    <option value={15}>Tanggal 15</option>
                    <option value={20}>Tanggal 20</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Port OLT / ODP
                  </label>
                  <input
                    type="text"
                    value={oltPort}
                    onChange={(e) => setOltPort(e.target.value)}
                    placeholder="PON-1/Slot-2 (ODP-MWR-01)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Model Modem ONT
                  </label>
                  <input
                    type="text"
                    value={ontModel}
                    onChange={(e) => setOntModel(e.target.value)}
                    placeholder="ZTE F609 GPON"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Customer Unique QR Code Modal */}
      <CustomerQrModal
        isOpen={!!selectedQrCustomer}
        onClose={() => setSelectedQrCustomer(null)}
        customer={selectedQrCustomer}
        packageInfo={packages.find((p) => p.id === selectedQrCustomer?.packageId)}
        activeInvoice={
          selectedQrCustomer
            ? invoices.find(
                (i) =>
                  i.customerId === selectedQrCustomer.id &&
                  (i.status === "unpaid" || i.status === "overdue")
              ) || null
            : null
        }
        lang={lang}
        onProcessCashPayment={onProcessCashPayment}
        onOpenPaymentGateway={onOpenPaymentGateway}
      />

      {/* Cashier Scanner Modal */}
      <CashierScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        customers={customers}
        packages={packages}
        invoices={invoices}
        onSelectCustomerQr={(c) => {
          setSelectedQrCustomer(c);
        }}
        onPayInvoiceCash={(inv) => {
          if (onProcessCashPayment) onProcessCashPayment(inv);
        }}
        onOpenPaymentGateway={(inv) => {
          if (onOpenPaymentGateway) onOpenPaymentGateway(inv);
        }}
        lang={lang}
      />
    </div>
  );
};
