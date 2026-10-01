import React from "react";
import {
  Wifi,
  Globe,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Bot,
  Search,
  WifiOff,
  Fingerprint,
} from "lucide-react";
import { Customer, UserRole } from "../types";
import { Language, translations } from "../translations";

interface NavbarProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isOnline: boolean;
  isSyncing: boolean;
  onManualSync: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenAiChat: () => void;
  onOpenBiometric: () => void;
  biometricActive: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  setRole,
  lang,
  setLang,
  darkMode,
  setDarkMode,
  isOnline,
  isSyncing,
  onManualSync,
  unreadCount,
  onOpenNotifications,
  onOpenAiChat,
  onOpenBiometric,
  biometricActive,
  searchQuery,
  setSearchQuery,
  customers,
  selectedCustomer,
  setSelectedCustomer,
}) => {
  const t = translations[lang];

  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 lg:px-6 py-2.5 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 md:gap-4 max-w-7xl mx-auto">
        {/* Left: Brand Identity & Network Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Wifi className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-slate-200 dark:to-indigo-400 bg-clip-text text-transparent">
                NetLancar
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                RT/RW Net OS
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                {isOnline ? "Mikrotik Core Online" : "Modem Offline"}
              </span>
              <span>•</span>
              <span className="hidden sm:inline font-mono text-[11px] text-slate-400 dark:text-slate-500">
                v2.4 Smart-Cloud
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search & Cloud Sync Indicator */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cloud Sync Button */}
          <button
            id="cloud-sync-btn"
            onClick={onManualSync}
            title={isOnline ? t.cloudSynced : t.offlineMode}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              isOnline
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400"
            }`}
          >
            {isOnline ? (
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-indigo-600" : ""}`} />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="hidden xl:inline font-medium">
              {isSyncing ? t.cloudSyncing : isOnline ? t.cloudSynced : t.offlineMode}
            </span>
          </button>

          {/* Biometric Security Toggle */}
          <button
            id="biometric-btn"
            onClick={onOpenBiometric}
            title={t.biometricSecured}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              biometricActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Fingerprint className="w-4 h-4" />
          </button>

          {/* Role Switcher (Admin / Customer Portal) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              id="role-admin-btn"
              onClick={() => setRole("admin")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                role === "admin"
                  ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Staf ISP
            </button>
            <button
              id="role-customer-btn"
              onClick={() => setRole("customer")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                role === "customer"
                  ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Pelanggan
            </button>
          </div>

          {/* If Customer Mode, show customer picker */}
          {role === "customer" && (
            <select
              id="customer-picker-select"
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value);
                if (found) setSelectedCustomer(found);
              }}
              className="text-xs py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.customerCode})
                </option>
              ))}
            </select>
          )}

          {/* AI ISP Bot trigger */}
          <button
            id="ai-bot-toggle-btn"
            onClick={onOpenAiChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm hover:from-violet-700 hover:to-indigo-700 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">AI Support</span>
          </button>

          {/* Notification Button */}
          <button
            id="notification-bell-btn"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={t.notifications}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Language toggle */}
          <button
            id="language-toggle-btn"
            onClick={() => setLang(lang === "id" ? "en" : "id")}
            className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 uppercase"
            title="Ganti Bahasa / Switch Language"
          >
            {lang}
          </button>

          {/* Dark Mode toggle */}
          <button
            id="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
