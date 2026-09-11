// src/components/SalesAnalyticsModal.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  TrendingUp,
  CreditCard,
  Banknote,
  Receipt,
  Calendar,
  Filter,
  User as UserIcon,
  Search,
  ArrowUpDown,
  Download,
  Loader2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FilterMode =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "year"
  | "date"
  | "custom"
  | "all";

type InvoiceSummary = {
  totalRevenue: number;
  onlineRevenue: number;
  onlineCount: number;
  cashRevenue: number;
  cashCount: number;
  totalInvoices: number;
  averageInvoiceValue: number;
};

type InvoiceItemRecord = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerDetails: string;
  total: string;
  paymentMode: "cash" | "online" | string;
  status: "draft" | "final";
  createdAt: string;
  finalizedAt: string | null;
  createdByUser?: {
    id: string;
    username: string;
    role: string;
  };
};

type StaffMember = {
  id: string;
  username: string;
  role: string;
};

interface SalesAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (invoiceId: string) => void;
  isAdmin?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SalesAnalyticsModal({
  open,
  onClose,
  onNavigate,
  isAdmin = false,
}: SalesAnalyticsModalProps) {
  const router = useRouter();
  const [filterMode, setFilterMode] = useState<FilterMode>("today");
  const [specificDate, setSpecificDate] = useState<string>(getTodayString());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const handleViewInvoice = (invoiceId: string) => {
    if (onNavigate) {
      onNavigate(invoiceId);
    } else {
      onClose();
      router.push(`/invoices/${invoiceId}`);
    }
  };
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<string>(getTodayString());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayString());

  const [paymentModeFilter, setPaymentModeFilter] = useState<"all" | "online" | "cash">("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [summary, setSummary] = useState<InvoiceSummary>({
    totalRevenue: 0,
    onlineRevenue: 0,
    onlineCount: 0,
    cashRevenue: 0,
    cashCount: 0,
    totalInvoices: 0,
    averageInvoiceValue: 0,
  });
  const [invoices, setInvoices] = useState<InvoiceItemRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([
    new Date().getFullYear(),
  ]);

  // Compute ISO timestamps for API query
  const { startDateISO, endDateISO } = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const curDay = now.getDate();

    if (filterMode === "today") {
      const start = new Date(curYear, curMonth, curDay, 0, 0, 0, 0);
      const end = new Date(curYear, curMonth, curDay, 23, 59, 59, 999);
      return { startDateISO: start.toISOString(), endDateISO: end.toISOString() };
    }

    if (filterMode === "yesterday") {
      const start = new Date(curYear, curMonth, curDay - 1, 0, 0, 0, 0);
      const end = new Date(curYear, curMonth, curDay - 1, 23, 59, 59, 999);
      return { startDateISO: start.toISOString(), endDateISO: end.toISOString() };
    }

    if (filterMode === "week") {
      const start = new Date(curYear, curMonth, curDay - 6, 0, 0, 0, 0);
      const end = new Date(curYear, curMonth, curDay, 23, 59, 59, 999);
      return { startDateISO: start.toISOString(), endDateISO: end.toISOString() };
    }

    if (filterMode === "month") {
      const start = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
      return { startDateISO: start.toISOString(), endDateISO: end.toISOString() };
    }

    if (filterMode === "year") {
      const start = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      const end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      return { startDateISO: start.toISOString(), endDateISO: end.toISOString() };
    }

    if (filterMode === "date") {
      const [y, m, d] = specificDate.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const start = new Date(y, m - 1, d, 0, 0, 0, 0);
        const end = new Date(y, m - 1, d, 23, 59, 59, 999);
        return { startDateISO: start.toISOString(), endDateISO: end.toISOString() };
      }
    }

    if (filterMode === "custom") {
      const [sy, sm, sd] = customStartDate.split("-").map(Number);
      const [ey, em, ed] = customEndDate.split("-").map(Number);
      if (!isNaN(sy) && !isNaN(sm) && !isNaN(sd) && !isNaN(ey) && !isNaN(em) && !isNaN(ed)) {
        const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
        return { startDateISO: start.toISOString(), endDateISO: end.toISOString() };
      }
    }

    // "all"
    return { startDateISO: undefined, endDateISO: undefined };
  }, [
    filterMode,
    specificDate,
    selectedMonth,
    selectedYear,
    customStartDate,
    customEndDate,
  ]);

  // Fetch sales analytics data
  async function fetchSalesData() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (startDateISO) params.set("startDate", startDateISO);
      if (endDateISO) params.set("endDate", endDateISO);
      if (paymentModeFilter !== "all") params.set("paymentMode", paymentModeFilter);
      if (isAdmin && selectedUserId !== "all") params.set("userId", selectedUserId);

      const res = await fetch(`/api/sales/analytics?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load sales data");

      setSummary(data.summary);
      setInvoices(data.invoices || []);
      if (data.staffList && Array.isArray(data.staffList)) {
        setStaffList(data.staffList);
      }
      if (data.availableYears && Array.isArray(data.availableYears)) {
        setAvailableYears(data.availableYears);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      fetchSalesData();
    }
  }, [
    open,
    startDateISO,
    endDateISO,
    paymentModeFilter,
    selectedUserId,
  ]);

  // Filter invoices based on text search query
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
        (inv.customerDetails && inv.customerDetails.toLowerCase().includes(q)) ||
        (inv.createdByUser?.username &&
          inv.createdByUser.username.toLowerCase().includes(q))
    );
  }, [invoices, searchQuery]);

  if (!open) return null;

  // Percentage calculations
  const onlinePercent =
    summary.totalRevenue > 0
      ? Math.round((summary.onlineRevenue / summary.totalRevenue) * 100)
      : 0;
  const cashPercent =
    summary.totalRevenue > 0
      ? Math.round((summary.cashRevenue / summary.totalRevenue) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-paper-flat px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine/10 text-pine-deep shadow-xs">
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base sm:text-lg font-bold text-ink">
                  Sales &amp; Revenue Analytics
                </h2>
                {isAdmin ? (
                  <span className="rounded bg-pine-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pine-deep">
                    Admin View • All Access
                  </span>
                ) : (
                  <span className="rounded bg-blue-50 text-[#1b365d] border border-blue-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    My Staff Sales
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-soft">
                Breakdown of online UPI, counter cash payments, and customer bills.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSalesData()}
              disabled={loading}
              title="Refresh Data"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-paper hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-paper hover:text-ink transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="border-b border-line bg-surface p-4 sm:px-6 space-y-3">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "week", label: "Last 7 Days" },
              { id: "month", label: "By Month" },
              { id: "year", label: "By Year" },
              { id: "date", label: "Specific Date" },
              { id: "custom", label: "Custom Range" },
              { id: "all", label: "All Time" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id as FilterMode)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterMode === tab.id
                    ? "bg-pine text-white shadow-xs"
                    : "bg-paper text-ink-soft hover:bg-line/60 hover:text-ink border border-line"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Context-Specific Pickers & Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            {/* 1. Date Picker */}
            {filterMode === "date" && (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
                <Calendar size={14} className="text-pine-deep" />
                <span className="font-semibold text-ink-soft">Date:</span>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="bg-transparent font-medium text-ink outline-none cursor-pointer"
                />
              </div>
            )}

            {/* 2. Month & Year Picker */}
            {filterMode === "month" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
                  <span className="font-semibold text-ink-soft">Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent font-medium text-ink outline-none cursor-pointer"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
                  <span className="font-semibold text-ink-soft">Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent font-medium text-ink outline-none cursor-pointer"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 3. Year Picker */}
            {filterMode === "year" && (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
                <span className="font-semibold text-ink-soft">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent font-medium text-ink outline-none cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 4. Custom Range (Custom Length) */}
            {filterMode === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
                  <span className="font-semibold text-ink-soft">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent font-medium text-ink outline-none cursor-pointer"
                  />
                </div>
                <span className="text-ink-soft">to</span>
                <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
                  <span className="font-semibold text-ink-soft">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent font-medium text-ink outline-none cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Admin Staff Filter */}
            {isAdmin && (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
                <UserIcon size={14} className="text-pine-deep" />
                <span className="font-semibold text-ink-soft">Staff:</span>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-transparent font-medium text-ink outline-none cursor-pointer"
                >
                  <option value="all">All Staff (Entire Nursery)</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.username} ({st.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Payment Mode Filter */}
            <div className="flex items-center rounded-lg border border-line bg-paper p-0.5 ml-auto">
              <button
                type="button"
                onClick={() => setPaymentModeFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  paymentModeFilter === "all"
                    ? "bg-surface text-ink font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                All Modes
              </button>
              <button
                type="button"
                onClick={() => setPaymentModeFilter("online")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  paymentModeFilter === "online"
                    ? "bg-blue-500 text-white font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <CreditCard size={12} /> Online (UPI)
              </button>
              <button
                type="button"
                onClick={() => setPaymentModeFilter("cash")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  paymentModeFilter === "cash"
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <Banknote size={12} /> Cash
              </button>
            </div>
          </div>
        </div>

        {/* Content Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Revenue Card */}
            <div className="relative overflow-hidden rounded-xl border border-line bg-paper-flat p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Total Sales
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine/10 text-pine-deep">
                  <Receipt size={16} />
                </span>
              </div>
              <div className="mt-2.5 font-serif text-2xl font-bold text-pine-deep">
                {formatCurrency(summary.totalRevenue)}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-ink-soft">
                <span>{summary.totalInvoices} finalized bill(s)</span>
                <span className="font-semibold text-pine">100%</span>
              </div>
            </div>

            {/* Online UPI Sales Card */}
            <div className="relative overflow-hidden rounded-xl border border-blue-200/80 bg-blue-50/40 dark:bg-blue-950/20 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  Online (UPI)
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <CreditCard size={16} />
                </span>
              </div>
              <div className="mt-2.5 font-serif text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(summary.onlineRevenue)}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-blue-800/80 dark:text-blue-400">
                <span>{summary.onlineCount} online bill(s)</span>
                <span className="font-semibold">{onlinePercent}%</span>
              </div>
            </div>

            {/* Offline Cash Sales Card */}
            <div className="relative overflow-hidden rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Cash (Offline)
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Banknote size={16} />
                </span>
              </div>
              <div className="mt-2.5 font-serif text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(summary.cashRevenue)}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-emerald-800/80 dark:text-emerald-400">
                <span>{summary.cashCount} cash bill(s)</span>
                <span className="font-semibold">{cashPercent}%</span>
              </div>
            </div>

            {/* Average Order Value Card */}
            <div className="relative overflow-hidden rounded-xl border border-line bg-paper-flat p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Avg Bill Value
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className="mt-2.5 font-serif text-2xl font-bold text-ink">
                {formatCurrency(summary.averageInvoiceValue)}
              </div>
              <div className="mt-1 text-xs text-ink-soft">
                Average transaction size
              </div>
            </div>
          </div>

          {/* Payment Split Ratio Bar */}
          {summary.totalRevenue > 0 && (
            <div className="rounded-xl border border-line bg-paper p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                  <span>Online / UPI ({onlinePercent}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <span>Cash / Offline ({cashPercent}%)</span>
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-line overflow-hidden flex">
                <div
                  style={{ width: `${onlinePercent}%` }}
                  className="bg-blue-500 transition-all duration-500"
                  title={`Online: ${onlinePercent}%`}
                />
                <div
                  style={{ width: `${cashPercent}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Cash: ${cashPercent}%`}
                />
              </div>
            </div>
          )}

          {/* Transaction Invoices List */}
          <div className="rounded-xl border border-line bg-surface overflow-hidden">
            {/* List Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line bg-paper-flat px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink">
                  Invoices Breakdown
                </h3>
                <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                  {filteredInvoices.length}
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft"
                />
                <input
                  type="text"
                  placeholder="Search invoice or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface pl-8 pr-3 py-1.5 text-xs text-ink outline-none focus:border-pine"
                />
              </div>
            </div>

            {/* List Table */}
            {loading ? (
              <div className="flex h-48 items-center justify-center gap-2 text-xs text-ink-soft">
                <Loader2 size={16} className="animate-spin text-pine" />
                <span>Loading sales data...</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Receipt size={36} className="text-ink-soft/40 mb-2" />
                <p className="text-sm font-semibold text-ink">No sales found</p>
                <p className="text-xs text-ink-soft mt-1 max-w-sm">
                  There are no finalized invoices matching the selected period or filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-line bg-paper-flat/60 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                      <th className="px-4 py-2.5">Invoice #</th>
                      <th className="px-4 py-2.5">Customer</th>
                      <th className="px-4 py-2.5">Date &amp; Time</th>
                      <th className="px-4 py-2.5">Payment Mode</th>
                      {isAdmin && <th className="px-4 py-2.5">Billed By</th>}
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredInvoices.map((inv) => {
                      const isOnline = inv.paymentMode === "online";
                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-paper-flat/40 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleViewInvoice(inv.id)}
                              className="font-mono font-bold text-pine-deep hover:underline text-left cursor-pointer"
                              title="View Invoice"
                            >
                              {inv.invoiceNumber}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-ink">
                              {inv.customerName || "Walk-in Customer"}
                            </div>
                            {inv.customerDetails && (
                              <div className="text-[11px] text-ink-soft truncate max-w-[200px]">
                                {inv.customerDetails}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-ink-soft">
                            {formatDate(inv.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                isOnline
                                  ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              }`}
                            >
                              {isOnline ? (
                                <CreditCard size={11} />
                              ) : (
                                <Banknote size={11} />
                              )}
                              <span>{isOnline ? "Online (UPI)" : "Cash"}</span>
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-ink-soft">
                              <span className="font-medium text-ink">
                                {inv.createdByUser?.username || "Admin"}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 text-right font-mono font-bold text-ink sm:text-sm">
                            ₹{Number(inv.total || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleViewInvoice(inv.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:bg-paper hover:text-ink transition-colors cursor-pointer"
                              title="View Invoice"
                            >
                              <span>View</span>
                              <ExternalLink size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line bg-paper-flat px-5 py-3 text-xs">
          <div className="text-ink-soft">
            Showing <strong className="text-ink">{filteredInvoices.length}</strong> of{" "}
            <strong className="text-ink">{summary.totalInvoices}</strong> invoice(s)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-pine px-4 py-2 font-semibold text-white shadow-xs hover:bg-pine-deep transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
