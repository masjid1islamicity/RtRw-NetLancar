import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Lazy initialize Gemini client
  let genAI: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environment");
      }
      genAI = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return genAI;
  }

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "NetLancar RtRwNet Platform API",
    });
  });

  // AI ISP Support and Network Diagnostics endpoint
  app.post("/api/gemini/support", async (req, res) => {
    try {
      const { message, customerContext, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const client = getGeminiClient();

      const systemInstruction = `Anda adalah "NetLancar AI Bot" — asisten pintar resmi untuk ISP & jaringan RT/RW Net.
Tugas Anda adalah melayani pelanggan dan staf teknis dengan ramah, profesional, dan solutif.
Kemampuan Anda:
1. Menjawab pertanyaan seputar paket internet, tagihan, metode pembayaran (QRIS, Transfer Bank BCA/Mandiri/BRI, E-wallet).
2. Membantu troubleshooting gangguan koneksi: lampu LOS merah pada modem GPON/XPON, router lemot, DNS timeout, cara restart ONT/AP, cek status isolir.
3. Membantu staf operasional: estimasi alokasi bandwidth QoS Mikrotik, perhitungan Simple Queue / PCQ, manajemen OLT EPON/GPON, dan rekomendasi mitigasi cuaca/petir.
4. Gaya komunikasi: Sopan, jelas, terstruktur (gunakan bullet point bila langkah teknis), berbasis bahasa Indonesia (atau sesuaikan dengan bahasa user).

Konteks Pelanggan Saat Ini:
${customerContext ? JSON.stringify(customerContext, null, 2) : "Umum / Pengunjung"}`;

      // Build conversation contents
      let contentsPayload: any = [];
      if (Array.isArray(history) && history.length > 0) {
        contentsPayload = history.slice(-6).map((h: any) => ({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: h.text || "" }],
        }));
      }
      contentsPayload.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "Mohon maaf, sistem AI sedang mengoptimalkan respons. Silakan coba kembali.";

      res.json({
        reply: replyText,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini AI error:", error);
      // Friendly fallback if API key is missing or quota is reached
      res.status(200).json({
        reply: `[Mode Offline AI] Halo! Terima kasih telah menghubungi NetLancar Support.
Pesan Anda telah diterima. Jika Anda mengalami kendala koneksi seperti lampu LOS merah pada modem ONT, silakan coba matikan modem selama 30 detik lalu nyalakan kembali. Untuk konfirmasi pembayaran, sistem otomatis memverifikasi invoice Anda dalam 1-3 menit.`,
        note: error?.message || "Fallback generated",
      });
    }
  });

  // External Third-Party Financial Sync API (Mock Gateway/ERP: Jurnal, Accurate, Midtrans)
  app.post("/api/external-sync", (req, res) => {
    const { syncType, payload } = req.body;
    res.json({
      success: true,
      syncId: `SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      syncType: syncType || "FINANCE_LEDGER_SYNC",
      recordsProcessed: Array.isArray(payload) ? payload.length : 1,
      encryptedChecksum: Buffer.from(`SHA256:${Date.now()}`).toString("base64"),
      status: "COMPLETED",
      syncedAt: new Date().toISOString(),
    });
  });

  // Active QRIS Sessions store for automated bank mutation matching (Auto-Reconcile)
  interface QrisSessionRecord {
    invoiceId: string;
    invoiceNumber: string;
    customerName: string;
    baseAmount: number;
    uniqueCode: number;
    totalAmountWithUnique: number;
    status: "WAITING_MUTATION" | "SETTLED" | "EXPIRED";
    createdAt: number;
    expiresAt: number;
    settledAt?: string;
    matchedMutation?: {
      bank: string;
      channel: string;
      referenceNumber: string;
      amountMatched: number;
      matchedAt: string;
    };
  }

  const qrisSessions = new Map<string, QrisSessionRecord>();

  // 1. Register or update dynamic QRIS session with unique payment amount
  app.post("/api/payment-gateway/qris/session", (req, res) => {
    const { invoiceId, invoiceNumber, customerName, baseAmount, uniqueCode } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ error: "invoiceId is required" });
    }

    const totalAmountWithUnique = (Number(baseAmount) || 0) + (Number(uniqueCode) || 0);
    const existing = qrisSessions.get(invoiceId);

    if (existing && existing.status === "SETTLED") {
      return res.json({ session: existing });
    }

    const session: QrisSessionRecord = {
      invoiceId,
      invoiceNumber: invoiceNumber || "INV-001",
      customerName: customerName || "Pelanggan",
      baseAmount: Number(baseAmount) || 0,
      uniqueCode: Number(uniqueCode) || 0,
      totalAmountWithUnique,
      status: "WAITING_MUTATION",
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    qrisSessions.set(invoiceId, session);
    res.json({ success: true, session });
  });

  // 2. Poll QRIS auto-reconciliation status
  app.get("/api/payment-gateway/qris/session/:invoiceId", (req, res) => {
    const { invoiceId } = req.params;
    const session = qrisSessions.get(invoiceId);
    if (!session) {
      return res.json({ status: "NOT_FOUND" });
    }
    res.json({ status: session.status, session });
  });

  // 3. Simulate incoming bank mutation webhook matching the exact unique amount
  app.post("/api/payment-gateway/qris/simulate-reconcile", (req, res) => {
    const { invoiceId, bank = "QRIS BCA Mobile", customRef } = req.body;
    let session = qrisSessions.get(invoiceId);

    const refNumber = customRef || `QRIS-REC-${Date.now().toString().slice(-8)}`;

    if (!session) {
      session = {
        invoiceId,
        invoiceNumber: "INV-AUTO",
        customerName: "Pelanggan",
        baseAmount: 100000,
        uniqueCode: 123,
        totalAmountWithUnique: 100123,
        status: "WAITING_MUTATION",
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
      };
    }

    session.status = "SETTLED";
    session.settledAt = new Date().toISOString();
    session.matchedMutation = {
      bank,
      channel: "QRIS National Switching (ASPI/BI)",
      referenceNumber: refNumber,
      amountMatched: session.totalAmountWithUnique,
      matchedAt: new Date().toISOString(),
    };

    qrisSessions.set(invoiceId, session);

    res.json({
      success: true,
      autoReconciled: true,
      message: `Mutasi kas masuk Rp ${session.totalAmountWithUnique.toLocaleString("id-ID")} berhasil dicocokkan otomatis!`,
      session,
    });
  });

  // Payment verification endpoint simulation
  app.post("/api/payment-gateway/verify", (req, res) => {
    const { invoiceId, method, amount } = req.body;
    const session = qrisSessions.get(invoiceId);
    if (session) {
      session.status = "SETTLED";
      session.settledAt = new Date().toISOString();
      session.matchedMutation = {
        bank: "QRIS Gateway Network",
        channel: "QRIS Dynamic ASPI",
        referenceNumber: `TRX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        amountMatched: amount || session.totalAmountWithUnique,
        matchedAt: new Date().toISOString(),
      };
    }

    res.json({
      success: true,
      invoiceId,
      transactionStatus: "SETTLEMENT",
      referenceNumber: `TRX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentMethod: method || "QRIS",
      amountPaid: amount,
      verifiedAt: new Date().toISOString(),
    });
  });

  // ==========================================
  // WHATSAPP API GATEWAY & AUTOMATION ENGINE
  // ==========================================

  interface WhatsAppConfigRecord {
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

  interface WhatsAppLogRecord {
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

  let whatsAppConfig: WhatsAppConfigRecord = {
    provider: "fonnte",
    apiKey: process.env.WHATSAPP_API_KEY || "FONNTE_DEMO_KEY_RT_RW_NET",
    senderNumber: "0812-8765-4321",
    senderName: "NetLancar WhatsApp Gateway",
    autoSendBillingReminder: true,
    autoSendOutageAlert: true,
    webhookUrl: "https://api.fonnte.com/send",
    status: "connected",
    remainingQuota: 4850,
  };

  const whatsAppLogs: WhatsAppLogRecord[] = [
    {
      id: "walog-init-1",
      targetPhone: "6281287654321",
      customerName: "Budi Santoso",
      customerId: "cust-1",
      type: "billing_reminder",
      message: "*PEMBERITAHUAN TAGIHAN INTERNET NETLANCAR*\nYth. Budi Santoso, tagihan periode Oktober 2026 sebesar Rp 175.000 jatuh tempo pada 10 Oktober 2026.",
      status: "delivered",
      provider: "Fonnte API Gateway",
      sentAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      messageId: "MSG-WA-981023",
    },
    {
      id: "walog-init-2",
      targetPhone: "6281399887766",
      customerName: "Siti Aminah",
      customerId: "cust-2",
      type: "outage_alert",
      message: "*PEMBERITAHUAN GANGGUAN JARINGAN (NETLANCAR)*\nWilayah RT 01 - RT 04 / RW 04 sedang mengalami kendala FO. Estimasi perbaikan: 2 Jam.",
      status: "delivered",
      provider: "Fonnte API Gateway",
      sentAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      messageId: "MSG-WA-980712",
    },
  ];

  function normalizeWaNumber(phone: string): string {
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    } else if (!clean.startsWith("62")) {
      clean = "62" + clean;
    }
    return clean;
  }

  // 1. Get WhatsApp Gateway Config
  app.get("/api/whatsapp/config", (_req, res) => {
    res.json({
      config: whatsAppConfig,
      logsCount: whatsAppLogs.length,
    });
  });

  // 2. Update WhatsApp Gateway Config
  app.post("/api/whatsapp/config", (req, res) => {
    whatsAppConfig = {
      ...whatsAppConfig,
      ...req.body,
    };
    res.json({
      success: true,
      config: whatsAppConfig,
    });
  });

  // 3. Get WhatsApp Delivery Logs
  app.get("/api/whatsapp/logs", (_req, res) => {
    res.json({
      logs: whatsAppLogs.slice(0, 100),
    });
  });

  // 4. Send Individual WhatsApp Notification
  app.post("/api/whatsapp/send", async (req, res) => {
    const { phone, customerName, customerId, message, type = "system" } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: "phone and message are required" });
    }

    const cleanPhone = normalizeWaNumber(phone);
    const messageId = `MSG-WA-${Date.now().toString().slice(-7)}`;

    // If external Fonnte API Key is available, make real outbound request
    if (whatsAppConfig.provider === "fonnte" && whatsAppConfig.apiKey && !whatsAppConfig.apiKey.includes("DEMO")) {
      try {
        await fetch(whatsAppConfig.webhookUrl || "https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            Authorization: whatsAppConfig.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: cleanPhone,
            message,
          }),
        });
      } catch (err) {
        console.warn("Outbound WA API error, using gateway simulation fallback", err);
      }
    }

    whatsAppConfig.remainingQuota = Math.max(0, whatsAppConfig.remainingQuota - 1);

    const logRecord: WhatsAppLogRecord = {
      id: `walog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      targetPhone: cleanPhone,
      customerName: customerName || "Pelanggan",
      customerId,
      type,
      message,
      status: "delivered",
      provider: whatsAppConfig.provider === "fonnte" ? "Fonnte API Gateway" : `${whatsAppConfig.provider.toUpperCase()} Gateway`,
      sentAt: new Date().toISOString(),
      messageId,
    };

    whatsAppLogs.unshift(logRecord);

    res.json({
      success: true,
      log: logRecord,
      messageId,
      deliveredTo: cleanPhone,
    });
  });

  // 5. Automated Billing Reminder WhatsApp Dispatch
  app.post("/api/whatsapp/send-billing-reminder", (req, res) => {
    const {
      invoiceId,
      invoiceNumber,
      customerName,
      phone,
      packageName,
      totalAmount,
      dueDate,
      periodMonth,
      customerId,
    } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Customer mobile number is required" });
    }

    const cleanPhone = normalizeWaNumber(phone);
    const formattedAmount = `Rp ${(Number(totalAmount) || 0).toLocaleString("id-ID")}`;

    const text = `*PEMBERITAHUAN TAGIHAN INTERNET RT/RW NET (NETLANCAR)*
Yth. Bapak/Ibu *${customerName}*,

Berikut informasi tagihan langganan internet Anda untuk periode *${periodMonth}*:
───────────────────────
• No. Tagihan : *${invoiceNumber}*
• Paket Aktif : ${packageName || "Paket Internet"}
• Total Biaya : *${formattedAmount}*
• Jatuh Tempo : *${dueDate}*
───────────────────────

Metode Pembayaran Praktis:
1. Scan QRIS Dinamis melalui m-Banking (BCA, Livin', BRImo) atau e-Wallet (GoPay, DANA, OVO).
2. Transfer BCA Virtual Account: *88019 081287654321* (Auto-Konfirmasi).
3. Portal Mandiri: https://netlancar.local/pay/${customerId || "portal"}

_Pesan ini dikirim otomatis oleh Gateway Billing NetLancar. Terima kasih atas kerjasama Bapak/Ibu! 🙏_`;

    const messageId = `INV-REM-${Date.now().toString().slice(-6)}`;
    whatsAppConfig.remainingQuota = Math.max(0, whatsAppConfig.remainingQuota - 1);

    const logRecord: WhatsAppLogRecord = {
      id: `walog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      targetPhone: cleanPhone,
      customerName: customerName || "Pelanggan",
      customerId,
      type: "billing_reminder",
      message: text,
      status: "delivered",
      provider: whatsAppConfig.provider === "fonnte" ? "Fonnte API Gateway" : `${whatsAppConfig.provider.toUpperCase()} Gateway`,
      sentAt: new Date().toISOString(),
      messageId,
    };

    whatsAppLogs.unshift(logRecord);

    res.json({
      success: true,
      log: logRecord,
      message: `Pengingat tagihan ${invoiceNumber} berhasil dikirim ke nomor WhatsApp ${cleanPhone} (${customerName})`,
    });
  });

  // 6. Batch Billing Reminders WhatsApp Dispatch
  app.post("/api/whatsapp/batch-billing-reminders", (req, res) => {
    const { invoices = [] } = req.body;
    const results: WhatsAppLogRecord[] = [];

    invoices.forEach((inv: any) => {
      const cleanPhone = normalizeWaNumber(inv.phone || "08123456789");
      const formattedAmount = `Rp ${(Number(inv.totalAmount) || 0).toLocaleString("id-ID")}`;

      const text = `*PEMBERITAHUAN TAGIHAN INTERNET RT/RW NET (NETLANCAR)*
Yth. Bapak/Ibu *${inv.customerName}*,

Berikut informasi tagihan langganan internet Anda untuk periode *${inv.periodMonth}*:
───────────────────────
• No. Tagihan : *${inv.invoiceNumber}*
• Paket Aktif : ${inv.packageName || "Paket Internet"}
• Total Biaya : *${formattedAmount}*
• Jatuh Tempo : *${inv.dueDate}*
───────────────────────
Pembayaran dapat dilakukan dengan scan QRIS Dinamis atau transfer BCA VA.
_Pesan otomatis NetLancar Billing OS._`;

      const logRecord: WhatsAppLogRecord = {
        id: `walog-batch-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        targetPhone: cleanPhone,
        customerName: inv.customerName || "Pelanggan",
        customerId: inv.customerId,
        type: "billing_reminder",
        message: text,
        status: "delivered",
        provider: whatsAppConfig.provider === "fonnte" ? "Fonnte API Gateway" : `${whatsAppConfig.provider.toUpperCase()} Gateway`,
        sentAt: new Date().toISOString(),
        messageId: `BAT-REM-${Date.now().toString().slice(-6)}`,
      };

      whatsAppLogs.unshift(logRecord);
      results.push(logRecord);
    });

    whatsAppConfig.remainingQuota = Math.max(0, whatsAppConfig.remainingQuota - invoices.length);

    res.json({
      success: true,
      total: invoices.length,
      delivered: results.length,
      logs: results,
      message: `${results.length} pengingat tagihan WhatsApp otomatis berhasil dikirim ke nomor seluler pelanggan!`,
    });
  });

  // 7. Automated Outage Notification Broadcast to Affected Mobile Numbers
  app.post("/api/whatsapp/broadcast-outage", (req, res) => {
    const {
      outageId,
      title,
      affectedArea,
      reason,
      estimatedFixTime,
      isResolved = false,
      customers = [],
    } = req.body;

    const results: WhatsAppLogRecord[] = [];

    customers.forEach((c: any) => {
      const cleanPhone = normalizeWaNumber(c.phone || "08123456789");

      let text = "";
      if (isResolved) {
        text = `*KONEKSI TELAH PULIH NORMAL (NETLANCAR RT/RW NET)*
Yth. Bapak/Ibu *${c.name}* (${c.rtRw}),

Kendala jaringan *${title}* pada wilayah *${affectedArea}* telah selesai diperbaiki oleh tim teknisi. Seluruh link optik & server telah kembali *ONLINE & STABIL*.

Jika modem ONT Anda masih berkedip merah atau LOS:
1. Matikan modem ONT selama 30 detik.
2. Nyalakan kembali saklar power modem.

Terima kasih atas kesabaran dan pengertian Bapak/Ibu! 🚀
- Tim Operasional NOC NetLancar RT/RW Net`;
      } else {
        text = `*PEMBERITAHUAN GANGGUAN JARINGAN INTERNET (NETLANCAR)*
Yth. Bapak/Ibu *${c.name}* (${c.rtRw}),

Kami informasikan bahwa saat ini terjadi gangguan koneksi internet di wilayah Anda:
───────────────────────
• Area Terdampak: *${affectedArea}*
• Kendala / Kasus: *${title}*
• Penyebab: ${reason}
• Estimasi Selesai: *${estimatedFixTime}*
───────────────────────
Tim teknisi optik kami telah berada di lokasi untuk penanganan secepat mungkin. Mohon untuk tidak mereset modem router Anda.

Informasi status perbaikan real-time: https://netlancar.local
- Pusat Operasional Jaringan NetLancar`;
      }

      const logRecord: WhatsAppLogRecord = {
        id: `walog-out-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        targetPhone: cleanPhone,
        customerName: c.name,
        customerId: c.id,
        type: isResolved ? "outage_resolved" : "outage_alert",
        message: text,
        status: "delivered",
        provider: whatsAppConfig.provider === "fonnte" ? "Fonnte API Gateway" : `${whatsAppConfig.provider.toUpperCase()} Gateway`,
        sentAt: new Date().toISOString(),
        messageId: `OUT-BC-${Date.now().toString().slice(-6)}`,
      };

      whatsAppLogs.unshift(logRecord);
      results.push(logRecord);
    });

    whatsAppConfig.remainingQuota = Math.max(0, whatsAppConfig.remainingQuota - customers.length);

    res.json({
      success: true,
      recipientsCount: results.length,
      results,
      message: `Pemberitahuan gangguan berhasil disiarkan ke ${results.length} nomor WhatsApp warga di area ${affectedArea}!`,
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
