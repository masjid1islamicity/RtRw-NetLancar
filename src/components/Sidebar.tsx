import React from "react";
import {
  LayoutDashboard,
  Users,
  Activity,
  Receipt,
  Wallet,
  Boxes,
  AlertTriangle,
  CheckSquare,
  FileSpreadsheet,
  Server,
  Zap,
} from "lucide-react";
import { Language, translations } from "../translations";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
  counts: {
    totalCustomers: number;
    isolatedCustomers: number;
    overdueInvoices: number;
    pendingTasks: number;
    activeOutages: number;
    lowStockItems?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  counts,
}) => {
  const t = translations[lang];

  const menuItems = [
    {
      id: "overview",
      label: t.tabOverview,
      icon: LayoutDashboard,
    },
    {
      id: "customers",
      label: t.tabCustomers,
      icon: Users,
      badge: counts.totalCustomers,
      badgeColor: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    {
      id: "bandwidth",
      label: t.tabBandwidth,
      icon: Activity,
    },
    {
      id: "billing",
      label: t.tabBilling,
      icon: Receipt,
      badge: counts.overdueInvoices > 0 ? counts.overdueInvoices : undefined,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      id: "finance",
      label: t.tabFinance,
      icon: Wallet,
    },
    {
      id: "inventory",
      label: t.tabInventory,
      icon: Boxes,
      badge: counts.lowStockItems && counts.lowStockItems > 0 ? counts.lowStockItems : undefined,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      id: "outage",
      label: t.tabOutage,
      icon: AlertTriangle,
      badge: counts.activeOutages > 0 ? counts.activeOutages : undefined,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      id: "tasks",
      label: t.tabTasks,
      icon: CheckSquare,
      badge: counts.pendingTasks > 0 ? counts.pendingTasks : undefined,
      badgeColor: "bg-indigo-500 text-white",
    },
    {
      id: "audit",
      label: t.tabAuditReport,
      icon: FileSpreadsheet,
    },
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shrink-0 min-h-[calc(100vh-57px)] transition-colors hidden md:flex"
    >
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
          Infrastruktur & Bisnis
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white" : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Network Edge Device Status Widget */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-500" />
              MikroTik CCR1036
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              99.98%
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>CPU Load</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">18%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[18%] rounded-full"></div>
            </div>

            <div className="flex justify-between pt-1">
              <span>GPON OLT Port</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">4 Port Sync</span>
            </div>
            <div className="flex justify-between">
              <span>Active PPPoE</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                {counts.totalCustomers - counts.isolatedCustomers} Sesi
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
