import React, { useState, useEffect } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Server,
  Zap,
  Gauge,
  CheckCircle,
  Play,
  RotateCw,
  Sliders,
  Wifi,
  Radio,
  Network,
  BarChart3,
  Layers,
} from "lucide-react";
import { Language, translations } from "../../translations";
import { Customer, InternetPackage } from "../../types";
import { initialCustomers, initialPackages } from "../../data/initialData";
import { NetworkTopologyMap } from "./NetworkTopologyMap";

interface BandwidthMonitorProps {
  lang: Language;
  customers?: Customer[];
  packages?: InternetPackage[];
  onToggleIsolation?: (id: string) => void;
}

export const BandwidthMonitor: React.FC<BandwidthMonitorProps> = ({
  lang,
  customers = initialCustomers,
  packages = initialPackages,
  onToggleIsolation,
}) => {
  const t = translations[lang];
  const [activeSubView, setActiveSubView] = useState<"topology" | "traffic" | "both">("both");

  // Dynamic live metric state
  const [downloadRate, setDownloadRate] = useState(682);
  const [uploadRate, setUploadRate] = useState(245);
  const [ping, setPing] = useState(12);

  // Speedtest states
  const [isTesting, setIsTesting] = useState(false);
  const [testStage, setTestStage] = useState<"idle" | "ping" | "download" | "upload" | "finished">("idle");
  const [speedProgress, setSpeedProgress] = useState(0);
  const [testResult, setTestResult] = useState({
    ping: 9,
    jitter: 2,
    download: 94.8,
    upload: 48.2,
  });

  // Fluctuate live rates realistically every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloadRate((prev) => Math.min(920, Math.max(520, prev + Math.floor(Math.random() * 41) - 20)));
      setUploadRate((prev) => Math.min(480, Math.max(180, prev + Math.floor(Math.random() * 21) - 10)));
      setPing((prev) => Math.min(22, Math.max(8, prev + Math.floor(Math.random() * 5) - 2)));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const runSpeedTest = () => {
    setIsTesting(true);
    setTestStage("ping");
    setSpeedProgress(15);

    setTimeout(() => {
      setTestStage("download");
      setSpeedProgress(55);
      setTimeout(() => {
        setTestStage("upload");
        setSpeedProgress(85);
        setTimeout(() => {
          setTestStage("finished");
          setSpeedProgress(100);
          setIsTesting(false);
          setTestResult({
            ping: Math.floor(8 + Math.random() * 6),
            jitter: Math.floor(1 + Math.random() * 3),
            download: Number((88 + Math.random() * 22).toFixed(1)),
            upload: Number((42 + Math.random() * 16).toFixed(1)),
          });
        }, 1200);
      }, 1400);
    }, 900);
  };

  return (
    <div id="bandwidth-monitor-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Pemantauan Bandwidth & Traffic Jaringan Real-Time
          </h2>
          <p className="text-xs text-slate-500">
            MikroTik RouterOS v7.14 PCQ Queue • Upstream Dedicated Fiber 1 Gbps
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subview Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              id="bandwidth-subview-both-btn"
              onClick={() => setActiveSubView("both")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubView === "both"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua</span>
            </button>
            <button
              type="button"
              id="bandwidth-subview-topology-btn"
              onClick={() => setActiveSubView("topology")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubView === "topology"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Peta Topologi OLT</span>
            </button>
            <button
              type="button"
              id="bandwidth-subview-traffic-btn"
              onClick={() => setActiveSubView("traffic")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubView === "traffic"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Metrik & Speedtest</span>
            </button>
          </div>

          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Telemetry Streaming Live
          </span>
        </div>
      </div>

      {/* Network Topology Map Feature */}
      {(activeSubView === "both" || activeSubView === "topology") && (
        <NetworkTopologyMap
          customers={customers}
          packages={packages}
          onToggleIsolation={onToggleIsolation}
          lang={lang}
        />
      )}

      {/* Main Real-Time Dashboard */}
      {(activeSubView === "both" || activeSubView === "traffic") && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Download Speed Live */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Trafik Download</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {downloadRate}
            </span>
            <span className="text-sm font-bold text-slate-400">Mbps</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Beban Uplink (1 Gbps)</span>
              <span>{Math.round((downloadRate / 1000) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${(downloadRate / 1000) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Upload Speed Live */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Trafik Upload</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <ArrowUp className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
              {uploadRate}
            </span>
            <span className="text-sm font-bold text-slate-400">Mbps</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Beban Uplink (1 Gbps)</span>
              <span>{Math.round((uploadRate / 1000) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${(uploadRate / 1000) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Latency & Ping */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Latensi Gateway (Ping DNS)</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-violet-600 dark:text-violet-400">
              {ping}
            </span>
            <span className="text-sm font-bold text-slate-400">ms (RTT)</span>
          </div>
          <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
            <span>Packet Loss: 0.00%</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Kualitas: SANGAT BAIK</span>
          </div>
        </div>
      </div>

      {/* Real-time Oscilloscope Canvas / SVG */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-bold">LIVE INTERFACE: ether1-gateway-upstream</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400">RX: {downloadRate} Mbps</span>
            <span className="text-blue-400">TX: {uploadRate} Mbps</span>
          </div>
        </div>

        {/* Visual Realtime Graph Canvas */}
        <div className="h-48 w-full bg-slate-900/60 rounded-xl relative overflow-hidden border border-slate-800 flex items-center justify-center">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
            <line x1="0" y1="50" x2="800" y2="50" stroke="#334155" strokeDasharray="3 3" />
            <line x1="0" y1="100" x2="800" y2="100" stroke="#334155" strokeDasharray="3 3" />
            <line x1="0" y1="150" x2="800" y2="150" stroke="#334155" strokeDasharray="3 3" />

            {/* Inbound waveform */}
            <path
              d="M 0 160 Q 60 70, 120 110 T 240 80 T 360 130 T 480 60 T 600 100 T 720 70 T 800 90 L 800 200 L 0 200 Z"
              fill="#10b981"
              fillOpacity="0.25"
            />
            <path
              d="M 0 160 Q 60 70, 120 110 T 240 80 T 360 130 T 480 60 T 600 100 T 720 70 T 800 90"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
            />

            {/* Outbound waveform */}
            <path
              d="M 0 180 Q 60 130, 120 150 T 240 140 T 360 160 T 480 125 T 600 145 T 720 130 T 800 140"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
            />
          </svg>
          <div className="absolute top-2 left-3 font-mono text-[10px] text-slate-400">
            Puncak Trafik 24 Jam: 840 Mbps (Pukul 20:45 WIB)
          </div>
        </div>
      </div>

      {/* Speedtest and OLT Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Speedtest Widget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-500" />
              Alat Uji Kecepatan Koneksi (Speedtest)
            </h3>
            <span className="text-[11px] text-slate-400">Server: Jakarta IDC 10G</span>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-center space-y-4">
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <div
                className={`w-full h-full rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                  isTesting
                    ? "border-indigo-500 animate-spin border-t-transparent"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              ></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-slate-400">
                  {testStage === "idle"
                    ? "Siap"
                    : testStage === "ping"
                    ? "Ping..."
                    : testStage === "download"
                    ? "Download"
                    : testStage === "upload"
                    ? "Upload"
                    : "Selesai"}
                </span>
                <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {isTesting ? `${speedProgress}%` : `${testResult.download}`}
                </span>
                <span className="text-[9px] text-slate-400">Mbps</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">Ping / Jitter</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {testResult.ping} ms / {testResult.jitter} ms
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">Download</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {testResult.download} Mbps
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">Upload</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {testResult.upload} Mbps
                </span>
              </div>
            </div>

            <button
              onClick={runSpeedTest}
              disabled={isTesting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isTesting ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isTesting ? "Sedang Menguji Kecepatan..." : "Mulai Speedtest Jaringan"}
            </button>
          </div>
        </div>

        {/* OLT Ports & Optical Power Levels */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500" />
              Status GPON OLT & Redaman Optik (dBm)
            </h3>
            <span className="text-[11px] font-mono text-emerald-500 font-bold">4 SFP AKTIF</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  PON-1 (ODP Melati & Mawar RW 04)
                </div>
                <div className="text-[11px] text-slate-500">
                  32 Pelanggan Online • Laser TX: +2.8 dBm
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Rata-rata RX ONT</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  -19.4 dBm (Bagus)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  PON-2 (ODP Graha Asri RW 05)
                </div>
                <div className="text-[11px] text-slate-500">
                  28 Pelanggan Online • Laser TX: +2.6 dBm
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Rata-rata RX ONT</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  -21.2 dBm (Normal)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  PON-3 (ODP Pasar & Lapangan)
                </div>
                <div className="text-[11px] text-slate-500">
                  18 Pelanggan Online • Laser TX: +2.7 dBm
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Rata-rata RX ONT</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  -18.9 dBm (Bagus)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</div>
  );
};
