export type UserRole = "admin" | "customer";

export type CustomerStatus = "active" | "isolated" | "suspended" | "pending";

export type PaymentStatus = "paid" | "unpaid" | "overdue" | "cancelled";

export type PaymentMethod = "QRIS" | "BCA_VA" | "MANDIRI_VA" | "BRI_VA" | "DANA" | "GOPAY" | "OVO" | "CASH";

export interface InternetPackage {
  id: string;
  name: string;
  speedDownload: number; // in Mbps
  speedUpload: number; // in Mbps
  price: number; // in IDR
  description: string;
  color: string;
  popular?: boolean;
}

export interface Customer {
  id: string;
  customerCode: string; // e.g. CUST-001
  name: string;
  phone: string; // e.g. 08123456789
  email?: string;
  address: string; // e.g. RT 03 / RW 05, Blok C No. 12
  rtRw: string; // e.g. "RT 03 / RW 05"
  packageId: string;
  status: CustomerStatus;
  ipAddress: string;
  macAddress: string;
  pppoeUsername: string;
  pppoePassword?: string;
  oltPort: string; // e.g. PON-1/Slot-2
  ontModel: string; // e.g. ZTE F609 / Huawei HG8245H
  joinDate: string;
  dueDate: number; // Day of month (e.g. 10)
  autoIsolateEnabled: boolean;
  totalPaidCount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-202609-001
  customerId: string;
  customerName: string;
  packageId: string;
  packageName: string;
  periodMonth: string; // e.g. "September 2026"
  amount: number;
  taxAmount: number; // PPN 11% or 0
  discount: number;
  totalAmount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
  notes?: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: "cash" | "bank" | "ewallet";
  accountNumber?: string;
  accountHolder?: string;
  balance: number;
  iconName: string;
  color: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface FinancialTransaction {
  id: string;
  date: string;
  type: TransactionType;
  walletId: string;
  walletName?: string;
  toWalletId?: string; // for transfer
  category: string; // e.g. "Iuran Bulanan", "Pemasangan Baru", "Upstream Fiber", "Listrik PLN", "Pemeliharaan FO"
  amount: number;
  description: string;
  referenceNumber?: string;
  customerId?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  notes: string;
  category: string;
}

export interface DebtReceivable {
  id: string;
  type: "debt" | "receivable"; // debt = hutang kita ke vendor; receivable = piutang pelanggan
  partyName: string;
  contact?: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: "unpaid" | "partial" | "settled";
  description: string;
}

export interface OutageAlert {
  id: string;
  title: string;
  affectedArea: string; // e.g. "RW 04 & RW 05"
  reason: string; // e.g. "Kabel FO Putus akibat galian drainase"
  status: "investigating" | "repairing" | "resolved" | "in_progress";
  startTime?: string;
  startedAt?: string;
  estimatedFixTime: string;
  broadcastSentToWhatsApp?: boolean;
  broadcastSent?: boolean;
  recipientsCount?: number;
}

export interface OperationalTask {
  id: string;
  title: string;
  description: string;
  type?: "installation" | "repair" | "maintenance" | "dismantle";
  priority: "urgent" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  assignee: string;
  customerId?: string;
  customerName?: string;
  createdAt: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  dueDate: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "billing" | "outage" | "system" | "task" | "payment";
  timestamp: string;
  read: boolean;
  linkTab?: string;
}

export interface BandwidthDataPoint {
  time: string;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
}

export interface WhatsAppMessageLog {
  id: string;
  targetPhone: string;
  customerName: string;
  customerId?: string;
  type: "billing_reminder" | "outage_alert" | "outage_resolved" | "system";
  message: string;
  status: "sent" | "delivered" | "failed";
  provider: string;
  sentAt: string;
  messageId: string;
}

export interface WhatsAppGatewayConfig {
  provider: "fonnte" | "wablas" | "twilio" | "meta" | "custom";
  apiKey: string;
  senderNumber: string;
  senderName: string;
  autoSendBillingReminder: boolean;
  autoSendOutageAlert: boolean;
  webhookUrl?: string;
  status: "connected" | "disconnected" | "testing";
  remainingQuota: number;
}

export type AssetCategory =
  | "router_cpe"
  | "cables_passive"
  | "olt_switch"
  | "tools_splicer"
  | "power_ups";

export type AssetCondition = "new" | "good" | "fair" | "damaged" | "decommissioned";

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  unit: "unit" | "pcs" | "roll" | "box" | "set" | "meter";
  stockTotal: number;
  stockAvailable: number;
  stockDeployed: number;
  stockFaulty: number;
  minStockAlert: number;
  purchasePrice: number;
  purchaseDate: string;
  supplier: string;
  location: string;
  usefulLifeMonths: number;
  salvageValue: number;
  serialNumbers?: string[];
  specs?: string;
  notes?: string;
}

export interface InventoryPurchaseRecord {
  id: string;
  itemId: string;
  itemName: string;
  purchaseOrderNumber: string;
  purchaseDate: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  paymentMethod: string;
  warrantyUntil?: string;
  receivedBy: string;
  notes?: string;
}

export interface AssetDepreciationRecord {
  id: string;
  itemId: string;
  itemName: string;
  category: AssetCategory;
  acquisitionCost: number;
  purchaseDate: string;
  usefulLifeYears: number;
  salvageValue: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
  depreciationPercentage: number;
  status: "active" | "fully_depreciated" | "disposed";
  lastCalculatedDate: string;
}

export type AuditActionType =
  | "customer_isolation_toggle"
  | "customer_deletion"
  | "customer_creation"
  | "customer_update"
  | "system_config_change"
  | "gateway_config_change"
  | "manual_fund_transfer"
  | "invoice_manual_override"
  | "outage_broadcast";

export type AuditSeverity = "critical" | "warning" | "info";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditActionType;
  actionTitle: string;
  description: string;
  actorName: string;
  actorRole: string;
  ipAddress: string;
  deviceInfo?: string;
  targetResource: string;
  targetId?: string;
  severity: AuditSeverity;
  status: "success" | "failed" | "rejected";
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  notes?: string;
}



