"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatMoney, InvoiceRecord } from "@/lib/types";

type Filter = "all" | "draft" | "final";

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

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

  const filtered = useMemo(
    () =>
      filter === "all" ? invoices : invoices.filter((i) => i.status === filter),
    [invoices, filter]
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
        <div className="flex gap-1 rounded-md border border-line-strong bg-surface p-1 text-sm">
          {(["all", "draft", "final"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1 capitalize transition-colors ${
                filter === f
                  ? "bg-pine text-surface"
                  : "text-ink-soft hover:bg-line/50"
              }`}
            >
              {f}
            </button>
          ))}
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
              : "No invoices match this filter."}
          </p>
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
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-flat text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-medium">Invoice</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
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
                  <td className="px-4 py-2.5 text-ink">
                    {inv.customerName || (
                      <span className="text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">
                    {new Date(inv.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  {user?.role === "admin" && (
                    <td className="px-4 py-2.5 text-ink-soft">
                      {inv.createdByUser?.username ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        inv.status === "final"
                          ? "bg-pine-tint text-pine-deep"
                          : "bg-rust-tint text-rust"
                      }`}
                    >
                      {inv.status}
                    </span>
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
