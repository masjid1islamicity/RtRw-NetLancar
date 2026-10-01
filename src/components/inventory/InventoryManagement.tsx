import React, { useState, useMemo } from "react";
import {
  Boxes,
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Server,
  Zap,
  Wrench,
  Cable,
  Router as RouterIcon,
  BatteryCharging,
  Layers,
  FileSpreadsheet,
  Download,
  Info,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  UserCheck,
  MapPin,
  RefreshCw,
} from "lucide-react";
import {
  InventoryItem,
  InventoryPurchaseRecord,
  AssetDepreciationRecord,
  AssetCategory,
  Customer,
  Wallet,
} from "../../types";
import { formatRupiah, formatDate } from "../../services/storage";
import { Language, translations } from "../../translations";

interface InventoryManagementProps {
  items: InventoryItem[];
  purchases: InventoryPurchaseRecord[];
  depreciations: AssetDepreciationRecord[];
  customers: Customer[];
  wallets: Wallet[];
  onUpdateItems: (items: InventoryItem[]) => void;
  onUpdatePurchases: (purchases: InventoryPurchaseRecord[]) => void;
  onUpdateDepreciations: (depreciations: AssetDepreciationRecord[]) => void;
  lang: Language;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  items,
  purchases,
  depreciations,
  customers,
  wallets,
  onUpdateItems,
  onUpdatePurchases,
  onUpdateDepreciations,
  lang,
}) => {
  const t = translations[lang];

  // Active Sub-tab View
  const [activeSubTab, setActiveSubTab] = useState<"catalog" | "purchases" | "depreciation">("catalog");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("all");

  // Modals
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isRecordPurchaseModalOpen, setIsRecordPurchaseModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedItemForDepreciation, setSelectedItemForDepreciation] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deployItemTarget, setDeployItemTarget] = useState<InventoryItem | null>(null);

  // Form State: Add/Edit Item
  const [itemFormData, setItemFormData] = useState({
    sku: "",
    name: "",
    category: "router_cpe" as AssetCategory,
    brand: "",
    model: "",
    unit: "unit" as "unit" | "pcs" | "roll" | "box" | "set" | "meter",
    stockTotal: 1,
    stockAvailable: 1,
    stockDeployed: 0,
    stockFaulty: 0,
    minStockAlert: 2,
    purchasePrice: 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
    supplier: "",
    location: "Gudang NOC",
    usefulLifeMonths: 48,
    salvageValue: 0,
    specs: "",
    notes: "",
  });

  // Form State: Purchase Record
  const [purchaseFormData, setPurchaseFormData] = useState({
    itemId: items[0]?.id || "",
    purchaseOrderNumber: `PO-${new Date().toISOString().slice(0, 7).replace("-", "")}-${Math.floor(100 + Math.random() * 900)}`,
    purchaseDate: new Date().toISOString().slice(0, 10),
    supplier: "",
    quantity: 1,
    unitPrice: 0,
    paymentMethod: "BCA_VA",
    warrantyUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    receivedBy: "Admin Logistik",
    notes: "",
  });

  // Form State: Deploy Asset
  const [deployFormData, setDeployFormData] = useState({
    quantity: 1,
    customerId: customers[0]?.id || "",
    targetLocation: "Rumah Pelanggan",
    serialNumber: "",
    technicianName: "Teknisi Lapangan",
    notes: "Instalasi sambungan baru",
  });

  // Category Icon & Label mapping
  const categoryMeta: Record<AssetCategory, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    router_cpe: {
      label: "Router & CPE/ONT",
      icon: RouterIcon,
      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    },
    cables_passive: {
      label: "Kabel & Pasif Optik",
      icon: Cable,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    olt_switch: {
      label: "OLT & Switch Sentral",
      icon: Server,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    },
    tools_splicer: {
      label: "Alat Kerja & Splicer",
      icon: Wrench,
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    power_ups: {
      label: "Catu Daya & UPS",
      icon: BatteryCharging,
      color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    },
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalAssetCost = items.reduce((sum, item) => sum + item.stockTotal * item.purchasePrice, 0);

    // Dynamic current book value calculation for all items
    const currentDate = new Date();
    let totalBookValue = 0;
    let totalAccumDepreciation = 0;

    items.forEach((item) => {
      const pDate = new Date(item.purchaseDate);
      const diffMonths = Math.max(
        0,
        (currentDate.getFullYear() - pDate.getFullYear()) * 12 + (currentDate.getMonth() - pDate.getMonth())
      );
      const totalCost = item.stockTotal * item.purchasePrice;
      const depreciableBase = Math.max(0, totalCost - (item.salvageValue || 0));
      const monthlyRate = item.usefulLifeMonths > 0 ? depreciableBase / item.usefulLifeMonths : 0;
      const accumDep = Math.min(depreciableBase, monthlyRate * diffMonths);
      const netBook = Math.max(item.salvageValue || 0, totalCost - accumDep);

      totalBookValue += netBook;
      totalAccumDepreciation += accumDep;
    });

    const totalUnits = items.reduce((sum, item) => sum + item.stockTotal, 0);
    const lowStockItems = items.filter((item) => item.stockAvailable <= item.minStockAlert && item.stockAvailable > 0);
    const depletedItems = items.filter((item) => item.stockAvailable === 0);

    return {
      totalAssetCost,
      totalBookValue,
      totalAccumDepreciation,
      depreciationRatio: totalAssetCost > 0 ? Math.round((totalAccumDepreciation / totalAssetCost) * 100) : 0,
      totalSKUs: items.length,
      totalUnits,
      lowStockCount: lowStockItems.length + depletedItems.length,
      lowStockItems,
      depletedItems,
    };
  }, [items]);

  // Filtered Items for Catalog view
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

      let matchesStock = true;
      if (stockStatusFilter === "in_stock") matchesStock = item.stockAvailable > item.minStockAlert;
      else if (stockStatusFilter === "low_stock")
        matchesStock = item.stockAvailable <= item.minStockAlert && item.stockAvailable > 0;
      else if (stockStatusFilter === "depleted") matchesStock = item.stockAvailable === 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [items, searchQuery, categoryFilter, stockStatusFilter]);

  // Export Inventory to CSV
  const handleExportCSV = () => {
    const headers = [
      "SKU",
      "Nama Aset",
      "Kategori",
      "Merek",
      "Model",
      "Total Stok",
      "Stok Tersedia",
      "Terpasang",
      "Harga Beli Satuan (Rp)",
      "Total Nilai Perolehan (Rp)",
      "Lokasi",
      "Tanggal Beli",
      "Supplier",
    ];

    const rows = items.map((i) => [
      i.sku,
      `"${i.name}"`,
      i.category,
      `"${i.brand}"`,
      `"${i.model}"`,
      i.stockTotal,
      i.stockAvailable,
      i.stockDeployed,
      i.purchasePrice,
      i.stockTotal * i.purchasePrice,
      `"${i.location}"`,
      i.purchaseDate,
      `"${i.supplier}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventaris_Aset_NetLancar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Helper: Open Add/Edit Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemFormData({
      sku: `NET-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      category: "router_cpe",
      brand: "",
      model: "",
      unit: "unit",
      stockTotal: 1,
      stockAvailable: 1,
      stockDeployed: 0,
      stockFaulty: 0,
      minStockAlert: 2,
      purchasePrice: 0,
      purchaseDate: new Date().toISOString().slice(0, 10),
      supplier: "",
      location: "Gudang NOC",
      usefulLifeMonths: 48,
      salvageValue: 0,
      specs: "",
      notes: "",
    });
    setIsAddItemModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemFormData({
      sku: item.sku,
      name: item.name,
      category: item.category,
      brand: item.brand,
      model: item.model,
      unit: item.unit,
      stockTotal: item.stockTotal,
      stockAvailable: item.stockAvailable,
      stockDeployed: item.stockDeployed,
      stockFaulty: item.stockFaulty,
      minStockAlert: item.minStockAlert,
      purchasePrice: item.purchasePrice,
      purchaseDate: item.purchaseDate,
      supplier: item.supplier,
      location: item.location,
      usefulLifeMonths: item.usefulLifeMonths,
      salvageValue: item.salvageValue,
      specs: item.specs || "",
      notes: item.notes || "",
    });
    setIsAddItemModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name.trim() || !itemFormData.sku.trim()) return;

    if (editingItem) {
      const updated = items.map((i) =>
        i.id === editingItem.id
          ? {
              ...i,
              ...itemFormData,
              id: editingItem.id,
            }
          : i
      );
      onUpdateItems(updated);
    } else {
      const newItem: InventoryItem = {
        ...itemFormData,
        id: `inv-item-${Date.now()}`,
      };
      onUpdateItems([newItem, ...items]);

      // Automatically register depreciation record
      const totalCost = newItem.stockTotal * newItem.purchasePrice;
      const usefulYears = Math.round(newItem.usefulLifeMonths / 12);
      const newDepRec: AssetDepreciationRecord = {
        id: `dep-${Date.now()}`,
        itemId: newItem.id,
        itemName: newItem.name,
        category: newItem.category,
        acquisitionCost: totalCost,
        purchaseDate: newItem.purchaseDate,
        usefulLifeYears: usefulYears || 4,
        salvageValue: newItem.salvageValue,
        monthlyDepreciation: Math.round(Math.max(0, totalCost - newItem.salvageValue) / (newItem.usefulLifeMonths || 48)),
        accumulatedDepreciation: 0,
        currentBookValue: totalCost,
        depreciationPercentage: 0,
        status: "active",
        lastCalculatedDate: new Date().toISOString().slice(0, 10),
      };
      onUpdateDepreciations([newDepRec, ...depreciations]);
    }

    setIsAddItemModalOpen(false);
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus item inventaris ini? Data riwayat terkait akan tetap tersimpan.")) {
      onUpdateItems(items.filter((i) => i.id !== id));
      onUpdateDepreciations(depreciations.filter((d) => d.itemId !== id));
    }
  };

  // Record New Purchase Order / Restock
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = items.find((i) => i.id === purchaseFormData.itemId);
    if (!targetItem) return;

    const totalCost = purchaseFormData.quantity * purchaseFormData.unitPrice;

    const newPO: InventoryPurchaseRecord = {
      id: `po-rec-${Date.now()}`,
      itemId: targetItem.id,
      itemName: targetItem.name,
      purchaseOrderNumber: purchaseFormData.purchaseOrderNumber,
      purchaseDate: purchaseFormData.purchaseDate,
      supplier: purchaseFormData.supplier || targetItem.supplier,
      quantity: Number(purchaseFormData.quantity),
      unitPrice: Number(purchaseFormData.unitPrice),
      totalCost,
      paymentMethod: purchaseFormData.paymentMethod,
      warrantyUntil: purchaseFormData.warrantyUntil,
      receivedBy: purchaseFormData.receivedBy,
      notes: purchaseFormData.notes,
    };

    // Increase item stocks
    const updatedItems = items.map((i) =>
      i.id === targetItem.id
        ? {
            ...i,
            stockTotal: i.stockTotal + Number(purchaseFormData.quantity),
            stockAvailable: i.stockAvailable + Number(purchaseFormData.quantity),
            purchasePrice: Number(purchaseFormData.unitPrice) || i.purchasePrice,
            purchaseDate: purchaseFormData.purchaseDate,
            supplier: purchaseFormData.supplier || i.supplier,
          }
        : i
    );

    onUpdatePurchases([newPO, ...purchases]);
    onUpdateItems(updatedItems);
    setIsRecordPurchaseModalOpen(false);
  };

  // Deploy Asset to Field / Customer
  const handleSaveDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployItemTarget) return;

    const qty = Math.min(deployFormData.quantity, deployItemTarget.stockAvailable);
    if (qty <= 0) {
      alert("Stok unit yang tersedia tidak mencukupi untuk dipasang!");
      return;
    }

    const updated = items.map((i) =>
      i.id === deployItemTarget.id
        ? {
            ...i,
            stockAvailable: i.stockAvailable - qty,
            stockDeployed: i.stockDeployed + qty,
          }
        : i
    );

    onUpdateItems(updated);
    setIsDeployModalOpen(false);
    setDeployItemTarget(null);
  };

  return (
    <div id="inventory-management-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Modul Manajemen Aset & Logistik
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Infrastruktur RT/RW Net</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Inventaris Perangkat Keras, Kabel & Nilai Aset
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pelacakan stok router, modem ONT, kabel fiber optik, riwayat pengadaan, dan kalkulasi penyusutan aset (depreciation)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => {
              setPurchaseFormData({
                itemId: items[0]?.id || "",
                purchaseOrderNumber: `PO-${new Date().toISOString().slice(0, 7).replace("-", "")}-${Math.floor(100 + Math.random() * 900)}`,
                purchaseDate: new Date().toISOString().slice(0, 10),
                supplier: items[0]?.supplier || "",
                quantity: 5,
                unitPrice: items[0]?.purchasePrice || 175000,
                paymentMethod: "BCA_VA",
                warrantyUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
                receivedBy: "Admin Logistik",
                notes: "Restock berkala",
              });
              setIsRecordPurchaseModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Pengadaan / Beli</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            id="add-inventory-item-btn"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Tambah Item Aset Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Acquisition Asset Cost */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Nilai Perolehan Aset</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {formatRupiah(metrics.totalAssetCost)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{metrics.totalSKUs} Jenis SKU</span>
            <span className="text-slate-300">•</span>
            <span>{metrics.totalUnits} Total Unit Fisik</span>
          </div>
        </div>

        {/* Card 2: Current Net Book Value (NBV) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Nilai Buku Bersih (NBV)</span>
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatRupiah(metrics.totalBookValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
              {metrics.depreciationRatio}% Terdepresiasi
            </span>
            <span>Sisa Nilai Manfaat</span>
          </div>
        </div>

        {/* Card 3: Deployed vs In-Stock */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Status Penempatan Fisik</span>
            <Server className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {items.reduce((acc, i) => acc + i.stockDeployed, 0)} Unit
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Terpasang</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Stok di Gudang NOC:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {items.reduce((acc, i) => acc + i.stockAvailable, 0)} Unit Ready
            </span>
          </div>
        </div>

        {/* Card 4: Low Stock Alert Warning */}
        <div
          className={`p-4 rounded-2xl border shadow-xs transition-all ${
            metrics.lowStockCount > 0
              ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Peringatan Stok Menipis
            </span>
            <AlertTriangle className={`w-4 h-4 ${metrics.lowStockCount > 0 ? "text-amber-500 animate-bounce" : "text-slate-400"}`} />
          </div>
          <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
            {metrics.lowStockCount} Item SKU
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            {metrics.lowStockCount > 0
              ? "Perlu reorder patch cord / ONT segera"
              : "Seluruh kuota stok material mencukupi"}
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation (Katalog Stok | Riwayat Pengadaan | Log Penyusutan) */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <button
          onClick={() => setActiveSubTab("catalog")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === "catalog"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Katalog & Stok Perangkat</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("purchases")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === "purchases"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat Pengadaan & Pembelian</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
            {purchases.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("depreciation")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === "depreciation"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Log & Jadwal Penyusutan Aset (Garis Lurus)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
            {depreciations.length} Aset
          </span>
        </button>
      </div>

      {/* VIEW 1: KATALOG & STOK PERANGKAT */}
      {activeSubTab === "catalog" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama perangkat, SKU, merek, lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="all">Semua Kategori</option>
                <option value="router_cpe">Router & CPE/ONT</option>
                <option value="cables_passive">Kabel & Pasif Optik</option>
                <option value="olt_switch">OLT & Switch</option>
                <option value="tools_splicer">Alat & Splicer</option>
                <option value="power_ups">Catu Daya & UPS</option>
              </select>

              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="all">Semua Status Stok</option>
                <option value="in_stock">Stok Aman</option>
                <option value="low_stock">Stok Menipis (Reorder)</option>
                <option value="depleted">Stok Habis (0)</option>
              </select>
            </div>
          </div>

          {/* Asset Items Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                <tr>
                  <th className="p-3.5">SKU & Perangkat</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5 text-center">Status Stok</th>
                  <th className="p-3.5 text-right">Rincian Fisik</th>
                  <th className="p-3.5 text-right">Harga Beli & Nilai</th>
                  <th className="p-3.5">Lokasi Gudang</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Tidak ada item aset yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLowStock = item.stockAvailable <= item.minStockAlert && item.stockAvailable > 0;
                    const isDepleted = item.stockAvailable === 0;
                    const Meta = categoryMeta[item.category] || categoryMeta.router_cpe;
                    const Icon = Meta.icon;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{item.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                SKU: {item.sku} • {item.brand} ({item.model})
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${Meta.color}`}>
                            {Meta.label}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          {isDepleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Habis
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Menipis ({item.stockAvailable})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Aman
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right font-mono">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {item.stockAvailable} {item.unit} Ready
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.stockDeployed} terpasang • Total {item.stockTotal}
                          </div>
                        </td>

                        <td className="p-3.5 text-right font-mono">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {formatRupiah(item.purchasePrice)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Tot: {formatRupiah(item.stockTotal * item.purchasePrice)}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.location}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{item.supplier}</div>
                        </td>

                        <td className="p-3.5 text-right space-x-1">
                          {/* Quick Deploy button */}
                          <button
                            onClick={() => {
                              setDeployItemTarget(item);
                              setDeployFormData({
                                quantity: 1,
                                customerId: customers[0]?.id || "",
                                targetLocation: "Rumah Pelanggan RT 01",
                                serialNumber: item.serialNumbers?.[0] || "",
                                technicianName: "Teknisi Lapangan NOC",
                                notes: `Pemasangan unit ${item.name} ke pelanggan`,
                              });
                              setIsDeployModalOpen(true);
                            }}
                            disabled={item.stockAvailable <= 0}
                            title="Pasang / Keluarkan Unit ke Pelanggan"
                            className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] inline-flex items-center gap-1 disabled:opacity-40"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Pasang</span>
                          </button>

                          {/* Depreciation view */}
                          <button
                            onClick={() => setSelectedItemForDepreciation(item)}
                            title="Lihat Kalkulator Penyusutan Nilai Aset"
                            className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <TrendingDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Data Aset"
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            title="Hapus Item"
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: RIWAYAT PENGADAAN & PEMBELIAN */}
      {activeSubTab === "purchases" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Buku Log Pengadaan Perangkat & Material (Purchase History)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pencatatan faktur pembelian, vendor, garansi perangkat, dan penambahan kuota stok otomatis
              </p>
            </div>

            <button
              onClick={() => {
                setPurchaseFormData({
                  itemId: items[0]?.id || "",
                  purchaseOrderNumber: `PO-${new Date().toISOString().slice(0, 7).replace("-", "")}-${Math.floor(100 + Math.random() * 900)}`,
                  purchaseDate: new Date().toISOString().slice(0, 10),
                  supplier: items[0]?.supplier || "",
                  quantity: 10,
                  unitPrice: items[0]?.purchasePrice || 175000,
                  paymentMethod: "BCA_VA",
                  warrantyUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
                  receivedBy: "Admin Logistik",
                  notes: "",
                });
                setIsRecordPurchaseModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Pengadaan Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                <tr>
                  <th className="p-3.5">No. PO & Tanggal</th>
                  <th className="p-3.5">Nama Perangkat / Material</th>
                  <th className="p-3.5">Vendor / Toko Supplier</th>
                  <th className="p-3.5 text-center">Jumlah</th>
                  <th className="p-3.5 text-right">Harga Satuan</th>
                  <th className="p-3.5 text-right">Total Biaya</th>
                  <th className="p-3.5">Garansi Hingga</th>
                  <th className="p-3.5">Penerima & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">{po.purchaseOrderNumber}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{formatDate(po.purchaseDate)}</div>
                    </td>

                    <td className="p-3.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {po.itemName}
                    </td>

                    <td className="p-3.5 font-sans text-slate-600 dark:text-slate-400">
                      <div>{po.supplier}</div>
                      <div className="text-[10px] text-slate-400">Metode: {po.paymentMethod}</div>
                    </td>

                    <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                      +{po.quantity}
                    </td>

                    <td className="p-3.5 text-right text-slate-700 dark:text-slate-300">
                      {formatRupiah(po.unitPrice)}
                    </td>

                    <td className="p-3.5 text-right font-black text-indigo-600 dark:text-indigo-400">
                      {formatRupiah(po.totalCost)}
                    </td>

                    <td className="p-3.5 font-sans text-slate-500">
                      {po.warrantyUntil ? formatDate(po.warrantyUntil) : "Non-Garansi"}
                    </td>

                    <td className="p-3.5 font-sans">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{po.receivedBy}</div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <Check className="w-3 h-3" />
                        Masuk Gudang
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: LOG & JADWAL PENYUSUTAN ASET (DEPRECIATION LOGS) */}
      {activeSubTab === "depreciation" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-slate-50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Metode Penyusutan Garis Lurus (Straight-Line Depreciation)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Rumus: Beban per Bulan = (Harga Perolehan - Nilai Residu) / Masa Manfaat Bulan. Memberikan transparansi nilai aset buku bersih kas paguyuban.
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Akumulasi Depresiasi</span>
              <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                -{formatRupiah(metrics.totalAccumDepreciation)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                <tr>
                  <th className="p-3.5">Nama Aset & Kategori</th>
                  <th className="p-3.5">Masa Manfaat</th>
                  <th className="p-3.5 text-right">Harga Perolehan Awal</th>
                  <th className="p-3.5 text-right">Nilai Residu (Sisa)</th>
                  <th className="p-3.5 text-right">Penyusutan / Bln</th>
                  <th className="p-3.5 text-right">Akumulasi Depresiasi</th>
                  <th className="p-3.5 text-right">Nilai Buku Bersih (NBV)</th>
                  <th className="p-3.5">Status & Umur Ekonomis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {depreciations.map((dep) => {
                  const Meta = categoryMeta[dep.category] || categoryMeta.router_cpe;

                  return (
                    <tr key={dep.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white">{dep.itemName}</div>
                        <div className="text-[10px] text-slate-400">Beli: {formatDate(dep.purchaseDate)}</div>
                      </td>

                      <td className="p-3.5 font-sans">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {dep.usefulLifeYears} Tahun
                        </span>
                        <div className="text-[10px] text-slate-400">{dep.usefulLifeYears * 12} Bulan</div>
                      </td>

                      <td className="p-3.5 text-right font-bold text-slate-800 dark:text-slate-200">
                        {formatRupiah(dep.acquisitionCost)}
                      </td>

                      <td className="p-3.5 text-right text-slate-500">
                        {formatRupiah(dep.salvageValue)}
                      </td>

                      <td className="p-3.5 text-right text-rose-600 dark:text-rose-400">
                        -{formatRupiah(dep.monthlyDepreciation)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-rose-600 dark:text-rose-400">
                        -{formatRupiah(dep.accumulatedDepreciation)}
                      </td>

                      <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatRupiah(dep.currentBookValue)}
                      </td>

                      <td className="p-3.5 font-sans">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Depresiasi:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{dep.depreciationPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, dep.depreciationPercentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT ITEM INVENTARIS */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingItem ? "Edit Data Aset Inventaris" : "Tambah Item Perangkat Keras / Kabel Baru"}
                </h3>
              </div>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kode SKU Aset:</label>
                  <input
                    type="text"
                    required
                    value={itemFormData.sku}
                    onChange={(e) => setItemFormData({ ...itemFormData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                    placeholder="misal: RTR-RB750-01"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kategori Perangkat:</label>
                  <select
                    value={itemFormData.category}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value as AssetCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="router_cpe">Router & CPE/ONT Warga</option>
                    <option value="cables_passive">Kabel Fiber, Dropcore & ODP</option>
                    <option value="olt_switch">OLT & Managed Switch</option>
                    <option value="tools_splicer">Alat Splicer & OPM</option>
                    <option value="power_ups">Catu Daya UPS & Aki</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Perangkat Lengkap:</label>
                <input
                  type="text"
                  required
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  placeholder="Contoh: ZTE F609 GPON ONT Wi-Fi Router"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Merek (Brand):</label>
                  <input
                    type="text"
                    value={itemFormData.brand}
                    onChange={(e) => setItemFormData({ ...itemFormData, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    placeholder="ZTE / MikroTik"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Model / Tipe:</label>
                  <input
                    type="text"
                    value={itemFormData.model}
                    onChange={(e) => setItemFormData({ ...itemFormData, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    placeholder="F609 V5.3"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Satuan Unit:</label>
                  <select
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="unit">unit</option>
                    <option value="pcs">pcs</option>
                    <option value="roll">roll (hasbel)</option>
                    <option value="box">box</option>
                    <option value="set">set</option>
                    <option value="meter">meter</option>
                  </select>
                </div>
              </div>

              {/* Stock Levels */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Total Unit:</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.stockTotal}
                    onChange={(e) => setItemFormData({ ...itemFormData, stockTotal: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Ready Gudang:</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.stockAvailable}
                    onChange={(e) => setItemFormData({ ...itemFormData, stockAvailable: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Terpasang:</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.stockDeployed}
                    onChange={(e) => setItemFormData({ ...itemFormData, stockDeployed: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Batas Alert Min:</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.minStockAlert}
                    onChange={(e) => setItemFormData({ ...itemFormData, minStockAlert: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-amber-600"
                  />
                </div>
              </div>

              {/* Price & Depreciation settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Harga Beli Satuan (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.purchasePrice}
                    onChange={(e) => setItemFormData({ ...itemFormData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Masa Manfaat (Bulan):</label>
                  <input
                    type="number"
                    min="1"
                    value={itemFormData.usefulLifeMonths}
                    onChange={(e) => setItemFormData({ ...itemFormData, usefulLifeMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">misal: 36 bln (3 thn)</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nilai Residu Sisa (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.salvageValue}
                    onChange={(e) => setItemFormData({ ...itemFormData, salvageValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Lokasi Penyimpanan:</label>
                  <input
                    type="text"
                    value={itemFormData.location}
                    onChange={(e) => setItemFormData({ ...itemFormData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    placeholder="Gudang NOC Rak A-1"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Supplier / Vendor:</label>
                  <input
                    type="text"
                    value={itemFormData.supplier}
                    onChange={(e) => setItemFormData({ ...itemFormData, supplier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    placeholder="Toko Glodok / Citraweb"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {editingItem ? "Simpan Perubahan" : "Tambahkan ke Inventaris"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATAT PEMBELIAN / RESTOCK */}
      {isRecordPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Catat Pengadaan & Penambahan Stok (Purchase Order)
                </h3>
              </div>
              <button onClick={() => setIsRecordPurchaseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pilih Item Aset yang Dibeli:</label>
                <select
                  value={purchaseFormData.itemId}
                  onChange={(e) => {
                    const selected = items.find((i) => i.id === e.target.value);
                    setPurchaseFormData({
                      ...purchaseFormData,
                      itemId: e.target.value,
                      unitPrice: selected?.purchasePrice || 0,
                      supplier: selected?.supplier || "",
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stok Saat Ini: {i.stockAvailable} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nomor PO / Faktur:</label>
                  <input
                    type="text"
                    required
                    value={purchaseFormData.purchaseOrderNumber}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, purchaseOrderNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tanggal Pengadaan:</label>
                  <input
                    type="date"
                    required
                    value={purchaseFormData.purchaseDate}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Jumlah Unit Beli (+):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseFormData.quantity}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Harga Beli Satuan (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchaseFormData.unitPrice}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Biaya Pengadaan:</span>
                <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {formatRupiah(purchaseFormData.quantity * purchaseFormData.unitPrice)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Supplier / Toko:</label>
                  <input
                    type="text"
                    value={purchaseFormData.supplier}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, supplier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="Nama vendor..."
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Garansi Hingga:</label>
                  <input
                    type="date"
                    value={purchaseFormData.warrantyUntil}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, warrantyUntil: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Simpan & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PASANG KE PELANGGAN / LAPANGAN */}
      {isDeployModalOpen && deployItemTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Pasang Perangkat ke Lapangan
                  </h3>
                  <p className="text-[11px] text-slate-400">{deployItemTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setIsDeployModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeploy} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center font-mono">
                <span className="text-slate-500">Stok Ready Gudang:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {deployItemTarget.stockAvailable} {deployItemTarget.unit}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pilih Pelanggan / Target Pemasangan:
                </label>
                <select
                  value={deployFormData.customerId}
                  onChange={(e) => setDeployFormData({ ...deployFormData, customerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.rtRw} - {c.address})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Jumlah Unit Dikeluarkan:</label>
                <input
                  type="number"
                  min="1"
                  max={deployItemTarget.stockAvailable}
                  required
                  value={deployFormData.quantity}
                  onChange={(e) => setDeployFormData({ ...deployFormData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Serial Number / MAC (Opsional):</label>
                <input
                  type="text"
                  value={deployFormData.serialNumber}
                  onChange={(e) => setDeployFormData({ ...deployFormData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  placeholder="ZTEG-xxxx / MAC: 1C:AF:..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Konfirmasi Pemasangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PENYUSUTAN GARIS LURUS (STRAIGHT-LINE SCHEDULE) */}
      {selectedItemForDepreciation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Simulasi & Jadwal Penyusutan Nilai Aset
                  </h3>
                  <p className="text-[11px] text-slate-400">{selectedItemForDepreciation.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedItemForDepreciation(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Harga Awal</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatRupiah(selectedItemForDepreciation.purchasePrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Masa Manfaat</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedItemForDepreciation.usefulLifeMonths} Bln
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Penyusutan/Bln</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    -{formatRupiah(
                      Math.round(
                        (selectedItemForDepreciation.purchasePrice - (selectedItemForDepreciation.salvageValue || 0)) /
                          (selectedItemForDepreciation.usefulLifeMonths || 1)
                      )
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Nilai Sisa</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(selectedItemForDepreciation.salvageValue || 0)}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-2.5">Tahun / Periode</th>
                      <th className="p-2.5 text-right">Beban Depresiasi</th>
                      <th className="p-2.5 text-right">Akumulasi Penyusutan</th>
                      <th className="p-2.5 text-right">Nilai Buku (Net Book Value)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {Array.from({ length: Math.ceil(selectedItemForDepreciation.usefulLifeMonths / 12) }).map((_, idx) => {
                      const yearNum = idx + 1;
                      const initialPrice = selectedItemForDepreciation.purchasePrice;
                      const salvage = selectedItemForDepreciation.salvageValue || 0;
                      const yearlyDep = (initialPrice - salvage) / Math.ceil(selectedItemForDepreciation.usefulLifeMonths / 12);
                      const accum = Math.min(initialPrice - salvage, yearlyDep * yearNum);
                      const nbv = Math.max(salvage, initialPrice - accum);

                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-sans font-bold text-slate-800 dark:text-slate-200">
                            Tahun Ke-{yearNum}
                          </td>
                          <td className="p-2.5 text-right text-rose-600 dark:text-rose-400">
                            -{formatRupiah(Math.round(yearlyDep))}
                          </td>
                          <td className="p-2.5 text-right text-rose-600 dark:text-rose-400">
                            -{formatRupiah(Math.round(accum))}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(Math.round(nbv))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedItemForDepreciation(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
