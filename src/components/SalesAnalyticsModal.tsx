// src/components/SalesAnalyticsModal.tsx

"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  BarChart3,
  PieChart,
  Layers,
  Eye,
  EyeOff,
  Info,
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

  // Data Visualization State
  const [showVisualization, setShowVisualization] = useState<boolean>(false);
  const [chartMetric, setChartMetric] = useState<"revenue" | "count">("revenue");
  const [hoveredBucketKey, setHoveredBucketKey] = useState<string | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    key: string;
    x: number;
    y: number;
  } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const barsWrapperRef = useRef<HTMLDivElement>(null);

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
  // Percentage calculations
  const onlinePercent =
    summary.totalRevenue > 0
      ? Math.round((summary.onlineRevenue / summary.totalRevenue) * 100)
      : 0;
  const cashPercent =
    summary.totalRevenue > 0
      ? Math.round((summary.cashRevenue / summary.totalRevenue) * 100)
      : 0;

  // Timeline series aggregation for interactive charts
  type TimelineBucket = {
    key: string;
    label: string;
    fullLabel: string;
    totalRevenue: number;
    onlineRevenue: number;
    cashRevenue: number;
    totalCount: number;
    onlineCount: number;
    cashCount: number;
  };

  const timelineData: TimelineBucket[] = useMemo(() => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      return [];
    }

    // 1. Single Day Mode: 2-Hour Time Slots
    if (filterMode === "today" || filterMode === "yesterday" || filterMode === "date") {
      const intervals = [
        { start: 6, end: 8, label: "6-8 AM", fullLabel: "06:00 AM – 08:00 AM" },
        { start: 8, end: 10, label: "8-10 AM", fullLabel: "08:00 AM – 10:00 AM" },
        { start: 10, end: 12, label: "10-12 PM", fullLabel: "10:00 AM – 12:00 PM" },
        { start: 12, end: 14, label: "12-2 PM", fullLabel: "12:00 PM – 02:00 PM" },
        { start: 14, end: 16, label: "2-4 PM", fullLabel: "02:00 PM – 04:00 PM" },
        { start: 16, end: 18, label: "4-6 PM", fullLabel: "04:00 PM – 06:00 PM" },
        { start: 18, end: 20, label: "6-8 PM", fullLabel: "06:00 PM – 08:00 PM" },
        { start: 20, end: 24, label: "8-12 AM", fullLabel: "08:00 PM – Midnight" },
      ];

      const buckets: TimelineBucket[] = intervals.map((slot, idx) => ({
        key: `slot-${idx}`,
        label: slot.label,
        fullLabel: slot.fullLabel,
        totalRevenue: 0,
        onlineRevenue: 0,
        cashRevenue: 0,
        totalCount: 0,
        onlineCount: 0,
        cashCount: 0,
      }));

      filteredInvoices.forEach((inv) => {
        const d = new Date(inv.createdAt);
        const hour = d.getHours();
        const amt = Number(inv.total) || 0;
        const isOnline = inv.paymentMode === "online";

        const slotIndex = intervals.findIndex((s) => hour >= s.start && hour < s.end);
        const target = slotIndex >= 0 ? buckets[slotIndex] : buckets[buckets.length - 1];
        if (target) {
          target.totalRevenue += amt;
          target.totalCount += 1;
          if (isOnline) {
            target.onlineRevenue += amt;
            target.onlineCount += 1;
          } else {
            target.cashRevenue += amt;
            target.cashCount += 1;
          }
        }
      });

      return buckets;
    }

    // 2. Week Mode: 7 Days
    if (filterMode === "week") {
      const buckets: TimelineBucket[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
        const fullLabel = d.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        buckets.push({
          key,
          label,
          fullLabel,
          totalRevenue: 0,
          onlineRevenue: 0,
          cashRevenue: 0,
          totalCount: 0,
          onlineCount: 0,
          cashCount: 0,
        });
      }

      filteredInvoices.forEach((inv) => {
        const d = new Date(inv.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const bucket = buckets.find((b) => b.key === key);
        if (bucket) {
          const amt = Number(inv.total) || 0;
          bucket.totalRevenue += amt;
          bucket.totalCount += 1;
          if (inv.paymentMode === "online") {
            bucket.onlineRevenue += amt;
            bucket.onlineCount += 1;
          } else {
            bucket.cashRevenue += amt;
            bucket.cashCount += 1;
          }
        }
      });

      return buckets;
    }

    // 3. Year Mode: 12 Months
    if (filterMode === "year") {
      const buckets: TimelineBucket[] = [];
      for (let m = 0; m < 12; m++) {
        const d = new Date(selectedYear, m, 1);
        const label = d.toLocaleDateString("en-IN", { month: "short" });
        const fullLabel = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        buckets.push({
          key: `m-${m}`,
          label,
          fullLabel,
          totalRevenue: 0,
          onlineRevenue: 0,
          cashRevenue: 0,
          totalCount: 0,
          onlineCount: 0,
          cashCount: 0,
        });
      }

      filteredInvoices.forEach((inv) => {
        const d = new Date(inv.createdAt);
        if (d.getFullYear() === selectedYear) {
          const m = d.getMonth();
          const bucket = buckets[m];
          if (bucket) {
            const amt = Number(inv.total) || 0;
            bucket.totalRevenue += amt;
            bucket.totalCount += 1;
            if (inv.paymentMode === "online") {
              bucket.onlineRevenue += amt;
              bucket.onlineCount += 1;
            } else {
              bucket.cashRevenue += amt;
              bucket.cashCount += 1;
            }
          }
        }
      });

      return buckets;
    }

    // 4. Month Mode: Days of the Selected Month
    if (filterMode === "month") {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const buckets: TimelineBucket[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(selectedYear, selectedMonth, day);
        const key = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        buckets.push({
          key,
          label: String(day),
          fullLabel: d.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          totalRevenue: 0,
          onlineRevenue: 0,
          cashRevenue: 0,
          totalCount: 0,
          onlineCount: 0,
          cashCount: 0,
        });
      }

      filteredInvoices.forEach((inv) => {
        const d = new Date(inv.createdAt);
        if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
          const dayIdx = d.getDate() - 1;
          const bucket = buckets[dayIdx];
          if (bucket) {
            const amt = Number(inv.total) || 0;
            bucket.totalRevenue += amt;
            bucket.totalCount += 1;
            if (inv.paymentMode === "online") {
              bucket.onlineRevenue += amt;
              bucket.onlineCount += 1;
            } else {
              bucket.cashRevenue += amt;
              bucket.cashCount += 1;
            }
          }
        }
      });

      return buckets;
    }

    // 5. Default / Custom Range / All Time: Group by active invoice dates
    const map = new Map<string, TimelineBucket>();
    filteredInvoices.forEach((inv) => {
      const d = new Date(inv.createdAt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          key: dateKey,
          label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          fullLabel: d.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          totalRevenue: 0,
          onlineRevenue: 0,
          cashRevenue: 0,
          totalCount: 0,
          onlineCount: 0,
          cashCount: 0,
        });
      }
      const b = map.get(dateKey)!;
      const amt = Number(inv.total) || 0;
      b.totalRevenue += amt;
      b.totalCount += 1;
      if (inv.paymentMode === "online") {
        b.onlineRevenue += amt;
        b.onlineCount += 1;
      } else {
        b.cashRevenue += amt;
        b.cashCount += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredInvoices, filterMode, selectedYear, selectedMonth]);

  // Max value in timeline data for scaling bar heights
  const maxTimelineVal = useMemo(() => {
    if (timelineData.length === 0) return 1;
    const vals = timelineData.map((d) => (chartMetric === "revenue" ? d.totalRevenue : d.totalCount));
    return Math.max(...vals, 1);
  }, [timelineData, chartMetric]);

  // Order size / ticket value distribution
  const orderSizeDistribution = useMemo(() => {
    let small = { count: 0, revenue: 0 };
    let medium = { count: 0, revenue: 0 };
    let large = { count: 0, revenue: 0 };

    filteredInvoices.forEach((inv) => {
      const amt = Number(inv.total) || 0;
      if (amt < 500) {
        small.count += 1;
        small.revenue += amt;
      } else if (amt <= 2000) {
        medium.count += 1;
        medium.revenue += amt;
      } else {
        large.count += 1;
        large.revenue += amt;
      }
    });

    const total = filteredInvoices.length || 1;
    return [
      {
        label: "Small Bills (< ₹500)",
        count: small.count,
        revenue: small.revenue,
        percent: Math.round((small.count / total) * 100),
        dotColor: "bg-sky-500",
        barColor: "bg-sky-500",
      },
      {
        label: "Medium Bills (₹500 – ₹2,000)",
        count: medium.count,
        revenue: medium.revenue,
        percent: Math.round((medium.count / total) * 100),
        dotColor: "bg-pine",
        barColor: "bg-pine",
      },
      {
        label: "Large Orders (> ₹2,000)",
        count: large.count,
        revenue: large.revenue,
        percent: Math.round((large.count / total) * 100),
        dotColor: "bg-amber-500",
        barColor: "bg-amber-500",
      },
    ];
  }, [filteredInvoices]);

  // Staff sales leaderboard for admin view
  const staffSalesData = useMemo(() => {
    if (!isAdmin || staffList.length <= 1) return [];
    const staffMap = new Map<string, { id: string; username: string; role: string; revenue: number; count: number }>();
    staffList.forEach((s) => {
      staffMap.set(s.id, { id: s.id, username: s.username, role: s.role, revenue: 0, count: 0 });
    });

    filteredInvoices.forEach((inv) => {
      const uId = inv.createdByUser?.id;
      if (uId && staffMap.has(uId)) {
        const item = staffMap.get(uId)!;
        item.revenue += Number(inv.total) || 0;
        item.count += 1;
      }
    });

    const totalRev = summary.totalRevenue || 1;
    return Array.from(staffMap.values())
      .map((s) => ({
        ...s,
        percent: Math.round((s.revenue / totalRev) * 100),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [isAdmin, staffList, filteredInvoices, summary.totalRevenue]);

  if (!open) return null;

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
              type="button"
              onClick={() => setShowVisualization(!showVisualization)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                showVisualization
                  ? "bg-pine text-white border-pine shadow-xs ring-1 ring-pine"
                  : "bg-surface text-ink hover:bg-paper border-line text-ink-soft hover:text-ink"
              }`}
              title="Toggle data visualization charts"
            >
              <BarChart3 size={14} className={showVisualization ? "text-white" : "text-pine-deep"} />
              <span className="hidden sm:inline">
                {showVisualization ? "Hide Charts" : "Visualize Data"}
              </span>
            </button>
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

          {/* Statistics Section Header with Optional "Visualize Data" Toggle Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Key Statistics &amp; Performance
                </h3>
                <span className="rounded bg-pine-tint px-2 py-0.5 text-[10px] font-bold text-pine-deep font-mono">
                  {filteredInvoices.length} Bills
                </span>
              </div>
              <p className="text-[11px] text-ink-soft mt-0.5">
                Financial totals and payment mode breakdown
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowVisualization(!showVisualization)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shadow-xs ${
                showVisualization
                  ? "bg-pine text-white border-pine shadow-sm ring-2 ring-pine/20"
                  : "bg-paper text-ink hover:bg-line/50 border-line-strong"
              }`}
              title="Toggle interactive data visualization charts"
            >
              <BarChart3 size={15} className={showVisualization ? "text-white" : "text-pine"} />
              <span>{showVisualization ? "Hide Charts" : "Visualize Data"}</span>
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase tracking-wider ${
                  showVisualization
                    ? "bg-white/20 text-white"
                    : "bg-pine-tint text-pine-deep"
                }`}
              >
                {showVisualization ? "ON" : "Charts"}
              </span>
            </button>
          </div>

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

          {/* ========================================================= */}
          {/* OPTIONAL VISUALIZATION DASHBOARD                          */}
          {/* ========================================================= */}
          {showVisualization && (
            <div className="rounded-2xl border border-line bg-paper-flat/70 p-4 sm:p-5 space-y-5 shadow-xs animate-in fade-in zoom-in-95 duration-150">
              {/* Header of Visualization with Metric Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine text-white shadow-xs">
                    <BarChart3 size={16} />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-ink">
                      Visual Statistics &amp; Analytics
                    </h4>
                    <p className="text-[11px] text-ink-soft">
                      Interactive chart breakdowns by time, payment mode, and order ticket size
                    </p>
                  </div>
                </div>

                {/* Metric Mode Switcher */}
                <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5 text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setChartMetric("revenue")}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      chartMetric === "revenue"
                        ? "bg-pine text-white shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric("count")}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      chartMetric === "count"
                        ? "bg-pine text-white shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Bill Count (#)
                  </button>
                </div>
              </div>

              {/* 1. Timeline Bar Chart */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-ink flex items-center gap-2">
                    <span>
                      {filterMode === "today" || filterMode === "yesterday" || filterMode === "date"
                        ? "Hourly Sales Velocity (06:00 AM – 10:00 PM)"
                        : filterMode === "week"
                        ? "7-Day Sales Trend"
                        : filterMode === "month"
                        ? `Daily Sales Performance (${MONTH_NAMES[selectedMonth]} ${selectedYear})`
                        : filterMode === "year"
                        ? `Monthly Performance (${selectedYear})`
                        : "Sales Performance Timeline"}
                    </span>
                    <span className="text-[10px] text-ink-soft font-normal hidden sm:inline">
                      (Hover over bars for details)
                    </span>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 text-[11px] font-medium">
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-sm bg-blue-500"></span>
                      <span className="text-ink-soft">Online (UPI)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500"></span>
                      <span className="text-ink-soft">Cash (Offline)</span>
                    </div>
                  </div>
                </div>

                {/* Timeline Chart Container */}
                <div ref={chartContainerRef} className="relative rounded-xl border border-line bg-surface p-4">
                  {timelineData.length === 0 || summary.totalRevenue === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-xs text-ink-soft text-center">
                      <BarChart3 size={32} className="text-ink-soft/30 mb-2" />
                      <span>No transactions recorded for this period to visualize.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Active Interval / Day Inspection Header */}
                      <div className="min-h-[46px] rounded-lg bg-paper-flat border border-line px-3.5 py-2 flex flex-wrap items-center justify-between gap-2.5 transition-all">
                        {hoveredBucketKey && timelineData.find((b) => b.key === hoveredBucketKey) ? (() => {
                          const active = timelineData.find((b) => b.key === hoveredBucketKey)!;
                          return (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-ink text-xs sm:text-sm flex items-center gap-1.5">
                                  <Calendar size={14} className="text-pine-deep" />
                                  {active.fullLabel}
                                </span>
                                <span className="rounded-full bg-pine/10 text-pine-deep px-2 py-0.5 text-[10px] font-bold">
                                  {active.totalCount} {active.totalCount === 1 ? "bill" : "bills"}
                                </span>
                              </div>
                              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-ink-soft">Total:</span>
                                  <span className="font-mono font-bold text-ink text-[13px]">{formatCurrency(active.totalRevenue)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                  <span>Online:</span>
                                  <span className="font-mono font-semibold">{formatCurrency(active.onlineRevenue)} ({active.onlineCount})</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                  <span>Cash:</span>
                                  <span className="font-mono font-semibold">{formatCurrency(active.cashRevenue)} ({active.cashCount})</span>
                                </div>
                              </div>
                            </>
                          );
                        })() : (
                          <div className="flex items-center justify-between w-full text-xs text-ink-soft">
                            <span className="flex items-center gap-1.5">
                              <Info size={14} className="text-pine-deep/70 shrink-0" />
                              Hover over or click any bar below to inspect that time period's sales breakdown.
                            </span>
                            <span className="text-[11px] font-mono hidden sm:inline shrink-0">
                              Peak: {chartMetric === "revenue" ? formatCurrency(maxTimelineVal) : `${maxTimelineVal} bills`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bars Area with dynamic floating indicator */}
                      <div ref={barsWrapperRef} className="relative">
                        <div
                          className="h-52 flex items-end gap-1 sm:gap-2 pt-6 pb-1 px-1 sm:px-2 border-b border-line overflow-x-auto"
                          onScroll={() => {
                            setHoveredTooltip(null);
                            setHoveredBucketKey(null);
                          }}
                        >
                          {timelineData.map((bucket) => {
                            const val = chartMetric === "revenue" ? bucket.totalRevenue : bucket.totalCount;
                            const heightPct =
                              maxTimelineVal > 0
                                ? Math.max(Math.round((val / maxTimelineVal) * 100), val > 0 ? 8 : 2)
                                : 2;
                            const onlineVal =
                              chartMetric === "revenue" ? bucket.onlineRevenue : bucket.onlineCount;
                            const onlineRatio = val > 0 ? onlineVal / val : 0;
                            const isHovered = hoveredBucketKey === bucket.key;

                            return (
                              <div
                                key={bucket.key}
                                className="relative flex-1 min-w-[28px] sm:min-w-[36px] flex flex-col items-center h-full justify-end group cursor-pointer"
                                onMouseEnter={(e) => {
                                  setHoveredBucketKey(bucket.key);
                                  if (barsWrapperRef.current) {
                                    const wRect = barsWrapperRef.current.getBoundingClientRect();
                                    const barEl = e.currentTarget.querySelector('[data-bar="true"]');
                                    const barRect = (barEl || e.currentTarget).getBoundingClientRect();
                                    const x = barRect.left + barRect.width / 2 - wRect.left;
                                    const y = barRect.top - wRect.top;
                                    setHoveredTooltip({ key: bucket.key, x, y });
                                  }
                                }}
                                onMouseMove={(e) => {
                                  if (barsWrapperRef.current) {
                                    const wRect = barsWrapperRef.current.getBoundingClientRect();
                                    const barEl = e.currentTarget.querySelector('[data-bar="true"]');
                                    const barRect = (barEl || e.currentTarget).getBoundingClientRect();
                                    const x = barRect.left + barRect.width / 2 - wRect.left;
                                    const y = barRect.top - wRect.top;
                                    setHoveredTooltip({ key: bucket.key, x, y });
                                  }
                                }}
                                onMouseLeave={() => {
                                  setHoveredBucketKey(null);
                                  setHoveredTooltip(null);
                                }}
                                onClick={() => {
                                  setHoveredBucketKey(bucket.key);
                                }}
                              >
                                {/* Value Label above bar if > 0 */}
                                {val > 0 && (
                                  <span className="mb-1 text-[9px] font-mono text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                                    {chartMetric === "revenue"
                                      ? val >= 1000
                                        ? `₹${(val / 1000).toFixed(1)}k`
                                        : `₹${val}`
                                      : `${val}`}
                                  </span>
                                )}

                                {/* The Stacked Bar */}
                                <div
                                  data-bar="true"
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-full max-w-[42px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-300 ${
                                    val === 0
                                      ? "bg-line/40"
                                      : isHovered
                                      ? "ring-2 ring-pine ring-offset-1 shadow-md scale-y-[1.02]"
                                      : "shadow-xs"
                                  }`}
                                >
                                  {/* Cash portion (top of stack) */}
                                  {bucket.cashRevenue > 0 && (
                                    <div
                                      style={{ height: `${(1 - onlineRatio) * 100}%` }}
                                      className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
                                    />
                                  )}
                                  {/* Online portion (bottom of stack) */}
                                  {bucket.onlineRevenue > 0 && (
                                    <div
                                      style={{ height: `${onlineRatio * 100}%` }}
                                      className="w-full bg-blue-500 hover:bg-blue-600 transition-colors"
                                    />
                                  )}
                                </div>

                                {/* X-axis Label */}
                                <span
                                  className={`mt-2 text-[10px] truncate max-w-full font-mono transition-colors ${
                                    isHovered ? "text-pine-deep font-bold" : "text-ink-soft"
                                  }`}
                                  title={bucket.fullLabel}
                                >
                                  {bucket.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Floating Tooltip anchored inside barsWrapperRef - NEVER clipped */}
                        {hoveredTooltip && (() => {
                          const active = timelineData.find((b) => b.key === hoveredTooltip.key);
                          if (!active) return null;
                          const wrapperW = barsWrapperRef.current?.clientWidth || 700;
                          const cardWidth = 224;
                          // Center card on bar, clamped within container boundaries
                          const cardCenterX = Math.max(
                            cardWidth / 2 + 8,
                            Math.min(hoveredTooltip.x, wrapperW - cardWidth / 2 - 8)
                          );
                          // Exact arrow offset relative to the card's left edge
                          const arrowInsideCard = Math.max(
                            14,
                            Math.min(hoveredTooltip.x - (cardCenterX - cardWidth / 2), cardWidth - 14)
                          );
                          // If bar is tall (top is within 65px from wrapper top), flip below bar top.
                          // Otherwise position cleanly above the bar.
                          const isAbove = hoveredTooltip.y >= 65;

                          return (
                            <div
                              style={{
                                left: `${cardCenterX}px`,
                                top: isAbove ? `${hoveredTooltip.y - 8}px` : `${hoveredTooltip.y + 12}px`,
                                transform: isAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
                                width: `${cardWidth}px`,
                              }}
                              className="absolute z-30 pointer-events-none rounded-xl border border-line bg-surface/98 backdrop-blur-md p-3 shadow-2xl text-xs whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/10"
                            >
                              <div className="flex items-center justify-between border-b border-line pb-1.5 mb-2 gap-2">
                                <span className="font-bold text-ink truncate max-w-[140px]">{active.fullLabel}</span>
                                <span className="text-[10px] font-mono font-semibold text-pine-deep bg-pine-tint px-1.5 py-0.5 rounded">
                                  {active.totalCount} {active.totalCount === 1 ? "bill" : "bills"}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-ink-soft">
                                  <span>Total:</span>
                                  <span className="font-bold font-mono text-ink text-[13px]">
                                    {formatCurrency(active.totalRevenue)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-medium">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                    Online (UPI):
                                  </span>
                                  <span className="font-semibold font-mono">
                                    {formatCurrency(active.onlineRevenue)} ({active.onlineCount})
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    Cash:
                                  </span>
                                  <span className="font-semibold font-mono">
                                    {formatCurrency(active.cashRevenue)} ({active.cashCount})
                                  </span>
                                </div>
                              </div>
                              {/* Arrow Caret */}
                              {isAbove ? (
                                <div
                                  style={{ left: `${arrowInsideCard}px` }}
                                  className="absolute top-full -mt-[1px] -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-surface drop-shadow-xs"
                                />
                              ) : (
                                <div
                                  style={{ left: `${arrowInsideCard}px` }}
                                  className="absolute bottom-full -mb-[1px] -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-b-[6px] border-b-surface drop-shadow-xs"
                                />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Donut & Order Distribution Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Payment Method Donut Chart */}
                <div className="rounded-xl border border-line bg-surface p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <PieChart size={14} className="text-pine-deep" />
                      <span>Payment Method Split</span>
                    </span>
                    <span className="text-[10px] font-mono text-ink-soft">
                      {summary.totalInvoices} Bills
                    </span>
                  </div>

                  <div className="flex items-center gap-5 my-auto py-2">
                    {/* SVG Donut Circle */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 120 120">
                        {/* Background track */}
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          className="stroke-line"
                          strokeWidth="14"
                          fill="transparent"
                        />
                        {/* Online (Blue) Arc */}
                        {onlinePercent > 0 && (
                          <circle
                            cx="60"
                            cy="60"
                            r="46"
                            stroke="#3b82f6"
                            strokeWidth="14"
                            fill="transparent"
                            strokeDasharray={`${(onlinePercent / 100) * 289.026} 289.026`}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                          />
                        )}
                        {/* Cash (Emerald) Arc */}
                        {cashPercent > 0 && (
                          <circle
                            cx="60"
                            cy="60"
                            r="46"
                            stroke="#10b981"
                            strokeWidth="14"
                            fill="transparent"
                            strokeDasharray={`${(cashPercent / 100) * 289.026} 289.026`}
                            strokeDashoffset={-((onlinePercent / 100) * 289.026)}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                          />
                        )}
                      </svg>
                      {/* Central Stat */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-[10px] font-medium text-ink-soft uppercase">Split</span>
                        <span className="text-xs font-bold text-ink font-mono">
                          {onlinePercent}:{cashPercent}
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend Cards */}
                    <div className="flex-1 space-y-2 text-xs">
                      <div className="rounded-lg border border-blue-200/60 bg-blue-50/40 dark:bg-blue-950/20 p-2.5">
                        <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 font-semibold mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            Online (UPI)
                          </span>
                          <span>{onlinePercent}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-blue-900 dark:text-blue-300/80 font-mono">
                          <span>{formatCurrency(summary.onlineRevenue)}</span>
                          <span>{summary.onlineCount} bills</span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5">
                        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            Cash (Offline)
                          </span>
                          <span>{cashPercent}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-900 dark:text-emerald-300/80 font-mono">
                          <span>{formatCurrency(summary.cashRevenue)}</span>
                          <span>{summary.cashCount} bills</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Order Value Size Distribution */}
                <div className="rounded-xl border border-line bg-surface p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Layers size={14} className="text-pine-deep" />
                      <span>Ticket Value Distribution</span>
                    </span>
                    <span className="text-[10px] font-mono text-ink-soft">
                      Avg: {formatCurrency(summary.averageInvoiceValue)}
                    </span>
                  </div>

                  <div className="space-y-3 my-auto">
                    {orderSizeDistribution.map((item) => (
                      <div key={item.label} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-ink-soft">
                          <span className="flex items-center gap-1.5 font-medium text-ink">
                            <span className={`h-2 w-2 rounded-full ${item.dotColor}`}></span>
                            {item.label}
                          </span>
                          <span className="font-mono text-ink font-semibold">
                            {item.count} bills ({item.percent}%)
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                          <div
                            style={{ width: `${item.percent}%` }}
                            className={`h-full ${item.barColor} transition-all duration-500`}
                          />
                        </div>
                        <div className="text-[10px] text-ink-soft text-right font-mono">
                          Total: {formatCurrency(item.revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Staff Sales Performance (Admin Only) */}
              {isAdmin && staffSalesData.length > 0 && (
                <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <UserIcon size={14} className="text-pine-deep" />
                      <span>Staff Sales Contribution</span>
                    </span>
                    <span className="text-[10px] text-ink-soft font-mono">
                      {staffSalesData.length} Staff Members Active
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {staffSalesData.map((staff) => (
                      <div key={staff.id} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-ink">
                            <span>{staff.username}</span>
                            <span className="text-[10px] font-normal text-ink-soft capitalize">
                              ({staff.role})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-pine-deep">
                              {formatCurrency(staff.revenue)}
                            </span>
                            <span className="text-ink-soft">
                              ({staff.count} bills • {staff.percent}%)
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                          <div
                            style={{ width: `${staff.percent}%` }}
                            className="h-full bg-pine transition-all duration-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
