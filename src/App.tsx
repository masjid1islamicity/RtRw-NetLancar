import React, { useState, useEffect } from "react";
import {
  Customer,
  FinancialTransaction,
  InternetPackage,
  Invoice,
  OperationalTask,
  OutageAlert,
  PaymentMethod,
  UserRole,
  Wallet,
  AppNotification,
  InventoryItem,
  InventoryPurchaseRecord,
  AssetDepreciationRecord,
  AuditLogEntry,
} from "./types";
import { Language, translations } from "./translations";
import {
  getStoredCustomers,
  saveStoredCustomers,
  getStoredInvoices,
  saveStoredInvoices,
  getStoredWallets,
  saveStoredWallets,
  getStoredTransactions,
  saveStoredTransactions,
  getStoredOutages,
  saveStoredOutages,
  getStoredTasks,
  saveStoredTasks,
  getStoredNotifications,
  saveStoredNotifications,
  getStoredInventoryItems,
  saveStoredInventoryItems,
  getStoredPurchases,
  saveStoredPurchases,
  getStoredDepreciations,
  saveStoredDepreciations,
  getStoredAuditLogs,
  recordAuditEvent,
  getStoredTheme,
  saveStoredTheme,
  getStoredLanguage,
  saveStoredLanguage,
  formatRupiah,
} from "./services/storage";
import { initialPackages } from "./data/initialData";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { NotificationCenter } from "./components/NotificationCenter";
import { BiometricModal } from "./components/BiometricModal";
import { AiAssistantModal } from "./components/AiAssistantModal";
import { PaymentGatewayModal } from "./components/PaymentGatewayModal";
import { InvoicePrintModal } from "./components/InvoicePrintModal";
import { OverviewDashboard } from "./components/dashboard/OverviewDashboard";
import { CustomerManagement } from "./components/customers/CustomerManagement";
import { BandwidthMonitor } from "./components/bandwidth/BandwidthMonitor";
import { BillingManagement } from "./components/billing/BillingManagement";
import { FinanceManagement } from "./components/finance/FinanceManagement";
import { InventoryManagement } from "./components/inventory/InventoryManagement";
import { OutageNotificationCenter } from "./components/outage/OutageNotificationCenter";
import { OperationalTasks } from "./components/tasks/OperationalTasks";
import { AuditReports } from "./components/audit/AuditReports";
import { CustomerPortal } from "./components/portal/CustomerPortal";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Activity,
  Wallet as WalletIcon,
  Boxes,
  WifiOff,
  Radio,
  Sparkles,
} from "lucide-react";

export default function App() {
  // Localization & Theme
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = getStoredTheme();
    return stored === "dark";
  });

  // User Role & Active Tab
  const [role, setRole] = useState<UserRole>("admin");
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Core Data State
  const [customers, setCustomers] = useState<Customer[]>(getStoredCustomers);
  const [packages] = useState<InternetPackage[]>(initialPackages);
  const [invoices, setInvoices] = useState<Invoice[]>(getStoredInvoices);
  const [wallets, setWallets] = useState<Wallet[]>(getStoredWallets);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(getStoredTransactions);
  const [outages, setOutages] = useState<OutageAlert[]>(getStoredOutages);
  const [tasks, setTasks] = useState<OperationalTask[]>(getStoredTasks);
  const [notifications, setNotifications] = useState<AppNotification[]>(getStoredNotifications);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(getStoredInventoryItems);
  const [purchaseRecords, setPurchaseRecords] = useState<InventoryPurchaseRecord[]>(getStoredPurchases);
  const [depreciationRecords, setDepreciationRecords] = useState<AssetDepreciationRecord[]>(getStoredDepreciations);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(getStoredAuditLogs);

  // Connectivity & Offline
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Modals & Search
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || "");
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync theme to DOM
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      saveStoredTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      saveStoredTheme("light");
    }
  }, [isDark]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      pushNotification(
        "Sinkronisasi Berhasil",
        "Semua perubahan data telah disinkronkan ke cloud server & Mikrotik.",
        "system"
      );
    }, 800);
  };

  // Persist State Updates
  const updateCustomers = (newCusts: Customer[]) => {
    setCustomers(newCusts);
    saveStoredCustomers(newCusts);
  };

  const updateInvoices = (newInvs: Invoice[]) => {
    setInvoices(newInvs);
    saveStoredInvoices(newInvs);
  };

  const updateWallets = (newWallets: Wallet[]) => {
    setWallets(newWallets);
    saveStoredWallets(newWallets);
  };

  const updateTransactions = (newTxs: FinancialTransaction[]) => {
    setTransactions(newTxs);
    saveStoredTransactions(newTxs);
  };

  const updateOutages = (newOutages: OutageAlert[]) => {
    setOutages(newOutages);
    saveStoredOutages(newOutages);
  };

  const updateTasks = (newTasks: OperationalTask[]) => {
    setTasks(newTasks);
    saveStoredTasks(newTasks);
  };

  const updateInventoryItems = (newItems: InventoryItem[]) => {
    setInventoryItems(newItems);
    saveStoredInventoryItems(newItems);
  };

  const updatePurchaseRecords = (newPurchases: InventoryPurchaseRecord[]) => {
    setPurchaseRecords(newPurchases);
    saveStoredPurchases(newPurchases);
  };

  const updateDepreciationRecords = (newDeps: AssetDepreciationRecord[]) => {
    setDepreciationRecords(newDeps);
    saveStoredDepreciations(newDeps);
  };

  const handleAddAuditLog = (entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
    const newEntry = recordAuditEvent(entry);
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const pushNotification = (title: string, message: string, type: AppNotification["type"]) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  // Customer Management Handlers
  const handleAddCustomer = (c: Customer) => {
    const updated = [c, ...customers];
    updateCustomers(updated);
    pushNotification(
      "Pelanggan Baru Terdaftar",
      `${c.name} (${c.customerCode}) telah berhasil didaftarkan ke server Mikrotik.`,
      "task"
    );

    handleAddAuditLog({
      action: "customer_creation",
      actionTitle: "Pendaftaran Pelanggan Baru",
      description: `Operator mendaftarkan pelanggan baru ${c.name} (${c.customerCode}) alamat: ${c.address}. PPPoE username ${c.pppoeUsername} dialokasikan pada port ${c.oltPort}.`,
      actorName: "Operator Registrasi NOC",
      actorRole: "Admin NOC",
      ipAddress: "192.168.10.18 (NOC Frontdesk)",
      deviceInfo: "Chrome 128 / Web Console",
      targetResource: `${c.customerCode} (${c.name})`,
      targetId: c.id,
      severity: "info",
      status: "success",
      newState: { customerCode: c.customerCode, name: c.name, pppoeUsername: c.pppoeUsername, ipAddress: c.ipAddress },
      notes: "Akun PPPoE dan limitasi bandwidth otomatis dibuat pada router MikroTik.",
    });
  };

  const handleUpdateCustomer = (c: Customer) => {
    const prev = customers.find((item) => item.id === c.id);
    const updated = customers.map((item) => (item.id === c.id ? c : item));
    updateCustomers(updated);

    handleAddAuditLog({
      action: "customer_update",
      actionTitle: "Perubahan Data Pelanggan",
      description: `Modifikasi data profil/paket pelanggan ${c.name} (${c.customerCode}) oleh administrator.`,
      actorName: "Admin NOC",
      actorRole: "Admin NOC",
      ipAddress: "192.168.10.25 (NOC Server)",
      deviceInfo: "Chrome 128 / Web Console",
      targetResource: `${c.customerCode} (${c.name})`,
      targetId: c.id,
      severity: "info",
      status: "success",
      previousState: prev ? { name: prev.name, address: prev.address, packageId: prev.packageId } : undefined,
      newState: { name: c.name, address: c.address, packageId: c.packageId },
      notes: "Sinkronisasi profil selesai.",
    });
  };

  const handleDeleteCustomer = (id: string) => {
    const target = customers.find((item) => item.id === id);
    const updated = customers.filter((item) => item.id !== id);
    updateCustomers(updated);

    if (target) {
      handleAddAuditLog({
        action: "customer_deletion",
        actionTitle: "Penghapusan Data Pelanggan Permanen",
        description: `Pelanggan ${target.name} (${target.customerCode}) dihapus secara permanen dari sistem registrasi beserta konfigurasi PPPoE (${target.pppoeUsername}).`,
        actorName: "Super Admin Paguyuban",
        actorRole: "Super Admin",
        ipAddress: "192.168.10.12 (Admin Laptop)",
        deviceInfo: "Web Browser Console",
        targetResource: `${target.customerCode} (${target.name})`,
        targetId: target.id,
        severity: "critical",
        status: "success",
        previousState: {
          customerCode: target.customerCode,
          name: target.name,
          address: target.address,
          rtRw: target.rtRw,
          pppoeUsername: target.pppoeUsername,
        },
        newState: { deleted: true },
        notes: "Seluruh konfigurasi port OLT dan lease IP pool telah dibersihkan.",
      });
    }
  };

  const handleToggleIsolation = (id: string) => {
    const target = customers.find((c) => c.id === id);
    if (!target) return;

    const nextStatus: Customer["status"] = target.status === "isolated" ? "active" : "isolated";
    const updated: Customer[] = customers.map((c) =>
      c.id === id ? { ...c, status: nextStatus } : c
    );
    updateCustomers(updated);

    if (nextStatus === "isolated") {
      pushNotification(
        "Isolir Layanan Aktif",
        `Pelanggan ${target.name} diisolir otomatis pada Mikrotik karena tunggakan tagihan.`,
        "billing"
      );
    } else {
      pushNotification(
        "Isolir Dibuka",
        `Layanan internet untuk ${target.name} telah diaktifkan kembali.`,
        "billing"
      );
    }

    handleAddAuditLog({
      action: "customer_isolation_toggle",
      actionTitle: nextStatus === "isolated" ? "Isolasi Pelanggan Diaktifkan" : "Pencabutan Isolasi Pelanggan",
      description: `Operator mengubah status isolasi pelanggan ${target.name} (${target.customerCode}) dari ${target.status.toUpperCase()} menjadi ${nextStatus.toUpperCase()} pada router MikroTik.`,
      actorName: "Operator NOC NetLancar",
      actorRole: "Admin NOC",
      ipAddress: "192.168.10.25 (NOC Terminal)",
      deviceInfo: "Chrome 128 / Web Console",
      targetResource: `${target.customerCode} (${target.name})`,
      targetId: target.id,
      severity: nextStatus === "isolated" ? "warning" : "info",
      status: "success",
      previousState: { status: target.status, ipAddress: target.ipAddress, pppoeUsername: target.pppoeUsername },
      newState: { status: nextStatus, ipAddress: target.ipAddress, pppoeUsername: target.pppoeUsername },
      notes:
        nextStatus === "isolated"
          ? "Pelanggan dialihkan ke IP pool isolir landing page."
          : "Akses bandwidth internet warga telah dipulihkan normal.",
    });
  };

  // Payment Processing Handlers
  const handlePaymentSuccess = (invoiceId: string, method: PaymentMethod, refNumber: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    // 1. Mark Invoice as Paid
    const updatedInvoices = invoices.map((i) =>
      i.id === invoiceId
        ? {
            ...i,
            status: "paid" as const,
            paymentMethod: method,
            paymentRef: refNumber,
            paidDate: new Date().toISOString().slice(0, 10),
          }
        : i
    );
    updateInvoices(updatedInvoices);

    // 2. Open isolation if customer was isolated
    const updatedCustomers = customers.map((c) => {
      if (c.id === inv.customerId && c.status === "isolated") {
        return { ...c, status: "active" as const, totalPaidCount: c.totalPaidCount + 1 };
      }
      return c;
    });
    updateCustomers(updatedCustomers);

    // 3. Deposit money into appropriate wallet (e.g., QRIS Merchant or BCA)
    const targetWalletId = method === "QRIS" ? "w-4" : method === "BCA_VA" ? "w-2" : "w-1";
    const updatedWallets = wallets.map((w) =>
      w.id === targetWalletId ? { ...w, balance: w.balance + inv.totalAmount } : w
    );
    updateWallets(updatedWallets);

    // 4. Record financial transaction
    const newTx: FinancialTransaction = {
      id: `trx-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: "income",
      category: "Iuran Langganan",
      amount: inv.totalAmount,
      description: `Pelunasan ${inv.invoiceNumber} via ${method} (${inv.customerName})`,
      walletId: targetWalletId,
      walletName: wallets.find((w) => w.id === targetWalletId)?.name || "Kas",
    };
    updateTransactions([newTx, ...transactions]);

    // 5. Notify
    pushNotification(
      "Pembayaran Diterima",
      `Tagihan ${inv.invoiceNumber} senilai ${formatRupiah(inv.totalAmount)} lunas via ${method}.`,
      "payment"
    );
  };

  // Automated Monthly Invoice Generation
  const handleGenerateMonthlyInvoices = (month: string) => {
    const newInvoices: Invoice[] = [];
    let count = invoices.length + 1;

    customers.forEach((c) => {
      const alreadyExists = invoices.some(
        (i) => i.customerId === c.id && i.periodMonth === month
      );
      if (!alreadyExists) {
        const pkg = packages.find((p) => p.id === c.packageId) || packages[0];
        newInvoices.push({
          id: `inv-${Date.now()}-${count}`,
          invoiceNumber: `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(count).padStart(3, "0")}`,
          customerId: c.id,
          customerName: c.name,
          packageId: pkg.id,
          packageName: pkg.name,
          periodMonth: month,
          amount: pkg.price,
          taxAmount: 0,
          discount: 0,
          totalAmount: pkg.price,
          status: "unpaid",
          dueDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(c.dueDate).padStart(2, "0")}`,
        });
        count++;
      }
    });

    if (newInvoices.length > 0) {
      updateInvoices([...newInvoices, ...invoices]);
      pushNotification(
        "Penagihan Masal Selesai",
        `${newInvoices.length} invoice tagihan baru berhasil diterbitkan untuk periode ${month}.`,
        "billing"
      );
    }
  };

  // Inter-wallet Transfer
  const handleTransferFunds = (fromId: string, toId: string, amount: number, notes: string) => {
    const fromW = wallets.find((w) => w.id === fromId);
    const toW = wallets.find((w) => w.id === toId);
    if (!fromW || !toW || fromW.balance < amount) return;

    const updatedWallets = wallets.map((w) => {
      if (w.id === fromId) return { ...w, balance: w.balance - amount };
      if (w.id === toId) return { ...w, balance: w.balance + amount };
      return w;
    });
    updateWallets(updatedWallets);

    const tx: FinancialTransaction = {
      id: `trx-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: "expense",
      category: "Pindah Saldo",
      amount,
      description: `Transfer dari ${fromW.name} ke ${toW.name}. ${notes}`,
      walletId: fromId,
      walletName: fromW.name,
    };
    updateTransactions([tx, ...transactions]);

    pushNotification(
      "Pindah Saldo Berhasil",
      `Berhasil memindahkan ${formatRupiah(amount)} dari ${fromW.name} ke ${toW.name}.`,
      "payment"
    );
  };

  // Outage Handlers
  const handleAddOutage = (o: OutageAlert) => {
    const updated = [o, ...outages];
    updateOutages(updated);
    pushNotification(
      "Siaran Gangguan Diterbitkan",
      `Notifikasi gangguan "${o.title}" dikirimkan ke pelanggan di wilayah ${o.affectedArea}.`,
      "outage"
    );
  };

  const handleResolveOutage = (id: string) => {
    const updated = outages.map((o) => (o.id === id ? { ...o, status: "resolved" as const } : o));
    updateOutages(updated);
    pushNotification(
      "Gangguan Selesai",
      "Koneksi jaringan telah pulih normal. Seluruh link OLT telah kembali sinkron.",
      "outage"
    );
  };

  // Task Handlers
  const handleAddTask = (t: OperationalTask) => {
    const updated = [t, ...tasks];
    updateTasks(updated);
    pushNotification("Surat Tugas SPK Terbit", `SPK "${t.title}" ditugaskan ke ${t.assignee}.`, "task");
  };

  const handleUpdateTaskStatus = (id: string, status: OperationalTask["status"]) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, status } : t));
    updateTasks(updated);
    if (status === "completed") {
      pushNotification(
        "Tugas Selesai",
        "Pekerjaan teknisi lapangan telah diselesaikan dan diverifikasi.",
        "task"
      );
    }
  };

  // Counts for sidebar badges
  const counts = {
    totalCustomers: customers.length,
    isolatedCustomers: customers.filter((c) => c.status === "isolated").length,
    overdueInvoices: invoices.filter((i) => i.status === "overdue" || i.status === "unpaid").length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    activeOutages: outages.filter((o) => o.status !== "resolved").length,
    lowStockItems: inventoryItems.filter((i) => i.stockAvailable <= i.minStockAlert).length,
  };

  // Current selected customer for portal mode
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs py-1.5 px-4 flex items-center justify-center gap-2 font-semibold">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Mode Offline Aktif. Data tersimpan lokal di peramban Anda.</span>
        </div>
      )}

      {/* Primary Top Navigation Bar */}
      <Navbar
        role={role}
        setRole={setRole}
        lang={lang}
        setLang={(newLang) => {
          setLang(newLang);
          saveStoredLanguage(newLang);
        }}
        darkMode={isDark}
        setDarkMode={setIsDark}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        unreadCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenBiometric={() => setIsBiometricOpen(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        biometricActive={true}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        customers={customers}
        selectedCustomer={currentCustomer}
        setSelectedCustomer={(c) => setSelectedCustomerId(c.id)}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation for Staff / Admin Roles */}
        {role !== "customer" && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            lang={lang}
            counts={counts}
          />
        )}

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {role === "customer" ? (
            <CustomerPortal
              customer={currentCustomer}
              currentPackage={packages.find((p) => p.id === currentCustomer?.packageId)}
              invoices={invoices}
              onOpenPaymentModal={(inv) => setPaymentModalInvoice(inv)}
              onOpenPrintModal={(inv) => setPrintInvoice(inv)}
              onOpenAiChat={() => setIsAiChatOpen(true)}
              onSimulateDirectPayment={(inv) =>
                handlePaymentSuccess(inv.id, "QRIS", `QRIS-STATIS-${Date.now().toString().slice(-6)}`)
              }
              lang={lang}
            />
          ) : (
            <>
              {activeTab === "overview" && (
                <OverviewDashboard
                  customers={customers}
                  invoices={invoices}
                  wallets={wallets}
                  transactions={transactions}
                  outages={outages}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenAddCustomer={() => setActiveTab("customers")}
                  onOpenTransfer={() => setActiveTab("finance")}
                  onOpenOutageBroadcast={() => setActiveTab("outage")}
                  onOpenPaymentModal={(inv) => setPaymentModalInvoice(inv)}
                  lang={lang}
                />
              )}

              {activeTab === "customers" && (
                <CustomerManagement
                  customers={customers}
                  packages={packages}
                  invoices={invoices}
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onToggleIsolation={handleToggleIsolation}
                  onProcessCashPayment={(inv) =>
                    handlePaymentSuccess(inv.id, "CASH", `KASIR-TRX-${Date.now().toString().slice(-6)}`)
                  }
                  onOpenPaymentGateway={(inv) => setPaymentModalInvoice(inv)}
                  lang={lang}
                />
              )}

              {activeTab === "bandwidth" && (
                <BandwidthMonitor
                  lang={lang}
                  customers={customers}
                  packages={packages}
                  onToggleIsolation={handleToggleIsolation}
                />
              )}

              {activeTab === "billing" && (
                <BillingManagement
                  invoices={invoices}
                  customers={customers}
                  onGenerateMonthlyInvoices={handleGenerateMonthlyInvoices}
                  onOpenPaymentModal={(inv) => setPaymentModalInvoice(inv)}
                  onOpenPrintModal={(inv) => setPrintInvoice(inv)}
                  lang={lang}
                />
              )}

              {activeTab === "finance" && (
                <FinanceManagement
                  wallets={wallets}
                  transactions={transactions}
                  onAddTransaction={(tx) => updateTransactions([tx, ...transactions])}
                  onTransferFunds={handleTransferFunds}
                  lang={lang}
                />
              )}

              {activeTab === "inventory" && (
                <InventoryManagement
                  items={inventoryItems}
                  purchases={purchaseRecords}
                  depreciations={depreciationRecords}
                  customers={customers}
                  wallets={wallets}
                  onUpdateItems={updateInventoryItems}
                  onUpdatePurchases={updatePurchaseRecords}
                  onUpdateDepreciations={updateDepreciationRecords}
                  lang={lang}
                />
              )}

              {activeTab === "outage" && (
                <OutageNotificationCenter
                  outages={outages}
                  customers={customers}
                  onAddOutage={handleAddOutage}
                  onResolveOutage={handleResolveOutage}
                  lang={lang}
                />
              )}

              {activeTab === "tasks" && (
                <OperationalTasks
                  tasks={tasks}
                  customers={customers}
                  onAddTask={handleAddTask}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  lang={lang}
                />
              )}

              {activeTab === "audit" && (
                <AuditReports
                  customers={customers}
                  invoices={invoices}
                  wallets={wallets}
                  transactions={transactions}
                  packages={packages}
                  auditLogs={auditLogs}
                  onAddAuditLog={handleAddAuditLog}
                  lang={lang}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation for Admin / Staff */}
      {role !== "customer" && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 flex items-center justify-around text-[10px] font-bold text-slate-500">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center gap-1 ${
              activeTab === "overview" ? "text-indigo-600 dark:text-indigo-400" : ""
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dasbor</span>
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`flex flex-col items-center gap-1 ${
              activeTab === "customers" ? "text-indigo-600 dark:text-indigo-400" : ""
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pelanggan</span>
          </button>

          <button
            onClick={() => setActiveTab("bandwidth")}
            className={`flex flex-col items-center gap-1 ${
              activeTab === "bandwidth" ? "text-indigo-600 dark:text-indigo-400" : ""
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Bandwidth</span>
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            className={`flex flex-col items-center gap-1 ${
              activeTab === "billing" ? "text-indigo-600 dark:text-indigo-400" : ""
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Billing</span>
          </button>

          <button
            onClick={() => setActiveTab("finance")}
            className={`flex flex-col items-center gap-1 ${
              activeTab === "finance" ? "text-indigo-600 dark:text-indigo-400" : ""
            }`}
          >
            <WalletIcon className="w-4 h-4" />
            <span>Keuangan</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex flex-col items-center gap-1 ${
              activeTab === "inventory" ? "text-indigo-600 dark:text-indigo-400" : ""
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Aset</span>
          </button>
        </div>
      )}

      {/* Notification Drawer */}
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          const readAll = notifications.map((n) => ({ ...n, read: true }));
          setNotifications(readAll);
          saveStoredNotifications(readAll);
        }}
        onNotificationClick={(notif) => {
          if (notif.type === "billing" || notif.type === "payment") setActiveTab("billing");
          if (notif.type === "outage") setActiveTab("outage");
          if (notif.type === "task") setActiveTab("tasks");
          setIsNotifOpen(false);
        }}
        lang={lang}
      />

      {/* Biometric Auth Modal */}
      <BiometricModal
        isOpen={isBiometricOpen}
        onClose={() => setIsBiometricOpen(false)}
        onSuccess={() => {
          pushNotification(
            "Otorisasi Biometrik Berhasil",
            "Identitas operator telah diverifikasi menggunakan WebAuthn / FIDO2.",
            "system"
          );
        }}
        lang={lang}
      />

      {/* Gemini AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        lang={lang}
        currentCustomer={role === "customer" ? currentCustomer : null}
      />

      {/* Payment Gateway Modal */}
      {paymentModalInvoice && (
        <PaymentGatewayModal
          isOpen={true}
          onClose={() => setPaymentModalInvoice(null)}
          invoice={paymentModalInvoice}
          onPaymentSuccess={handlePaymentSuccess}
          lang={lang}
        />
      )}

      {/* Invoice Print / Kwitansi Modal */}
      {printInvoice && (
        <InvoicePrintModal
          isOpen={true}
          onClose={() => setPrintInvoice(null)}
          invoice={printInvoice}
          lang={lang}
        />
      )}
    </div>
  );
}
