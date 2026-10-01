import React, { useState } from "react";
import { Fingerprint, ShieldCheck, CheckCircle2, KeyRound, X } from "lucide-react";
import { Language } from "../translations";

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: Language;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang,
}) => {
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState("");

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
      }, 900);
    }, 1200);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Fingerprint className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {lang === "id" ? "Autentikasi Biometrik Aman" : "Secure Biometric Authentication"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
          {lang === "id"
            ? "Verifikasi identitas staf operasional atau pelanggan menggunakan sensor sidik jari / FaceID."
            : "Verify staff or subscriber identity using fingerprint sensor or device biometric key."}
        </p>

        {!pinMode ? (
          <div className="space-y-4">
            <button
              onClick={handleSimulateScan}
              disabled={scanning || success}
              className={`w-28 h-28 mx-auto rounded-full border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                success
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                  : scanning
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 animate-pulse scale-105"
                  : "border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {success ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
              ) : (
                <>
                  <Fingerprint className={`w-10 h-10 ${scanning ? "animate-pulse" : ""}`} />
                  <span className="text-[10px] font-semibold mt-1">
                    {scanning ? (lang === "id" ? "Memindai..." : "Scanning...") : (lang === "id" ? "Sentuh Sensor" : "Touch Sensor")}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={() => setPinMode(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 mx-auto pt-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {lang === "id" ? "Gunakan PIN Otorisasi 6-Digit" : "Use 6-digit Authorization PIN"}
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === "id" ? "Masukkan PIN Keamanan" : "Enter Security PIN"}
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full text-center tracking-[1em] text-lg font-mono py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPinMode(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {lang === "id" ? "Kembali" : "Back"}
              </button>
              <button
                type="submit"
                disabled={pin.length < 6}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700"
              >
                {lang === "id" ? "Konfirmasi" : "Confirm"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>FIDO2 / WebAuthn End-to-End Cryptography</span>
        </div>
      </div>
    </div>
  );
};
