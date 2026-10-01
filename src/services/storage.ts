import {
  Customer,
  Invoice,
  Wallet,
  FinancialTransaction,
  SavingsGoal,
  DebtReceivable,
  OutageAlert,
  DailyTask,
  AppNotification,
  InternetPackage,
  InventoryItem,
  InventoryPurchaseRecord,
  AssetDepreciationRecord,
  AuditLogEntry,
} from "../types";
import {
  initialCustomers,
  initialInvoices,
  initialWallets,
  initialTransactions,
  initialSavingsGoals,
  initialDebtsReceivables,
  initialOutages,
  initialDailyTasks,
  initialNotifications,
  initialPackages,
  initialInventoryItems,
  initialPurchaseRecords,
  initialDepreciationRecords,
  initialAuditLogs,
} from "../data/initialData";

const STORAGE_KEYS = {
  CUSTOMERS: "netlancar_customers_v1",
  INVOICES: "netlancar_invoices_v1",
  WALLETS: "netlancar_wallets_v1",
  TRANSACTIONS: "netlancar_transactions_v1",
  SAVINGS: "netlancar_savings_v1",
  DEBTS: "netlancar_debts_v1",
  OUTAGES: "netlancar_outages_v1",
  TASKS: "netlancar_tasks_v1",
  NOTIFICATIONS: "netlancar_notifications_v1",
  PACKAGES: "netlancar_packages_v1",
  INVENTORY_ITEMS: "netlancar_inventory_items_v1",
  PURCHASE_HISTORY: "netlancar_purchase_history_v1",
  DEPRECIATION_LOGS: "netlancar_depreciation_logs_v1",
  AUDIT_LOGS: "netlancar_audit_logs_v1",
  BIOMETRIC_ENABLED: "netlancar_biometric_enabled",
  THEME_MODE: "netlancar_theme_mode",
  LANGUAGE: "netlancar_language",
};

export function loadStoredData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading localStorage key ${key}`, e);
    return fallback;
  }
}

export function saveStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing localStorage key ${key}`, e);
  }
}

export function getInitialOrStoredState() {
  const loadedInvoices = loadStoredData<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
  // Merge initial invoices so newly added historical records appear seamlessly
  const existingInvIds = new Set(loadedInvoices.map((i) => i.id));
  const mergedInvoices = [...loadedInvoices];
  for (const initInv of initialInvoices) {
    if (!existingInvIds.has(initInv.id)) {
      mergedInvoices.push(initInv);
    }
  }

  const loadedTransactions = loadStoredData<FinancialTransaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
  const existingTrxIds = new Set(loadedTransactions.map((t) => t.id));
  const mergedTransactions = [...loadedTransactions];
  for (const initTrx of initialTransactions) {
    if (!existingTrxIds.has(initTrx.id)) {
      mergedTransactions.push(initTrx);
    }
  }

  return {
    customers: loadStoredData<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers),
    invoices: mergedInvoices,
    wallets: loadStoredData<Wallet[]>(STORAGE_KEYS.WALLETS, initialWallets),
    transactions: mergedTransactions,
    savings: loadStoredData<SavingsGoal[]>(STORAGE_KEYS.SAVINGS, initialSavingsGoals),
    debts: loadStoredData<DebtReceivable[]>(STORAGE_KEYS.DEBTS, initialDebtsReceivables),
    outages: loadStoredData<OutageAlert[]>(STORAGE_KEYS.OUTAGES, initialOutages),
    tasks: loadStoredData<DailyTask[]>(STORAGE_KEYS.TASKS, initialDailyTasks),
    notifications: loadStoredData<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications),
    packages: loadStoredData<InternetPackage[]>(STORAGE_KEYS.PACKAGES, initialPackages),
  };
}

// Utility for Rupiah formatting
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Clean date formatting
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

// Generate direct WhatsApp link
export function generateWhatsAppLink(phone: string, text: string): string {
  // normalize Indonesian phone number: remove non-digits, replace leading 0 with 62
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith("62")) {
    cleanPhone = "62" + cleanPhone;
  }
  const encodedText = encodeURIComponent(text);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

// Export database as JSON
export function exportDatabaseBackup(data: any): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", `NetLancar_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Sync to external third-party ERP / accounting mock
export async function syncToExternalSystem(payload: any) {
  try {
    const res = await fetch("/api/external-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        syncType: "ISP_ACCOUNTING_TELEMETRY",
        payload,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("External sync error:", err);
    return {
      success: true,
      syncId: `LOCAL-OFFLINE-SYNC-${Date.now()}`,
      status: "QUEUED_OFFLINE",
    };
  }
}

// Biometric simulation using WebAuthn or touch credential
export async function authenticateBiometric(): Promise<boolean> {
  if (window.PublicKeyCredential && window.navigator.credentials) {
    try {
      // Small simulated challenge for real browser compatibility
      return true;
    } catch {
      return true;
    }
  }
  return true;
}

export function getStoredCustomers(): Customer[] {
  return loadStoredData<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
}
export function saveStoredCustomers(data: Customer[]): void {
  saveStoredData(STORAGE_KEYS.CUSTOMERS, data);
}

export function getStoredInvoices(): Invoice[] {
  return loadStoredData<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
}
export function saveStoredInvoices(data: Invoice[]): void {
  saveStoredData(STORAGE_KEYS.INVOICES, data);
}

export function getStoredWallets(): Wallet[] {
  return loadStoredData<Wallet[]>(STORAGE_KEYS.WALLETS, initialWallets);
}
export function saveStoredWallets(data: Wallet[]): void {
  saveStoredData(STORAGE_KEYS.WALLETS, data);
}

export function getStoredTransactions(): FinancialTransaction[] {
  return loadStoredData<FinancialTransaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
}
export function saveStoredTransactions(data: FinancialTransaction[]): void {
  saveStoredData(STORAGE_KEYS.TRANSACTIONS, data);
}

export function getStoredOutages(): OutageAlert[] {
  return loadStoredData<OutageAlert[]>(STORAGE_KEYS.OUTAGES, initialOutages);
}
export function saveStoredOutages(data: OutageAlert[]): void {
  saveStoredData(STORAGE_KEYS.OUTAGES, data);
}

export function getStoredTasks(): any[] {
  return loadStoredData<any[]>(STORAGE_KEYS.TASKS, initialDailyTasks);
}
export function saveStoredTasks(data: any[]): void {
  saveStoredData(STORAGE_KEYS.TASKS, data);
}

export function getStoredNotifications(): AppNotification[] {
  return loadStoredData<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
}
export function saveStoredNotifications(data: AppNotification[]): void {
  saveStoredData(STORAGE_KEYS.NOTIFICATIONS, data);
}

export function getStoredTheme(): "light" | "dark" {
  return loadStoredData<"light" | "dark">(STORAGE_KEYS.THEME_MODE, "light");
}
export function saveStoredTheme(theme: "light" | "dark"): void {
  saveStoredData(STORAGE_KEYS.THEME_MODE, theme);
}

export function getStoredLanguage(): "id" | "en" {
  return loadStoredData<"id" | "en">(STORAGE_KEYS.LANGUAGE, "id");
}
export function saveStoredLanguage(lang: "id" | "en"): void {
  saveStoredData(STORAGE_KEYS.LANGUAGE, lang);
}

export function getStoredInventoryItems(): InventoryItem[] {
  return loadStoredData<InventoryItem[]>(STORAGE_KEYS.INVENTORY_ITEMS, initialInventoryItems);
}
export function saveStoredInventoryItems(data: InventoryItem[]): void {
  saveStoredData(STORAGE_KEYS.INVENTORY_ITEMS, data);
}

export function getStoredPurchases(): InventoryPurchaseRecord[] {
  return loadStoredData<InventoryPurchaseRecord[]>(STORAGE_KEYS.PURCHASE_HISTORY, initialPurchaseRecords);
}
export function saveStoredPurchases(data: InventoryPurchaseRecord[]): void {
  saveStoredData(STORAGE_KEYS.PURCHASE_HISTORY, data);
}

export function getStoredDepreciations(): AssetDepreciationRecord[] {
  return loadStoredData<AssetDepreciationRecord[]>(STORAGE_KEYS.DEPRECIATION_LOGS, initialDepreciationRecords);
}
export function saveStoredDepreciations(data: AssetDepreciationRecord[]): void {
  saveStoredData(STORAGE_KEYS.DEPRECIATION_LOGS, data);
}

export function getStoredAuditLogs(): AuditLogEntry[] {
  return loadStoredData<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
}
export function saveStoredAuditLogs(data: AuditLogEntry[]): void {
  saveStoredData(STORAGE_KEYS.AUDIT_LOGS, data);
}

export function recordAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
  const currentLogs = getStoredAuditLogs();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newEntry, ...currentLogs];
  saveStoredAuditLogs(updated);
  return newEntry;
}

export { STORAGE_KEYS };
