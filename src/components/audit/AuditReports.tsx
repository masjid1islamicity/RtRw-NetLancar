import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  Building,
  ShieldCheck,
  Users,
  FileText,
  FileDown,
  Filter,
  DollarSign,
  Layers,
  Check,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { Customer, FinancialTransaction, Invoice, Wallet, InternetPackage, AuditLogEntry } from "../../types";
import { formatRupiah, getStoredAuditLogs } from "../../services/storage";
import {
  exportFinancialReportToExcel,
  exportFinancialReportToPDF,
  exportCustomersToExcel,
  exportCustomersToPDF,
  exportFinancialReportToCSV,
} from "../../services/exportUtils";
import { Language, translations } from "../../translations";
import { initialPackages } from "../../data/initialData";
import { AuditTrail } from "./AuditTrail";

interface AuditReportsProps {
  customers: Customer[];
  invoices: Invoice[];
  wallets: Wallet[];
  transactions: FinancialTransaction[];
  packages?: InternetPackage[];
  auditLogs?: AuditLogEntry[];
  onAddAuditLog?: (entry: Omit<AuditLogEntry, "id" | "timestamp">) => void;
  lang: Language;
}

export const AuditReports: React.FC<AuditReportsProps> = ({
  customers,
  invoices,
  wallets,
  transactions,
  packages = initialPackages,
  auditLogs: auditLogsProp,
  onAddAuditLog,
  lang,
}) => {
  const t = translations[lang];

  // Resolve Audit Logs
  const auditLogs = auditLogsProp || getStoredAuditLogs();

  // Financial Filters & States
  const [selectedMonth, setSelectedMonth] = useState<string>("Oktober 2026");
  const [previewTab, setPreviewTab] = useState<"finance" | "customers" | "audit_trail">("finance");

  // Customer Filters & States
  const [customerRtFilter, setCustomerRtFilter] = useState<string>("all");
  const [customerStatusFilter, setCustomerStatusFilter] = useState<string>("all");
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Available Months for Financial Audit
  const availableMonths = [
    "Oktober 2026",
    "September 2026",
    "Agustus 2026",
    "Juli 2026",
    "Juni 2026",
    "Mei 2026",
    "Semua Periode",
  ];

  // Distinct RT/RW list
  const rtRwOptions = useMemo(() => {
    const list = Array.from(new Set(customers.map((c) => c.rtRw).filter(Boolean))).sort();
    return list;
  }, [customers]);

  // Package map
  const packageMap = useMemo(() => {
    return new Map(packages.map((p) => [p.id, p]));
  }, [packages]);

  // Filtered Transactions for Financial view
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === "Semua Periode") return transactions;
    return transactions.filter((tx) => {
      if (tx.description?.includes(selectedMonth)) return true;
      const txDate = new Date(tx.date);
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const txPeriod = `${monthNames[txDate.getMonth()]} ${txDate.getFullYear()}`;
      return txPeriod.toLowerCase() === selectedMonth.toLowerCase();
    });
  }, [transactions, selectedMonth]);

  const activeTxList = filteredTransactions.length > 0 ? filteredTransactions : transactions;

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    if (selectedMonth === "Semua Periode") return invoices;
    return invoices.filter((i) => i.periodMonth.toLowerCase() === selectedMonth.toLowerCase());
  }, [invoices, selectedMonth]);

  const activeInvList = filteredInvoices.length > 0 ? filteredInvoices : invoices;

  // Financial Calculations
  const totalInvoiced = activeInvList.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = activeInvList
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + i.totalAmount, 0);
  const totalUnpaid = totalInvoiced - totalPaid;
  const complianceRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  const totalIncome = activeTxList
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = activeTxList
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (customerRtFilter !== "all" && c.rtRw !== customerRtFilter) return false;
      if (customerStatusFilter !== "all" && c.status !== customerStatusFilter) return false;
      if (customerSearchQuery) {
        const query = customerSearchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.customerCode.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          c.ipAddress.includes(query) ||
          c.oltPort.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [customers, customerRtFilter, customerStatusFilter, customerSearchQuery]);

  const customerTotalRevenue = useMemo(() => {
    return filteredCustomers.reduce((acc, c) => {
      const pkg = packageMap.get(c.packageId);
      return acc + (pkg?.price || 0);
    }, 0);
  }, [filteredCustomers, packageMap]);

  // Handlers for Financial Exports
  const handleExportFinanceExcel = () => {
    exportFinancialReportToExcel(transactions, wallets, invoices, selectedMonth);
    showToast(`Laporan Keuangan (${selectedMonth}) berhasil diekspor ke format Excel (.xlsx)`);
  };

  const handleExportFinancePDF = () => {
    exportFinancialReportToPDF({
      transactions,
      wallets,
      invoices,
      customers,
      periodMonth: selectedMonth,
    });
    showToast(`Dokumen Resmi Laporan Keuangan (${selectedMonth}) berhasil diekspor ke PDF (.pdf)`);
  };

  // Handlers for Customer Exports
  const handleExportCustomerExcel = () => {
    exportCustomersToExcel(customers, packages, {
      filterRtRw: customerRtFilter,
      filterStatus: customerStatusFilter,
    });
    showToast(`Data Pelanggan (${filteredCustomers.length} warga) berhasil diekspor ke format Excel (.xlsx)`);
  };

  const handleExportCustomerPDF = () => {
    exportCustomersToPDF(customers, packages, {
      filterRtRw: customerRtFilter,
      filterStatus: customerStatusFilter,
    });
    showToast(`Buku Induk Data Pelanggan (${filteredCustomers.length} warga) berhasil diekspor ke PDF (.pdf)`);
  };

  const handlePrintAudit = () => {
    window.print();
  };

  return (
    <div id="audit-reports-view" className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="export-toast-notification"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-100">Ekspor Berhasil</p>
            <p className="text-[11px] text-slate-300">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Modul Administrasi & Arsip
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Format PDF & Excel XLSX</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Laporan Keuangan & Data Pelanggan RT/RW Net
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pusat ekspor dokumen resmi pembukuan kas, buku induk pelanggan, dan arsip pertanggungjawaban pengurus paguyuban
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setPreviewTab("finance")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                previewTab === "finance"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Laporan Kas
            </button>
            <button
              onClick={() => setPreviewTab("customers")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                previewTab === "customers"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Data Pelanggan
            </button>
            <button
              onClick={() => setPreviewTab("audit_trail")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                previewTab === "audit_trail"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Audit Trail (Keamanan)
            </button>
          </div>

          <button
            onClick={handlePrintAudit}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Cetak Fisik
          </button>
        </div>
      </div>

      {/* PUSAT EKSPOR & ARSIP ADMINISTRASI (DUAL CARDS) */}
      {previewTab !== "audit_trail" && (
        <div id="export-archive-hub" className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:hidden">
        {/* CARD 1: EKSPOR LAPORAN KEUANGAN */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-900 transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Ekspor Laporan Keuangan
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Buku kas umum, arus penerimaan & pengeluaran, serta mutasi dompet
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                Resmi RT/RW
              </span>
            </div>

            {/* Filter Periode */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Pilih Periode Bulan Laporan:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Snapshot metrics */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Pemasukan</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(totalIncome)}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Pengeluaran</span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {formatRupiah(totalExpense)}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Sisa Bersih</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {formatRupiah(netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Ekspor PDF */}
            <button
              onClick={handleExportFinancePDF}
              id="export-finance-pdf-button"
              className="group px-3.5 py-2.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-extrabold text-[12px]">Ekspor PDF (.pdf)</div>
                  <div className="text-[10px] text-rose-500 font-normal">Berkas kop & tanda tangan</div>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                PDF
              </span>
            </button>

            {/* Ekspor Excel */}
            <button
              onClick={handleExportFinanceExcel}
              id="export-finance-excel-button"
              className="group px-3.5 py-2.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-extrabold text-[12px]">Ekspor Excel (.xlsx)</div>
                  <div className="text-[10px] text-emerald-600 font-normal">Workbook 3 lembar kerja</div>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                XLSX
              </span>
            </button>
          </div>
        </div>

        {/* CARD 2: EKSPOR DATA PELANGGAN */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-200 dark:hover:border-emerald-900 transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Ekspor Data Pelanggan & Jaringan
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Buku induk warga, port OLT/ODP, paket langganan, dan status sambungan
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                Data Induk
              </span>
            </div>

            {/* Filter Wilayah & Status */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Wilayah RT / RW:
                  </label>
                  <select
                    value={customerRtFilter}
                    onChange={(e) => setCustomerRtFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Semua Wilayah ({customers.length})</option>
                    {rtRwOptions.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt} ({customers.filter((c) => c.rtRw === rt).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Status Sambungan:
                  </label>
                  <select
                    value={customerStatusFilter}
                    onChange={(e) => setCustomerStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Aktif Saja</option>
                    <option value="isolated">Terisolir Saja</option>
                  </select>
                </div>
              </div>

              {/* Snapshot metrics */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Pelanggan</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {filteredCustomers.length} Warga
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Aktif</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {filteredCustomers.filter((c) => c.status === "active").length} Sambungan
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Potensi Iuran</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {formatRupiah(customerTotalRevenue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Ekspor PDF */}
            <button
              onClick={handleExportCustomerPDF}
              id="export-customer-pdf-button"
              className="group px-3.5 py-2.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-extrabold text-[12px]">Ekspor PDF (.pdf)</div>
                  <div className="text-[10px] text-rose-500 font-normal">Format Landscape Resmi</div>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                PDF
              </span>
            </button>

            {/* Ekspor Excel */}
            <button
              onClick={handleExportCustomerExcel}
              id="export-customer-excel-button"
              className="group px-3.5 py-2.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-extrabold text-[12px]">Ekspor Excel (.xlsx)</div>
                  <div className="text-[10px] text-emerald-600 font-normal">Data Induk + Rekap RT/RW</div>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                XLSX
              </span>
            </button>
          </div>
        </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW & AUDIT TRAIL SECTION */}
      {previewTab === "audit_trail" ? (
        <AuditTrail logs={auditLogs} onAddLog={onAddAuditLog} lang={lang} />
      ) : previewTab === "finance" ? (
        /* OFFICIAL FINANCIAL AUDIT SHEET */
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 text-xs text-slate-900 dark:text-slate-100">
          {/* Document Header */}
          <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-6 space-y-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
              LAPORAN KINERJA & AUDIT KEUANGAN RESMI
            </span>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              PAGUYUBAN RT/RW NET "NETLANCAR"
            </h1>
            <p className="text-xs text-slate-500">
              Laporan Realisasi Kas & Penagihan Periode: <strong>{selectedMonth}</strong>
            </p>
            <div className="text-[10px] text-slate-400">
              Dicetak otomatis dari NetLancar Central Cloud Ledger • Tanggal:{" "}
              {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pemasukan</span>
              <div className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatRupiah(totalIncome)}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Biaya Operasional</span>
              <div className="text-sm sm:text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                {formatRupiah(totalExpense)}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sisa Kas Bersih</span>
              <div className="text-sm sm:text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                {formatRupiah(netProfit)}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Kepatuhan Warga</span>
              <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {complianceRate}% ({activeInvList.filter((i) => i.status === "paid").length}/{activeInvList.length})
              </div>
            </div>
          </div>

          {/* Wallets Position Mini Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span>1. Posisi Kas & Saldo Dompet Bendahara</span>
              <span className="text-xs font-normal text-slate-500">
                Total Likuiditas: <strong>{formatRupiah(wallets.reduce((a, b) => a + b.balance, 0))}</strong>
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {wallets.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{w.name}</div>
                    <div className="text-[10px] text-slate-400">{w.accountNumber || "Kas Tunai"}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {formatRupiah(w.balance)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rincian Pos Keuangan */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
              <span>2. Rincian Penerimaan & Pengeluaran Kas (Cash Flow)</span>
              <span className="text-[11px] font-normal text-slate-500">
                {activeTxList.length} Transaksi Tercatat
              </span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                  <tr>
                    <th className="p-3 text-left">Kode Pos</th>
                    <th className="p-3 text-left">Tanggal</th>
                    <th className="p-3 text-left">Pos Anggaran & Keterangan</th>
                    <th className="p-3 text-left">Metode Kas</th>
                    <th className="p-3 text-right">Debit (Masuk)</th>
                    <th className="p-3 text-right">Kredit (Keluar)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {activeTxList.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono text-slate-400 text-[11px]">POS-{String(idx + 1).padStart(3, "0")}</td>
                      <td className="p-2.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">{tx.date}</td>
                      <td className="p-2.5">
                        <span className="font-semibold text-slate-900 dark:text-white">{tx.category}</span>
                        <span className="text-slate-500 block text-[11px]">{tx.description}</span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                        {tx.walletName || "Kas"}
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {tx.type === "income" ? formatRupiah(tx.amount) : "-"}
                      </td>
                      <td className="p-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                        {tx.type === "expense" ? formatRupiah(tx.amount) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold">
                  <tr>
                    <td colSpan={4} className="p-3 text-right">
                      TOTAL KESELURUHAN ({selectedMonth}):
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(totalIncome)}
                    </td>
                    <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400">
                      {formatRupiah(totalExpense)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Breakdown per RT/RW */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              3. Distribusi Pelanggan & Wilayah RT / RW
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">RT 01 & RT 02 / RW 04</span>
                <div className="text-slate-500 mt-1">24 Pelanggan • 100% Aktif</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">ODP Melati (ODP-01 s/d 03)</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">RT 03 & RT 04 / RW 04</span>
                <div className="text-slate-500 mt-1">32 Pelanggan • 1 Terisolir</div>
                <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">ODP Mawar (ODP-04 s/d 06)</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">RW 05 Graha Asri</span>
                <div className="text-slate-500 mt-1">28 Pelanggan • 100% Aktif</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">ODP Graha (ODP-07 s/d 09)</div>
              </div>
            </div>
          </div>

          {/* Verification Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-10 text-center border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-400 text-[11px] block mb-12">Ketua RW 04 / RW 05</span>
              <span className="font-bold text-slate-900 dark:text-white border-b border-slate-400 pb-0.5 inline-block">
                H. Bambang Sukoco, S.T.
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-12">Bendahara Paguyuban</span>
              <span className="font-bold text-slate-900 dark:text-white border-b border-slate-400 pb-0.5 inline-block">
                Siti Rahayu, S.E.
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-12">Koordinator Teknisi ISP</span>
              <span className="font-bold text-slate-900 dark:text-white border-b border-slate-400 pb-0.5 inline-block">
                Dani Pratama (NOC Lead)
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* CUSTOMER MASTER DIRECTORY PREVIEW */
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 text-xs text-slate-900 dark:text-slate-100">
          {/* Document Header */}
          <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-6 space-y-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
              BUKU INDUK ADMINISTRASI PELANGGAN & JARINGAN FIBER OPTIC
            </span>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              PAGUYUBAN RT/RW NET "NETLANCAR"
            </h1>
            <p className="text-xs text-slate-500">
              Daftar Registrasi Pelanggan Wilayah:{" "}
              <strong>{customerRtFilter === "all" ? "Semua RT / RW" : customerRtFilter}</strong> • Status:{" "}
              <strong>{customerStatusFilter === "all" ? "Semua Status" : customerStatusFilter}</strong>
            </p>
            <div className="text-[10px] text-slate-400">
              Total Terdata: {filteredCustomers.length} Warga • Potensi Iuran Bulanan: {formatRupiah(customerTotalRevenue)}
            </div>
          </div>

          {/* Quick Search & Filter bar within preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari nama, kode, WhatsApp, IP..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-64"
              />
              {customerSearchQuery && (
                <button
                  onClick={() => setCustomerSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCustomerPDF}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1.5 shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5" />
                Unduh PDF Pelanggan
              </button>
              <button
                onClick={handleExportCustomerExcel}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Unduh Excel Pelanggan
              </button>
            </div>
          </div>

          {/* Customer Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                <tr>
                  <th className="p-3 text-left">Kode</th>
                  <th className="p-3 text-left">Nama Pelanggan</th>
                  <th className="p-3 text-left">WhatsApp</th>
                  <th className="p-3 text-left">Wilayah RT/RW</th>
                  <th className="p-3 text-left">Paket & Tarif</th>
                  <th className="p-3 text-left">IP Address</th>
                  <th className="p-3 text-left">Port OLT / ODP</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-left">Tgl Daftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                {filteredCustomers.map((c) => {
                  const pkg = packageMap.get(c.packageId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {c.customerCode}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                        {c.name}
                        <span className="text-[10px] text-slate-400 font-normal block">{c.address}</span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 font-mono">{c.phone}</td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300 font-medium">{c.rtRw}</td>
                      <td className="p-2.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {pkg ? pkg.name : c.packageId}
                        </span>
                        <span className="text-slate-500 block font-mono text-[10px]">
                          {pkg ? formatRupiah(pkg.price) : "-"}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">{c.ipAddress}</td>
                      <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">{c.oltPort}</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {c.status === "active" ? "Aktif" : "Isolir"}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-500 text-[10px]">{c.joinDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom administrative signatures */}
          <div className="grid grid-cols-2 gap-6 pt-8 text-center border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-400 text-[11px] block mb-12">Ketua Paguyuban RT/RW Net</span>
              <span className="font-bold text-slate-900 dark:text-white border-b border-slate-400 pb-0.5 inline-block">
                H. Bambang Sukoco, S.T.
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-12">Koordinator Administrasi & Pendataan</span>
              <span className="font-bold text-slate-900 dark:text-white border-b border-slate-400 pb-0.5 inline-block">
                Siti Rahayu, S.E.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
