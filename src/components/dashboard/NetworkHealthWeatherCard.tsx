import React, { useState, useEffect } from "react";
import {
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  Cloud,
  Activity,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  Radio,
  ArrowUpRight,
  TrendingDown,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Language, translations } from "../../translations";

interface NetworkHealthWeatherCardProps {
  onNavigateTab?: (tab: string) => void;
  lang: Language;
}

interface ProbeTarget {
  name: string;
  target: string;
  latencyMs: number;
  packetLoss: number;
  jitterMs: number;
  status: "optimal" | "warning" | "critical";
  type: "upstream" | "dns" | "core";
}

export const NetworkHealthWeatherCard: React.FC<NetworkHealthWeatherCardProps> = ({
  onNavigateTab,
  lang,
}) => {
  const t = translations[lang];

  // Live Ping Probes state
  const [isProbing, setIsProbing] = useState(false);
  const [lastProbedTime, setLastProbedTime] = useState<string>("Baru saja (Real-time)");

  // Latency & Loss values
  const [currentLatency, setCurrentLatency] = useState<number>(11);
  const [currentPacketLoss, setCurrentPacketLoss] = useState<number>(0.0);
  const [currentJitter, setCurrentJitter] = useState<number>(1.6);
  const [dnsResolveMs, setDnsResolveMs] = useState<number>(13);

  // History sparkline data points
  const [pingHistory, setPingHistory] = useState<number[]>([12, 11, 13, 10, 11, 14, 11, 10, 12, 11, 11]);

  // Target Hops
  const [probeTargets, setProbeTargets] = useState<ProbeTarget[]>([
    {
      name: "Gateway Upstream ISP (BGP Fiber)",
      target: "103.144.18.1",
      latencyMs: 4,
      packetLoss: 0.0,
      jitterMs: 0.8,
      status: "optimal",
      type: "upstream",
    },
    {
      name: "Google Public Primary DNS",
      target: "8.8.8.8",
      latencyMs: 12,
      packetLoss: 0.0,
      jitterMs: 1.4,
      status: "optimal",
      type: "dns",
    },
    {
      name: "Cloudflare 1.1.1.1 (Anycast)",
      target: "1.1.1.1",
      latencyMs: 9,
      packetLoss: 0.0,
      jitterMs: 1.1,
      status: "optimal",
      type: "dns",
    },
    {
      name: "Core OLT EPON Sentral (NOC)",
      target: "192.168.10.1",
      latencyMs: 1,
      packetLoss: 0.0,
      jitterMs: 0.3,
      status: "optimal",
      type: "core",
    },
  ]);

  // Calculate Health Score (0 - 100)
  // Base = 100;
  // Latency deduction: if > 15ms: -1pt per ms
  // Packet loss deduction: -15pts per 1% loss
  // Jitter deduction: if > 3ms: -2pts per ms
  const healthScore = Math.max(
    15,
    Math.min(
      100,
      Math.round(
        100 -
          Math.max(0, currentLatency - 10) * 1.2 -
          currentPacketLoss * 20 -
          Math.max(0, currentJitter - 2) * 2
      )
    )
  );

  // Weather Assessment based on Health Score
  const weatherConfig = (() => {
    if (healthScore >= 92) {
      return {
        title: "Cuaca Jaringan: Cerah Prima",
        subtitle: "Koneksi optik sangat responsif & tanpa hambatan",
        icon: Sun,
        color: "text-amber-500",
        badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        containerBg: "from-amber-500/10 via-emerald-500/5 to-transparent",
        borderColor: "border-amber-200 dark:border-amber-900/60",
        statusText: "Optimal / Bebas Hambatan",
        recommendation: "Link fiber optik stabil, redaman optical normal (< -21 dBm), siap melayani streaming 4K & gaming.",
      };
    } else if (healthScore >= 75) {
      return {
        title: "Cuaca Jaringan: Cerah Berawan",
        subtitle: "Kecepatan dan stabilitas berjalan normal",
        icon: CloudSun,
        color: "text-blue-500",
        badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800",
        containerBg: "from-blue-500/10 via-indigo-500/5 to-transparent",
        borderColor: "border-blue-200 dark:border-blue-900/60",
        statusText: "Normal & Stabil",
        recommendation: "Trafik jam sibuk terdistribusi baik, tidak ada antrean paket data signifikan di router MikroTik.",
      };
    } else if (healthScore >= 50) {
      return {
        title: "Cuaca Jaringan: Berawan Tebal",
        subtitle: "Terdeteksi sedikit fluktuasi latensi ping",
        icon: Cloud,
        color: "text-slate-500",
        badgeBg: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
        containerBg: "from-slate-500/10 via-amber-500/5 to-transparent",
        borderColor: "border-slate-300 dark:border-slate-700",
        statusText: "Waspada Fluktuasi",
        recommendation: "Latensi sedikit meningkat, queue bandwidth pada ODP padat pelanggan sedang mendekati kapasitas.",
      };
    } else if (healthScore >= 30) {
      return {
        title: "Cuaca Jaringan: Hujan Rintik",
        subtitle: "Terdeteksi packet loss minor ke upstream",
        icon: CloudRain,
        color: "text-orange-500",
        badgeBg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
        containerBg: "from-orange-500/10 via-rose-500/5 to-transparent",
        borderColor: "border-orange-300 dark:border-orange-800",
        statusText: "Packet Loss Terdeteksi",
        recommendation: "Periksa koneksi fisik kabel dropcore dan konektor SC/UPC dari kotoran debu atau bending.",
      };
    } else {
      return {
        title: "Cuaca Jaringan: Badai Petir / Gangguan",
        subtitle: "Tingkat kehilangan paket tinggi atau link terputus",
        icon: CloudLightning,
        color: "text-rose-500",
        badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300",
        containerBg: "from-rose-500/15 via-red-500/10 to-transparent",
        borderColor: "border-rose-300 dark:border-rose-800",
        statusText: "Gangguan Kritis",
        recommendation: "Segera lakukan pengecekan pada OLT sentral atau kabel feeder utama RT/RW Net.",
      };
    }
  })();

  const WeatherIcon = weatherConfig.icon;

  // Simulate Live Ping Probe action
  const handleRunPingProbe = () => {
    setIsProbing(true);

    setTimeout(() => {
      // Simulate realistic slight ping variations (9 - 14 ms, 0% loss)
      const newLatency = Math.floor(9 + Math.random() * 5);
      const newLoss = Math.random() > 0.9 ? parseFloat((Math.random() * 0.5).toFixed(1)) : 0.0;
      const newJitter = parseFloat((1.1 + Math.random() * 0.9).toFixed(1));
      const newDns = Math.floor(10 + Math.random() * 6);

      setCurrentLatency(newLatency);
      setCurrentPacketLoss(newLoss);
      setCurrentJitter(newJitter);
      setDnsResolveMs(newDns);

      setPingHistory((prev) => [...prev.slice(1), newLatency]);

      setProbeTargets((prev) =>
        prev.map((target) => {
          let updatedLatency = target.latencyMs;
          if (target.type === "upstream") updatedLatency = Math.floor(3 + Math.random() * 3);
          if (target.type === "dns") updatedLatency = Math.floor(8 + Math.random() * 6);
          if (target.type === "core") updatedLatency = 1;

          return {
            ...target,
            latencyMs: updatedLatency,
            packetLoss: newLoss,
            jitterMs: parseFloat((target.jitterMs + (Math.random() * 0.4 - 0.2)).toFixed(1)),
          };
        })
      );

      setIsProbing(false);
      setLastProbedTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
    }, 700);
  };

  return (
    <div
      id="network-weather-card"
      className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border ${weatherConfig.borderColor} shadow-xs transition-all relative overflow-hidden`}
    >
      {/* Background weather tint glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${weatherConfig.containerBg} pointer-events-none`}
      />

      <div className="relative z-10 space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
              <WeatherIcon className={`w-6 h-6 ${weatherConfig.color} animate-pulse`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {weatherConfig.title}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${weatherConfig.badgeBg}`}>
                  {weatherConfig.statusText}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {weatherConfig.subtitle} • Probe MikroTik CCR1036
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRunPingProbe}
              disabled={isProbing}
              id="run-ping-probe-btn"
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isProbing ? "animate-spin" : ""}`} />
              <span>{isProbing ? "Memeriksa..." : "Uji Ping Sekarang"}</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("bandwidth")}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold transition-colors"
              >
                Monitor Bandwidth &gt;
              </button>
            )}
          </div>
        </div>

        {/* Core Score & Metric Gauges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Main Health Score Dial */}
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3.5">
            {/* Circular Score Badge */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-700"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    healthScore >= 85
                      ? "text-emerald-500"
                      : healthScore >= 70
                      ? "text-blue-500"
                      : healthScore >= 50
                      ? "text-amber-500"
                      : "text-rose-500"
                  }
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-base font-black font-mono text-slate-900 dark:text-white leading-none">
                  {healthScore}
                </span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Skor</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Skor Kesehatan Jaringan
              </span>
              <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                {healthScore >= 90 ? "Sangat Prima" : healthScore >= 75 ? "Kondisi Stabil" : "Waspada Penurunan"}
              </div>
              <span className="text-[10px] text-slate-500">Skala 0 - 100 Real-Time</span>
            </div>
          </div>

          {/* Metric 2: Latensi RTT */}
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
              <span>Latensi RTT (Ping)</span>
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {currentLatency}
              </span>
              <span className="text-xs text-slate-500 font-bold font-mono">ms</span>
            </div>
            {/* Sparkline mini bar chart */}
            <div className="flex items-end gap-1 h-4 mt-1.5 pt-0.5">
              {pingHistory.map((val, idx) => (
                <div
                  key={idx}
                  style={{ height: `${Math.min(100, (val / 20) * 100)}%` }}
                  className={`flex-1 rounded-xs transition-all ${
                    val <= 12 ? "bg-emerald-500" : val <= 25 ? "bg-blue-500" : "bg-amber-500"
                  }`}
                  title={`${val} ms`}
                />
              ))}
            </div>
          </div>

          {/* Metric 3: Packet Loss */}
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
              <span>Kehilangan Paket (Loss)</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-xl font-black font-mono ${
                  currentPacketLoss === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {currentPacketLoss.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">loss</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              {currentPacketLoss === 0 ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Paket Sampai</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="text-rose-600 font-semibold">Paket Tertahan</span>
                </>
              )}
            </div>
          </div>

          {/* Metric 4: Jitter & DNS Resolv */}
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
              <span>Jitter & Resolusi DNS</span>
              <Radio className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                  {currentJitter}
                </span>
                <span className="text-[10px] text-slate-400 font-mono ml-0.5">ms jitter</span>
              </div>
              <div>
                <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {dnsResolveMs}
                </span>
                <span className="text-[10px] text-slate-400 font-mono ml-0.5">ms DNS</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Kestabilan frame suara & video stream
            </div>
          </div>
        </div>

        {/* Hop by Hop Ping Breakdown Table */}
        <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden bg-white/60 dark:bg-slate-800/40">
          <div className="px-3.5 py-2 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span>Uji Coba Sasaran Hop (Target Probing Mikrotik)</span>
            <span className="text-[10px] text-slate-400 font-mono">Pembaruan: {lastProbedTime}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
            {probeTargets.map((hop, idx) => (
              <div
                key={idx}
                className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                      {hop.name}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">{hop.target}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px] mr-1">RTT:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{hop.latencyMs} ms</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] mr-1">Loss:</span>
                    <strong
                      className={
                        hop.packetLoss === 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }
                    >
                      {hop.packetLoss}%
                    </strong>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Online
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnosis & Operational Guidance Note */}
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Rekomendasi NOC: </span>
            {weatherConfig.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
};
