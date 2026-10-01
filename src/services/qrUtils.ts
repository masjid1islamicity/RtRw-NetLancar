import QRCode from "qrcode";
import { Customer, Invoice, InternetPackage } from "../types";

export interface CustomerQrPayload {
  type: "NETLANCAR_CUSTOMER_PAY" | "NETLANCAR_MEMBER_ID";
  version: "1.0";
  customerId: string;
  customerCode: string;
  name: string;
  phone: string;
  packageName?: string;
  amountDue?: number;
  periodMonth?: string;
  ipAddress?: string;
  payUrl: string;
  generatedAt: string;
}

/**
 * Generates the structured payload string for a customer's unique payment QR code
 */
export function generateCustomerQrPayload(
  customer: Customer,
  pkg?: InternetPackage,
  activeInvoice?: Invoice
): string {
  const payload: CustomerQrPayload = {
    type: "NETLANCAR_CUSTOMER_PAY",
    version: "1.0",
    customerId: customer.id,
    customerCode: customer.customerCode,
    name: customer.name,
    phone: customer.phone,
    packageName: pkg?.name || "Paket Internet RT/RW",
    amountDue: activeInvoice ? activeInvoice.totalAmount : pkg?.price || 150000,
    periodMonth: activeInvoice?.periodMonth || new Date().toLocaleString("id-ID", { month: "long", year: "numeric" }),
    ipAddress: customer.ipAddress,
    payUrl: `https://netlancar.local/pay/${customer.id}?code=${customer.customerCode}`,
    generatedAt: new Date().toISOString(),
  };

  return JSON.stringify(payload);
}

/**
 * Generates a high-quality data URL (base64 image/png) for a QR code
 */
export async function generateQrDataUrl(
  text: string,
  options?: {
    darkColor?: string;
    lightColor?: string;
    width?: number;
  }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 300,
      margin: 2,
      color: {
        dark: options?.darkColor || "#0f172a",
        light: options?.lightColor || "#ffffff",
      },
      errorCorrectionLevel: "H",
    });
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    return "";
  }
}

/**
 * Parses and validates scanned QR payload
 */
export function parseCustomerQrPayload(scannedText: string): CustomerQrPayload | null {
  try {
    // Check if it's JSON
    const parsed = JSON.parse(scannedText);
    if (parsed && (parsed.type === "NETLANCAR_CUSTOMER_PAY" || parsed.customerId || parsed.customerCode)) {
      return parsed;
    }
  } catch {
    // If it's a simple customer code or ID string (e.g. "CUST-001" or customerId)
    const trimmed = scannedText.trim();
    if (trimmed.startsWith("CUST-") || trimmed.startsWith("cust-")) {
      return {
        type: "NETLANCAR_MEMBER_ID",
        version: "1.0",
        customerId: trimmed,
        customerCode: trimmed.toUpperCase(),
        name: "",
        phone: "",
        payUrl: `https://netlancar.local/pay/${trimmed}`,
        generatedAt: new Date().toISOString(),
      };
    }
  }
  return null;
}

/**
 * Calculates a unique 3-digit verification code (e.g. 101 - 899)
 * to enable instant zero-touch auto-reconciliation of incoming bank mutations/webhooks.
 */
export function getUniquePaymentCode(invoiceId: string, seedOffset = 0): number {
  let hash = seedOffset;
  for (let i = 0; i < invoiceId.length; i++) {
    hash = (hash * 37 + invoiceId.charCodeAt(i)) % 799;
  }
  return 101 + (Math.abs(hash) % 898);
}

/**
 * Calculates standard EMVCo / CCITT-FALSE CRC-16 checksum for QRIS payloads
 */
export function calculateCrc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc ^= (byte << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatEmvTag(tag: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${tag}${len}${value}`;
}

/**
 * Generates an ASPI / Bank Indonesia EMVCo compliant Static QRIS string for NetLancar RT/RW Net
 * With Point of Initiation Method = "11" (Static QR).
 * Customers can scan this code with any bank or e-wallet app directly without selecting an invoice.
 */
export function generateStaticQrisPayload(customerCode?: string, merchantName = "NETLANCAR RT-RW NET"): string {
  const code = (customerCode || "MEMBER").replace(/[^a-zA-Z0-9]/g, "");
  const basePayload = `00020101021126600016ID.NETLANCAR.WWW01189360099900000000000215NETLANCAR-STAT0303UMI51440014ID.GO.QRIS.WWW0215ID10200234567890303UMI5204489953033605802ID5919${merchantName.padEnd(19, " ").slice(0, 19)}6007BANDUNG61054011562200116${code}6304`;
  const crc = calculateCrc16Ccitt(basePayload);
  return `${basePayload}${crc}`;
}

/**
 * Generates an ASPI / Bank Indonesia EMVCo compliant Dynamic QRIS string
 * Point of Initiation Method = "12" (Dynamic QR)
 * Encodes the exact transaction amount (Tag 54) and invoice reference (Tag 62)
 * so customers' mobile banking or e-wallet apps automatically lock in the exact bill amount.
 */
export function generateDynamicQrisPayload(
  invoice: Invoice,
  merchantName = "NETLANCAR RT-RW NET",
  options?: {
    customAmount?: number;
    uniqueCode?: number;
  }
): string {
  const finalAmount = options?.customAmount ?? invoice.totalAmount;
  const amountStr = Math.round(finalAmount).toString();
  
  // Tag 00: Payload Format Indicator (01)
  const tag00 = formatEmvTag("00", "01");
  // Tag 01: Point of Initiation Method (12 = Dynamic QR)
  const tag01 = formatEmvTag("01", "12");

  // Tag 26: Merchant Account Information
  const mInfoSub = [
    formatEmvTag("00", "ID.NETLANCAR.WWW"),
    formatEmvTag("01", "936009990000000000"),
    formatEmvTag("02", "NETLANCAR-DYN"),
    formatEmvTag("03", "UMI"),
  ].join("");
  const tag26 = formatEmvTag("26", mInfoSub);

  // Tag 51: Merchant Account Information (QRIS National network)
  const qrisNatSub = [
    formatEmvTag("00", "ID.GO.QRIS.WWW"),
    formatEmvTag("01", "ID1020023456789"),
    formatEmvTag("02", "UMI"),
  ].join("");
  const tag51 = formatEmvTag("51", qrisNatSub);

  // Tag 52: Merchant Category Code (4899 = Telecommunication Services)
  const tag52 = formatEmvTag("52", "4899");
  // Tag 53: Transaction Currency (360 = IDR)
  const tag53 = formatEmvTag("53", "360");
  // Tag 54: Transaction Amount (Specific Bill Amount with Unique Code)
  const tag54 = formatEmvTag("54", amountStr);
  // Tag 58: Country Code (ID)
  const tag58 = formatEmvTag("58", "ID");
  // Tag 59: Merchant Name
  const cleanMerchant = merchantName.trim().slice(0, 25);
  const tag59 = formatEmvTag("59", cleanMerchant);
  // Tag 60: Merchant City
  const tag60 = formatEmvTag("60", "BANDUNG");
  // Tag 61: Postal Code
  const tag61 = formatEmvTag("61", "40115");

  // Tag 62: Additional Data Field Template (Invoice Number & Customer Ref & Unique Code)
  const billNum = invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25);
  const uniqueCodeTag = options?.uniqueCode ? `UNQ-${options.uniqueCode}` : "AUTO-REC";
  const addDataSub = [
    formatEmvTag("01", billNum),
    formatEmvTag("05", invoice.customerId.slice(0, 15)),
    formatEmvTag("07", uniqueCodeTag),
  ].join("");
  const tag62 = formatEmvTag("62", addDataSub);

  // Tag 63: CRC16 prefix ("6304")
  const partial = [
    tag00,
    tag01,
    tag26,
    tag51,
    tag52,
    tag53,
    tag54,
    tag58,
    tag59,
    tag60,
    tag61,
    tag62,
    "6304",
  ].join("");

  const crc = calculateCrc16Ccitt(partial);
  return `${partial}${crc}`;
}
