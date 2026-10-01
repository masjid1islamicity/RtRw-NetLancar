import React, { useState, useMemo } from "react";
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  Building2,
  Banknote,
  Wallet,
  FileText,
  Copy,
  Check,
  Search,
  ArrowUpDown,
  Filter,
  Calendar,
  CreditCard,
  Printer,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Tag,
  Download,
} from "lucide-react";
import { Invoice, PaymentMethod, Customer } from "../../types";
import { formatRupiah, formatDate } from "../../services/storage";
import { exportCustomerPaymentHistoryToCSV } from "../../services/exportUtils";
import { Language, translations } from "../../translations";

interface CustomerTransactionHistoryProps {
  customer: Customer;
  invoices: Invoice[];
  onOpenPrintModal: (invoice: Invoice) => void;
  onOpenPaymentModal: (invoice: Invoice) => void;
  lang: Language;
}

export const CustomerTransactionHistory: React.FC<CustomerTransactionHistoryProps> = ({
  customer,
  invoices,
  onOpenPrintModal,
  onOpenPaymentModal,
  lang,
}) => {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Filter only this customer's invoices
  const customerInvoices = useMemo(() => {
    return invoices.filter((i) => i.customerId === customer.id);
  }, [invoices, customer.id]);

  // Handle CSV Download
  const handleDownloadCsv = () => {
    const exportData = filteredInvoices.length > 0 ? filteredInvoices : customerInvoices;
    if (exportData.length === 0) return;
    exportCustomerPaymentHistoryToCSV(customer, exportData);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2500);
  };

  // Handle copying reference code
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(id);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const paidList = customerInvoices.filter((i) => i.status === "paid");
    const totalPaid = paidList.reduce((acc, curr) => acc + curr.totalAmount, 0);

    // Most used method
    const methodCounts: Record<string, number> = {};
    paidList.forEach((inv) => {
      const m = inv.paymentMethod || "OTHER";
      methodCounts[m] = (methodCounts[m] || 0) + 1;
    });
    let topMethod = "-";
    let maxCount = 0;
    Object.entries(methodCounts).forEach(([m, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topMethod = m;
      }
    });

    // Last payment date
    const sortedPaid = [...paidList].sort((a, b) => {
      const dateA = a.paidDate ? new Date(a.paidDate).getTime() : 0;
      const dateB = b.paidDate ? new Date(b.paidDate).getTime() : 0;
      return dateB - dateA;
    });
    const lastPaid = sortedPaid[0] || null;

    return {
      totalPaidCount: paidList.length,
      totalPaidAmount: totalPaid,
      topMethod,
      lastPaid,
    };
  }, [customerInvoices]);

  // Filtered & Chronologically Sorted List
  const filteredInvoices = useMemo(() => {
    return customerInvoices
      .filter((inv) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
          const matchPeriod = inv.periodMonth.toLowerCase().includes(q);
          const matchRef = (inv.paymentRef || "").toLowerCase().includes(q);
          const matchNotes = (inv.notes || "").toLowerCase().includes(q);
          if (!matchInv && !matchPeriod && !matchRef && !matchNotes) return false;
        }

        // Status filter
        if (statusFilter !== "all" && inv.status !== statusFilter) {
          return false;
        }

        // Method filter
        if (methodFilter !== "all") {
          if (methodFilter === "VA") {
            if (!inv.paymentMethod?.includes("VA")) return false;
          } else if (methodFilter === "EWALLET") {
            if (
              inv.paymentMethod !== "DANA" &&
              inv.paymentMethod !== "GOPAY" &&
              inv.paymentMethod !== "OVO"
            )
              return false;
          } else if (inv.paymentMethod !== methodFilter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sort chronologically based on paidDate or dueDate
        const timeA = new Date(a.paidDate || a.dueDate || 0).getTime();
        const timeB = new Date(b.paidDate || b.dueDate || 0).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [customerInvoices, searchQuery, statusFilter, methodFilter, sortOrder]);

  const getMethodBadge = (method?: PaymentMethod) => {
    switch (method) {
      case "QRIS":
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold text-[10px] inline-flex items-center gap-1">
            <QrCode className="w-3 h-3 text-rose-600" />
            QRIS Dinamis
          </span>
        );
      case "BCA_VA":
      case "MANDIRI_VA":
      case "BRI_VA":
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-bold text-[10px] inline-flex items-center gap-1">
            <Building2 className="w-3 h-3 text-blue-600" />
            {method.replace("_", " ")}
          </span>
        );
      case "CASH":
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
            <Banknote className="w-3 h-3 text-emerald-600" />
            Tunai / Kasir RT/RW
          </span>
        );
      case "DANA":
      case "GOPAY":
      case "OVO":
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 font-bold text-[10px] inline-flex items-center gap-1">
            <Wallet className="w-3 h-3 text-purple-600" />
            {method}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
            {method || "Belum Bayar"}
          </span>
        );
    }
  };

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-extrabold inline-flex items-center gap-1 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            LUNAS
          </span>
        );
      case "overdue":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10.5px] font-extrabold inline-flex items-center gap-1 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            JATUH TEMPO
          </span>
        );
      case "unpaid":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10.5px] font-extrabold inline-flex items-center gap-1 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            MENUNGGU BAYAR
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 text-[10.5px] font-bold">
            {status}
          </span>
        );
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div
      id="customer-transaction-history-section"
      className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
    >
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
              Riwayat Transaksi & Pembayaran
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Histori kronologis seluruh pembayaran langganan internet, nomor referensi, dan kwitansi resmi.
          </p>
        </div>

        {/* View Mode, Export & Sorting Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Tombol Unduh CSV */}
          <button
            type="button"
            id="download-customer-history-csv-btn"
            onClick={handleDownloadCsv}
            disabled={customerInvoices.length === 0}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
              isDownloaded
                ? "bg-emerald-600 text-white border border-emerald-600"
                : "border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Ekspor riwayat transaksi pelanggan ke format file CSV (kompatibel dengan Excel & Google Sheets)"
          >
            {isDownloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>CSV Berhasil Diunduh</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Unduh CSV</span>
              </>
            )}
          </button>

          {/* Timeline vs Table */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "timeline"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Garis Waktu
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Tabel Rinci
            </button>
          </div>

          {/* Chronological Sort Toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            title={`Urutan: ${sortOrder === "desc" ? "Terbaru ke Terlama" : "Terlama ke Terbaru"}`}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">
              {sortOrder === "desc" ? "Terkini" : "Terlama"}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Highlights Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Transaksi Lunas
          </span>
          <div className="text-lg font-black text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">
            {stats.totalPaidCount} Kali
          </div>
          <span className="text-[10px] text-indigo-500 font-medium flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Pelanggan Disiplin
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Akumulasi Terbayar
          </span>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
            {formatRupiah(stats.totalPaidAmount)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Histori Terverifikasi</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Metode Favorit
          </span>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
            {stats.topMethod.replace("_", " ")}
          </div>
          <span className="text-[10px] text-slate-400">Paling sering digunakan</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Pembayaran Terakhir
          </span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
            {stats.lastPaid?.paidDate ? formatDate(stats.lastPaid.paidDate) : "-"}
          </div>
          <span className="text-[10px] text-slate-400 font-mono truncate block">
            {stats.lastPaid?.paymentRef || stats.lastPaid?.periodMonth || "Belum ada"}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between text-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor invoice, bulan, atau no. referensi..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer text-xs"
        >
          <option value="all">Semua Status</option>
          <option value="paid">Lunas (Paid)</option>
          <option value="unpaid">Menunggu Bayar</option>
          <option value="overdue">Jatuh Tempo (Overdue)</option>
        </select>

        {/* Method Filter */}
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer text-xs"
        >
          <option value="all">Semua Metode Bayar</option>
          <option value="QRIS">QRIS Dinamis / Statis</option>
          <option value="VA">Virtual Account (BCA/Mandiri/BRI)</option>
          <option value="CASH">Setor Tunai Kasir</option>
          <option value="EWALLET">E-Wallet (DANA/OVO/GoPay)</option>
        </select>

        {(searchQuery || statusFilter !== "all" || methodFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setMethodFilter("all");
            }}
            className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* CHRONOLOGICAL TIMELINE VIEW */}
      {viewMode === "timeline" && (
        <div className="space-y-4 pt-2">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Tidak ada riwayat transaksi yang cocok dengan filter.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {filteredInvoices.map((inv, idx) => {
                const isPaid = inv.status === "paid";
                const isOverdue = inv.status === "overdue";
                const dateToDisplay = inv.paidDate || inv.dueDate;

                return (
                  <div key={inv.id} className="relative group">
                    {/* Timeline Node Bullet */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-xs transition-transform group-hover:scale-110 ${
                        isPaid
                          ? "bg-emerald-500 border-white text-white"
                          : isOverdue
                          ? "bg-rose-500 border-white text-white animate-pulse"
                          : "bg-amber-400 border-white text-white"
                      }`}
                    >
                      {isPaid ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : isOverdue ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                    </div>

                    {/* Timeline Transaction Card */}
                    <div
                      className={`p-4 rounded-2xl border transition-all duration-200 ${
                        isPaid
                          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-2xs hover:shadow-xs"
                          : isOverdue
                          ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs"
                          : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                      }`}
                    >
                      {/* Card Header: Period & Invoice Meta */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {inv.periodMonth}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {inv.invoiceNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(inv.status)}
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {isPaid ? `Lunas: ${formatDate(inv.paidDate!)}` : `Tempo: ${inv.dueDate}`}
                          </span>
                        </div>
                      </div>

                      {/* Card Body: Amount & Payment Channel */}
                      <div className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                        <div className="sm:col-span-4">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Total Dibayar
                          </span>
                          <span className="text-xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                            {formatRupiah(inv.totalAmount)}
                          </span>
                          <span className="text-[10.5px] text-slate-500 block truncate">
                            {inv.packageName}
                          </span>
                        </div>

                        <div className="sm:col-span-5 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Saluran Pembayaran
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getMethodBadge(inv.paymentMethod)}
                            {inv.paymentRef && (
                              <button
                                type="button"
                                onClick={() => handleCopy(inv.paymentRef!, inv.id)}
                                title="Salin Nomor Referensi"
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-mono text-[10px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>Ref: {inv.paymentRef}</span>
                                {copiedRef === inv.id ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            )}
                          </div>
                          {inv.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                              "{inv.notes}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="sm:col-span-3 flex sm:flex-col items-center sm:items-end justify-end gap-2">
                          {isPaid ? (
                            <button
                              type="button"
                              onClick={() => onOpenPrintModal(inv)}
                              className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              Kwitansi Resmi
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenPaymentModal(inv)}
                              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Bayar Sekarang
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAILED TABLE VIEW */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold text-[11px]">
              <tr>
                <th className="p-3.5">No Invoice</th>
                <th className="p-3.5">Periode Tagihan</th>
                <th className="p-3.5">Tanggal Bayar / Tempo</th>
                <th className="p-3.5">Metode Bayar</th>
                <th className="p-3.5">No. Referensi</th>
                <th className="p-3.5">Nominal</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      {inv.periodMonth}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {inv.paidDate ? formatDate(inv.paidDate) : `Tempo: ${inv.dueDate}`}
                    </td>
                    <td className="p-3.5">{getMethodBadge(inv.paymentMethod)}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {inv.paymentRef || "-"}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(inv.totalAmount)}
                    </td>
                    <td className="p-3.5">{getStatusBadge(inv.status)}</td>
                    <td className="p-3.5 text-right">
                      {inv.status === "paid" ? (
                        <button
                          type="button"
                          onClick={() => onOpenPrintModal(inv)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-indigo-500" />
                          Kwitansi
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenPaymentModal(inv)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredInvoices.length > 0 && (
            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Menampilkan <strong className="text-slate-700 dark:text-slate-200">{filteredInvoices.length}</strong> dari{" "}
                <strong className="text-slate-700 dark:text-slate-200">{customerInvoices.length}</strong> total transaksi
              </span>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Tabel CSV</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
