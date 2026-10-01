import React from "react";
import { X, Printer, Share2, CheckCircle, Wifi, ShieldCheck } from "lucide-react";
import { Invoice } from "../types";
import { formatRupiah, generateWhatsAppLink } from "../services/storage";
import { Language } from "../translations";

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  lang: Language;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoice,
  lang,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*BUKTI PEMBAYARAN INTERNET NETLANCAR*
No. Invoice: ${invoice.invoiceNumber}
Nama: ${invoice.customerName}
Paket: ${invoice.packageName}
Periode: ${invoice.periodMonth}
Jumlah: ${formatRupiah(invoice.totalAmount)}
Status: ${invoice.status === "paid" ? "LUNAS ✅" : "BELUM LUNAS ⏳"}
${invoice.paymentRef ? `Ref Pembayaran: ${invoice.paymentRef}` : ""}

Terima kasih atas kepercayaan Anda menggunakan layanan internet RT/RW NetLancar!`;
    const url = generateWhatsAppLink("081287654321", text);
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div
        id="invoice-print-container"
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Controls (Hidden during print) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {lang === "id" ? "Faktur & Bukti Pembayaran Resmi" : "Official Invoice & Payment Receipt"}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                invoice.status === "paid"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : invoice.status === "overdue"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-700 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              {lang === "id" ? "Cetak / PDF" : "Print / PDF"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Official Printable Invoice Sheet */}
        <div className="p-8 space-y-6 text-slate-900 dark:text-slate-100 text-xs bg-white dark:bg-slate-900">
          {/* Header & Logo */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Wifi className="w-5 h-5" />
                </div>
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  NetLancar RT/RW Net
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Layanan Internet Mandiri Warga RT 01-04 / RW 04 & RW 05
              </p>
              <p className="text-[10px] text-slate-400">
                Sekretariat Paguyuban Warga • Telp/WA: 0812-8765-4321
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                INVOICE TAGIHAN
              </span>
              <div className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                {invoice.invoiceNumber}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Jatuh Tempo: <span className="font-medium text-slate-700 dark:text-slate-300">{invoice.dueDate}</span>
              </div>
              {invoice.paidDate && (
                <div className="text-[11px] text-emerald-600 font-medium">
                  Lunas Tanggal: {invoice.paidDate}
                </div>
              )}
            </div>
          </div>

          {/* Customer & Period Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Tagihan Kepada:
              </span>
              <div className="font-bold text-sm text-slate-900 dark:text-white">{invoice.customerName}</div>
              <div className="text-slate-500 mt-0.5">Kode Pelanggan: {invoice.customerId}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Rincian Layanan:
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200">{invoice.packageName}</div>
              <div className="text-slate-500 mt-0.5">Periode Pemakaian: {invoice.periodMonth}</div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-3 text-left font-bold">Deskripsi Layanan</th>
                <th className="p-3 text-right font-bold">Periode</th>
                <th className="p-3 text-right font-bold">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              <tr>
                <td className="p-3">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Iuran Langganan Internet Broadband Unlimited
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {invoice.packageName} (FUP Unlimited, Tanpa Kuota)
                  </div>
                </td>
                <td className="p-3 text-right text-slate-600 dark:text-slate-400">{invoice.periodMonth}</td>
                <td className="p-3 text-right font-mono font-medium text-slate-900 dark:text-white">
                  {formatRupiah(invoice.amount)}
                </td>
              </tr>
              {invoice.discount > 0 && (
                <tr className="text-emerald-600 dark:text-emerald-400">
                  <td className="p-3">Potongan Harga / Diskon Khusus</td>
                  <td className="p-3 text-right">-</td>
                  <td className="p-3 text-right font-mono font-medium">
                    -{formatRupiah(invoice.discount)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-bold">
              <tr>
                <td colSpan={2} className="p-3 text-right text-slate-700 dark:text-slate-300">
                  Total Tagihan:
                </td>
                <td className="p-3 text-right text-indigo-600 dark:text-indigo-400 text-sm font-mono">
                  {formatRupiah(invoice.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Verification & Stamp Area */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-6 h-6 text-indigo-600 mx-auto" />
                <span className="text-[8px] font-mono text-slate-400 mt-1">VERIFIED</span>
              </div>
              <div className="text-[11px] text-slate-500">
                <div>Dokumen ini diterbitkan sah secara elektronik oleh</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  NetLancar Autonomous Billing Engine
                </div>
                {invoice.paymentRef && (
                  <div className="font-mono text-[10px] text-slate-400">
                    Ref Transaksi: {invoice.paymentRef}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <div className="text-[11px] text-slate-400 mb-8">Pengelola RT/RW Net</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-slate-600 pb-0.5">
                Bendahara Operasional
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
