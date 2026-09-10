// src/components/InvoiceEditor.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Printer, Save, FilePlus2, Trash2, Lock } from "lucide-react";
import {
  formatMoney,
  InvoiceLineItem,
  InvoiceRecord,
  StockItem,
} from "@/lib/types";

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `line-${Date.now()}-${keyCounter}`;
}

export function InvoiceEditor({
  initialInvoice,
}: {
  initialInvoice?: InvoiceRecord;
}) {
  const router = useRouter();
  const isFinal = initialInvoice?.status === "final";

  const [invoiceId, setInvoiceId] = useState(initialInvoice?.id ?? null);
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice?.invoiceNumber ?? null,
  );
  const [status, setStatus] = useState<"draft" | "final">(
    initialInvoice?.status ?? "draft",
  );
  const [customerName, setCustomerName] = useState(
    initialInvoice?.customerName ?? "",
  );
  const [customerDetails, setCustomerDetails] = useState(
    initialInvoice?.customerDetails ?? "",
  );
  const [notes, setNotes] = useState(initialInvoice?.notes ?? "");
  const [items, setItems] = useState<InvoiceLineItem[]>(
    initialInvoice?.items.map((i) => ({
      key: newKey(),
      stockItemId: i.stockItemId,
      name: i.name,
      price: Number(i.price),
      quantity: i.quantity,
    })) ?? [],
  );

  const [stock, setStock] = useState<StockItem[]>([]);
  const [pickerStockId, setPickerStockId] = useState("");
  const [pickerQty, setPickerQty] = useState("1");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");

  const [saving, setSaving] = useState<"draft" | "final" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isFinal) {
      fetch("/api/stock", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setStock(d.items ?? []))
        .catch(() => {});
    }
  }, [isFinal]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const dateLabel = new Date(
    initialInvoice?.createdAt ?? Date.now(),
  ).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  function addStockItem() {
    const stockItem = stock.find((s) => s.id === pickerStockId);
    if (!stockItem) return;
    const qty = Math.max(1, parseInt(pickerQty, 10) || 1);
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        stockItemId: stockItem.id,
        name: stockItem.name,
        price: Number(stockItem.price),
        quantity: qty,
      },
    ]);
    setPickerStockId("");
    setPickerQty("1");
  }

  function addCustomItem() {
    if (!customName.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        stockItemId: null,
        name: customName.trim(),
        price: Number(customPrice) || 0,
        quantity: Number(customQty) || 1,
      },
    ]);
    setCustomName("");
    setCustomPrice("");
    setCustomQty("1");
    setCustomMode(false);
  }

  function updateItem(key: string, patch: Partial<InvoiceLineItem>) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, ...patch } : i)),
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function resetForm() {
    setInvoiceId(null);
    setInvoiceNumber(null);
    setStatus("draft");
    setCustomerName("");
    setCustomerDetails("");
    setNotes("");
    setItems([]);
    setError("");
  }

  async function persist(action: "draft" | "final") {
    if (items.length === 0) {
      setError("Add at least one item before saving.");
      return;
    }
    setSaving(action);
    setError("");
    try {
      const payload = {
        customerName,
        customerDetails,
        notes,
        items: items.map((i) => ({
          stockItemId: i.stockItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      };

      let res: Response;
      if (invoiceId) {
        res = await fetch(`/api/invoices/${invoiceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            action: action === "final" ? "finalize" : "save",
          }),
        });
      } else {
        res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            status: action === "final" ? "final" : "draft",
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save invoice");

      const saved = data.invoice as InvoiceRecord;
      setInvoiceId(saved.id);
      setInvoiceNumber(saved.invoiceNumber);
      setStatus(saved.status);

      if (action === "final") {
        router.push(`/invoices/${saved.id}`);
        setTimeout(() => window.print(), 300);
      } else if (!initialInvoice) {
        router.replace(`/invoices/${saved.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save invoice");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-serif text-xl font-semibold text-ink">
            {isFinal ? "Invoice" : invoiceId ? "Edit draft" : "New invoice"}
          </h1>
          {status === "draft" && (
            <span className="mt-0.5 inline-block rounded-full bg-rust-tint px-2 py-0.5 text-xs font-medium text-rust">
              Draft — not yet finalized
            </span>
          )}
        </div>
        <button
          onClick={() => {
            resetForm();
            router.push("/invoice");
          }}
          className="flex items-center gap-1.5 rounded-md border border-line-strong px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-line/50"
        >
          <FilePlus2 size={15} /> New invoice
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-rust-tint px-3 py-2 text-sm text-rust print:hidden">
          {error}
        </p>
      )}

      {/* The paper invoice itself */}
      <div
        id="invoice-print"
        className="rounded-lg border border-line bg-surface px-8 py-8 shadow-sm print:rounded-none print:border-none print:shadow-none"
      >
        <div className="mb-8 flex items-start justify-between border-b border-line pb-6">
          <div>
            <div className="font-serif text-2xl font-semibold text-pine-deep">
              Ledger
            </div>
            <div className="mt-1 text-xs text-ink-soft">
              Invoice generated {dateLabel}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-ink-soft">
              Invoice No.
            </div>
            <div className="font-mono text-lg tabular text-ink">
              {invoiceNumber ?? "—"}
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <div className="mb-1 text-xs uppercase tracking-wide text-ink-soft">
              Billed to
            </div>
            {isFinal ? (
              <>
                <div className="text-sm font-medium text-ink">
                  {customerName || "—"}
                </div>
                {customerDetails && (
                  <div className="whitespace-pre-line text-sm text-ink-soft">
                    {customerDetails}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
                />
                <textarea
                  value={customerDetails}
                  onChange={(e) => setCustomerDetails(e.target.value)}
                  placeholder="Address, phone, GSTIN, etc. (optional)"
                  rows={2}
                  className="resize-none rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
                />
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="mb-1 text-xs uppercase tracking-wide text-ink-soft">
              Status
            </div>
            <div className="text-sm font-medium capitalize text-ink">
              {status}
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line-strong text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="py-2 pr-2 font-medium">Item</th>
              <th className="w-20 py-2 px-2 text-right font-medium">Qty</th>
              <th className="w-28 py-2 px-2 text-right font-medium">Price</th>
              <th className="w-32 py-2 pl-2 text-right font-medium">Amount</th>
              {!isFinal && <th className="w-8"></th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-sm text-ink-soft"
                >
                  No items yet. Add one below.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.key} className="border-b border-line">
                <td className="py-2 pr-2 text-ink">{item.name}</td>
                <td className="py-2 px-2 text-right">
                  {isFinal ? (
                    <span className="font-mono tabular">{item.quantity}</span>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.key, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-16 rounded-md border border-line-strong bg-surface px-2 py-1 text-right font-mono tabular outline-none focus:border-pine"
                    />
                  )}
                </td>
                <td className="py-2 px-2 text-right">
                  {isFinal ? (
                    <span className="font-mono tabular">
                      {formatMoney(item.price)}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.key, {
                          price: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-24 rounded-md border border-line-strong bg-surface px-2 py-1 text-right font-mono tabular outline-none focus:border-pine"
                    />
                  )}
                </td>
                <td className="py-2 pl-2 text-right font-mono tabular text-ink">
                  {formatMoney(item.price * item.quantity)}
                </td>
                {!isFinal && (
                  <td className="py-2 pl-1 text-right">
                    <button
                      onClick={() => removeItem(item.key)}
                      className="rounded p-1 text-ink-soft hover:bg-rust-tint hover:text-rust"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add item row */}
        {!isFinal && (
          <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-dashed border-line pt-4 print:hidden">
            {!customMode ? (
              <>
                <label className="flex flex-1 min-w-[180px] flex-col gap-1">
                  <span className="text-xs text-ink-soft">Add from stock</span>
                  <select
                    value={pickerStockId}
                    onChange={(e) => setPickerStockId(e.target.value)}
                    className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
                  >
                    <option value="">Select an item…</option>
                    {stock.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {formatMoney(Number(s.price))} ({s.quantity}{" "}
                        {s.unit || "pcs"} in stock)
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex w-20 flex-col gap-1">
                  <span className="text-xs text-ink-soft">Qty</span>
                  <input
                    type="number"
                    min={1}
                    value={pickerQty}
                    onChange={(e) => setPickerQty(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addStockItem();
                      }
                    }}
                    className="rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm outline-none focus:border-pine"
                  />
                </label>
                <button
                  onClick={addStockItem}
                  disabled={!pickerStockId}
                  className="flex items-center gap-1.5 rounded-md bg-pine px-3 py-1.5 text-sm font-medium text-surface hover:opacity-90 disabled:opacity-50"
                >
                  <Plus size={15} /> Add
                </button>
                <button
                  onClick={() => setCustomMode(true)}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-pine-deep hover:underline"
                >
                  + Custom line item
                </button>
              </>
            ) : (
              <>
                <label className="flex flex-1 min-w-[140px] flex-col gap-1">
                  <span className="text-xs text-ink-soft">Description</span>
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
                  />
                </label>
                <label className="flex w-20 flex-col gap-1">
                  <span className="text-xs text-ink-soft">Qty</span>
                  <input
                    type="number"
                    min={1}
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    className="rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm outline-none focus:border-pine"
                  />
                </label>
                <label className="flex w-24 flex-col gap-1">
                  <span className="text-xs text-ink-soft">Price</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm outline-none focus:border-pine"
                  />
                </label>
                <button
                  onClick={addCustomItem}
                  className="flex items-center gap-1.5 rounded-md bg-pine px-3 py-1.5 text-sm font-medium text-surface hover:opacity-90"
                >
                  <Plus size={15} /> Add
                </button>
                <button
                  onClick={() => setCustomMode(false)}
                  className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:underline"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="mt-6 flex justify-end border-t border-line-strong pt-4">
          <div className="w-56">
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">Total</span>
              <span className="font-mono text-base font-semibold tabular text-ink">
                {formatMoney(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6 border-t border-line pt-4">
          <div className="mb-1 text-xs uppercase tracking-wide text-ink-soft">
            Notes
          </div>
          {isFinal ? (
            notes ? (
              <p className="whitespace-pre-line text-sm text-ink-soft">
                {notes}
              </p>
            ) : null
          ) : (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, thank-you note, etc. (optional)"
              rows={2}
              className="w-full resize-none rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
            />
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-rust-tint px-3 py-2 text-sm text-rust print:hidden">
          {error}
        </p>
      )}

      {/* Action buttons at bottom of invoice */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 print:hidden">
        {!isFinal && (
          <>
            <button
              onClick={() => persist("draft")}
              disabled={saving !== null}
              className="flex items-center gap-1.5 rounded-md border border-line-strong px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/50 disabled:opacity-50"
            >
              <Save size={15} />
              {saving === "draft" ? "Saving…" : "Save as draft"}
            </button>
            <button
              onClick={() => persist("final")}
              disabled={saving !== null}
              className="flex items-center gap-1.5 rounded-md bg-pine px-4 py-2 text-sm font-medium text-surface shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Lock size={15} />
              {saving === "final" ? "Finalizing…" : "Finalize & print"}
            </button>
          </>
        )}
        {isFinal && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-md bg-pine px-4 py-2 text-sm font-medium text-surface shadow-sm transition-opacity hover:opacity-90"
          >
            <Printer size={15} /> Print invoice
          </button>
        )}
      </div>
    </div>
  );
}
