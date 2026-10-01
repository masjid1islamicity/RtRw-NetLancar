import React from "react";
import {
  Users,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Wallet,
  AlertTriangle,
  Send,
  Zap,
  CheckCircle,
  PlusCircle,
  Clock,
  ShieldCheck,
  Server,
  FileSpreadsheet,
} from "lucide-react";
import {
  Customer,
  FinancialTransaction,
  Invoice,
  Wallet as WalletType,
  OutageAlert,
} from "../../types";
import { formatRupiah, generateWhatsAppLink } from "../../services/storage";
import { Language, translations } from "../../translations";
import { MonthlyTrendsBarChart } from "./MonthlyTrendsBarChart";
import { MonthlyRevenueProjectionLineChart } from "./MonthlyRevenueProjectionLineChart";
import { NetworkHealthWeatherCard } from "./NetworkHealthWeatherCard";

interface OverviewDashboardProps {
  customers: Customer[];
  invoices: Invoice[];
  wallets: WalletType[];
  transactions: FinancialTransaction[];
  outages: OutageAlert[];
  onNavigateTab: (tab: string) => void;
  onOpenAddCustomer: () => void;
  onOpenTransfer: () => void;
  onOpenOutageBroadcast: () => void;
  onOpenPaymentModal: (inv: Invoice) => void;
  lang: Language;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  customers,
  invoices,
  wallets,
  transactions,
  outages,
  onNavigateTab,
  onOpenAddCustomer,
  onOpenTransfer,
  onOpenOutageBroadcast,
  onOpenPaymentModal,
  lang,
}) => {
  const t = translations[lang];

  // Calculated metrics
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const isolatedCustomers = customers.filter((c) => c.status === "isolated").length;

  const globalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const monthlyIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const netProfit = monthlyIncome - monthlyExpense;

  const unpaidInvoices = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue");
  const unpaidTotal = unpaidInvoices.reduce((acc, i) => acc + i.totalAmount, 0);

  const handleSendReminderWA = (inv: Invoice) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    const phone = cust?.phone || "08123456789";
    const text = `Halo Bapak/Ibu ${inv.customerName}, pengingat tagihan internet NetLancar (${inv.packageName}) sebesar ${formatRupiah(
      inv.totalAmount
    )} untuk periode ${inv.periodMonth} jatuh tempo pada ${inv.dueDate}.
Mohon segera melakukan pembayaran via QRIS atau Virtual Account di aplikasi NetLancar agar koneksi tetap lancar dan tidak terisolir otomatis. Terima kasih! 🙏`;
    window.open(generateWhatsAppLink(phone, text), "_blank");
  };

  return (
    <div id="overview-dashboard-view" className="space-y-6 pb-12">
      {/* Top Banner Alert if Outage is active */}
      {outages.some((o) => o.status !== "resolved") && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">
                {outages[0].title} ({outages[0].affectedArea})
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Alasan: {outages[0].reason} • Estimasi Selesai: {outages[0].estimatedFixTime}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("outage")}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors shrink-0"
          >
            Lihat Broadcast WA
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Global Multi-Dompet */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t.globalBalance}</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-2">
            {formatRupiah(globalBalance)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{wallets.length} Dompet Aktif (Kas & Bank)</span>
          </div>
        </div>

        {/* Card 2: Pemasukan & Laba Bersih */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t.monthlyRevenue}</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-2">
            {formatRupiah(monthlyIncome)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Laba Bersih: {formatRupiah(netProfit)}</span>
          </div>
        </div>

        {/* Card 3: Pelanggan Aktif vs Isolir */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t.activeSubscribers}</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {activeCustomers}
            </span>
            <span className="text-xs text-slate-400">/ {customers.length} total</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-slate-500">{isolatedCustomers} terisolir</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {Math.round((activeCustomers / (customers.length || 1)) * 100)}% online
            </span>
          </div>
        </div>

        {/* Card 4: Tagihan Belum Lunas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t.unpaidBills}</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-2">
            {formatRupiah(unpaidTotal)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>{unpaidInvoices.length} invoice menunggu pelunasan</span>
          </div>
        </div>
      </div>

      {/* Network Health Score Weather Card (Real-time Mikrotik Ping & Loss) */}
      <NetworkHealthWeatherCard
        onNavigateTab={onNavigateTab}
        lang={lang}
      />

      {/* Action shortcuts */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
        <button
          onClick={onOpenAddCustomer}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          {t.addCustomer}
        </button>

        <button
          onClick={onOpenTransfer}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Zap className="w-4 h-4 text-amber-500" />
          {t.transferBalance}
        </button>

        <button
          onClick={onOpenOutageBroadcast}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Send className="w-4 h-4 text-emerald-500" />
          {t.broadcastOutage}
        </button>

        <button
          onClick={() => onNavigateTab("billing")}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Receipt className="w-4 h-4 text-indigo-500" />
          {t.generateInvoices}
        </button>

        <button
          onClick={() => onNavigateTab("audit")}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          {t.exportExcel}
        </button>
      </div>

      {/* 6-Month Monthly Revenue & Subscriber Growth Bar Chart */}
      <MonthlyTrendsBarChart
        customers={customers}
        invoices={invoices}
        transactions={transactions}
        lang={lang}
      />

      {/* Monthly Revenue Projection Line Chart based on Invoice Trends */}
      <MonthlyRevenueProjectionLineChart
        invoices={invoices}
        transactions={transactions}
        customers={customers}
        lang={lang}
      />

      {/* Main Two Columns: Live Bandwidth preview & Wallets summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Bandwidth Traffic Pulse & Core Router */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                Pemantauan Bandwidth Real-Time (Core Uplink)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pipa Upstream Fiber 1 Gbps Dedicated • RTT Ping 11 ms
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("bandwidth")}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Monitor Lengkap &gt;
            </button>
          </div>

          {/* Real-time SVG Bandwidth waveform */}
          <div className="h-44 w-full bg-slate-950 rounded-xl p-3 relative overflow-hidden border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400 z-10">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  Download: <strong className="text-emerald-400 font-mono">684 Mbps</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  Upload: <strong className="text-blue-400 font-mono">248 Mbps</strong>
                </span>
              </div>
              <span className="text-emerald-400 font-mono">Status: NORMAL</span>
            </div>

            {/* Wave lines simulation */}
            <svg className="absolute inset-0 w-full h-full preserve-3d" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 120 Q 80 40, 160 80 T 320 60 T 480 100 T 640 50 T 800 90 T 960 40 L 960 176 L 0 176 Z"
                fill="url(#dlGradient)"
              />
              <path
                d="M 0 120 Q 80 40, 160 80 T 320 60 T 480 100 T 640 50 T 800 90 T 960 40"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />
              <path
                d="M 0 145 Q 80 110, 160 130 T 320 120 T 480 135 T 640 115 T 800 130 T 960 110"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </svg>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 z-10 pt-2 border-t border-slate-800/80">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span className="text-emerald-400 font-bold">LIVE PEAK</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Jatuh Tempo Mendekat</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tgl 10 & 15 Tiap Bulan
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Kapasitas Port GPON</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                4 / 8 Port Terpasang
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Total Penggunaan Bulan</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                18.4 Terabyte
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Dompet Cash & Rekening (Screenshot Match!) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-500" />
                Dompet Cash & Rekening
              </h3>
              <button
                onClick={() => onNavigateTab("finance")}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Kelola &gt;
              </button>
            </div>

            <div className="space-y-2.5">
              {wallets.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {w.type === "cash" ? "💵" : w.type === "bank" ? "🏦" : "📱"}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {w.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {w.accountNumber || "Kasir Tunai"}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                    {formatRupiah(w.balance)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenTransfer}
            className="w-full mt-4 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
          >
            + Pindah Saldo Antar Dompet
          </button>
        </div>
      </div>

      {/* Bottom Row: Tagihan Jatuh Tempo & Quick Action WhatsApp */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Tagihan Pelanggan Menunggu Pembayaran
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {unpaidInvoices.length} invoice belum terbayar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="pb-2 font-semibold">No Invoice</th>
                <th className="pb-2 font-semibold">Pelanggan</th>
                <th className="pb-2 font-semibold">Paket</th>
                <th className="pb-2 font-semibold">Jatuh Tempo</th>
                <th className="pb-2 font-semibold">Nominal</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {unpaidInvoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 font-mono text-slate-700 dark:text-slate-300">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                    {inv.customerName}
                  </td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400">{inv.packageName}</td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400 font-mono">
                    {inv.dueDate}
                  </td>
                  <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                    {formatRupiah(inv.totalAmount)}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        inv.status === "overdue"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right space-x-1.5">
                    <button
                      onClick={() => handleSendReminderWA(inv)}
                      className="px-2 py-1 rounded-lg border border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 text-[11px] font-medium inline-flex items-center gap-1"
                      title="Kirim pesan WhatsApp pengingat"
                    >
                      <Send className="w-3 h-3" />
                      WA Reminder
                    </button>
                    <button
                      onClick={() => onOpenPaymentModal(inv)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 inline-flex items-center gap-1"
                    >
                      {t.payNow}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
