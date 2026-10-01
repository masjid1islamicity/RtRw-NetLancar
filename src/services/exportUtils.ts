import { Customer, FinancialTransaction, Invoice, Wallet, InternetPackage } from "../types";
import { formatRupiah } from "./storage";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ==========================================
// 1. FINANCIAL REPORT EXPORT (EXCEL .xlsx)
// ==========================================

export function exportFinancialReportToExcel(
  transactions: FinancialTransaction[],
  wallets: Wallet[],
  invoices: Invoice[],
  periodMonth: string = "Semua Periode"
): void {
  const wb = XLSX.utils.book_new();
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));

  // Filter transactions and invoices by period if specified
  const filteredTransactions =
    periodMonth === "Semua Periode"
      ? transactions
      : transactions.filter((t) => {
          // Check month or date
          if (t.description?.includes(periodMonth)) return true;
          // Or parse transaction date e.g. "2026-10"
          const txDate = new Date(t.date);
          const monthNames = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
          ];
          const txPeriod = `${monthNames[txDate.getMonth()]} ${txDate.getFullYear()}`;
          return txPeriod.toLowerCase() === periodMonth.toLowerCase();
        });

  const txToUse = filteredTransactions.length > 0 ? filteredTransactions : transactions;

  const totalIncome = txToUse
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = txToUse
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const filteredInvoices =
    periodMonth === "Semua Periode"
      ? invoices
      : invoices.filter((i) => i.periodMonth.toLowerCase() === periodMonth.toLowerCase());
  const invToUse = filteredInvoices.length > 0 ? filteredInvoices : invoices;

  const totalInvoiced = invToUse.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = invToUse
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + i.totalAmount, 0);
  const totalUnpaid = totalInvoiced - totalPaid;
  const complianceRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  // --- SHEET 1: RINGKASAN EKSEKUTIF ---
  const summaryData: (string | number)[][] = [
    ["PAGUYUBAN WARGA RT/RW NET 'NETLANCAR'"],
    ["LAPORAN KINERJA & AUDIT KEUANGAN RESMI"],
    [`Periode Laporan: ${periodMonth}`],
    [`Tanggal Unduh / Ekspor: ${new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}`],
    [""],
    ["RINGKASAN EKSEKUTIF KAS & ARUS DANA"],
    ["Metrik Indikator", "Nilai (IDR)", "Keterangan"],
    ["Total Pemasukan Kas", totalIncome, "Termasuk iuran warga, instalasi baru, dan kas masuk"],
    ["Total Pengeluaran Kas (Beban)", totalExpense, "Biaya upstream ISP, perbaikan, listrik, dan operasional"],
    ["Sisa Kas Bersih (Surplus / Defisit)", netProfit, netProfit >= 0 ? "Surplus Kas Positif" : "Defisit Kas"],
    ["Total Tagihan Diterbitkan", totalInvoiced, `${invToUse.length} tagihan tercatat`],
    ["Total Tagihan Terbayar", totalPaid, `${invToUse.filter((i) => i.status === "paid").length} tagihan lunas`],
    ["Total Tagihan Tertunggak / Belum Lunas", totalUnpaid, `${invToUse.filter((i) => i.status !== "paid").length} tagihan tertunggak`],
    ["Tingkat Kepatuhan Pembayaran Warga", `${complianceRate}%`, `${invToUse.filter((i) => i.status === "paid").length} dari ${invToUse.length} pelanggan`],
    [""],
    ["POSISI SALDO KAS & DOMPET OPERASIONAL"],
    ["Nama Dompet / Rekening", "Tipe Rekening", "No. Akun / Info", "Saldo Saat Ini (IDR)"],
    ...wallets.map((w) => [
      w.name,
      w.type === "cash" ? "Kas Tunai" : w.type === "bank" ? "Rekening Bank" : "E-Wallet / QRIS",
      w.accountNumber || "-",
      w.balance,
    ]),
    ["TOTAL SALDO KAS KESELURUHAN", "", "", wallets.reduce((acc, w) => acc + w.balance, 0)],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 38 }, { wch: 24 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Eksekutif");

  // --- SHEET 2: BUKU KAS & MUTASI ---
  const txHeaders = [
    "No",
    "ID Transaksi",
    "Tanggal",
    "Jenis Transaksi",
    "Pos Anggaran / Kategori",
    "Metode Kas / Dompet",
    "Debit / Masuk (IDR)",
    "Kredit / Keluar (IDR)",
    "Keterangan / Deskripsi",
    "No. Referensi",
  ];

  const txRows = txToUse.map((t, idx) => [
    idx + 1,
    t.id,
    t.date,
    t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Pindah Kas",
    t.category,
    walletMap.get(t.walletId) || t.walletName || t.walletId,
    t.type === "income" ? t.amount : 0,
    t.type === "expense" ? t.amount : 0,
    t.description,
    t.referenceNumber || "-",
  ]);

  const txData = [
    ["BUKU KAS UMUM & CATATAN MUTASI KEUANGAN - NETLANCAR"],
    [`Periode: ${periodMonth}`],
    [""],
    txHeaders,
    ...txRows,
    [""],
    [
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      totalIncome,
      totalExpense,
      `SURPLUS BERSIH: Rp ${netProfit.toLocaleString("id-ID")}`,
      "",
    ],
  ];

  const wsTx = XLSX.utils.aoa_to_sheet(txData);
  wsTx["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 45 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, "Mutasi Kas (Cash Flow)");

  // --- SHEET 3: REKAP TAGIHAN INVOICE ---
  const invHeaders = [
    "No",
    "No. Invoice",
    "ID Pelanggan",
    "Nama Pelanggan",
    "Paket Langganan",
    "Periode Tagihan",
    "Jumlah Tagihan (IDR)",
    "Diskon (IDR)",
    "Total Bayar (IDR)",
    "Tgl Jatuh Tempo",
    "Tgl Pembayaran",
    "Status Tagihan",
    "Metode Bayar",
    "No. Ref Pembayaran",
  ];

  const invRows = invToUse.map((i, idx) => [
    idx + 1,
    i.invoiceNumber,
    i.customerId,
    i.customerName,
    i.packageName,
    i.periodMonth,
    i.amount,
    i.discount || 0,
    i.totalAmount,
    i.dueDate,
    i.paidDate || "-",
    i.status === "paid" ? "LUNAS" : i.status === "overdue" ? "JATUH TEMPO" : "BELUM LUNAS",
    i.paymentMethod || "-",
    i.paymentRef || "-",
  ]);

  const invData = [
    ["REKAPITULASI TAGIHAN & IURAN WARGA - NETLANCAR"],
    [`Periode: ${periodMonth}`],
    [""],
    invHeaders,
    ...invRows,
    [""],
    [
      "TOTAL KESELURUHAN",
      "",
      "",
      "",
      "",
      "",
      invToUse.reduce((acc, i) => acc + i.amount, 0),
      invToUse.reduce((acc, i) => acc + (i.discount || 0), 0),
      totalInvoiced,
      "",
      "",
      `TERBAYAR: Rp ${totalPaid.toLocaleString("id-ID")} | TERTUNGGAK: Rp ${totalUnpaid.toLocaleString("id-ID")}`,
      "",
      "",
    ],
  ];

  const wsInv = XLSX.utils.aoa_to_sheet(invData);
  wsInv["!cols"] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 14 },
    { wch: 24 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInv, "Rekap Tagihan Warga");

  // Generate and download
  const safePeriod = periodMonth.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Laporan_Keuangan_NetLancar_${safePeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ==========================================
// 2. FINANCIAL REPORT EXPORT (PDF .pdf)
// ==========================================

export function exportFinancialReportToPDF(options: {
  transactions: FinancialTransaction[];
  wallets: Wallet[];
  invoices: Invoice[];
  customers?: Customer[];
  periodMonth: string;
}): void {
  const { transactions, wallets, invoices, periodMonth } = options;

  // Filter for period if specified
  const filteredTransactions =
    periodMonth === "Semua Periode"
      ? transactions
      : transactions.filter((t) => {
          if (t.description?.includes(periodMonth)) return true;
          const txDate = new Date(t.date);
          const monthNames = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
          ];
          const txPeriod = `${monthNames[txDate.getMonth()]} ${txDate.getFullYear()}`;
          return txPeriod.toLowerCase() === periodMonth.toLowerCase();
        });

  const txToUse = filteredTransactions.length > 0 ? filteredTransactions : transactions;

  const totalIncome = txToUse
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = txToUse
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const filteredInvoices =
    periodMonth === "Semua Periode"
      ? invoices
      : invoices.filter((i) => i.periodMonth.toLowerCase() === periodMonth.toLowerCase());
  const invToUse = filteredInvoices.length > 0 ? filteredInvoices : invoices;
  const paidCount = invToUse.filter((i) => i.status === "paid").length;
  const complianceRate = invToUse.length > 0 ? Math.round((paidCount / invToUse.length) * 100) : 0;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 26, "F");

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PAGUYUBAN WARGA RT/RW NET 'NETLANCAR'", 14, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text("BERKAS AUDIT & PERTANGGUNGJAWABAN KEUANGAN KAS BULANAN", 14, 18);

  // Date on right
  doc.setFontSize(8);
  doc.text(`Periode: ${periodMonth}`, pageWidth - 14, 11, { align: "right" });
  doc.text(`Tgl Cetak: ${new Date().toLocaleDateString("id-ID")}`, pageWidth - 14, 18, { align: "right" });

  let startY = 32;

  // Title Box
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RINGKASAN EKSEKUTIF KAS PAGUYUBAN", 14, startY);

  startY += 4;

  // 4 Metric Badges
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 18;
  const metrics = [
    { label: "TOTAL PEMASUKAN", val: formatRupiah(totalIncome), color: [16, 185, 129] }, // emerald
    { label: "BIAYA OPERASIONAL", val: formatRupiah(totalExpense), color: [244, 63, 94] }, // rose
    { label: "SISA KAS BERSIH", val: formatRupiah(netProfit), color: [79, 70, 229] }, // indigo
    { label: "KEPATUHAN WARGA", val: `${complianceRate}% (${paidCount}/${invToUse.length})`, color: [14, 165, 233] }, // sky
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(m.label, x + 3, startY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.val, x + 3, startY + 12.5);
  });

  startY += boxHeight + 7;

  // Wallets Mini Summary
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("1. Posisi Kas & Saldo Dompet Bendahara", 14, startY);
  startY += 2;

  const walletRows = wallets.map((w) => [
    w.name,
    w.type === "cash" ? "Kas Tunai" : w.type === "bank" ? "Rekening Bank" : "QRIS / E-Wallet",
    w.accountNumber || "-",
    formatRupiah(w.balance),
  ]);

  autoTable(doc, {
    startY: startY,
    head: [["Nama Rekening / Dompet", "Jenis Kas", "No. Rekening / Keterangan", "Saldo Saat Ini"]],
    body: walletRows,
    foot: [["TOTAL SALDO SEMUA DOMPET", "", "", formatRupiah(wallets.reduce((a, b) => a + b.balance, 0))]],
    theme: "striped",
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      3: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });

  const lastTableY = (doc as any).lastAutoTable?.finalY || startY + 30;
  startY = lastTableY + 8;

  // Cash Flow Table
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("2. Rincian Buku Kas Arus Masuk & Keluar (Cash Flow)", 14, startY);
  startY += 2;

  const txTableRows = txToUse.map((t, idx) => [
    String(idx + 1),
    t.date,
    t.category,
    t.walletName || "Kas",
    t.description,
    t.type === "income" ? formatRupiah(t.amount) : "-",
    t.type === "expense" ? formatRupiah(t.amount) : "-",
  ]);

  autoTable(doc, {
    startY: startY,
    head: [["No", "Tanggal", "Kategori Pos", "Kas/Dompet", "Keterangan", "Masuk (IDR)", "Keluar (IDR)"]],
    body: txTableRows,
    foot: [
      [
        "TOTAL KESELURUHAN",
        "",
        "",
        "",
        `SURPLUS KAS BERSIH: ${formatRupiah(netProfit)}`,
        formatRupiah(totalIncome),
        formatRupiah(totalExpense),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
    footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: "bold", fontSize: 7.5 },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { cellWidth: 18 },
      2: { cellWidth: 26 },
      3: { cellWidth: 22 },
      5: { halign: "right", textColor: [16, 185, 129], fontStyle: "bold", cellWidth: 26 },
      6: { halign: "right", textColor: [225, 29, 72], fontStyle: "bold", cellWidth: 26 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Add page footer
      const str = `Dokumen Resmi Paguyuban RT/RW Net NetLancar • Halaman ${data.pageNumber}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth / 2, pageHeight - 8, { align: "center" });
    },
  });

  const finalTxY = (doc as any).lastAutoTable?.finalY || startY + 40;

  // Check if signatures fit on current page or need a new page
  if (finalTxY > pageHeight - 45) {
    doc.addPage();
    startY = 20;
  } else {
    startY = finalTxY + 12;
  }

  // Signatures Section
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PENGESAHAN & PERTANGGUNGJAWABAN AUDIT", 14, startY);

  startY += 5;
  const colWidth = (pageWidth - 28) / 3;

  const signers = [
    { title: "Ketua RW 04 / RW 05", name: "H. Bambang Sukoco, S.T." },
    { title: "Bendahara Paguyuban", name: "Siti Rahayu, S.E." },
    { title: "Koordinator Teknisi ISP", name: "Dani Pratama (NOC Lead)" },
  ];

  signers.forEach((s, idx) => {
    const x = 14 + idx * colWidth + colWidth / 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(s.title, x, startY + 4, { align: "center" });

    // Underline name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(s.name, x, startY + 22, { align: "center" });
    doc.setDrawColor(148, 163, 184);
    doc.line(x - 22, startY + 23, x + 22, startY + 23);
  });

  const safePeriod = periodMonth.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Laporan_Keuangan_NetLancar_${safePeriod}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ==========================================
// 3. CUSTOMER DATA EXPORT (EXCEL .xlsx)
// ==========================================

export function exportCustomersToExcel(
  customers: Customer[],
  packages: InternetPackage[] = [],
  options?: { filterRtRw?: string; filterStatus?: string }
): void {
  const wb = XLSX.utils.book_new();
  const pkgMap = new Map(packages.map((p) => [p.id, p]));

  // Apply filters
  const filteredCustomers = customers.filter((c) => {
    if (options?.filterRtRw && options.filterRtRw !== "all" && c.rtRw !== options.filterRtRw) {
      return false;
    }
    if (options?.filterStatus && options.filterStatus !== "all" && c.status !== options.filterStatus) {
      return false;
    }
    return true;
  });

  // --- SHEET 1: DATA INDUK PELANGGAN ---
  const headers = [
    "No",
    "Kode Pelanggan",
    "Nama Lengkap",
    "Nomor WhatsApp / HP",
    "Alamat Rumah",
    "Wilayah RT / RW",
    "Paket Langganan",
    "Kecepatan Download (Mbps)",
    "Kecepatan Upload (Mbps)",
    "Tarif Bulanan (IDR)",
    "Status Layanan",
    "Alamat IP Pelanggan",
    "MAC Address",
    "Username PPPoE",
    "Port OLT / ODP",
    "Model Perangkat ONT",
    "Tanggal Pendaftaran",
    "Tgl Jatuh Tempo",
    "Jumlah Pembayaran Berhasil",
    "Auto Isolate",
  ];

  const rows = filteredCustomers.map((c, idx) => {
    const pkg = pkgMap.get(c.packageId);
    return [
      idx + 1,
      c.customerCode,
      c.name,
      c.phone,
      c.address,
      c.rtRw,
      pkg?.name || c.packageId,
      pkg?.speedDownload || 0,
      pkg?.speedUpload || 0,
      pkg?.price || 0,
      c.status === "active" ? "Aktif" : c.status === "isolated" ? "Terisolir" : c.status,
      c.ipAddress,
      c.macAddress,
      c.pppoeUsername,
      c.oltPort,
      c.ontModel,
      c.joinDate,
      c.dueDate,
      c.totalPaidCount,
      c.autoIsolateEnabled ? "Ya" : "Tidak",
    ];
  });

  const sheetData = [
    ["BUKU INDUK ADMINISTRASI DATA PELANGGAN - PAGUYUBAN RT/RW NET NETLANCAR"],
    [`Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}`],
    [`Total Terdata: ${filteredCustomers.length} Pelanggan`],
    [""],
    headers,
    ...rows,
  ];

  const wsCustomers = XLSX.utils.aoa_to_sheet(sheetData);
  wsCustomers["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 18 },
    { wch: 32 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCustomers, "Data Induk Pelanggan");

  // --- SHEET 2: REKAPITULASI PER WILAYAH RT-RW ---
  const rtRwGroups: { [rt: string]: { total: number; active: number; isolated: number; totalRevenue: number } } = {};

  filteredCustomers.forEach((c) => {
    const rt = c.rtRw || "Lainnya";
    if (!rtRwGroups[rt]) {
      rtRwGroups[rt] = { total: 0, active: 0, isolated: 0, totalRevenue: 0 };
    }
    rtRwGroups[rt].total += 1;
    if (c.status === "active") rtRwGroups[rt].active += 1;
    if (c.status === "isolated") rtRwGroups[rt].isolated += 1;
    const pkg = pkgMap.get(c.packageId);
    rtRwGroups[rt].totalRevenue += pkg?.price || 0;
  });

  const rtSummaryHeaders = [
    "Wilayah RT / RW",
    "Total Pelanggan",
    "Pelanggan Aktif",
    "Pelanggan Terisolir",
    "Potensi Iuran Bulanan (IDR)",
  ];

  const rtRows = Object.entries(rtRwGroups).map(([rt, stats]) => [
    rt,
    stats.total,
    stats.active,
    stats.isolated,
    stats.totalRevenue,
  ]);

  const rtSheetData = [
    ["REKAPITULASI SEBARAN PELANGGAN PER WILAYAH RT / RW"],
    [""],
    rtSummaryHeaders,
    ...rtRows,
    [""],
    [
      "TOTAL KESELURUHAN",
      filteredCustomers.length,
      filteredCustomers.filter((c) => c.status === "active").length,
      filteredCustomers.filter((c) => c.status === "isolated").length,
      Object.values(rtRwGroups).reduce((acc, g) => acc + g.totalRevenue, 0),
    ],
  ];

  const wsRt = XLSX.utils.aoa_to_sheet(rtSheetData);
  wsRt["!cols"] = [{ wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, wsRt, "Rekap Wilayah RT-RW");

  const filename = `Data_Pelanggan_NetLancar_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ==========================================
// 4. CUSTOMER DATA EXPORT (PDF .pdf)
// ==========================================

export function exportCustomersToPDF(
  customers: Customer[],
  packages: InternetPackage[] = [],
  options?: { filterRtRw?: string; filterStatus?: string }
): void {
  const pkgMap = new Map(packages.map((p) => [p.id, p]));

  // Apply filters
  const filteredCustomers = customers.filter((c) => {
    if (options?.filterRtRw && options.filterRtRw !== "all" && c.rtRw !== options.filterRtRw) {
      return false;
    }
    if (options?.filterStatus && options.filterStatus !== "all" && c.status !== options.filterStatus) {
      return false;
    }
    return true;
  });

  const totalActive = filteredCustomers.filter((c) => c.status === "active").length;
  const totalIsolated = filteredCustomers.filter((c) => c.status === "isolated").length;
  const totalRevenue = filteredCustomers.reduce((acc, c) => {
    const pkg = pkgMap.get(c.packageId);
    return acc + (pkg?.price || 0);
  }, 0);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PAGUYUBAN WARGA RT/RW NET 'NETLANCAR'", 14, 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    "BUKU INDUK ADMINISTRASI DATA PELANGGAN & PERANGKAT JARINGAN FIBER",
    14,
    15
  );

  doc.setFontSize(8);
  doc.text(`Tgl Dokumen: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}`, pageWidth - 14, 9, {
    align: "right",
  });
  doc.text(
    `Filter: ${options?.filterRtRw && options.filterRtRw !== "all" ? options.filterRtRw : "Semua Wilayah"} | Status: ${options?.filterStatus && options.filterStatus !== "all" ? options.filterStatus : "Semua"}`,
    pageWidth - 14,
    15,
    { align: "right" }
  );

  let startY = 27;

  // Mini summary cards
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 14;
  const cards = [
    { label: "TOTAL TERDATA", val: `${filteredCustomers.length} Warga`, color: [79, 70, 229] },
    { label: "PELANGGAN AKTIF", val: `${totalActive} Sambungan`, color: [16, 185, 129] },
    { label: "TERISOLIR / MENUNGGU", val: `${totalIsolated} Sambungan`, color: [244, 63, 94] },
    { label: "POTENSI IURAN BULANAN", val: formatRupiah(totalRevenue), color: [14, 165, 233] },
  ];

  cards.forEach((c, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, x + 3, startY + 4.5);

    doc.setFontSize(9);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.val, x + 3, startY + 10.5);
  });

  startY += cardHeight + 5;

  const tableRows = filteredCustomers.map((c, idx) => {
    const pkg = pkgMap.get(c.packageId);
    return [
      String(idx + 1),
      c.customerCode,
      c.name,
      c.phone,
      c.rtRw,
      pkg ? `${pkg.name} (${pkg.speedDownload}M)` : c.packageId,
      pkg ? formatRupiah(pkg.price) : "-",
      c.ipAddress,
      c.oltPort,
      c.status === "active" ? "AKTIF" : c.status === "isolated" ? "ISOLIR" : c.status.toUpperCase(),
      c.joinDate,
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [
      [
        "No",
        "Kode",
        "Nama Pelanggan",
        "WhatsApp / HP",
        "RT / RW",
        "Paket Langganan",
        "Tarif",
        "IP Address",
        "Port OLT",
        "Status",
        "Tgl Gabung",
      ],
    ],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { cellWidth: 18, fontStyle: "bold" },
      2: { cellWidth: 38 },
      3: { cellWidth: 26 },
      4: { cellWidth: 28 },
      5: { cellWidth: 38 },
      6: { halign: "right", cellWidth: 24 },
      7: { cellWidth: 26 },
      8: { cellWidth: 24 },
      9: { halign: "center", cellWidth: 16, fontStyle: "bold" },
      10: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const footerStr = `Buku Induk Pelanggan NetLancar RT/RW Net • Dokumen Resmi Arsip • Halaman ${data.pageNumber}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(footerStr, pageWidth / 2, pageHeight - 6, { align: "center" });
    },
  });

  const filename = `Data_Pelanggan_NetLancar_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// Backward-compatible CSV Exports
export function exportTransactionsToCSV(transactions: FinancialTransaction[], wallets: Wallet[]): void {
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  
  const headers = ["ID", "Tanggal", "Tipe", "Dompet", "Kategori", "Jumlah (IDR)", "Keterangan", "No Referensi"];
  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Pindah Saldo"}"`,
    `"${walletMap.get(t.walletId) || t.walletId}"`,
    `"${t.category}"`,
    t.amount,
    `"${t.description.replace(/"/g, '""')}"`,
    `"${t.referenceNumber || "-"}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Laporan_Keuangan_NetLancar_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function exportCustomersToCSV(customers: Customer[]): void {
  const headers = ["Kode", "Nama Pelanggan", "WhatsApp", "Alamat", "RT/RW", "Status", "IP Address", "PPPoE User", "ODP/Port OLT", "Tanggal Daftar"];
  const rows = customers.map((c) => [
    `"${c.customerCode}"`,
    `"${c.name}"`,
    `"${c.phone}"`,
    `"${c.address.replace(/"/g, '""')}"`,
    `"${c.rtRw}"`,
    `"${c.status}"`,
    `"${c.ipAddress}"`,
    `"${c.pppoeUsername}"`,
    `"${c.oltPort}"`,
    `"${c.joinDate}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Data_Pelanggan_NetLancar_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export const exportFinancialReportToCSV = exportTransactionsToCSV;

export function exportInvoicesToCSV(invoices: Invoice[]): void {
  const headers = ["No Invoice", "Pelanggan", "Paket", "Periode", "Nominal (IDR)", "Jatuh Tempo", "Status", "Metode Bayar", "Ref Pembayaran"];
  const rows = invoices.map((i) => [
    `"${i.invoiceNumber}"`,
    `"${i.customerName.replace(/"/g, '""')}"`,
    `"${i.packageName}"`,
    `"${i.periodMonth}"`,
    i.totalAmount,
    `"${i.dueDate}"`,
    `"${i.status}"`,
    `"${i.paymentMethod || "-"}"`,
    `"${i.paymentRef || "-"}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Data_Invoice_NetLancar_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function exportCustomerPaymentHistoryToCSV(customer: Customer, invoices: Invoice[]): void {
  const headers = [
    "No Invoice",
    "Periode Tagihan",
    "Tanggal Bayar",
    "Jatuh Tempo",
    "Paket Langganan",
    "Nominal Pokok (IDR)",
    "Diskon (IDR)",
    "Total Bayar (IDR)",
    "Status",
    "Metode Pembayaran",
    "No Referensi",
    "Catatan",
  ];

  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const getStatusLabel = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return "Lunas";
      case "overdue":
        return "Jatuh Tempo";
      case "unpaid":
        return "Menunggu Pembayaran";
      default:
        return status;
    }
  };

  const rows = invoices.map((inv) => [
    escapeCsv(inv.invoiceNumber),
    escapeCsv(inv.periodMonth),
    escapeCsv(inv.paidDate || "-"),
    escapeCsv(inv.dueDate),
    escapeCsv(inv.packageName),
    inv.amount,
    inv.discount || 0,
    inv.totalAmount,
    escapeCsv(getStatusLabel(inv.status)),
    escapeCsv(inv.paymentMethod || "-"),
    escapeCsv(inv.paymentRef || "-"),
    escapeCsv(inv.notes || "-"),
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = (customer.name || "Pelanggan").replace(/[^a-zA-Z0-9]/g, "_");
  link.setAttribute("href", url);
  link.setAttribute("download", `Riwayat_Transaksi_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportAuditExcel(
  transactions: FinancialTransaction[],
  invoices: Invoice[],
  wallets: Wallet[]
): void {
  exportFinancialReportToExcel(transactions, wallets, invoices, "Semua Periode");
}

export function getGoogleCalendarUrl(event: {
  title: string;
  description: string;
  location?: string;
  startDate?: Date;
  durationHours?: number;
}): string {
  const start = event.startDate || new Date();
  const end = new Date(start.getTime() + (event.durationHours || 2) * 60 * 60 * 1000);

  const formatUtc = (d: Date) =>
    d
      .toISOString()
      .replace(/-|:|\.\d+/g, "")
      .slice(0, 15) + "Z";

  const datesParam = `${formatUtc(start)}/${formatUtc(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.location || "Wilayah Jaringan NetLancar RT/RW Net",
    dates: datesParam,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function exportMaintenanceToIcs(event: {
  title: string;
  description: string;
  location?: string;
  startDate?: Date;
  durationHours?: number;
  filename?: string;
}): void {
  const start = event.startDate || new Date();
  const end = new Date(start.getTime() + (event.durationHours || 2) * 60 * 60 * 1000);

  const formatIcsDate = (d: Date) =>
    d
      .toISOString()
      .replace(/-|:|\.\d+/g, "")
      .slice(0, 15) + "Z";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NetLancar RT-RW Net//Schedule//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:netlancar-${Date.now()}@netlancar.local`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${event.title.replace(/\n/g, "\\n")}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${(event.location || "Wilayah NetLancar").replace(/\n/g, "\\n")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.filename || "Jadwal_Pemeliharaan_NetLancar"}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
