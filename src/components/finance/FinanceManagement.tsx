import React, { useState } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Plus,
  ArrowRightLeft,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Calendar,
  X,
} from "lucide-react";
import { FinancialTransaction, Wallet as WalletType } from "../../types";
import { formatRupiah } from "../../services/storage";
import { exportFinancialReportToCSV } from "../../services/exportUtils";
import { Language, translations } from "../../translations";

interface FinanceManagementProps {
  wallets: WalletType[];
  transactions: FinancialTransaction[];
  onAddTransaction: (tx: FinancialTransaction) => void;
  onTransferFunds: (fromId: string, toId: string, amount: number, notes: string) => void;
  lang: Language;
}

export const FinanceManagement: React.FC<FinanceManagementProps> = ({
  wallets,
  transactions,
  onAddTransaction,
  onTransferFunds,
  lang,
}) => {
  const t = translations[lang];

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // New Tx form
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txCategory, setTxCategory] = useState("Sewa Bandwidth ISP");
  const [txAmount, setTxAmount] = useState("");
  const [txWalletId, setTxWalletId] = useState(wallets[0]?.id || "");
  const [txDesc, setTxDesc] = useState("");

  // Transfer form
  const [fromWallet, setFromWallet] = useState(wallets[0]?.id || "");
  const [toWallet, setToWallet] = useState(wallets[1]?.id || "");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  // Calculations
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (!amountNum || amountNum <= 0) return;

    const targetWallet = wallets.find((w) => w.id === txWalletId);
    const newTx: FinancialTransaction = {
      id: `trx-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: txType,
      category: txCategory,
      amount: amountNum,
      description: txDesc || `${txType === "income" ? "Pemasukan" : "Pengeluaran"} ${txCategory}`,
      walletId: txWalletId,
      walletName: targetWallet?.name || "Kasir",
    };

    onAddTransaction(newTx);
    setIsAddTxOpen(false);
    setTxAmount("");
    setTxDesc("");
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount);
    if (!amountNum || amountNum <= 0 || fromWallet === toWallet) return;

    onTransferFunds(fromWallet, toWallet, amountNum, transferNotes);
    setIsTransferOpen(false);
    setTransferAmount("");
    setTransferNotes("");
  };

  return (
    <div id="finance-management-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            Laporan Keuangan & Manajemen Kas RT/RW Net
          </h2>
          <p className="text-xs text-slate-500">
            Laporan akurat arus kas pemasukan iuran, biaya operasional uplink, dan saldo multi-dompet
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportFinancialReportToCSV(transactions, wallets)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Ekspor Excel
          </button>
          <button
            onClick={() => setIsTransferOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-500" />
            Pindah Saldo
          </button>
          <button
            id="add-transaction-btn"
            onClick={() => setIsAddTxOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Catat Transaksi
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">{t.globalBalance}</span>
            <Wallet className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatRupiah(totalBalance)}
          </div>
          <span className="text-[11px] text-slate-500">{wallets.length} Akun & Dompet</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">{t.monthlyRevenue}</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatRupiah(totalIncome)}
          </div>
          <span className="text-[11px] text-slate-500">Iuran Pelanggan & Pasang Baru</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Pengeluaran</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {formatRupiah(totalExpense)}
          </div>
          <span className="text-[11px] text-slate-500">Uplink ISP, Listrik PLN, Maintenance</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Laba Operasional Bersih</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {formatRupiah(netProfit)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Margin Sehat 60%+</span>
        </div>
      </div>

      {/* Multi-Wallet Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-500" />
            Rekening & Kas RT/RW Net
          </h3>
          <span className="text-xs text-slate-400">Pencatatan buku kas terpisah</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 hover:border-indigo-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{w.name}</span>
                <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                  {w.type}
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                {formatRupiah(w.balance)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {w.accountNumber || "Kas Tunai"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Riwayat Mutasi & Pembukuan Arus Kas
          </h3>
          <span className="text-xs text-slate-400">{transactions.length} mutasi tercatat</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Deskripsi / Keterangan</th>
                <th className="p-3.5">Akun Dompet</th>
                <th className="p-3.5 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((tx) => {
                const isIncome = tx.type === "income";
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{tx.date}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                      {tx.description}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">{tx.walletName}</td>
                    <td
                      className={`p-3.5 text-right font-mono font-bold ${
                        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatRupiah(tx.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Catat Transaksi Keuangan Baru
              </h3>
              <button
                onClick={() => setIsAddTxOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-3.5 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTxType("expense")}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                    txType === "expense"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                  }`}
                >
                  Pengeluaran Kas
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("income")}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                    txType === "income"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                  }`}
                >
                  Pemasukan Kas
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kategori Transaksi
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {txType === "expense" ? (
                    <>
                      <option value="Sewa Bandwidth ISP">Sewa Bandwidth Upstream ISP</option>
                      <option value="Listrik PLN NOC">Token Listrik PLN Ruang Server / NOC</option>
                      <option value="Honor Teknisi & Pengelola">Honor / Gaji Teknisi & Bendahara</option>
                      <option value="Kabel & Aksesoris Fiber">Kabel Dropcore, Patchcord, Fast Connector</option>
                      <option value="Operasional Lainnya">Operasional Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="Iuran Langganan">Iuran Langganan Internet</option>
                      <option value="Biaya Pasang Baru">Biaya Pemasangan Baru (PSB)</option>
                      <option value="Penjualan Router ONT">Penjualan / Penggantian Router</option>
                      <option value="Pendapatan Lainnya">Pendapatan Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nominal (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="Contoh: 1500000"
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Gunakan Dompet / Rekening
                </label>
                <select
                  value={txWalletId}
                  onChange={(e) => setTxWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Keterangan Tambahan
                </label>
                <input
                  type="text"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="Catatan transaksi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTxOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Pindah Saldo Antar Rekening & Kas
              </h3>
              <button
                onClick={() => setIsTransferOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Dari Rekening Asal
                </label>
                <select
                  value={fromWallet}
                  onChange={(e) => setFromWallet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Tersedia: {formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Ke Rekening Tujuan
                </label>
                <select
                  value={toWallet}
                  onChange={(e) => setToWallet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Saldo: {formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Jumlah Transfer (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2 font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Transfer
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Contoh: Setor tunai hasil tagihan kasir ke Bank"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Proses Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
