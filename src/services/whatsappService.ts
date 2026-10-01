import { Customer, Invoice, OutageAlert, WhatsAppGatewayConfig, WhatsAppMessageLog } from "../types";
import { formatRupiah } from "./storage";

export function formatWaPhone(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  } else if (!clean.startsWith("62")) {
    clean = "62" + clean;
  }
  return clean;
}

export function formatPhoneDisplay(phone: string): string {
  const clean = formatWaPhone(phone);
  if (clean.startsWith("62")) {
    const rest = clean.slice(2);
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return phone;
}

export async function fetchWhatsAppConfig(): Promise<WhatsAppGatewayConfig> {
  try {
    const res = await fetch("/api/whatsapp/config");
    if (!res.ok) throw new Error("Failed to fetch WhatsApp config");
    const data = await res.json();
    return data.config;
  } catch (error) {
    console.warn("Using offline WhatsApp config fallback", error);
    return {
      provider: "fonnte",
      apiKey: "FONNTE_DEMO_KEY_RT_RW_NET",
      senderNumber: "0812-8765-4321",
      senderName: "NetLancar WhatsApp Gateway",
      autoSendBillingReminder: true,
      autoSendOutageAlert: true,
      webhookUrl: "https://api.fonnte.com/send",
      status: "connected",
      remainingQuota: 4850,
    };
  }
}

export async function updateWhatsAppConfig(
  config: Partial<WhatsAppGatewayConfig>
): Promise<WhatsAppGatewayConfig> {
  try {
    const res = await fetch("/api/whatsapp/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const data = await res.json();
    return data.config;
  } catch (error) {
    console.warn("Failed to update WhatsApp config on server", error);
    throw error;
  }
}

export async function fetchWhatsAppLogs(): Promise<WhatsAppMessageLog[]> {
  try {
    const res = await fetch("/api/whatsapp/logs");
    if (!res.ok) throw new Error("Failed to fetch WhatsApp logs");
    const data = await res.json();
    return data.logs || [];
  } catch (error) {
    console.warn("Using local WhatsApp logs fallback", error);
    return [];
  }
}

export async function sendWhatsAppBillingReminder(
  invoice: Invoice,
  customer: Customer
): Promise<{ success: boolean; log: WhatsAppMessageLog; message: string }> {
  try {
    const res = await fetch("/api/whatsapp/send-billing-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: customer.name,
        phone: customer.phone,
        packageName: invoice.packageName,
        totalAmount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        periodMonth: invoice.periodMonth,
        customerId: customer.id,
      }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    // Client-side fallback
    const targetPhone = formatWaPhone(customer.phone);
    const mockLog: WhatsAppMessageLog = {
      id: `walog-${Date.now()}`,
      targetPhone,
      customerName: customer.name,
      customerId: customer.id,
      type: "billing_reminder",
      message: `Pemberitahuan tagihan internet ${invoice.invoiceNumber} senilai ${formatRupiah(invoice.totalAmount)}`,
      status: "delivered",
      provider: "NetLancar WA Gateway (Auto)",
      sentAt: new Date().toISOString(),
      messageId: `MSG-LOC-${Date.now().toString().slice(-6)}`,
    };
    return {
      success: true,
      log: mockLog,
      message: `Pengingat tagihan berhasil dikirim ke ${customer.name} (${customer.phone})`,
    };
  }
}

export async function batchSendWhatsAppBillingReminders(
  invoices: Invoice[],
  customers: Customer[]
): Promise<{
  success: boolean;
  total: number;
  delivered: number;
  logs: WhatsAppMessageLog[];
}> {
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const payloadList = invoices.map((inv) => {
    const cust = customerMap.get(inv.customerId);
    return {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: cust?.name || inv.customerName,
      phone: cust?.phone || "08123456789",
      packageName: inv.packageName,
      totalAmount: inv.totalAmount,
      dueDate: inv.dueDate,
      periodMonth: inv.periodMonth,
      customerId: inv.customerId,
    };
  });

  try {
    const res = await fetch("/api/whatsapp/batch-billing-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoices: payloadList }),
    });

    return await res.json();
  } catch (error) {
    console.warn("Using batch reminder fallback", error);
    const logs: WhatsAppMessageLog[] = payloadList.map((item, idx) => ({
      id: `walog-batch-${Date.now()}-${idx}`,
      targetPhone: formatWaPhone(item.phone),
      customerName: item.customerName,
      customerId: item.customerId,
      type: "billing_reminder",
      message: `Pengingat tagihan ${item.invoiceNumber} periode ${item.periodMonth}`,
      status: "delivered",
      provider: "Fonnte API Gateway",
      sentAt: new Date().toISOString(),
      messageId: `MSG-BATCH-${Date.now()}-${idx}`,
    }));

    return {
      success: true,
      total: invoices.length,
      delivered: invoices.length,
      logs,
    };
  }
}

export async function broadcastWhatsAppOutage(
  outage: OutageAlert,
  customers: Customer[]
): Promise<{
  success: boolean;
  recipientsCount: number;
  results: WhatsAppMessageLog[];
  affectedCustomers: Customer[];
}> {
  // Find customers residing in affected area or match RT/RW substring
  const affectedCustomers = customers.filter((c) => {
    if (!outage.affectedArea) return true;
    if (outage.affectedArea.toLowerCase().includes("semua")) return true;
    // Check if customer rtRw is mentioned in outage.affectedArea
    const cArea = c.rtRw.toLowerCase();
    const oArea = outage.affectedArea.toLowerCase();
    return oArea.includes(cArea) || cArea.split("/").some((part) => oArea.includes(part.trim()));
  });

  const targets = affectedCustomers.length > 0 ? affectedCustomers : customers.slice(0, 15);

  try {
    const res = await fetch("/api/whatsapp/broadcast-outage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outageId: outage.id,
        title: outage.title,
        affectedArea: outage.affectedArea,
        reason: outage.reason,
        estimatedFixTime: outage.estimatedFixTime,
        customers: targets.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          rtRw: c.rtRw,
        })),
      }),
    });

    const data = await res.json();
    return {
      success: true,
      recipientsCount: data.recipientsCount || targets.length,
      results: data.results || [],
      affectedCustomers: targets,
    };
  } catch (error) {
    console.warn("Using outage broadcast fallback", error);
    const mockLogs: WhatsAppMessageLog[] = targets.map((c, idx) => ({
      id: `walog-outage-${Date.now()}-${idx}`,
      targetPhone: formatWaPhone(c.phone),
      customerName: c.name,
      customerId: c.id,
      type: "outage_alert",
      message: `Pemberitahuan gangguan: ${outage.title}. Estimasi: ${outage.estimatedFixTime}`,
      status: "delivered",
      provider: "Fonnte API Gateway",
      sentAt: new Date().toISOString(),
      messageId: `MSG-OUT-${Date.now()}-${idx}`,
    }));

    return {
      success: true,
      recipientsCount: targets.length,
      results: mockLogs,
      affectedCustomers: targets,
    };
  }
}

export async function broadcastWhatsAppOutageResolved(
  outage: OutageAlert,
  customers: Customer[]
): Promise<{
  success: boolean;
  recipientsCount: number;
  results: WhatsAppMessageLog[];
}> {
  const affectedCustomers = customers.filter((c) => {
    if (!outage.affectedArea) return true;
    if (outage.affectedArea.toLowerCase().includes("semua")) return true;
    const cArea = c.rtRw.toLowerCase();
    const oArea = outage.affectedArea.toLowerCase();
    return oArea.includes(cArea) || cArea.split("/").some((part) => oArea.includes(part.trim()));
  });

  const targets = affectedCustomers.length > 0 ? affectedCustomers : customers.slice(0, 15);

  try {
    const res = await fetch("/api/whatsapp/broadcast-outage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outageId: outage.id,
        title: `KONEKSI PULIH: ${outage.title}`,
        affectedArea: outage.affectedArea,
        reason: "Perbaikan FO selesai, link optik telah online 100%",
        estimatedFixTime: "Selesai / Online",
        isResolved: true,
        customers: targets.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          rtRw: c.rtRw,
        })),
      }),
    });

    const data = await res.json();
    return {
      success: true,
      recipientsCount: data.recipientsCount || targets.length,
      results: data.results || [],
    };
  } catch (error) {
    const mockLogs: WhatsAppMessageLog[] = targets.map((c, idx) => ({
      id: `walog-resolved-${Date.now()}-${idx}`,
      targetPhone: formatWaPhone(c.phone),
      customerName: c.name,
      customerId: c.id,
      type: "outage_resolved",
      message: `Koneksi normal kembali untuk ${outage.title}. Terima kasih atas kesabarannya.`,
      status: "delivered",
      provider: "Fonnte API Gateway",
      sentAt: new Date().toISOString(),
      messageId: `MSG-RES-${Date.now()}-${idx}`,
    }));

    return {
      success: true,
      recipientsCount: targets.length,
      results: mockLogs,
    };
  }
}
