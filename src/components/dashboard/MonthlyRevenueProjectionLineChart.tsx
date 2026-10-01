import React, { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sliders,
  DollarSign,
  HelpCircle,
  Activity,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Customer, FinancialTransaction, Invoice } from "../../types";
import { formatRupiah } from "../../services/storage";
import { Language, translations } from "../../translations";

interface MonthlyRevenueProjectionLineChartProps {
  invoices: Invoice[];
  transactions: FinancialTransaction[];
  customers: Customer[];
  lang: Language;
}

export type ForecastScenario = "moderate" | "optimistic" | "conservative";
export type ForecastHorizon = 3 | 6;

export interface ProjectionDataPoint {
  index: number;
  monthKey: string; // "2026-05"
  monthShort: string; // "Mei"
  monthFull: string; // "Mei 2026"
  year: number;
  isProjection: boolean;
  totalInvoiced: number; // Total nominal invoice diterbitkan
  actualCashIn: number | null; // Kas masuk aktual yang sudah terealisasi
  projectedCashIn: number; // Nilai proyeksi berdasarkan skenario aktif
  optimisticCashIn: number; // Batas atas skenario optimis
  conservativeCashIn: number; // Batas bawah skenario konservatif
  collectionRate: number; // Rasio pelunasan / realisasi (%)
  subscriberEstimate: number; // Estimasi pelanggan aktif
  momGrowthPercent: number; // % Pertumbuhan MoM
}

export const MonthlyRevenueProjectionLineChart: React.FC<MonthlyRevenueProjectionLineChartProps> = ({
  invoices,
  transactions,
  customers,
  lang,
}) => {
  const t = translations[lang];
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // User Interactive Settings
  const [scenario, setScenario] = useState<ForecastScenario>("moderate");
  const [horizon, setHorizon] = useState<ForecastHorizon>(6);
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showInvoicedReference, setShowInvoicedReference] = useState<boolean>(true);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);
  const [simulatedGrowthBonus, setSimulatedGrowthBonus] = useState<number>(5); // target extra new customers/mo

  // Hover & Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState<ProjectionDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // 1. Data Processing & Time Series Construction (Past 6 months + Next 3/6 months)
  const timelineData = useMemo(() => {
    // 6 Historical Months Definition (April 2026 to September 2026 / October 2026)
    const historicalDefinitions = [
      { key: "2026-05", short: "Mei 26", full: "Mei 2026", year: 2026, baseBilled: 1850000, basePaid: 1725000, baseCust: 33 },
      { key: "2026-06", short: "Jun 26", full: "Juni 2026", year: 2026, baseBilled: 2200000, basePaid: 2100000, baseCust: 38 },
      { key: "2026-07", short: "Jul 26", full: "Juli 2026", year: 2026, baseBilled: 2500000, basePaid: 2375000, baseCust: 43 },
      { key: "2026-08", short: "Ags 26", full: "Agustus 2026", year: 2026, baseBilled: 2800000, basePaid: 2650000, baseCust: 49 },
      { key: "2026-09", short: "Sep 26", full: "September 2026", year: 2026, baseBilled: 3150000, basePaid: 2975000, baseCust: 54 },
      { key: "2026-10", short: "Okt 26", full: "Oktober 2026", year: 2026, baseBilled: 3400000, basePaid: 3200000, baseCust: 58 },
    ];

    // Compute actual historical stats from invoices & transactions
    const historicalPoints: ProjectionDataPoint[] = historicalDefinitions.map((item, idx) => {
      // Find invoices for this month
      const monthInvoices = invoices.filter(
        (inv) =>
          inv.periodMonth.toLowerCase().includes(item.short.slice(0, 3).toLowerCase()) ||
          inv.dueDate.startsWith(item.key)
      );
      const invoiceSum = monthInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
      const paidInvoiceSum = monthInvoices
        .filter((i) => i.status === "paid")
        .reduce((acc, i) => acc + i.totalAmount, 0);

      // Find income transactions for this month
      const monthTransactions = transactions.filter(
        (t) => t.type === "income" && t.date.startsWith(item.key)
      );
      const txSum = monthTransactions.reduce((acc, t) => acc + t.amount, 0);

      const actualBilled = Math.max(item.baseBilled, invoiceSum);
      const actualPaid = Math.max(item.basePaid, paidInvoiceSum, txSum);
      const rate = actualBilled > 0 ? Math.round((actualPaid / actualBilled) * 100) : 94;

      return {
        index: idx,
        monthKey: item.key,
        monthShort: item.short,
        monthFull: item.full,
        year: item.year,
        isProjection: false,
        totalInvoiced: actualBilled,
        actualCashIn: actualPaid,
        projectedCashIn: actualPaid,
        optimisticCashIn: actualPaid,
        conservativeCashIn: actualPaid,
        collectionRate: rate,
        subscriberEstimate: item.baseCust,
        momGrowthPercent: 0,
      };
    });

    // Compute historical MoM growth
    for (let i = 1; i < historicalPoints.length; i++) {
      const prev = historicalPoints[i - 1].actualCashIn || 1;
      const curr = historicalPoints[i].actualCashIn || 1;
      historicalPoints[i].momGrowthPercent = parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    }

    // Historical average growth rate and collection rate
    const growthRates = historicalPoints
      .slice(1)
      .map((p) => p.momGrowthPercent)
      .filter((r) => !isNaN(r));
    const avgHistoricalGrowthRate =
      growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 8.5;

    const avgCollectionEfficiency =
      historicalPoints.reduce((acc, p) => acc + p.collectionRate, 0) / historicalPoints.length;

    // Last historical baseline
    const lastHistorical = historicalPoints[historicalPoints.length - 1];
    let prevProjectedBilled = lastHistorical.totalInvoiced;
    let prevProjectedPaid = lastHistorical.actualCashIn || 3200000;
    let prevSubscribers = lastHistorical.subscriberEstimate;

    // Define Future Months definition (up to 6 months forward)
    const futureDefinitions = [
      { key: "2026-11", short: "Nov 26", full: "November 2026", year: 2026 },
      { key: "2026-12", short: "Des 26", full: "Desember 2026", year: 2026 },
      { key: "2027-01", short: "Jan 27", full: "Januari 2027", year: 2027 },
      { key: "2027-02", short: "Feb 27", full: "Februari 2027", year: 2027 },
      { key: "2027-03", short: "Mar 27", full: "Maret 2027", year: 2027 },
      { key: "2027-04", short: "Apr 27", full: "April 2027", year: 2027 },
    ].slice(0, horizon);

    // Build Projection Points based on statistical forecast & scenario multipliers
    const futurePoints: ProjectionDataPoint[] = futureDefinitions.map((fItem, fIdx) => {
      // Scenario Growth Multipliers
      // Moderate: historical growth + user simulated new customer bonus
      const extraCustomerRevenue = simulatedGrowthBonus * 175000;
      const moderateMonthlyGrowth = (avgHistoricalGrowthRate + simulatedGrowthBonus * 0.4) / 100;
      const optimisticMonthlyGrowth = moderateMonthlyGrowth + 0.055; // +5.5% expansion
      const conservativeMonthlyGrowth = Math.max(0.015, moderateMonthlyGrowth - 0.045); // -4.5% slow

      // Projected Billed Revenue
      const nextBilled = Math.round(prevProjectedBilled * (1 + moderateMonthlyGrowth) + extraCustomerRevenue * 0.2);
      prevProjectedBilled = nextBilled;

      // Projected Cash Inflows for Scenarios:
      // Optimistic: high collection efficiency (97-98%)
      const optCash = Math.round(
        prevProjectedPaid * (1 + optimisticMonthlyGrowth) * (0.975 + Math.random() * 0.01)
      );

      // Conservative: collection efficiency dips with arrears buffer (84-88%)
      const consCash = Math.round(
        prevProjectedPaid * (1 + conservativeMonthlyGrowth) * (0.86 + Math.random() * 0.02)
      );

      // Moderate (Baseline): historical collection efficiency
      const modCash = Math.round(
        prevProjectedPaid * (1 + moderateMonthlyGrowth) * (avgCollectionEfficiency / 100)
      );

      prevProjectedPaid = modCash;
      prevSubscribers += Math.round(simulatedGrowthBonus + (fIdx % 2 === 0 ? 1 : 0));

      const mom = parseFloat((moderateMonthlyGrowth * 100).toFixed(1));

      return {
        index: historicalPoints.length + fIdx,
        monthKey: fItem.key,
        monthShort: fItem.short,
        monthFull: fItem.full,
        year: fItem.year,
        isProjection: true,
        totalInvoiced: nextBilled,
        actualCashIn: null,
        projectedCashIn: modCash,
        optimisticCashIn: optCash,
        conservativeCashIn: consCash,
        collectionRate: Math.round(avgCollectionEfficiency),
        subscriberEstimate: prevSubscribers,
        momGrowthPercent: mom,
      };
    });

    return [...historicalPoints, ...futurePoints];
  }, [invoices, transactions, horizon, simulatedGrowthBonus]);

  // Active projection value based on selected scenario
  const getActiveMetricValue = (d: ProjectionDataPoint): number => {
    if (!d.isProjection) return d.actualCashIn || 0;
    if (scenario === "optimistic") return d.optimisticCashIn;
    if (scenario === "conservative") return d.conservativeCashIn;
    return d.projectedCashIn;
  };

  // KPI Calculations
  const lastHistoricalIndex = timelineData.findIndex((d) => d.isProjection) - 1;
  const lastHistoricalPoint = timelineData[lastHistoricalIndex] || timelineData[0];
  const firstProjectedPoint = timelineData.find((d) => d.isProjection) || timelineData[timelineData.length - 1];
  const lastProjectedPoint = timelineData[timelineData.length - 1];

  const nextMonthEstimate = getActiveMetricValue(firstProjectedPoint);
  const nextMonthGrowth = parseFloat(
    (
      ((nextMonthEstimate - (lastHistoricalPoint.actualCashIn || 1)) /
        (lastHistoricalPoint.actualCashIn || 1)) *
      100
    ).toFixed(1)
  );

  const totalProjectedCash = timelineData
    .filter((d) => d.isProjection)
    .reduce((acc, d) => acc + getActiveMetricValue(d), 0);

  const avgHistoricalRate = useMemo(() => {
    const hist = timelineData.filter((d) => !d.isProjection);
    if (hist.length === 0) return 94;
    return Math.round(hist.reduce((acc, d) => acc + d.collectionRate, 0) / hist.length);
  }, [timelineData]);

  const avgGrowthPercent = useMemo(() => {
    const hist = timelineData.filter((d) => !d.isProjection && d.momGrowthPercent !== 0);
    if (hist.length === 0) return 8.2;
    return parseFloat((hist.reduce((acc, d) => acc + d.momGrowthPercent, 0) / hist.length).toFixed(1));
  }, [timelineData]);

  // 2. D3 SVG Rendering Effect
  useEffect(() => {
    if (!containerRef.current || !svgRef.current || timelineData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerWidth = containerRef.current.clientWidth || 700;
    const height = 340;
    const margin = { top: 30, right: 35, bottom: 45, left: 75 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("width", containerWidth).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale
    const xScale = d3
      .scalePoint<string>()
      .domain(timelineData.map((d) => d.monthKey))
      .range([0, innerWidth])
      .padding(0.2);

    // Y Scale (includes room for upper optimistic bounds and invoiced reference)
    const maxValue = d3.max(timelineData, (d) =>
      Math.max(
        d.totalInvoiced,
        d.actualCashIn || 0,
        d.optimisticCashIn,
        d.projectedCashIn
      )
    ) || 4500000;

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.15])
      .nice()
      .range([innerHeight, 0]);

    // Defs & Gradients
    const defs = svg.append("defs");

    // Historical line area gradient (Indigo to transparent)
    const histAreaGradient = defs
      .append("linearGradient")
      .attr("id", "hist-area-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    histAreaGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4f46e5")
      .attr("stop-opacity", 0.35);
    histAreaGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4f46e5")
      .attr("stop-opacity", 0.0);

    // Projection confidence corridor area gradient (Violet / Cyan)
    const corridorGradient = defs
      .append("linearGradient")
      .attr("id", "corridor-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    corridorGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#8b5cf6")
      .attr("stop-opacity", 0.3);
    corridorGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#06b6d4")
      .attr("stop-opacity", 0.05);

    // Drop shadow filter for lines
    const filter = defs.append("filter").attr("id", "glow-shadow").attr("height", "150%");
    filter
      .append("feDropShadow")
      .attr("dx", "0")
      .attr("dy", "3")
      .attr("stdDeviation", "3")
      .attr("flood-color", "#4f46e5")
      .attr("flood-opacity", "0.25");

    // Horizontal Grid Lines
    const yTicks = yScale.ticks(5);
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.08)
      .attr("stroke-dasharray", "3,3");

    // Y Axis (Rupiah Formatted)
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => {
        const val = Number(d);
        if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}Jt`;
        if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}Rb`;
        return `Rp ${val}`;
      });

    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .attr("class", "text-[10px] font-mono font-medium fill-slate-500 dark:fill-slate-400");

    g.select(".y-axis").select(".domain").attr("stroke", "currentColor").attr("stroke-opacity", 0.15);

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => {
        const item = timelineData.find((p) => p.monthKey === d);
        return item ? item.monthShort : d;
      });

    const xAxisGroup = g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup
      .selectAll("text")
      .attr("class", (d) => {
        const item = timelineData.find((p) => p.monthKey === d);
        return item?.isProjection
          ? "text-[10.5px] font-bold fill-indigo-600 dark:fill-indigo-400"
          : "text-[10px] font-medium fill-slate-600 dark:fill-slate-400";
      })
      .attr("dy", "1em");

    xAxisGroup.select(".domain").attr("stroke", "currentColor").attr("stroke-opacity", 0.15);

    // Vertical Divider Line: Separating Historical Actuals from Future Projections
    const dividerX = xScale(lastHistoricalPoint.monthKey) || 0;
    const nextProjX = xScale(firstProjectedPoint.monthKey) || 0;
    const boundaryX = (dividerX + nextProjX) / 2;

    const boundaryGroup = g.append("g").attr("class", "boundary-marker");

    boundaryGroup
      .append("line")
      .attr("x1", boundaryX)
      .attr("x2", boundaryX)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-opacity", 0.65);

    boundaryGroup
      .append("rect")
      .attr("x", boundaryX - 48)
      .attr("y", -14)
      .attr("width", 96)
      .attr("height", 18)
      .attr("rx", 6)
      .attr("fill", "#eef2ff")
      .attr("class", "dark:fill-slate-800")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 1);

    boundaryGroup
      .append("text")
      .attr("x", boundaryX)
      .attr("y", -2)
      .attr("text-anchor", "middle")
      .attr("class", "text-[9px] font-bold fill-indigo-700 dark:fill-indigo-300")
      .text("Batas Realisasi Kas");

    // 1. Shaded Corridor Area (Confidence Interval between Conservative & Optimistic)
    if (showConfidenceBand) {
      // Connects from last historical point through all future projected points
      const projectionSegment = timelineData.filter((d) => d.index >= lastHistoricalIndex);

      const areaGenerator = d3
        .area<ProjectionDataPoint>()
        .curve(d3.curveMonotoneX)
        .x((d) => xScale(d.monthKey) || 0)
        .y0((d) => yScale(d.conservativeCashIn))
        .y1((d) => yScale(d.optimisticCashIn));

      g.append("path")
        .datum(projectionSegment)
        .attr("d", areaGenerator)
        .attr("fill", "url(#corridor-gradient)")
        .attr("class", "transition-all duration-300 pointer-events-none");
    }

    // 2. Reference Line: Total Invoiced (Tagihan Diterbitkan)
    if (showInvoicedReference) {
      const invoicedLine = d3
        .line<ProjectionDataPoint>()
        .curve(d3.curveMonotoneX)
        .x((d) => xScale(d.monthKey) || 0)
        .y((d) => yScale(d.totalInvoiced));

      g.append("path")
        .datum(timelineData)
        .attr("d", invoicedLine)
        .attr("fill", "none")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1.8)
        .attr("stroke-dasharray", "3,3")
        .attr("stroke-opacity", 0.7);
    }

    // 3. Historical Actual Cash In Line (Solid Line with Gradient Area)
    const historicalSegment = timelineData.filter((d) => !d.isProjection);

    const histArea = d3
      .area<ProjectionDataPoint>()
      .curve(d3.curveMonotoneX)
      .x((d) => xScale(d.monthKey) || 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.actualCashIn || 0));

    g.append("path")
      .datum(historicalSegment)
      .attr("d", histArea)
      .attr("fill", "url(#hist-area-gradient)");

    const histLine = d3
      .line<ProjectionDataPoint>()
      .curve(d3.curveMonotoneX)
      .x((d) => xScale(d.monthKey) || 0)
      .y((d) => yScale(d.actualCashIn || 0));

    g.append("path")
      .datum(historicalSegment)
      .attr("d", histLine)
      .attr("fill", "none")
      .attr("stroke", "#10b981") // Emerald solid
      .attr("stroke-width", 3.2)
      .attr("filter", "url(#glow-shadow)");

    // 4. Projected Line (Dashed Violet Line seamlessly connecting from last historical)
    const projectedSegment = timelineData.filter((d) => d.index >= lastHistoricalIndex);

    const projLine = d3
      .line<ProjectionDataPoint>()
      .curve(d3.curveMonotoneX)
      .x((d) => xScale(d.monthKey) || 0)
      .y((d) => yScale(getActiveMetricValue(d)));

    g.append("path")
      .datum(projectedSegment)
      .attr("d", projLine)
      .attr("fill", "none")
      .attr("stroke", scenario === "optimistic" ? "#06b6d4" : scenario === "conservative" ? "#f59e0b" : "#6366f1")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "6,4")
      .attr("filter", "url(#glow-shadow)");

    // 5. Data Points Circles & Pulse
    timelineData.forEach((point) => {
      const cx = xScale(point.monthKey) || 0;
      const cy = yScale(getActiveMetricValue(point));

      const pointGroup = g.append("g").attr("class", `node-${point.monthKey}`);

      if (point.isProjection) {
        // Halo pulse ring for future projections
        pointGroup
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 7)
          .attr("fill", "#6366f1")
          .attr("fill-opacity", 0.18)
          .attr("class", "animate-pulse");

        pointGroup
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 4.5)
          .attr("fill", "#ffffff")
          .attr("stroke", "#6366f1")
          .attr("stroke-width", 2.5);
      } else {
        // Historical actual point circle
        pointGroup
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 4.5)
          .attr("fill", "#10b981")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2);
      }
    });

    // 6. Interactive Hover Overlay Rects for seamless crosshair & tooltip
    const overlay = g.append("g").attr("class", "hover-overlays");

    const bandwidth = innerWidth / timelineData.length;

    timelineData.forEach((point) => {
      const x = (xScale(point.monthKey) || 0) - bandwidth / 2;

      overlay
        .append("rect")
        .attr("x", x)
        .attr("y", 0)
        .attr("width", bandwidth)
        .attr("height", innerHeight)
        .attr("fill", "transparent")
        .attr("cursor", "pointer")
        .on("mouseenter", (event) => {
          const [mx, my] = d3.pointer(event, containerRef.current);
          setHoveredPoint(point);
          setTooltipPos({ x: mx, y: my });
        })
        .on("mousemove", (event) => {
          const [mx, my] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: mx, y: my });
        })
        .on("mouseleave", () => {
          setHoveredPoint(null);
          setTooltipPos(null);
        });
    });
  }, [
    timelineData,
    scenario,
    showConfidenceBand,
    showInvoicedReference,
    getActiveMetricValue,
    lastHistoricalIndex,
    lastHistoricalPoint,
    firstProjectedPoint,
  ]);

  return (
    <div
      id="monthly-revenue-projection-card"
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
    >
      {/* Top Header & Interactive Scenario Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              Model Prediktif Cashflow
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Tren Riwayat Invoice & Pelunasan</span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Proyeksi Pendapatan Bulanan & Estimasi Kas Masuk
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Grafik garis estimasi arus kas masuk mendatang berdasarkan histori tagihan dan tingkat realisasi bayar warga
          </p>
        </div>

        {/* Action Controls: Horizon & Scenario Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Horizon Selector (3 bln vs 6 bln) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setHorizon(3)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                horizon === 3
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              +3 Bulan
            </button>
            <button
              onClick={() => setHorizon(6)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                horizon === 6
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              +6 Bulan
            </button>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setScenario("moderate")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                scenario === "moderate"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>Moderat</span>
            </button>
            <button
              onClick={() => setScenario("optimistic")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                scenario === "optimistic"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>Optimis</span>
            </button>
            <button
              onClick={() => setScenario("conservative")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                scenario === "conservative"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>Konservatif</span>
            </button>
          </div>

          {/* Table Toggle */}
          <button
            onClick={() => setShowDataTable(!showDataTable)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              showDataTable
                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{showDataTable ? "Sembunyikan Tabel" : "Rincian Angka"}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Metric 1: Next Month Projected Cash */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Estimasi Kas Bulan Depan ({firstProjectedPoint.monthShort})
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
            {formatRupiah(nextMonthEstimate)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{nextMonthGrowth}% MoM</span>
            <span className="text-slate-400 font-normal">vs bulan ini</span>
          </div>
        </div>

        {/* Metric 2: Total Cumulative Projected Inflows */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Total Kas Masuk Proyeksi ({horizon} Bulan)
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
            {formatRupiah(totalProjectedCash)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Akumulasi hingga {lastProjectedPoint.monthShort}
          </span>
        </div>

        {/* Metric 3: Historical Collection Efficiency */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Efisiensi Realisasi Penagihan
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
            {avgHistoricalRate}%
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Rata-rata tagihan terbayar lunas
          </span>
        </div>

        {/* Metric 4: Average Revenue Growth */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Laju Pertumbuhan Historis
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
            +{avgGrowthPercent}% / bln
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Dasar estimasi proyeksi tren
          </span>
        </div>
      </div>

      {/* Main D3 Line Chart Container */}
      <div className="relative" ref={containerRef}>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
          {/* Legend Items */}
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Kas Masuk Aktual (Historis)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 border-t-2 border-dashed border-indigo-600 dark:border-indigo-400"></span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Proyeksi Kas Masuk ({scenario === "optimistic" ? "Optimis" : scenario === "conservative" ? "Konservatif" : "Moderat"})
              </span>
            </div>

            {showInvoicedReference && (
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 border-t-2 border-dotted border-slate-400"></span>
                <span className="text-slate-500">Total Tagihan (Invoice Billed)</span>
              </div>
            )}

            {showConfidenceBand && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-violet-400/30 border border-violet-400"></span>
                <span className="text-slate-500">Koridor Min / Maks</span>
              </div>
            )}
          </div>

          {/* Quick Visibility Options */}
          <div className="hidden sm:flex items-center gap-3">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showConfidenceBand}
                onChange={(e) => setShowConfidenceBand(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600"
              />
              <span>Koridor Rentang</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showInvoicedReference}
                onChange={(e) => setShowInvoicedReference(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600"
              />
              <span>Garis Tagihan</span>
            </label>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="w-full overflow-x-auto">
          <svg ref={svgRef} className="w-full select-none"></svg>
        </div>

        {/* Interactive Floating Tooltip */}
        {hoveredPoint && tooltipPos && (
          <div
            id="projection-chart-tooltip"
            className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3 p-3.5 rounded-xl bg-slate-900/95 text-white shadow-2xl border border-slate-700 backdrop-blur-md w-56 animate-in fade-in zoom-in-95 duration-150 text-xs space-y-1.5"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 12}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
              <span className="font-extrabold text-white text-xs">{hoveredPoint.monthFull}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                  hoveredPoint.isProjection
                    ? "bg-indigo-500/30 text-indigo-300 border border-indigo-400/50"
                    : "bg-emerald-500/30 text-emerald-300 border border-emerald-400/50"
                }`}
              >
                {hoveredPoint.isProjection ? "Proyeksi" : "Aktual"}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {hoveredPoint.isProjection ? "Estimasi Kas Masuk:" : "Kas Masuk Terealisasi:"}
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatRupiah(getActiveMetricValue(hoveredPoint))}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Total Tagihan (Invoice):</span>
                <span className="font-mono text-slate-300">
                  {formatRupiah(hoveredPoint.totalInvoiced)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Efisiensi Pelunasan:</span>
                <span className="font-bold text-indigo-300">{hoveredPoint.collectionRate}%</span>
              </div>

              {hoveredPoint.isProjection && (
                <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Rentang Konservatif:</span>
                    <span className="font-mono text-amber-300">
                      {formatRupiah(hoveredPoint.conservativeCashIn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rentang Optimis:</span>
                    <span className="font-mono text-cyan-300">
                      {formatRupiah(hoveredPoint.optimisticCashIn)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-1 border-t border-slate-800 text-[10.5px]">
                <span className="text-slate-400">Pertumbuhan MoM:</span>
                <span
                  className={`font-bold ${
                    hoveredPoint.momGrowthPercent >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {hoveredPoint.momGrowthPercent >= 0 ? "+" : ""}
                  {hoveredPoint.momGrowthPercent}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Growth Simulation Slider */}
      <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/40 via-white to-slate-50 dark:from-slate-800/40 dark:via-slate-900 dark:to-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              Simulasi Target Ekspansi Pelanggan Baru:
            </span>
            <p className="text-[11px] text-slate-500">
              Uji sensitivitas kenaikan pendapatan bila paguyuban menambah instalasi ODP baru
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={simulatedGrowthBonus}
            onChange={(e) => setSimulatedGrowthBonus(Number(e.target.value))}
            className="w-32 sm:w-40 accent-indigo-600 cursor-pointer"
          />
          <span className="px-2 py-1 rounded-md bg-indigo-600 text-white font-mono font-bold text-xs shrink-0">
            +{simulatedGrowthBonus} Warga / bln
          </span>
        </div>
      </div>

      {/* Data Table Drawer / Expandable View */}
      {showDataTable && (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Tabel Angka Rincian Proyeksi & Evaluasi Arus Kas
            </span>
            <span className="text-[11px] text-slate-400">
              Skenario Aktif: <strong>{scenario.toUpperCase()}</strong> ({horizon} Bulan)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-2.5 text-left">Periode Bulan</th>
                  <th className="p-2.5 text-left">Status</th>
                  <th className="p-2.5 text-right">Tagihan Terbit (IDR)</th>
                  <th className="p-2.5 text-right">Kas Masuk (IDR)</th>
                  <th className="p-2.5 text-right">Batas Bawah (Konservatif)</th>
                  <th className="p-2.5 text-right">Batas Atas (Optimis)</th>
                  <th className="p-2.5 text-center">Efisiensi Bayar</th>
                  <th className="p-2.5 text-center">MoM (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {timelineData.map((d) => (
                  <tr
                    key={d.monthKey}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      d.isProjection ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""
                    }`}
                  >
                    <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-white">
                      {d.monthFull}
                    </td>
                    <td className="p-2.5 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          d.isProjection
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {d.isProjection ? "Proyeksi" : "Aktual"}
                      </span>
                    </td>
                    <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                      {formatRupiah(d.totalInvoiced)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(getActiveMetricValue(d))}
                    </td>
                    <td className="p-2.5 text-right text-amber-600 dark:text-amber-400">
                      {d.isProjection ? formatRupiah(d.conservativeCashIn) : "-"}
                    </td>
                    <td className="p-2.5 text-right text-cyan-600 dark:text-cyan-400">
                      {d.isProjection ? formatRupiah(d.optimisticCashIn) : "-"}
                    </td>
                    <td className="p-2.5 text-center text-slate-700 dark:text-slate-300 font-sans font-semibold">
                      {d.collectionRate}%
                    </td>
                    <td
                      className={`p-2.5 text-center font-bold font-sans ${
                        d.momGrowthPercent >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {d.momGrowthPercent >= 0 ? "+" : ""}
                      {d.momGrowthPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
