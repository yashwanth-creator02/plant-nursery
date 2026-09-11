// src/app/invoices/page.tsx

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Search, X, Banknote, QrCode } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatMoney, InvoiceRecord } from "@/lib/types";

type Filter = "all" | "draft" | "final" | "cash" | "online";

function InvoicesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [versionFilter, setVersionFilter] = useState<string>(
    searchParams.get("version") || "all"
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );

  useEffect(() => {
    fetch("/api/invoices", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn't load invoices");
        setInvoices(data.invoices);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const availableVersions = useMemo(() => {
    const s = new Set<number>();
    invoices.forEach((i) => s.add(i.version || 1));
    return Array.from(s).sort((a, b) => b - a);
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (filter === "draft" && inv.status !== "draft") return false;
      if (filter === "final" && inv.status !== "final") return false;
      if (filter === "cash" && inv.paymentMode !== "cash") return false;
      if (filter === "online" && inv.paymentMode !== "online") return false;
      if (versionFilter !== "all" && String(inv.version || 1) !== versionFilter) {
        return false;
      }
      if (!q) return true;

      const num = inv.invoiceNumber?.toLowerCase() || "";
      const cust = inv.customerName?.toLowerCase() || "";
      const details = inv.customerDetails?.toLowerCase() || "";
      const creator = inv.createdByUser?.username?.toLowerCase() || "";
      const d = new Date(inv.createdAt);
      const dateStr = `${d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })} ${d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`.toLowerCase();
      const totalStr = inv.total?.toString() || "";
      const versionStr = `v${inv.version || 1} version ${inv.version || 1}`;

      return (
        num.includes(q) ||
        cust.includes(q) ||
        details.includes(q) ||
        creator.includes(q) ||
        dateStr.includes(q) ||
        totalStr.includes(q) ||
        versionStr.includes(q)
      );
    });
  }, [invoices, filter, versionFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-xl font-semibold text-ink">
            Invoices
          </h1>
          <p className="text-sm text-ink-soft">
            {user?.role === "admin"
              ? "All invoices across your team."
              : "Invoices you've created."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices..."
              className="w-full rounded-md border border-line-strong bg-surface py-1.5 pl-9 pr-8 text-sm outline-none placeholder:text-ink-soft/70 focus:border-pine"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-soft hover:text-ink"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-md border border-line-strong bg-surface p-1 text-sm flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors cursor-pointer ${
                filter === "all"
                  ? "bg-pine text-surface font-semibold shadow-xs"
                  : "text-ink-soft hover:bg-line/50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("draft")}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors cursor-pointer ${
                filter === "draft"
                  ? "bg-pine text-surface font-semibold shadow-xs"
                  : "text-ink-soft hover:bg-line/50"
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setFilter("final")}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors cursor-pointer ${
                filter === "final"
                  ? "bg-pine text-surface font-semibold shadow-xs"
                  : "text-ink-soft hover:bg-line/50"
              }`}
            >
              Final
            </button>

            <span className="mx-0.5 h-3.5 w-px bg-line-strong" aria-hidden="true" />

            <button
              onClick={() => setFilter("cash")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                filter === "cash"
                  ? "bg-pine text-surface font-semibold shadow-xs"
                  : "text-ink-soft hover:bg-line/50"
              }`}
              title="Filter by Cash payment"
            >
              <Banknote size={13} />
              <span>Cash</span>
            </button>
            <button
              onClick={() => setFilter("online")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                filter === "online"
                  ? "bg-pine text-surface font-semibold shadow-xs"
                  : "text-ink-soft hover:bg-line/50"
              }`}
              title="Filter by Online payment"
            >
              <QrCode size={13} />
              <span>Online</span>
            </button>

            {availableVersions.length > 1 && (
              <>
                <span className="mx-0.5 h-3.5 w-px bg-line-strong" aria-hidden="true" />
                <select
                  value={versionFilter}
                  onChange={(e) => setVersionFilter(e.target.value)}
                  className="rounded px-2 py-0.5 text-xs font-medium text-ink bg-transparent outline-none cursor-pointer"
                  title="Filter by invoice header version"
                >
                  <option value="all">All Versions</option>
                  {availableVersions.map((v) => (
                    <option key={v} value={String(v)}>
                      Version {v}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-rust-tint px-3 py-2 text-sm text-rust">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
          <FileText className="mx-auto mb-2 text-ink-soft" size={22} />
          <p className="text-sm text-ink-soft">
            {invoices.length === 0
              ? "No invoices yet — create your first one."
              : searchQuery || versionFilter !== "all"
              ? `No invoices match this search/version.`
              : "No invoices match this filter."}
          </p>
          {(searchQuery || versionFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setVersionFilter("all");
              }}
              className="mt-3 inline-block text-xs font-medium text-pine-deep underline hover:opacity-80"
            >
              Reset filters
            </button>
          )}
          {invoices.length === 0 && (
            <Link
              href="/invoice"
              className="mt-3 inline-block text-sm font-medium text-pine-deep underline"
            >
              New invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-flat text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-medium">Invoice</th>
                <th className="px-4 py-2.5 font-medium">Version</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Date &amp; Time</th>
                {user?.role === "admin" && (
                  <th className="px-4 py-2.5 font-medium">Created by</th>
                )}
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-line last:border-0 hover:bg-paper-flat/60"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-mono tabular text-pine-deep hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center rounded border border-line-strong/60 bg-paper-flat px-2 py-0.5 font-mono text-xs font-medium text-ink-soft">
                      Version {inv.version || 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink">
                    {inv.customerName || (
                      <span className="text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft whitespace-nowrap">
                    <div className="font-medium text-ink">
                      {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] text-ink-soft/80 font-mono">
                      {new Date(inv.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </td>
                  {user?.role === "admin" && (
                    <td className="px-4 py-2.5 text-ink-soft">
                      {inv.createdByUser?.username ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          inv.status === "final"
                            ? "bg-pine-tint text-pine-deep"
                            : "bg-rust-tint text-rust"
                        }`}
                      >
                        {inv.status}
                      </span>
                      {inv.paymentMode && (
                        <span className="rounded bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1b365d]">
                          {inv.paymentMode}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular text-ink">
                    {formatMoney(Number(inv.total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-ink-soft">Loading invoices…</div>}>
      <InvoicesContent />
    </Suspense>
  );
}
