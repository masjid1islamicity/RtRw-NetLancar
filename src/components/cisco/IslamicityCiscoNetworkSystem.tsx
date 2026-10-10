import React, { useState, useEffect, useRef } from "react";
import {
  Server,
  Network,
  Terminal,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  Download,
  Copy,
  Check,
  Radio,
  Wifi,
  Layers,
  Lock,
  Cpu,
  HelpCircle,
  Clock,
  Heart,
  Globe,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CornerDownLeft,
  Trash2,
  Plus,
  Eye,
  FileText,
} from "lucide-react";
import { Language, translations } from "../../translations";

interface IslamicityCiscoNetworkSystemProps {
  lang: Language;
}

export interface CiscoPort {
  id: string;
  name: string;
  status: "up" | "down" | "connecting";
  adminStatus: "up" | "shutdown";
  speed: string;
  duplex: string;
  vlan: number;
  vlanName: string;
  inMbps: number;
  outMbps: number;
  crcErrors: number;
  cableLength?: number;
  description: string;
}

interface DnsFilterRule {
  id: string;
  domain: string;
  category: "Judi Online" | "Pornografi" | "Phishing / Malware" | "Game Berat";
  blockedCount: number;
  addedAt: string;
}

interface PrayerTimeItem {
  name: string;
  time: string;
  active: boolean;
  isJumat?: boolean;
}

export const IslamicityCiscoNetworkSystem: React.FC<IslamicityCiscoNetworkSystemProps> = ({
  lang,
}) => {
  const t = translations[lang];

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<
    "topology" | "ports" | "vlans" | "safesearch" | "cli" | "config"
  >("topology");

  // Initial Ports
  const [ports, setPorts] = useState<CiscoPort[]>([
    {
      id: "Gi1/0/1",
      name: "Gi1/0/1",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 10,
      vlanName: "Masjid Al-Ikhlas Streaming",
      inMbps: 84.2,
      outMbps: 12.4,
      crcErrors: 0,
      cableLength: 35,
      description: "UPLINK-MASJID-AL-IKHLAS-AUDIO-VIDEO",
    },
    {
      id: "Gi1/0/2",
      name: "Gi1/0/2",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 10,
      vlanName: "Masjid Sound System IP",
      inMbps: 4.8,
      outMbps: 1.2,
      crcErrors: 0,
      cableLength: 28,
      description: "MASJID-IP-SPEAKER-ADHAN-FEED",
    },
    {
      id: "Gi1/0/3",
      name: "Gi1/0/3",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 20,
      vlanName: "Madrasah Lab Komputer",
      inMbps: 112.5,
      outMbps: 28.1,
      crcErrors: 0,
      cableLength: 45,
      description: "MADRASAH-LAB-KOMPUTER-SANTRI",
    },
    {
      id: "Gi1/0/4",
      name: "Gi1/0/4",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 20,
      vlanName: "Ruang Guru & Kelas Digital",
      inMbps: 45.0,
      outMbps: 8.5,
      crcErrors: 0,
      cableLength: 50,
      description: "KELAS-DIGITAL-MADRASAH-ACADEMIC",
    },
    {
      id: "Gi1/0/5",
      name: "Gi1/0/5",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 30,
      vlanName: "Baitul Maal Sharia Ledger",
      inMbps: 12.3,
      outMbps: 6.8,
      crcErrors: 0,
      cableLength: 15,
      description: "BAITUL-MAAL-KASIR-KEUANGAN-SYARIAH",
    },
    {
      id: "Gi1/0/6",
      name: "Gi1/0/6",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 30,
      vlanName: "Koperasi Syariah Warga",
      inMbps: 8.2,
      outMbps: 4.1,
      crcErrors: 0,
      cableLength: 22,
      description: "KOPERASI-SYARIAH-POS-TERMINAL",
    },
    {
      id: "Gi1/0/7",
      name: "Gi1/0/7",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 40,
      vlanName: "OLT EPON Sentral (RT 01)",
      inMbps: 340.2,
      outMbps: 88.5,
      crcErrors: 0,
      cableLength: 12,
      description: "UPLINK-OLT-EPON-RT01-DISTRIBUTION",
    },
    {
      id: "Gi1/0/8",
      name: "Gi1/0/8",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 40,
      vlanName: "OLT GPON Sentral (RT 02)",
      inMbps: 295.1,
      outMbps: 72.3,
      crcErrors: 0,
      cableLength: 14,
      description: "UPLINK-OLT-GPON-RT02-DISTRIBUTION",
    },
    {
      id: "Gi1/0/9",
      name: "Gi1/0/9",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 40,
      vlanName: "ODP Tiang RW 04 Cluster",
      inMbps: 180.4,
      outMbps: 44.1,
      crcErrors: 0,
      cableLength: 85,
      description: "FEEDER-FO-ODP-TIANG-RW04",
    },
    {
      id: "Gi1/0/10",
      name: "Gi1/0/10",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 40,
      vlanName: "ODP Tiang RW 05 Cluster",
      inMbps: 210.8,
      outMbps: 58.2,
      crcErrors: 0,
      cableLength: 95,
      description: "FEEDER-FO-ODP-TIANG-RW05",
    },
    {
      id: "Gi1/0/11",
      name: "Gi1/0/11",
      status: "down",
      adminStatus: "shutdown",
      speed: "Auto",
      duplex: "Auto",
      vlan: 40,
      vlanName: "Cadangan ODP RT 06",
      inMbps: 0,
      outMbps: 0,
      crcErrors: 0,
      cableLength: 0,
      description: "SPARE-DISTRIBUTION-PORT-RT06",
    },
    {
      id: "Gi1/0/12",
      name: "Gi1/0/12",
      status: "down",
      adminStatus: "shutdown",
      speed: "Auto",
      duplex: "Auto",
      vlan: 40,
      vlanName: "Cadangan ODP RT 07",
      inMbps: 0,
      outMbps: 0,
      crcErrors: 0,
      cableLength: 0,
      description: "SPARE-DISTRIBUTION-PORT-RT07",
    },
    {
      id: "Gi1/0/13",
      name: "Gi1/0/13",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 99,
      vlanName: "MikroTik CCR1036 Gateway",
      inMbps: 480.5,
      outMbps: 160.2,
      crcErrors: 0,
      cableLength: 2,
      description: "802.1Q-TRUNK-TO-MIKROTIK-CCR1036",
    },
    {
      id: "Gi1/0/14",
      name: "Gi1/0/14",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 99,
      vlanName: "Cisco ASR 1001-X BGP Edge",
      inMbps: 680.1,
      outMbps: 240.4,
      crcErrors: 0,
      cableLength: 3,
      description: "10G-SFP-TRUNK-TO-CISCO-ASR-BGP-EDGE",
    },
    {
      id: "Gi1/0/15",
      name: "Gi1/0/15",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 99,
      vlanName: "Server NOC NetLancar Local",
      inMbps: 35.4,
      outMbps: 45.1,
      crcErrors: 0,
      cableLength: 5,
      description: "SERVER-NOC-CONTAINER-DASHBOARD",
    },
    {
      id: "Gi1/0/16",
      name: "Gi1/0/16",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 99,
      vlanName: "DNS Pi-Hole + SafeSearch",
      inMbps: 14.2,
      outMbps: 14.1,
      crcErrors: 0,
      cableLength: 4,
      description: "PI-HOLE-PRIMARY-SAFESEARCH-DNS",
    },
    {
      id: "Gi1/0/17",
      name: "Gi1/0/17",
      status: "down",
      adminStatus: "shutdown",
      speed: "Auto",
      duplex: "Auto",
      vlan: 1,
      vlanName: "Default Spare Port",
      inMbps: 0,
      outMbps: 0,
      crcErrors: 0,
      cableLength: 0,
      description: "UNALLOCATED-PORT",
    },
    {
      id: "Gi1/0/18",
      name: "Gi1/0/18",
      status: "down",
      adminStatus: "shutdown",
      speed: "Auto",
      duplex: "Auto",
      vlan: 1,
      vlanName: "Default Spare Port",
      inMbps: 0,
      outMbps: 0,
      crcErrors: 0,
      cableLength: 0,
      description: "UNALLOCATED-PORT",
    },
    {
      id: "Gi1/0/19",
      name: "Gi1/0/19",
      status: "down",
      adminStatus: "shutdown",
      speed: "Auto",
      duplex: "Auto",
      vlan: 1,
      vlanName: "Default Spare Port",
      inMbps: 0,
      outMbps: 0,
      crcErrors: 0,
      cableLength: 0,
      description: "UNALLOCATED-PORT",
    },
    {
      id: "Gi1/0/20",
      name: "Gi1/0/20",
      status: "down",
      adminStatus: "shutdown",
      speed: "Auto",
      duplex: "Auto",
      vlan: 1,
      vlanName: "Default Spare Port",
      inMbps: 0,
      outMbps: 0,
      crcErrors: 0,
      cableLength: 0,
      description: "UNALLOCATED-PORT",
    },
    {
      id: "Gi1/0/21",
      name: "Gi1/0/21",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 99,
      vlanName: "CCTV NOC Ruang Server",
      inMbps: 8.5,
      outMbps: 1.2,
      crcErrors: 0,
      cableLength: 18,
      description: "NVR-CCTV-RUANG-SERVER-NOC",
    },
    {
      id: "Gi1/0/22",
      name: "Gi1/0/22",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 99,
      vlanName: "UPS Smart APC Management",
      inMbps: 0.2,
      outMbps: 0.1,
      crcErrors: 0,
      cableLength: 3,
      description: "APC-SMART-UPS-SNMP-CARD",
    },
    {
      id: "Gi1/0/23",
      name: "Gi1/0/23",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 99,
      vlanName: "Trunk Uplink SW2 Expansion",
      inMbps: 95.4,
      outMbps: 30.1,
      crcErrors: 0,
      cableLength: 5,
      description: "EXPANSION-SWITCH-2-UPLINK",
    },
    {
      id: "Gi1/0/24",
      name: "Gi1/0/24",
      status: "up",
      adminStatus: "up",
      speed: "1000",
      duplex: "Full",
      vlan: 99,
      vlanName: "Trunk Uplink SW3 Expansion",
      inMbps: 72.1,
      outMbps: 22.4,
      crcErrors: 0,
      cableLength: 6,
      description: "EXPANSION-SWITCH-3-UPLINK",
    },
  ]);

  // Selected port for inspector
  const [selectedPortId, setSelectedPortId] = useState<string>("Gi1/0/1");
  const [testingCable, setTestingCable] = useState(false);
  const [cableTestResult, setCableTestResult] = useState<string | null>(null);

  // Prayer / Jum'ah QoS Boost Toggle
  const [isJumatQosActive, setIsJumatQosActive] = useState(true);
  const [autoPrayerBoost, setAutoPrayerBoost] = useState(true);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedMikrotik, setCopiedMikrotik] = useState(false);

  // Selected node for topology inspector
  const [selectedTopologyNode, setSelectedTopologyNode] = useState<string>("catalyst");

  // Terminal state
  const [cliPrompt, setCliPrompt] = useState<string>("Islamicity-Core-SW1#");
  const [cliConfigMode, setCliConfigMode] = useState<"exec" | "config" | "interface">("exec");
  const [cliActiveInterface, setCliActiveInterface] = useState<string | null>(null);
  const [cliInput, setCliInput] = useState("");
  const [cliHistory, setCliHistory] = useState<string[]>([
    "Islamicity-Core-SW1# show version",
    "Cisco IOS Software, C3850 Software (CAT3K_CAA-UNIVERSALK9-M), Version 16.12.5b, RELEASE SOFTWARE (fc1)",
    "Technical Support: http://www.cisco.com/techsupport",
    "Compiled Wed 24-Feb-26 12:44 by prod_rel_team",
    "Islamicity-Core-SW1 uptime is 14 weeks, 2 days, 8 hours, 14 minutes",
    "System returned to ROM by power-on",
    "Model number: WS-C3850-24T-L (Layer-3 Gigabit Core Switch)",
    "Islamicity Community Network System for project.islamicity@gmail.com",
    "Islamicity-Core-SW1# ",
  ]);
  const [cliHistoryCmds, setCliHistoryCmds] = useState<string[]>([
    "show version",
    "show ip interface brief",
    "show vlan brief",
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // SafeSearch Blacklist State
  const [dnsFilters, setDnsFilters] = useState<DnsFilterRule[]>([
    { id: "dns-1", domain: "slotgacor88.vip", category: "Judi Online", blockedCount: 1420, addedAt: "2026-09-12" },
    { id: "dns-2", domain: "taruhan-bola-online.com", category: "Judi Online", blockedCount: 980, addedAt: "2026-09-15" },
    { id: "dns-3", domain: "dewaslot77.com", category: "Judi Online", blockedCount: 1840, addedAt: "2026-09-18" },
    { id: "dns-4", domain: "adult-xxx-stream.net", category: "Pornografi", blockedCount: 2310, addedAt: "2026-09-20" },
    { id: "dns-5", domain: "phishing-bank-bri.xyz", category: "Phishing / Malware", blockedCount: 115, addedAt: "2026-09-25" },
  ]);
  const [newDomainInput, setNewDomainInput] = useState("");
  const [newCategoryInput, setNewCategoryInput] = useState<DnsFilterRule["category"]>("Judi Online");

  // Infaq Community Hotspot Stats
  const [infaqTotal, setInfaqTotal] = useState(1450000);

  // Prayer Times (WIB)
  const prayerTimes: PrayerTimeItem[] = [
    { name: "Subuh", time: "04:32", active: false },
    { name: "Syuruq", time: "05:46", active: false },
    { name: "Dzuhur", time: "11:51", active: true, isJumat: true },
    { name: "Ashar", time: "15:08", active: false },
    { name: "Maghrib", time: "17:55", active: false },
    { name: "Isya", time: "19:04", active: false },
  ];

  // Auto scroll terminal
  useEffect(() => {
    if (activeTab === "cli") {
      terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [cliHistory, activeTab]);

  const selectedPort = ports.find((p) => p.id === selectedPortId) || ports[0];

  // Toggle Port Admin Status
  const handleTogglePortAdmin = (portId: string) => {
    setPorts((prev) =>
      prev.map((port) => {
        if (port.id !== portId) return port;
        const newAdminStatus = port.adminStatus === "up" ? "shutdown" : "up";
        const newStatus = newAdminStatus === "shutdown" ? "down" : "up";
        return {
          ...port,
          adminStatus: newAdminStatus,
          status: newStatus,
          inMbps: newAdminStatus === "shutdown" ? 0 : Number((Math.random() * 80 + 20).toFixed(1)),
          outMbps: newAdminStatus === "shutdown" ? 0 : Number((Math.random() * 30 + 5).toFixed(1)),
        };
      })
    );
  };

  // Change Port VLAN
  const handleChangePortVlan = (portId: string, vlanId: number) => {
    const vlanMap: Record<number, string> = {
      1: "Default Spare Port",
      10: "Masjid Al-Ikhlas Streaming",
      20: "Madrasah Edu & SafeSearch",
      30: "Baitul Maal Sharia Ledger",
      40: "Warga Residential RT/RW",
      99: "Islamicity NOC Management",
    };

    setPorts((prev) =>
      prev.map((port) => {
        if (port.id !== portId) return port;
        return {
          ...port,
          vlan: vlanId,
          vlanName: vlanMap[vlanId] || `Custom VLAN ${vlanId}`,
        };
      })
    );
  };

  // Run Cable Test TDR
  const handleRunCableTest = () => {
    setTestingCable(true);
    setCableTestResult(null);
    setTimeout(() => {
      setTestingCable(false);
      if (selectedPort.adminStatus === "shutdown") {
        setCableTestResult("TDR Test Result: Interface is administratively shutdown (Terminated open).");
      } else {
        const len = selectedPort.cableLength || Math.floor(Math.random() * 40 + 15);
        setCableTestResult(
          `Cisco Time Domain Reflectometry (TDR) OK: Pair A: Normal (${len}m) • Pair B: Normal (${len}m) • Pair C: Normal (${len}m) • Pair D: Normal (${len}m). Speed 1000BASE-T Full Duplex.`
        );
      }
    }, 1200);
  };

  // Execute CLI Command
  const handleRunCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    // Add to history
    setCliHistoryCmds((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const lower = trimmed.toLowerCase();
    let responseOutput = "";

    // Clear command
    if (lower === "clear") {
      setCliHistory([]);
      setCliInput("");
      return;
    }

    // Help command
    if (lower === "help" || lower === "?") {
      responseOutput = `Cisco IOS Software Commands Help:
  show version               - Tampilkan info versi IOS, uptime, serial Catalyst
  show ip interface brief    - Status singkat antarmuka IP dan port
  show vlan brief            - Matriks pemetaan VLAN 10, 20, 30, 40, 99
  show interfaces status     - Kecepatan duplex, status operasional tiap port
  show ip ospf neighbor      - Tetangga routing OSPF (Cisco ASR & MikroTik CCR)
  show ip route              - Tabel routing Layer-3 Catalyst
  show policy-map            - Kebijakan QoS Prioritas Sholat & Jum'at
  show running-config        - Cetak seluruh konfigurasi aktif switch
  show cdp neighbors         - Perangkat tetangga Cisco Discovery Protocol
  ping <ip>                  - Uji koneksi ICMP echo (cth: ping 103.144.18.1)
  configure terminal (conf t)- Masuk ke mode konfigurasi global
  interface <port>           - Konfigurasi antarmuka port (cth: interface Gi1/0/1)
  shutdown / no shutdown     - Nonaktifkan atau aktifkan port yang dipilih
  switchport access vlan <X> - Pindahkan port ke VLAN komunitas tertentu
  write memory               - Simpan konfigurasi ke NVRAM (copy run start)`;
    }
    // Enter config mode
    else if (lower === "conf t" || lower === "configure terminal") {
      setCliConfigMode("config");
      setCliPrompt("Islamicity-Core-SW1(config)#");
      responseOutput = "Enter configuration commands, one per line. End with CNTL/Z or 'exit'.";
    }
    // Exit config mode
    else if (lower === "exit" || lower === "end") {
      if (cliConfigMode === "interface") {
        setCliConfigMode("config");
        setCliPrompt("Islamicity-Core-SW1(config)#");
        setCliActiveInterface(null);
        responseOutput = "Exited interface configuration mode.";
      } else {
        setCliConfigMode("exec");
        setCliPrompt("Islamicity-Core-SW1#");
        responseOutput = "Exited configuration mode.";
      }
    }
    // Interface mode
    else if (lower.startsWith("interface ") || lower.startsWith("int ")) {
      const parts = trimmed.split(" ");
      const ifName = parts[1];
      // Normalize e.g. gi1/0/1 -> Gi1/0/1
      const foundPort = ports.find(
        (p) => p.id.toLowerCase() === ifName.toLowerCase() || p.id.toLowerCase().includes(ifName.toLowerCase())
      );
      if (foundPort) {
        setCliConfigMode("interface");
        setCliActiveInterface(foundPort.id);
        setCliPrompt(`Islamicity-Core-SW1(config-if-${foundPort.id})#`);
        responseOutput = `Entering interface configuration for ${foundPort.id} (${foundPort.vlanName})`;
      } else {
        responseOutput = `% Invalid interface ${ifName}. Available: Gi1/0/1 s/d Gi1/0/24`;
      }
    }
    // Shutdown command in interface mode
    else if (lower === "shutdown" && cliActiveInterface) {
      setPorts((prev) =>
        prev.map((p) => (p.id === cliActiveInterface ? { ...p, adminStatus: "shutdown", status: "down", inMbps: 0, outMbps: 0 } : p))
      );
      responseOutput = `%LINK-5-CHANGED: Interface ${cliActiveInterface}, changed state to administratively down
%LINEPROTO-5-UPDOWN: Line protocol on Interface ${cliActiveInterface}, changed state to down`;
    }
    // No shutdown command
    else if ((lower === "no shutdown" || lower === "no shut") && cliActiveInterface) {
      setPorts((prev) =>
        prev.map((p) => (p.id === cliActiveInterface ? { ...p, adminStatus: "up", status: "up", inMbps: 45.2, outMbps: 12.8 } : p))
      );
      responseOutput = `%LINK-3-UPDOWN: Interface ${cliActiveInterface}, changed state to up
%LINEPROTO-3-UPDOWN: Line protocol on Interface ${cliActiveInterface}, changed state to up`;
    }
    // Switchport access vlan
    else if (lower.startsWith("switchport access vlan ") && cliActiveInterface) {
      const vlanNum = parseInt(lower.replace("switchport access vlan ", "").trim(), 10);
      if (!isNaN(vlanNum)) {
        handleChangePortVlan(cliActiveInterface, vlanNum);
        responseOutput = `Interface ${cliActiveInterface} assigned to VLAN ${vlanNum}. Access mode active.`;
      } else {
        responseOutput = "% Incomplete command or invalid VLAN ID.";
      }
    }
    // Show IP Interface Brief
    else if (lower.startsWith("show ip int") || lower.startsWith("show ip interface brief")) {
      const rows = ports
        .slice(0, 16)
        .map((p) => `${p.id.padEnd(23)} unassigned      YES unset  ${p.status.padEnd(21)} ${p.status}`)
        .join("\n");
      responseOutput = `Interface              IP-Address      OK? Method Status                Protocol
${rows}
Vlan10 (Masjid)        192.168.10.1    YES NVRAM  up                    up
Vlan20 (Madrasah)      192.168.20.1    YES NVRAM  up                    up
Vlan30 (BaitulMaal)    192.168.30.1    YES NVRAM  up                    up
Vlan40 (Warga-RT)      192.168.40.1    YES NVRAM  up                    up
Vlan99 (Management)    10.99.0.2       YES NVRAM  up                    up`;
    }
    // Show VLAN
    else if (lower.includes("vlan")) {
      responseOutput = `VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Gi1/0/17, Gi1/0/18, Gi1/0/19, Gi1/0/20
10   Masjid_Streaming_Priority        active    Gi1/0/1, Gi1/0/2
20   Madrasah_Edu_SafeSearch          active    Gi1/0/3, Gi1/0/4
30   Baitul_Maal_Sharia_Finance       active    Gi1/0/5, Gi1/0/6
40   Warga_Residential_RT_RW          active    Gi1/0/7, Gi1/0/8, Gi1/0/9, Gi1/0/10, Gi1/0/11, Gi1/0/12
99   Islamicity_NOC_Management        active    Gi1/0/13, Gi1/0/14, Gi1/0/15, Gi1/0/16, Gi1/0/21, Gi1/0/22, Gi1/0/23, Gi1/0/24`;
    }
    // Show OSPF
    else if (lower.includes("ospf") || lower.includes("neighbor")) {
      responseOutput = `Neighbor ID     Pri   State           Dead Time   Address         Interface
103.144.18.1      1   FULL/BDR        00:00:34    10.99.0.1       Gi1/0/14 (Cisco ASR 1001-X BGP)
192.168.10.254    1   FULL/DR         00:00:38    10.99.0.254     Gi1/0/13 (MikroTik CCR1036 Gateway)`;
    }
    // Show Route
    else if (lower.includes("show ip route")) {
      responseOutput = `Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area
Gateway of last resort is 10.99.0.1 to network 0.0.0.0

B*    0.0.0.0/0 [20/0] via 10.99.0.1, 14w2d, Gi1/0/14 (Cisco ASR)
C     10.99.0.0/24 is directly connected, Vlan99
C     192.168.10.0/24 is directly connected, Vlan10 (Masjid)
C     192.168.20.0/24 is directly connected, Vlan20 (Madrasah)
C     192.168.30.0/24 is directly connected, Vlan30 (Baitul Maal)
C     192.168.40.0/22 is directly connected, Vlan40 (Warga RT/RW)`;
    }
    // Show Policy Map / QoS
    else if (lower.includes("policy-map") || lower.includes("qos")) {
      responseOutput = `Policy Map ISLAMIC-COMMUNITY-QOS
  Class ISLAMIC-LIVESTREAM-JUMAT
    priority 100000 (kbps) burst 2500000 (Bytes)
    Total Dropped 0 packets, 0 bytes (No Bufferbloat)
    Match: dscp ef (46), protocol rtmp, protocol zoom
  Class EDUCATION-MADRASAH-SURF
    bandwidth 150000 (kbps)
    Total Dropped 0 packets, 0 bytes
    Match: dscp af21 (18)
  Class class-default
    fair-queue
    queue-limit 128 packets`;
    }
    // Ping
    else if (lower.startsWith("ping")) {
      const target = trimmed.split(" ")[1] || "103.144.18.1";
      responseOutput = `Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`;
    }
    // Write Memory
    else if (lower === "write memory" || lower === "wr" || lower === "copy run start") {
      responseOutput = `Building configuration...
[OK]
Cryptographic NVRAM hash generated: 48F2A9B817E53C4D
Islamicity Cisco configuration committed to flash:/config.text`;
    }
    // Show Run
    else if (lower === "show run" || lower === "show running-config") {
      responseOutput = `Building configuration...
Current configuration : 3840 bytes
!
version 16.12
service timestamps debug datetime msec
service timestamps log datetime msec
no service password-encryption
!
hostname Islamicity-Core-SW1
!
boot-start-marker
boot-end-marker
!
ip routing
ip cef
!
vlan 10,20,30,40,99
!
ip domain-name islamicity.netlancar.internal
!
spanning-tree mode rapid-pvst
spanning-tree portfast default
!
interface GigabitEthernet1/0/1
 description MASJID-AL-IKHLAS-PRIORITY
 switchport access vlan 10
 switchport mode access
 service-policy input ISLAMIC-COMMUNITY-QOS
!
interface GigabitEthernet1/0/14
 description TRUNK-10G-CISCO-ASR
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,40,99
!
end`;
    } else {
      responseOutput = `Islamicity-Core-SW1# Executing: ${trimmed}
Command executed successfully under Cisco IOS Software release 16.12.5b.`;
    }

    setCliHistory((prev) => [
      ...prev,
      `${cliPrompt} ${trimmed}`,
      ...responseOutput.split("\n"),
      `${cliPrompt} `,
    ]);
    setCliInput("");
  };

  // Add new DNS filter domain
  const handleAddDnsDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;

    const newRule: DnsFilterRule = {
      id: `dns-${Date.now()}`,
      domain: newDomainInput.trim().toLowerCase(),
      category: newCategoryInput,
      blockedCount: 0,
      addedAt: new Date().toISOString().split("T")[0],
    };

    setDnsFilters([newRule, ...dnsFilters]);
    setNewDomainInput("");
  };

  const handleRemoveDnsFilter = (id: string) => {
    setDnsFilters((prev) => prev.filter((item) => item.id !== id));
  };

  // Production-Ready Cisco IOS XE Running-Config Template
  const ciscoIosConfigTemplate = `! ==============================================================================
! ISLAMICITY CISCO ENTERPRISE NETWORK SYSTEM - CORE BACKBONE
! Device     : Cisco Catalyst WS-C3850-24T Layer-3 Switch & Cisco ASR 1001-X BGP Edge
! Managed for: project.islamicity@gmail.com
! Location   : Sentral NOC RT/RW Net & Masjid Al-Ikhlas Server Rack
! ==============================================================================
hostname Islamicity-Core-SW1
!
ip routing
ip cef
no ip domain-lookup
ip domain-name islamicity.netlancar.internal
!
! --- SEGMENTASI VLAN KOMUNITAS ---
vlan 10
 name Masjid_Streaming_Priority
!
vlan 20
 name Madrasah_Edu_SafeSearch
!
vlan 30
 name Baitul_Maal_Sharia_Finance
!
vlan 40
 name Warga_Residential_RT_RW
!
vlan 99
 name Islamicity_NOC_Management
!
! --- QUALITY OF SERVICE (QoS) SHOLAT & JUM'AT BUFFERLESS PRIORITY ---
class-map match-any ISLAMIC-LIVESTREAM-JUMAT
 match ip dscp ef
 match protocol rtmp
 match protocol zoom
 match protocol youtube-streaming
!
class-map match-any MADRASAH-EDU-TRAFFIC
 match ip dscp af21
 match protocol http
 match protocol https
!
policy-map ISLAMIC-COMMUNITY-QOS
 class ISLAMIC-LIVESTREAM-JUMAT
  priority percent 35
 class MADRASAH-EDU-TRAFFIC
  bandwidth percent 25
 class class-default
  fair-queue
!
! --- INTERFACE CONFIGURATION ---
! Port 1: Masjid Al-Ikhlas Main Audio/Video Uplink
interface GigabitEthernet1/0/1
 description UPLINK-MASJID-AL-IKHLAS-STREAMING
 switchport access vlan 10
 switchport mode access
 service-policy input ISLAMIC-COMMUNITY-QOS
 spanning-tree portfast
!
! Port 3: Madrasah Cyber Lab (Protected Education VLAN)
interface GigabitEthernet1/0/3
 description MADRASAH-LAB-KOMPUTER-SANTRI
 switchport access vlan 20
 switchport mode access
 spanning-tree portfast
!
! Port 5: Baitul Maal wat Tamwil (Sharia Microfinance POS)
interface GigabitEthernet1/0/5
 description BAITUL-MAAL-KASIR-KEUANGAN-SYARIAH
 switchport access vlan 30
 switchport mode access
 spanning-tree portfast
!
! Port 13: 802.1Q Inter-VLAN Trunk ke MikroTik CCR1036 Gateway
interface GigabitEthernet1/0/13
 description TRUNK-MIKROTIK-CCR1036-GATEWAY
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,40,99
!
! Port 14: 10G SFP+ Dedicated Trunk ke Cisco ASR 1001-X BGP Edge
interface GigabitEthernet1/0/14
 description TRUNK-CISCO-ASR-BGP-10G-UPLINK
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,40,99
!
! --- SVI LAYER-3 INTER-VLAN GATEWAYS ---
interface Vlan10
 description Gateway-Masjid-Al-Ikhlas
 ip address 192.168.10.1 255.255.255.0
 no shutdown
!
interface Vlan20
 description Gateway-Madrasah-Santri
 ip address 192.168.20.1 255.255.255.0
 no shutdown
!
interface Vlan30
 description Gateway-Baitul-Maal-Sharia
 ip address 192.168.30.1 255.255.255.0
 no shutdown
!
interface Vlan40
 description Gateway-Warga-Residential-RT-RW
 ip address 192.168.40.1 255.255.252.0
 no shutdown
!
interface Vlan99
 description Gateway-NOC-Management
 ip address 10.99.0.2 255.255.255.0
 no shutdown
!
! --- OSPF DYNAMIC ROUTING WITH CISCO ASR & MIKROTIK ---
router ospf 1
 router-id 10.99.0.2
 network 10.99.0.0 0.0.0.255 area 0
 network 192.168.10.0 0.0.0.255 area 0
 network 192.168.20.0 0.0.0.255 area 0
 network 192.168.30.0 0.0.0.255 area 0
!
ip route 0.0.0.0 0.0.0.0 10.99.0.1
!
end`;

  // Companion MikroTik RouterOS Script for 802.1Q Trunking
  const mikrotikTrunkScript = `# ==============================================================================
# MIKROTIK ROUTEROS SCRIPT - CISCO CATALYST 3850 802.1Q TRUNK INTEGRATION
# Hardware: MikroTik CCR1036-12G-4S <--> Cisco Catalyst WS-C3850-24T (Port 13)
# ==============================================================================
/interface bridge add name=bridge-islamicity-vlan vlan-filtering=yes

# Tambahkan trunk interface ether13 (terhubung ke Cisco Gi1/0/13)
/interface bridge port
add bridge=bridge-islamicity-vlan interface=ether13

# Konfigurasi Tagged VLAN 802.1Q pada Bridge
/interface bridge vlan
add bridge=bridge-islamicity-vlan tagged=bridge-islamicity-vlan,ether13 vlan-ids=10
add bridge=bridge-islamicity-vlan tagged=bridge-islamicity-vlan,ether13 vlan-ids=20
add bridge=bridge-islamicity-vlan tagged=bridge-islamicity-vlan,ether13 vlan-ids=30
add bridge=bridge-islamicity-vlan tagged=bridge-islamicity-vlan,ether13 vlan-ids=40
add bridge=bridge-islamicity-vlan tagged=bridge-islamicity-vlan,ether13 vlan-ids=99

# Buat SVI interface virtual pada MikroTik
/interface vlan
add interface=bridge-islamicity-vlan name=vlan10-masjid vlan-id=10
add interface=bridge-islamicity-vlan name=vlan20-madrasah vlan-id=20
add interface=bridge-islamicity-vlan name=vlan30-baitulmaal vlan-id=30
add interface=bridge-islamicity-vlan name=vlan40-warga vlan-id=40
add interface=bridge-islamicity-vlan name=vlan99-mgmt vlan-id=99

# Konfigurasi IP Gateway pada MikroTik
/ip address
add address=10.99.0.254/24 interface=vlan99-mgmt comment="NOC OOB Inter-connect to Cisco"

# Routing OSPF MikroTik ke Cisco Core Switch
/routing ospf instance add name=ospf-islamicity router-id=10.99.0.254
/routing ospf area add instance=ospf-islamicity name=area0-backbone area-id=0.0.0.0
/routing ospf interface-template add area=area0-backbone interfaces=vlan99-mgmt`;

  const handleCopyCiscoConfig = () => {
    navigator.clipboard.writeText(ciscoIosConfigTemplate);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2500);
  };

  const handleCopyMikrotikConfig = () => {
    navigator.clipboard.writeText(mikrotikTrunkScript);
    setCopiedMikrotik(true);
    setTimeout(() => setCopiedMikrotik(false), 2500);
  };

  const handleDownloadCiscoConfig = () => {
    const blob = new Blob([ciscoIosConfigTemplate], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Islamicity-Cisco-Catalyst-3850-Running-Config.cfg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="cisco-network-system-view" className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner with Enterprise Cisco & Islamic Community Branding */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-indigo-900/60 shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30 shrink-0">
            <Server className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-cyan-400/30">
                Enterprise Core Backbone
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Cisco IOS XE 16.12.5b (Layer-3 Catalyst WS-C3850-24T)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Islamicity CISCO Network System
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Integrasi Core Switch Cisco Catalyst &amp; Edge Router Cisco ASR untuk Jaringan Komunitas Islamicity, Masjid Al-Ikhlas, Madrasah Cyber, Baitul Maal &amp; Pelanggan RT/RW Net.
            </p>
          </div>
        </div>

        {/* Quick Prayer Time & QoS Priority Pill */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                Waktu Sholat Aktif (WIB)
              </div>
              <div className="text-xs font-black font-mono text-emerald-300 flex items-center gap-1.5">
                <span>Dzuhur / Jum'at 11:51</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/30 text-emerald-200">
                  Live Stream Boost
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsJumatQosActive(!isJumatQosActive)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isJumatQosActive
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25"
                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>QoS Sholat &amp; Jum'at: {isJumatQosActive ? "AKTIF (Priority 35%)" : "Standby (Normal)"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("topology")}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "topology"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Topologi &amp; Telemetri Core</span>
        </button>

        <button
          onClick={() => setActiveTab("ports")}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "ports"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Matriks Port Catalyst (24P)</span>
        </button>

        <button
          onClick={() => setActiveTab("vlans")}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "vlans"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Segmentasi VLAN Komunitas</span>
        </button>

        <button
          onClick={() => setActiveTab("safesearch")}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "safesearch"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>SafeSearch &amp; Filter Syariah</span>
        </button>

        <button
          onClick={() => setActiveTab("cli")}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "cli"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Cisco IOS CLI Terminal</span>
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "config"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Konfigurasi Running-Config</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TOPOLOGI & TELEMETRI CORE */}
      {/* ========================================================================= */}
      {activeTab === "topology" && (
        <div className="space-y-6">
          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Uptime Core Backbone
              </span>
              <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                14 Minggu, 2 Hari
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">99.98% High Availability</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Beban CPU Catalyst 3850
              </span>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                14% Load
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Suhu Normal: 38°C (Cooling Fan OK)</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Throughput 10G SFP+ Trunk
              </span>
              <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                920.5 Mbps
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Cisco ASR BGP AS138xxx Peering</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Port Aktif / Total Catalyst
              </span>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {ports.filter((p) => p.status === "up").length} / 24 Port
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {ports.filter((p) => p.status === "down").length} Port Cadangan (Spare Standby)
              </span>
            </div>
          </div>

          {/* Interactive Dual-Homed Core Architecture Diagram */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-white relative overflow-hidden space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-400" />
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Topologi Hirarkis Islamicity Cisco Enterprise Architecture
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Klik simpul jaringan (node) di bawah untuk menginspeksi informasi interface, IP routing, dan status peering
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-blue-500/20 text-cyan-300 border border-blue-400/30 shrink-0">
                Dual-Homed Core &amp; Distribution
              </span>
            </div>

            {/* Interactive Topology Visual Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Node 1: Cisco ASR 1001-X WAN Edge */}
              <button
                onClick={() => setSelectedTopologyNode("asr")}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedTopologyNode === "asr"
                    ? "border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-400">LAYER 1: BGP EDGE</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-cyan-400" />
                  Cisco ASR 1001-X
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  10G Fiber Uplink ISP Dedicated BGP ASN Peering
                </p>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  IP: 103.144.18.1 • BGP: Active
                </div>
              </button>

              {/* Node 2: Cisco Catalyst 3850 Core Switch */}
              <button
                onClick={() => setSelectedTopologyNode("catalyst")}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedTopologyNode === "catalyst"
                    ? "border-blue-400 bg-blue-950/40 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-blue-400">LAYER 2: CORE L3</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-400" />
                  Catalyst WS-C3850
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Central Inter-VLAN Routing &amp; Jum'at MQC QoS
                </p>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  IP: 10.99.0.2 • 24x 1G + 4x 10G
                </div>
              </button>

              {/* Node 3: MikroTik CCR1036-12G-4S Gateway */}
              <button
                onClick={() => setSelectedTopologyNode("mikrotik")}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedTopologyNode === "mikrotik"
                    ? "border-indigo-400 bg-indigo-950/40 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-400">LAYER 2: QUEUE & PPPoE</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-indigo-400" />
                  MikroTik CCR1036
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  PPPoE Server, PCQ Bandwidth Shaper &amp; User Isolir
                </p>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  IP: 10.99.0.254 • 36 Cores
                </div>
              </button>

              {/* Node 4: Community Access (Masjid & Warga) */}
              <button
                onClick={() => setSelectedTopologyNode("community")}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedTopologyNode === "community"
                    ? "border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-400">LAYER 3: COMMUNITY ACCESS</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  OLT &amp; Masjid / Warga
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  EPON / GPON FTTH, Masjid Al-Ikhlas &amp; Madrasah
                </p>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  VLAN 10, 20, 30, 40 • 140+ ONT
                </div>
              </button>
            </div>

            {/* Selected Node Details Drawer */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
              {selectedTopologyNode === "asr" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 text-sm">
                      Detail Simpul: Cisco ASR 1001-X BGP Edge Router
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                      BGP Session ID: AS138xxx-PEER-1
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Menangani peering BGP eksternal dengan Upstream Fiber Dedicated 1 Gbps. Dilengkapi perangkat keras Cisco QuantumFlow Processor (QFP) untuk akselerasi NAT64, Stateful Firewall, dan NetFlow telemetry real-time ke monitoring NetLancar.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Prefix IPv4 Diterima</span>
                      <strong className="text-white">924,180 Rute BGP</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Throughput Edge</span>
                      <strong className="text-emerald-400">920.5 Mbps Rx / 240 Mbps Tx</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">SFP+ 10G Rx Power</span>
                      <strong className="text-cyan-400">-18.2 dBm (Excellent)</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">OSPF Area 0 Neighbor</span>
                      <strong className="text-white">Catalyst 3850 (10.99.0.2)</strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedTopologyNode === "catalyst" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400 text-sm">
                      Detail Simpul: Cisco Catalyst WS-C3850-24T Layer-3 Switch (Core Backbone)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono">
                      Backplane: 92 Gbps Non-Blocking
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Pusat distribusi traffic data seluruh komunitas Islamicity RT/RW Net. Mengelola segregasi VLAN 10 (Masjid), VLAN 20 (Madrasah), VLAN 30 (Baitul Maal), dan VLAN 40 (Warga). Menjalankan kebijakan MQC (Modular QoS CLI) untuk prioritas audio adhan dan live streaming khutbah Jum'at.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Status Operasional Port</span>
                      <strong className="text-emerald-400">18 Port Up, 6 Down (Spare)</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Beban CPU L3</span>
                      <strong className="text-white">14% (Cisco IOS-XE)</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Suhu Internal Chassis</span>
                      <strong className="text-white">38°C (Normal)</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">QoS Buffer Packet Drop</span>
                      <strong className="text-emerald-400">0 Packets (Bufferless)</strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedTopologyNode === "mikrotik" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 text-sm">
                      Detail Simpul: MikroTik CCR1036-12G-4S (Pelayanan Pelanggan &amp; PPPoE)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                      RouterOS v7.14
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Terhubung langsung ke port 13 Cisco Catalyst via 802.1Q Dot1q Trunk. MikroTik bertindak sebagai PPPoE Server warga, mengeksekusi limitasi antrian bandwidth (Queue Simple / PCQ), dan auto-isolate pelanggan menunggak.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Sesi PPPoE Aktif</span>
                      <strong className="text-white">138 Sesi Online</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Trunk Interface</span>
                      <strong className="text-indigo-400">Gi1/0/13 &lt;--&gt; ether13</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Firewall Filter Raw</span>
                      <strong className="text-white">FastPath Aktif</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">OSPF Status</span>
                      <strong className="text-emerald-400">Full DR / Neighbor OK</strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedTopologyNode === "community" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-sm">
                      Detail Simpul: Distribusi Akses Komunitas &amp; OLT Fiber Optic
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                      4x PON Port EPON / GPON
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Terhubung ke ODP tiang jalan RW 04 &amp; RW 05 serta OLT NOC sentral. Membagi jalur terpisah ke Masjid Al-Ikhlas (VLAN 10), Madrasah Lab Komputer (VLAN 20), Baitul Maal (VLAN 30), dan pelanggan rumah tangga RT 01-05 (VLAN 40).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MATRIKS PORT CATALYST 24-PORT (INTERACTIVE FRONT PANEL) */}
      {/* ========================================================================= */}
      {activeTab === "ports" && (
        <div className="space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-400" />
                  Panel Depan Fisik Switch Cisco Catalyst WS-C3850-24T
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Klik nomor port RJ-45 untuk menginspeksi throughput Rx/Tx, melakukan uji kabel TDR, mengubah VLAN, atau shutdown/enable port secara interaktif.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                  Up ({ports.filter((p) => p.status === "up").length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-600"></span>
                  Down ({ports.filter((p) => p.status === "down").length})
                </span>
              </div>
            </div>

            {/* Visual 24-Port RJ-45 Grid Simulation */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-slate-400">
                <span>CISCO CATALYST 3850 SERIES (1-24 GIGABIT ETHERNET)</span>
                <span className="text-emerald-400">PWR: OK • STAT: OK • SPEED: 1000</span>
              </div>

              {/* Ports 1-12 (Top Row) & 13-24 (Bottom Row) */}
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {ports.map((port) => (
                  <button
                    key={port.id}
                    onClick={() => {
                      setSelectedPortId(port.id);
                      setCableTestResult(null);
                    }}
                    className={`p-2.5 rounded-xl flex flex-col items-center justify-between gap-1.5 border transition-all cursor-pointer relative ${
                      selectedPortId === port.id
                        ? "border-cyan-400 bg-cyan-950/60 scale-105 shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40"
                        : port.status === "up"
                        ? "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400"
                        : "border-slate-800 bg-slate-900/40 opacity-60 hover:opacity-100 hover:border-slate-700"
                    }`}
                  >
                    {/* Status LED */}
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          port.status === "up"
                            ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"
                            : "bg-slate-600"
                        }`}
                      ></span>
                    </div>

                    {/* Port Name */}
                    <span className="font-mono text-[11px] font-bold text-white">
                      {port.id.replace("Gi1/0/", "")}
                    </span>

                    {/* VLAN Tag Badge */}
                    <span
                      className={`text-[8px] font-mono px-1 py-0.2 rounded font-semibold ${
                        port.vlan === 10
                          ? "bg-indigo-500/20 text-indigo-300"
                          : port.vlan === 20
                          ? "bg-emerald-500/20 text-emerald-300"
                          : port.vlan === 30
                          ? "bg-purple-500/20 text-purple-300"
                          : port.vlan === 40
                          ? "bg-blue-500/20 text-cyan-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      V{port.vlan}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Port Details & Interactive Controls Inspector */}
            {selectedPort && (
              <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-base text-cyan-400">
                      {selectedPort.name}
                    </span>
                    <span className="text-xs text-white font-semibold">
                      ({selectedPort.vlanName})
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      Desc: {selectedPort.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Admin Status Button */}
                    <button
                      onClick={() => handleTogglePortAdmin(selectedPort.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedPort.adminStatus === "up"
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{selectedPort.adminStatus === "up" ? "Shutdown Port" : "No Shutdown (Enable)"}</span>
                    </button>

                    {/* Cable TDR Test Button */}
                    <button
                      onClick={handleRunCableTest}
                      disabled={testingCable}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingCable ? "animate-spin" : ""}`} />
                      <span>{testingCable ? "Testing TDR..." : "Uji Kabel TDR"}</span>
                    </button>
                  </div>
                </div>

                {/* Port Realtime Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">Status Port</span>
                    <strong
                      className={
                        selectedPort.status === "up" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"
                      }
                    >
                      {selectedPort.status.toUpperCase()} ({selectedPort.adminStatus})
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">Speed &amp; Duplex</span>
                    <strong className="text-white">
                      {selectedPort.speed} Mbps / {selectedPort.duplex}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">VLAN Assignment</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <select
                        value={selectedPort.vlan}
                        onChange={(e) => handleChangePortVlan(selectedPort.id, Number(e.target.value))}
                        className="bg-slate-800 text-cyan-300 font-bold text-xs rounded px-2 py-0.5 border border-slate-700 focus:outline-hidden"
                      >
                        <option value={10}>VLAN 10 (Masjid)</option>
                        <option value={20}>VLAN 20 (Madrasah)</option>
                        <option value={30}>VLAN 30 (Baitul Maal)</option>
                        <option value={40}>VLAN 40 (Warga RT/RW)</option>
                        <option value={99}>VLAN 99 (NOC Mgmt)</option>
                        <option value={1}>VLAN 1 (Spare)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">Throughput Masuk (Rx)</span>
                    <strong className="text-emerald-400">{selectedPort.inMbps} Mbps</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">Throughput Keluar (Tx)</span>
                    <strong className="text-cyan-400">{selectedPort.outMbps} Mbps</strong>
                  </div>
                </div>

                {/* Cable TDR result notification if present */}
                {cableTestResult && (
                  <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/80 text-blue-200 text-xs font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{cableTestResult}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SEGMENTASI VLAN KOMUNITAS */}
      {/* ========================================================================= */}
      {activeTab === "vlans" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* VLAN 10: Masjid */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  VLAN 10 • Priority Audio/Video
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  DSCP EF (46)
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Masjid Al-Ikhlas &amp; Siaran Khutbah Jum'at
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Jalur bandwidth prioritas tinggi tanpa buffer untuk audio adhan digital, livestreaming khutbah Jum'at via YouTube/Facebook, pengajian tabligh akbar, dan CCTV keamanan masjid.
              </p>
              <div className="font-mono text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span>Subnet: 192.168.10.0/24</span>
                <span>Gateway: 192.168.10.1</span>
              </div>
            </div>

            {/* VLAN 20: Madrasah */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  VLAN 20 • SafeSearch Filtered
                </span>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                  DNS Whitelist Pi-Hole
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Madrasah Tsanawiyah &amp; Santri Cyber Lab
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Jaringan ruang kelas digital dan laboratorium komputer santri dengan proteksi konten pornografi, judi online, dan malware terintegrasi Pi-hole DNS dan Cisco Umbrella.
              </p>
              <div className="font-mono text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span>Subnet: 192.168.20.0/24</span>
                <span>Gateway: 192.168.20.1</span>
              </div>
            </div>

            {/* VLAN 30: Baitul Maal */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  VLAN 30 • Sharia Microfinance
                </span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                  Encrypted ACL Segregation
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Baitul Maal wat Tamwil (BMT) &amp; Koperasi Warga
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Segregasi data transaksi keuangan syariah dan pencatatan kas paguyuban yang terisolasi dari domain broadcast warga biasa demi keamanan finansial dan proteksi penipuan perbankan.
              </p>
              <div className="font-mono text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span>Subnet: 192.168.30.0/24</span>
                <span>Gateway: 192.168.30.1</span>
              </div>
            </div>

            {/* VLAN 40: Warga RT/RW Net */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  VLAN 40 • Subscriber Residential
                </span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                  PPPoE Encapsulation
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Jaringan Rumah Warga RT 01 s/d RT 05
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Distribusi koneksi internet ke rumah-rumah warga dengan alokasi bandwidth berbasis paket (15, 25, 50, 100 Mbps) dan isolir otomatis tunggakan bulanan terhubung ke sistem penagihan NetLancar.
              </p>
              <div className="font-mono text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span>Subnet: 192.168.40.0/22</span>
                <span>Gateway: 192.168.40.1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SAFESEARCH & FILTER SYARIAH */}
      {/* ========================================================================= */}
      {activeTab === "safesearch" && (
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Kueri Negatif Terblokir Hari Ini
              </span>
              <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                4,285 Kueri
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Judi Online (68%), Pornografi (32%)</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Status Mesin DNS Filter
              </span>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span>SafeSearch ON</span>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Pi-Hole + Cisco Umbrella Sinkron</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Infaq Hotspot Komunitas
              </span>
              <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                Rp {infaqTotal.toLocaleString("id-ID")}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Terkumpul untuk kas internet masjid</span>
            </div>
          </div>

          {/* Add Domain Blacklist Form */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Daftar Blokir Domain Syariah (Cisco ACL &amp; DNS Sinkhole)
                </h4>
                <p className="text-xs text-slate-500">
                  Tambahkan situs terlarang (judi online, situs pornografi, malware) untuk diblokir seketika di seluruh VLAN 20 &amp; VLAN 40.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddDnsDomain} className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                placeholder="Nama domain (contoh: judionline88.xyz)..."
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                className="flex-1 min-w-[240px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="Judi Online">Judi Online / Taruhan</option>
                <option value="Pornografi">Pornografi / Dewasa</option>
                <option value="Phishing / Malware">Phishing / Scam</option>
                <option value="Game Berat">Game Berat Jam Sholat</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Blokir Domain</span>
              </button>
            </form>

            {/* List of blocked domains */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
              {dnsFilters.map((rule) => (
                <div key={rule.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {rule.domain}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rule.category === "Judi Online"
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                          : rule.category === "Pornografi"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {rule.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Terblokir: {rule.blockedCount} kali
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveDnsFilter(rule.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    title="Hapus dari daftar blokir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CISCO IOS CLI TERMINAL EMULATOR */}
      {/* ========================================================================= */}
      {activeTab === "cli" && (
        <div className="space-y-3">
          {/* Quick Command Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Quick Command:</span>
            {[
              "show ip interface brief",
              "show vlan brief",
              "show ip ospf neighbor",
              "show policy-map",
              "show running-config",
              "interface Gi1/0/1",
              "ping 103.144.18.1",
              "write memory",
              "help",
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleRunCommand(cmd)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Terminal Console */}
          <div className="rounded-2xl bg-black border border-slate-800 p-4 font-mono text-xs text-emerald-400 space-y-2 shadow-2xl h-[440px] overflow-y-auto flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-slate-500 pb-2 border-b border-slate-800 text-[11px] flex justify-between items-center">
                <span>Cisco IOS Software (WS-C3850-24T) • Connected to Islamicity-Core-SW1 via SSHv2</span>
                <span className="text-emerald-500 font-bold">Terminal Online</span>
              </div>

              <div className="space-y-1 pt-1">
                {cliHistory.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                    {line}
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunCommand(cliInput);
              }}
              className="flex items-center gap-2 pt-2 border-t border-slate-800 text-white mt-2"
            >
              <span className="text-emerald-400 font-bold shrink-0">{cliPrompt}</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    if (cliHistoryCmds.length > 0) {
                      const nextIdx = historyIndex + 1 < cliHistoryCmds.length ? historyIndex + 1 : historyIndex;
                      setHistoryIndex(nextIdx);
                      setCliInput(cliHistoryCmds[cliHistoryCmds.length - 1 - nextIdx] || "");
                    }
                  } else if (e.key === "ArrowDown") {
                    if (historyIndex > 0) {
                      const nextIdx = historyIndex - 1;
                      setHistoryIndex(nextIdx);
                      setCliInput(cliHistoryCmds[cliHistoryCmds.length - 1 - nextIdx] || "");
                    } else {
                      setHistoryIndex(-1);
                      setCliInput("");
                    }
                  }
                }}
                placeholder="Ketik perintah Cisco IOS (contoh: show vlan brief, help, conf t)..."
                className="flex-1 bg-transparent border-none text-white font-mono text-xs focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold cursor-pointer"
              >
                Execute
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: RUNNING-CONFIG & MIKROTIK TRUNK GUIDE */}
      {/* ========================================================================= */}
      {activeTab === "config" && (
        <div className="space-y-6">
          {/* Cisco Config Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Skrip Konfigurasi Running-Config Cisco Catalyst WS-C3850-24T
                </h3>
                <p className="text-xs text-slate-500">
                  Konfigurasi siap pakai untuk konsol switch fisik di ruang server NOC Masjid Al-Ikhlas
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCiscoConfig}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh .cfg</span>
                </button>

                <button
                  onClick={handleCopyCiscoConfig}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedConfig ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedConfig ? "Tersalin!" : "Salin Running-Config"}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed">
              {ciscoIosConfigTemplate}
            </pre>
          </div>

          {/* Companion MikroTik Script Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-indigo-500" />
                  Skrip Pendamping MikroTik RouterOS (Trunking 802.1Q ke Cisco Port 13)
                </h3>
                <p className="text-xs text-slate-500">
                  Eksekusi skrip ini di Terminal MikroTik CCR1036 untuk menghubungkan VLAN antar-perangkat secara otomatis
                </p>
              </div>

              <button
                onClick={handleCopyMikrotikConfig}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedMikrotik ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMikrotik ? "Tersalin!" : "Salin Skrip MikroTik"}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto max-h-[300px] leading-relaxed">
              {mikrotikTrunkScript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
