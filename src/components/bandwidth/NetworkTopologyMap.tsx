import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import {
  Server,
  Radio,
  Wifi,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  Activity,
  Maximize2,
  Minimize2,
  Layers,
  MapPin,
  RefreshCw,
  Power,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
import { Customer, InternetPackage } from "../../types";
import { formatRupiah } from "../../services/storage";
import { Language, translations } from "../../translations";

export interface NetworkTopologyMapProps {
  customers: Customer[];
  packages?: InternetPackage[];
  onToggleIsolation?: (id: string) => void;
  lang: Language;
}

// Node types in our fiber network topology
export type NodeType = "noc" | "olt" | "odp" | "ont";

export interface TopologyNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: NodeType;
  code?: string;
  status: "active" | "warning" | "isolated" | "down";
  ponPort?: string;
  odpName?: string;
  ip?: string;
  mac?: string;
  rxPower?: number; // in dBm (e.g. -19.4)
  customer?: Customer;
  packageInfo?: InternetPackage;
  ontModel?: string;
  details?: string;
  rxRate?: number; // Mbps
  txRate?: number; // Mbps
  // Fixed positions for hierarchical layout
  targetX?: number;
  targetY?: number;
}

export interface TopologyLink extends d3.SimulationLinkDatum<TopologyNode> {
  id: string;
  source: string | TopologyNode;
  target: string | TopologyNode;
  speed: string;
  type: "core" | "feeder" | "distribution" | "drop";
  status: "active" | "warning" | "isolated";
  attenuation?: string;
}

export const NetworkTopologyMap: React.FC<NetworkTopologyMapProps> = ({
  customers,
  packages = [],
  onToggleIsolation,
  lang,
}) => {
  const t = translations[lang];
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [dimensions, setDimensions] = useState({ width: 900, height: 580 });
  const [layoutMode, setLayoutMode] = useState<"hierarchical" | "force">("hierarchical");
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ponFilter, setPonFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimulatingPing, setIsSimulatingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ ms: number; packetLoss: number } | null>(null);

  // ResizeObserver on the container as per guidelines
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 100) {
          setDimensions({
            width: Math.max(700, Math.floor(width)),
            height: isFullscreen ? Math.max(600, Math.floor(window.innerHeight - 180)) : 580,
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Construct Topology Graph Data from Customers & OLT Configuration
  const { nodes, links, odpList } = useMemo(() => {
    const rawNodes: TopologyNode[] = [];
    const rawLinks: TopologyLink[] = [];

    // 1. Root NOC Gateway Node
    rawNodes.push({
      id: "noc-gateway",
      name: "Core Gateway MikroTik CCR2004",
      code: "NOC-PBR",
      type: "noc",
      status: "active",
      ip: "103.180.22.1",
      details: "Upstream 1 Gbps Fiber Dedicated • BGP ASN-64500",
      rxRate: 682,
      txRate: 245,
    });

    // 2. Central GPON OLT Node
    rawNodes.push({
      id: "olt-central",
      name: "ZTE C320 OLT (GPON 4-Port)",
      code: "OLT-01-NOC",
      type: "olt",
      status: "active",
      ip: "192.168.10.1",
      details: "Laser TX: +2.8 dBm • SFP Class C+ • 4 PON Ports Aktif",
      rxRate: 540,
      txRate: 210,
    });

    // Core link between Gateway and OLT
    rawLinks.push({
      id: "link-noc-olt",
      source: "noc-gateway",
      target: "olt-central",
      speed: "10 Gbps SFP+",
      type: "core",
      status: "active",
      attenuation: "0.2 dB",
    });

    // 3. Known ODP Distribution Boxes in RT/RW
    const distinctOdps = [
      { id: "odp-mwr-01", name: "ODP-MWR-01 (Mawar RW 04)", pon: "PON-1", pole: "Tiang 12 RW 04" },
      { id: "odp-mwr-02", name: "ODP-MWR-02 (Mawar RW 04)", pon: "PON-1", pole: "Tiang 18 RW 04" },
      { id: "odp-mlt-01", name: "ODP-MLT-01 (Melati RW 04)", pon: "PON-1", pole: "Tiang 05 RW 04" },
      { id: "odp-kng-03", name: "ODP-KNG-03 (Kenanga RW 05)", pon: "PON-2", pole: "Tiang 24 RW 05" },
      { id: "odp-gra-01", name: "ODP-GRA-01 (Graha Asri RW 05)", pon: "PON-2", pole: "Tiang 31 RW 05" },
      { id: "odp-psr-01", name: "ODP-PSR-01 (Pasar RW 06)", pon: "PON-3", pole: "Tiang 08 RW 06" },
    ];

    distinctOdps.forEach((odp) => {
      rawNodes.push({
        id: odp.id,
        name: odp.name,
        code: odp.id.toUpperCase(),
        type: "odp",
        status: "active",
        ponPort: odp.pon,
        details: `Splitter 1:8 PLC • ${odp.pole} • Feeder dari ${odp.pon}`,
      });

      // Feeder link from OLT to ODP
      rawLinks.push({
        id: `link-olt-${odp.id}`,
        source: "olt-central",
        target: odp.id,
        speed: "2.5 Gbps GPON",
        type: "feeder",
        status: "active",
        attenuation: "-14.2 dBm",
      });
    });

    // 4. Customer ONT Nodes
    customers.forEach((cust, index) => {
      // Find matching package
      const pkg = packages.find((p) => p.id === cust.packageId);

      // Extract ODP from customer oltPort or default based on index
      let targetOdpId = "odp-mwr-01";
      const portUpper = (cust.oltPort || "").toUpperCase();
      if (portUpper.includes("MLT")) targetOdpId = "odp-mlt-01";
      else if (portUpper.includes("MWR-02")) targetOdpId = "odp-mwr-02";
      else if (portUpper.includes("MWR")) targetOdpId = "odp-mwr-01";
      else if (portUpper.includes("KNG")) targetOdpId = "odp-kng-03";
      else if (portUpper.includes("GRA")) targetOdpId = "odp-gra-01";
      else if (portUpper.includes("PSR")) targetOdpId = "odp-psr-01";
      else {
        // Fallback round-robin
        targetOdpId = distinctOdps[index % distinctOdps.length].id;
      }

      const isIsolated = cust.status === "isolated";
      // Deterministic realistic RX power based on customer id
      const hash = cust.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const rxBase = -18.5 - ((hash % 45) / 10); // Between -18.5 dBm and -23.0 dBm

      const ontNode: TopologyNode = {
        id: `ont-${cust.id}`,
        name: cust.name,
        code: cust.customerCode,
        type: "ont",
        status: isIsolated ? "isolated" : rxBase < -24 ? "warning" : "active",
        ponPort: portUpper.includes("PON-2") ? "PON-2" : portUpper.includes("PON-3") ? "PON-3" : "PON-1",
        odpName: targetOdpId.toUpperCase(),
        ip: cust.ipAddress,
        mac: cust.macAddress,
        rxPower: Number(rxBase.toFixed(1)),
        customer: cust,
        packageInfo: pkg,
        ontModel: cust.ontModel || "ZTE F609 GPON",
        details: `${cust.address} (${cust.rtRw})`,
        rxRate: isIsolated ? 0 : Math.round((pkg?.speedDownload || 20) * (0.4 + (hash % 60) / 100)),
        txRate: isIsolated ? 0 : Math.round((pkg?.speedUpload || 10) * (0.3 + (hash % 50) / 100)),
      };

      rawNodes.push(ontNode);

      // Drop cable link from ODP to ONT
      rawLinks.push({
        id: `link-${targetOdpId}-${ontNode.id}`,
        source: targetOdpId,
        target: ontNode.id,
        speed: `${pkg?.speedDownload || 20} Mbps`,
        type: "drop",
        status: isIsolated ? "isolated" : "active",
        attenuation: `${rxBase.toFixed(1)} dBm`,
      });
    });

    return { nodes: rawNodes, links: rawLinks, odpList: distinctOdps };
  }, [customers, packages]);

  // Filter nodes based on search, PON, and status
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // Determine matching ONT nodes
    const matchingOntIds = new Set<string>();
    nodes.forEach((n) => {
      if (n.type === "ont") {
        const matchSearch =
          !q ||
          n.name.toLowerCase().includes(q) ||
          (n.code && n.code.toLowerCase().includes(q)) ||
          (n.ip && n.ip.includes(q)) ||
          (n.ontModel && n.ontModel.toLowerCase().includes(q)) ||
          (n.details && n.details.toLowerCase().includes(q));

        const matchPon = ponFilter === "all" || n.ponPort === ponFilter;
        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && n.status === "active") ||
          (statusFilter === "isolated" && n.status === "isolated") ||
          (statusFilter === "warning" && n.status === "warning");

        if (matchSearch && matchPon && matchStatus) {
          matchingOntIds.add(n.id);
        }
      }
    });

    // If filter is active, only show relevant ODPs that connect to matching ONTs
    const activeOdpIds = new Set<string>();
    links.forEach((l) => {
      const targetId = typeof l.target === "object" ? l.target.id : l.target;
      const sourceId = typeof l.source === "object" ? l.source.id : l.source;
      if (matchingOntIds.has(targetId)) {
        activeOdpIds.add(sourceId);
      }
    });

    const visibleNodes = nodes.filter((n) => {
      if (n.type === "noc" || n.type === "olt") return true;
      if (n.type === "odp") {
        return matchingOntIds.size === 0 && (q || statusFilter !== "all")
          ? false
          : activeOdpIds.has(n.id) || (q === "" && statusFilter === "all" && (ponFilter === "all" || n.ponPort === ponFilter));
      }
      return matchingOntIds.has(n.id);
    });

    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleLinks = links.filter((l) => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      return visibleNodeIds.has(s) && visibleNodeIds.has(t);
    });

    return { visibleNodes, visibleLinks };
  }, [nodes, links, searchQuery, ponFilter, statusFilter]);

  // Compute Positions for Hierarchical Layout
  const layoutedNodes = useMemo(() => {
    const { visibleNodes } = filteredData;
    const { width, height } = dimensions;

    const nocNodes = visibleNodes.filter((n) => n.type === "noc");
    const oltNodes = visibleNodes.filter((n) => n.type === "olt");
    const odpNodes = visibleNodes.filter((n) => n.type === "odp");
    const ontNodes = visibleNodes.filter((n) => n.type === "ont");

    // Levels along Y-axis:
    // Level 0: NOC Gateway (Top)
    // Level 1: OLT (Upper middle)
    // Level 2: ODP Splitters (Middle)
    // Level 3: Customer ONTs (Bottom arc / grid)

    const yNoc = 50;
    const yOlt = 130;
    const yOdp = 240;
    const yOnt = Math.min(height - 70, 420);

    const result = visibleNodes.map((node) => {
      const clone = { ...node };

      if (clone.type === "noc") {
        clone.targetX = width / 2;
        clone.targetY = yNoc;
      } else if (clone.type === "olt") {
        clone.targetX = width / 2;
        clone.targetY = yOlt;
      } else if (clone.type === "odp") {
        const idx = odpNodes.findIndex((o) => o.id === clone.id);
        const count = odpNodes.length;
        const spacing = width / (count + 1);
        clone.targetX = spacing * (idx + 1);
        clone.targetY = yOdp;
      } else if (clone.type === "ont") {
        const idx = ontNodes.findIndex((o) => o.id === clone.id);
        const count = ontNodes.length;
        if (count <= 8) {
          const spacing = width / (count + 1);
          clone.targetX = spacing * (idx + 1);
          clone.targetY = yOnt;
        } else {
          // Wrap into 2 rows for aesthetic spacing
          const cols = Math.ceil(count / 2);
          const row = idx % 2;
          const col = Math.floor(idx / 2);
          const spacing = width / (cols + 1);
          clone.targetX = spacing * (col + 1) + (row % 2 === 1 ? 16 : -16);
          clone.targetY = yOnt + (row === 1 ? 75 : 0);
        }
      }

      if (layoutMode === "hierarchical") {
        clone.x = clone.targetX;
        clone.y = clone.targetY;
      }

      return clone;
    });

    return result;
  }, [filteredData, dimensions, layoutMode]);

  // Main D3 Rendering & Force/Zoom Setup
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const { width, height } = dimensions;

    // Define SVG Filters & Gradients (Glows, Arrows, Line Patterns)
    const defs = svg.append("defs");

    // Glow filter for optical links
    const filter = defs.append("filter").attr("id", "glow").attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
    filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Soft drop shadow filter for nodes
    const dropShadow = defs.append("filter").attr("id", "shadow").attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
    dropShadow.append("feDropShadow").attr("dx", "0").attr("dy", "3").attr("stdDeviation", "3").attr("flood-opacity", "0.2");

    // Zoom container
    const g = svg.append("g").attr("class", "topology-root");
    gRef.current = g.node();

    // Setup d3.zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial subtle grid background
    const gridPattern = defs
      .append("pattern")
      .attr("id", "topo-grid")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");

    gridPattern
      .append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("class", "text-slate-200/60 dark:text-slate-800/40")
      .attr("stroke-width", "0.5");

    g.append("rect")
      .attr("x", -2000)
      .attr("y", -2000)
      .attr("width", 6000)
      .attr("height", 6000)
      .attr("fill", "url(#topo-grid)");

    // Prepare links and nodes references
    const nodeMap = new Map<string, TopologyNode>();
    layoutedNodes.forEach((n) => nodeMap.set(n.id, n));

    const activeLinks = filteredData.visibleLinks
      .map((l) => {
        const sId = typeof l.source === "object" ? l.source.id : l.source;
        const tId = typeof l.target === "object" ? l.target.id : l.target;
        return {
          ...l,
          sourceNode: nodeMap.get(sId),
          targetNode: nodeMap.get(tId),
        };
      })
      .filter((l) => l.sourceNode && l.targetNode);

    // Group for Links
    const linksGroup = g.append("g").attr("class", "links-layer");

    // Group for Nodes
    const nodesGroup = g.append("g").attr("class", "nodes-layer");

    // DRAW LINKS
    const linkPaths = linksGroup
      .selectAll<SVGPathElement, typeof activeLinks[0]>("path.link-fiber")
      .data(activeLinks, (d) => d.id)
      .enter()
      .append("path")
      .attr("class", "link-fiber")
      .attr("stroke", (d) => {
        if (d.status === "isolated") return "#ef4444";
        if (d.type === "core") return "#6366f1";
        if (d.type === "feeder") return "#3b82f6";
        return "#10b981";
      })
      .attr("stroke-width", (d) => {
        if (d.type === "core") return 3.5;
        if (d.type === "feeder") return 2.5;
        return 1.8;
      })
      .attr("stroke-dasharray", (d) => (d.status === "isolated" ? "4,4" : "none"))
      .attr("stroke-opacity", (d) => (d.status === "isolated" ? 0.45 : 0.8))
      .attr("fill", "none")
      .attr("filter", "url(#glow)");

    // Add animated pulses on active links to simulate optical fiber light transmission
    const pulsePaths = linksGroup
      .selectAll<SVGPathElement, typeof activeLinks[0]>("path.link-pulse")
      .data(activeLinks.filter((d) => d.status !== "isolated"), (d) => `pulse-${d.id}`)
      .enter()
      .append("path")
      .attr("class", "link-pulse")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6, 28")
      .attr("fill", "none")
      .style("animation", "dash 2.5s linear infinite");

    // Helper to calculate smooth curved SVG path
    const calculatePath = (d: typeof activeLinks[0]) => {
      const sx = d.sourceNode?.x ?? 0;
      const sy = d.sourceNode?.y ?? 0;
      const tx = d.targetNode?.x ?? 0;
      const ty = d.targetNode?.y ?? 0;

      if (layoutMode === "hierarchical") {
        const midY = (sy + ty) / 2;
        return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
      } else {
        return `M ${sx} ${sy} L ${tx} ${ty}`;
      }
    };

    // DRAW NODES
    const nodeGroups = nodesGroup
      .selectAll<SVGGElement, TopologyNode>("g.node-item")
      .data(layoutedNodes, (d) => d.id)
      .enter()
      .append("g")
      .attr("class", "node-item cursor-pointer")
      .attr("transform", (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`)
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // Node outer shapes & backgrounds
    nodeGroups.each(function (d) {
      const el = d3.select(this);

      if (d.type === "noc") {
        // NOC Hexagon / Rect Badge
        el.append("rect")
          .attr("x", -70)
          .attr("y", -22)
          .attr("width", 140)
          .attr("height", 44)
          .attr("rx", 12)
          .attr("fill", "#1e1b4b")
          .attr("stroke", "#6366f1")
          .attr("stroke-width", 2)
          .attr("filter", "url(#shadow)");

        el.append("circle").attr("cx", -48).attr("cy", 0).attr("r", 10).attr("fill", "#6366f1");

        el.append("text")
          .attr("x", -32)
          .attr("y", -3)
          .attr("fill", "#ffffff")
          .attr("font-size", "11px")
          .attr("font-weight", "800")
          .text("NOC GATEWAY");

        el.append("text")
          .attr("x", -32)
          .attr("y", 11)
          .attr("fill", "#a5b4fc")
          .attr("font-size", "9px")
          .attr("font-family", "monospace")
          .text("MikroTik CCR2004");
      } else if (d.type === "olt") {
        // Central OLT Box
        el.append("rect")
          .attr("x", -85)
          .attr("y", -24)
          .attr("width", 170)
          .attr("height", 48)
          .attr("rx", 14)
          .attr("fill", "#0f172a")
          .attr("stroke", "#38bdf8")
          .attr("stroke-width", 2.2)
          .attr("filter", "url(#shadow)");

        // SFP port status light
        el.append("circle").attr("cx", -62).attr("cy", 0).attr("r", 7).attr("fill", "#10b981").attr("class", "animate-pulse");

        el.append("text")
          .attr("x", -46)
          .attr("y", -3)
          .attr("fill", "#ffffff")
          .attr("font-size", "11.5px")
          .attr("font-weight", "800")
          .text("GPON OLT PUSAT");

        el.append("text")
          .attr("x", -46)
          .attr("y", 11)
          .attr("fill", "#38bdf8")
          .attr("font-size", "9.5px")
          .attr("font-family", "monospace")
          .text("ZTE C320 • 4-PON SFP");
      } else if (d.type === "odp") {
        // ODP Distribution Box
        el.append("rect")
          .attr("x", -44)
          .attr("y", -18)
          .attr("width", 88)
          .attr("height", 36)
          .attr("rx", 10)
          .attr("fill", "#0f172a")
          .attr("stroke", "#a855f7")
          .attr("stroke-width", 1.8)
          .attr("filter", "url(#shadow)");

        el.append("circle").attr("cx", -28).attr("cy", 0).attr("r", 5).attr("fill", "#a855f7");

        el.append("text")
          .attr("x", -18)
          .attr("y", -1)
          .attr("fill", "#ffffff")
          .attr("font-size", "9.5px")
          .attr("font-weight", "700")
          .text(d.code || "ODP");

        el.append("text")
          .attr("x", -18)
          .attr("y", 11)
          .attr("fill", "#c084fc")
          .attr("font-size", "8px")
          .attr("font-family", "monospace")
          .text(d.ponPort || "PON-1");
      } else {
        // Customer ONT (Device at home)
        const isIso = d.status === "isolated";
        const strokeColor = isIso ? "#ef4444" : "#10b981";
        const bgColor = isIso ? "#450a0a" : "#064e3b";

        el.append("rect")
          .attr("x", -46)
          .attr("y", -22)
          .attr("width", 92)
          .attr("height", 44)
          .attr("rx", 10)
          .attr("fill", bgColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", 1.8)
          .attr("filter", "url(#shadow)");

        // Status indicator dot
        el.append("circle")
          .attr("cx", -32)
          .attr("cy", -8)
          .attr("r", 4.5)
          .attr("fill", isIso ? "#ef4444" : "#34d399");

        // Customer Code
        el.append("text")
          .attr("x", -22)
          .attr("y", -5)
          .attr("fill", "#ffffff")
          .attr("font-size", "9px")
          .attr("font-weight", "800")
          .attr("font-family", "monospace")
          .text(d.code || "ONT");

        // Customer Name (clipped)
        const shortName = d.name.length > 12 ? d.name.slice(0, 11) + "…" : d.name;
        el.append("text")
          .attr("x", 0)
          .attr("y", 8)
          .attr("text-anchor", "middle")
          .attr("fill", isIso ? "#fca5a5" : "#a7f3d0")
          .attr("font-size", "8.5px")
          .attr("font-weight", "600")
          .text(shortName);

        // RX Power / Redaman badge below
        el.append("text")
          .attr("x", 0)
          .attr("y", 18)
          .attr("text-anchor", "middle")
          .attr("fill", "#94a3b8")
          .attr("font-size", "7.5px")
          .attr("font-family", "monospace")
          .text(isIso ? "ISOLIR" : `${d.rxPower} dBm`);
      }
    });

    // Update link path coordinates
    const updatePositions = () => {
      linkPaths.attr("d", calculatePath);
      pulsePaths.attr("d", calculatePath);
      nodeGroups.attr("transform", (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    };

    // If Force Simulation Mode is enabled
    if (layoutMode === "force") {
      const simulation = d3
        .forceSimulation<TopologyNode>(layoutedNodes)
        .force(
          "link",
          d3
            .forceLink<TopologyNode, TopologyLink>(filteredData.visibleLinks)
            .id((d) => d.id)
            .distance((d) => (d.type === "core" ? 90 : d.type === "feeder" ? 120 : 80))
            .strength(0.7)
        )
        .force("charge", d3.forceManyBody().strength(-350))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(45))
        .on("tick", updatePositions);

      // Drag behavior for force simulation
      const drag = d3
        .drag<SVGGElement, TopologyNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      nodeGroups.call(drag);

      return () => {
        simulation.stop();
      };
    } else {
      // Hierarchical mode static layout
      updatePositions();
    }
  }, [layoutedNodes, dimensions, layoutMode, filteredData]);

  // Zoom control handlers
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.75);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  // Ping Diagnostic Simulation for Selected ONT
  const runPingDiagnostic = (ip?: string) => {
    if (!ip) return;
    setIsSimulatingPing(true);
    setPingResult(null);
    setTimeout(() => {
      setIsSimulatingPing(false);
      setPingResult({
        ms: Math.floor(6 + Math.random() * 8),
        packetLoss: selectedNode?.status === "isolated" ? 100 : 0,
      });
    }, 1200);
  };

  // Statistics calculation for network summary
  const stats = useMemo(() => {
    const totalOnts = customers.length;
    const activeOnts = customers.filter((c) => c.status === "active").length;
    const isolatedOnts = customers.filter((c) => c.status === "isolated").length;
    return { totalOnts, activeOnts, isolatedOnts, totalOdps: odpList.length };
  }, [customers, odpList]);

  return (
    <div
      id="network-topology-mapping-card"
      className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : "relative w-full"
      }`}
    >
      {/* Top Header & Interactive Action Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-2">
              Pemetaan Visual Jaringan & Topologi OLT
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-extrabold border border-emerald-200 dark:border-emerald-800">
                FTTH GPON Live
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi interaktif posisi fisik OLT pusat, kotak pembagi ODP, dan perangkat modem ONT pelanggan.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PON Filter */}
          <select
            id="topology-pon-filter"
            value={ponFilter}
            onChange={(e) => setPonFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua SFP PON</option>
            <option value="PON-1">PON-1 (Melati & Mawar)</option>
            <option value="PON-2">PON-2 (Kenanga & Graha)</option>
            <option value="PON-3">PON-3 (Pasar & Lapangan)</option>
          </select>

          {/* Status Filter */}
          <select
            id="topology-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">ONT Aktif (Hijau)</option>
            <option value="isolated">ONT Terisolir (Merah)</option>
            <option value="warning">Redaman Tinggi (Kuning)</option>
          </select>

          {/* Layout Mode Switcher */}
          <div className="flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs">
            <button
              type="button"
              id="layout-hierarchical-btn"
              onClick={() => setLayoutMode("hierarchical")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                layoutMode === "hierarchical"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
              title="Tampilan Skematik Hierarki FTTH"
            >
              Hierarki
            </button>
            <button
              type="button"
              id="layout-force-btn"
              onClick={() => setLayoutMode("force")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                layoutMode === "force"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
              title="Tampilan Grafika Fisik Gaya Bebas (Drag & Drop)"
            >
              Fisik / Gaya
            </button>
          </div>

          {/* Zoom Tools */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Perbesar Peta (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Perkecil Peta (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Reset Tampilan (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
            title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Network Metrics Strip */}
      <div className="px-5 py-2.5 bg-slate-900 text-slate-300 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>NOC Gateway: <strong>1 Unit</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>OLT GPON: <strong>4 SFP Aktif</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Kotak ODP: <strong>{stats.totalOdps} Titik</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>ONT Pelanggan: <strong>{stats.totalOnts} Unit</strong> ({stats.activeOnts} Aktif, {stats.isolatedOnts} Isolir)</span>
          </span>
        </div>

        {/* Search within topology */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pelanggan, IP, atau ODP..."
            className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Interactive Canvas Stage Area */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-slate-950 overflow-hidden select-none min-h-[460px]"
        onClick={() => setSelectedNode(null)}
      >
        <svg
          ref={svgRef}
          id="d3-network-topology-canvas"
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ minHeight: dimensions.height }}
        />

        {/* Floating Interactive Legend */}
        <div className="absolute bottom-3 left-3 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 shadow-xl pointer-events-none space-y-1.5">
          <div className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider mb-1">
            Legenda Simbol Jaringan
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-indigo-950 border border-indigo-500"></span>
            <span>NOC Router Core</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-slate-900 border border-sky-400"></span>
            <span>OLT GPON (Pusat Fiber)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-slate-900 border border-purple-500"></span>
            <span>ODP Splitter Distribusi</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-emerald-950 border border-emerald-500"></span>
            <span>Modem ONT Pelanggan (Aktif)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-rose-950 border border-rose-500"></span>
            <span>ONT Pelanggan Terisolir</span>
          </div>
        </div>

        {/* Selected Node Inspector Drawer / Card */}
        {selectedNode && (
          <div
            id="topology-node-inspector-drawer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-4 w-80 max-w-[calc(100%-2rem)] rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 text-slate-200 shadow-2xl p-4.5 space-y-3 z-30 animate-in fade-in slide-in-from-right-4 duration-200"
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold uppercase text-[9px] tracking-wider border border-indigo-500/30 inline-block mb-1">
                  {selectedNode.type.toUpperCase()} INSPECTOR
                </span>
                <h4 className="font-extrabold text-sm text-white leading-tight">
                  {selectedNode.name}
                </h4>
                {selectedNode.code && (
                  <span className="font-mono text-xs text-slate-400 font-bold">
                    {selectedNode.code}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content for Customer ONT */}
            {selectedNode.type === "ont" && selectedNode.customer && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Status Sambungan
                    </span>
                    <span
                      className={`font-bold inline-flex items-center gap-1 ${
                        selectedNode.status === "isolated" ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {selectedNode.status === "isolated" ? (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          Terisolir (Isolate)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Online Normal
                        </>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Redaman RX Optik
                    </span>
                    <span
                      className={`font-mono font-black ${
                        (selectedNode.rxPower || 0) < -24 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {selectedNode.rxPower} dBm
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Paket Kecepatan
                    </span>
                    <span className="font-bold text-white">
                      {selectedNode.packageInfo?.name || "25 Mbps"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Perangkat ONT
                    </span>
                    <span className="font-mono text-slate-300 truncate block">
                      {selectedNode.ontModel}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">IP PPPoE:</span>
                    <span className="font-mono text-white">{selectedNode.ip || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Alamat MAC:</span>
                    <span className="font-mono text-slate-300">{selectedNode.mac || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Port OLT / ODP:</span>
                    <span className="font-semibold text-sky-400">
                      {selectedNode.ponPort} • {selectedNode.odpName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lokasi:</span>
                    <span className="text-right text-slate-300 truncate max-w-[170px]">
                      {selectedNode.details}
                    </span>
                  </div>
                </div>

                {/* Ping Diagnostic Simulation */}
                <div className="pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-indigo-400" />
                      Uji Sambungan ICMP Ping
                    </span>
                    {pingResult && (
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">
                        {pingResult.ms} ms (Loss {pingResult.packetLoss}%)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => runPingDiagnostic(selectedNode.ip)}
                    disabled={isSimulatingPing}
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSimulatingPing ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3 text-amber-400" />
                    )}
                    {isSimulatingPing ? "Menguji Latensi ONT..." : "Ping Perangkat ONT"}
                  </button>
                </div>

                {/* Isolation Toggle Button */}
                {onToggleIsolation && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedNode.customer) {
                        onToggleIsolation(selectedNode.customer.id);
                        setSelectedNode(null);
                      }
                    }}
                    className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                      selectedNode.status === "isolated"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-rose-600 hover:bg-rose-700 text-white"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {selectedNode.status === "isolated" ? "Buka Isolir Layanan" : "Isolir Layanan Pelanggan"}
                  </button>
                )}
              </div>
            )}

            {/* Content for OLT Central Node */}
            {selectedNode.type === "olt" && (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model Chassis:</span>
                    <span className="font-bold text-white">ZTE ZXA10 C320</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total SFP PON:</span>
                    <span className="font-mono text-emerald-400 font-bold">4 Port Aktif</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Laser TX Power:</span>
                    <span className="font-mono text-white">+2.8 dBm (Class C+)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Throughput Realtime:</span>
                    <span className="font-mono text-indigo-400 font-bold">
                      DL 540 Mbps • UL 210 Mbps
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  Tersambung langsung ke Core Gateway MikroTik melalui Uplink 10G SFP+.
                </p>
              </div>
            )}

            {/* Content for ODP Distribution Node */}
            {selectedNode.type === "odp" && (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipe Box:</span>
                    <span className="font-bold text-white">ODP Pole Outdoor IP65</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rasio Splitter:</span>
                    <span className="font-mono text-purple-400 font-bold">1:8 PLC Splitter</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Feeder Inbound:</span>
                    <span className="font-mono text-white">{selectedNode.ponPort}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rata-rata Redaman:</span>
                    <span className="font-mono text-emerald-400 font-bold">-19.8 dBm</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">{selectedNode.details}</p>
              </div>
            )}

            {/* Content for NOC Gateway Node */}
            {selectedNode.type === "noc" && (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Router Core:</span>
                    <span className="font-bold text-white">CCR2004-1G-12S+2XS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IP Publik Gateway:</span>
                    <span className="font-mono text-white">{selectedNode.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kapasitas Pipa:</span>
                    <span className="font-mono text-indigo-400 font-bold">1.0 Gbps Dedicated</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info & Guidance */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>
            Klik pada node mana saja untuk melihat redaman optik (dBm), profil ONT, atau menjalankan uji Ping latensi.
          </span>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-[11px]">
          <span>Zoom: Scroll / Pinch</span>
          <span>Pan: Drag Canvas</span>
        </div>
      </div>
    </div>
  );
};
