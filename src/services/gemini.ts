export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export async function askAiSupport(
  message: string,
  history: ChatMessage[] = [],
  customerContext?: any
): Promise<string> {
  try {
    const res = await fetch("/api/gemini/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history,
        customerContext,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    return data.reply || "Maaf, tidak ada respons yang diterima.";
  } catch (error: any) {
    console.warn("AI query fallback:", error);
    // Intelligent local response matching common ISP questions
    const lower = message.toLowerCase();
    if (lower.includes("los") || lower.includes("merah") || lower.includes("mati")) {
      return `⚠️ Lampu indikator LOS berkedip merah menandakan hilangnya sinyal laser fiber optik dari ODP ke modem rumah Anda.
Langkah penanganan:
1. Periksa kabel kuning (patchcord) di belakang modem ONT, pastikan tidak tertekuk tajam atau terjepit.
2. Jangan cabut colokan biru (SC-UPC) kecuali diperlukan.
3. Restart modem dengan menekan tombol power selama 30 detik.
4. Jika lampu LOS tetap merah setelah 2 menit, mohon klik tombol "Lapor Gangguan ke Teknisi" di aplikasi agar staf kami mengecek redaman optik di box ODP terdekat.`;
    }
    if (lower.includes("lambat") || lower.includes("lemot") || lower.includes("ping")) {
      return `📶 Koneksi internet terasa lambat dapat disebabkan oleh beberapa hal:
1. Jumlah perangkat (smartphone/laptop/smart TV) yang sedang streaming atau download melebihi kapasitas paket.
2. Posisi router terhalang tembok tebal atau berada di dekat perangkat interferensi (microwave, lemari es).
3. Coba lakukan restart router dan jalankan Speedtest pada menu "Uji Kecepatan" di NetLancar. Jika hasil speedtest di bawah 60% paket langganan Anda, teknisi kami siap melakukan optimasi frekuensi WiFi 2.4GHz / 5GHz.`;
    }
    if (lower.includes("bayar") || lower.includes("qris") || lower.includes("va") || lower.includes("tagihan")) {
      return `💳 Pembayaran iuran internet NetLancar sangat mudah:
- QRIS Dinamis: Scan menggunakan BCA Mobile, Livin Mandiri, GoPay, OVO, DANA, atau ShopeePay.
- Virtual Account (VA): Tersedia BCA, Mandiri, dan BRI.
- Verifikasi instan: Sistem langsung mengaktifkan kembali layanan dan mengirim kwitansi WhatsApp begitu pembayaran berhasil.`;
    }
    return `Halo! Saya NetLancar AI Assistant. Saya siap membantu menjawab pertanyaan seputar paket internet RT/RW Net, cek status tagihan, tutorial bayar via QRIS/VA, panduan restart ONT, atau bantuan teknis jaringan lainnya. Apa yang bisa saya bantu hari ini?`;
  }
}
