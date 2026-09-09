"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Boxes, Pencil, Check, X } from "lucide-react";
import { formatMoney, StockItem } from "@/lib/types";

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    unit: string;
    price: string;
    quantity: string;
  } | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/stock", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn't load stock");
        setItems(data.items);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unit: unit || undefined,
          price: Number(price) || 0,
          quantity: Number(quantity) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't add item");
      setName("");
      setUnit("");
      setPrice("");
      setQuantity("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add item");
    } finally {
      setAdding(false);
    }
  }

  async function removeItem(id: string) {
    if (!confirm("Remove this item from stock?")) return;
    setError("");
    try {
      const res = await fetch(`/api/stock/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't remove item");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove item");
    }
  }

  function startEdit(item: StockItem) {
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      unit: item.unit ?? "",
      price: item.price,
      quantity: String(item.quantity),
    });
  }

  async function saveEdit(id: string) {
    if (!editDraft) return;
    setError("");
    try {
      const res = await fetch(`/api/stock/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editDraft.name,
          unit: editDraft.unit || undefined,
          price: Number(editDraft.price) || 0,
          quantity: Number(editDraft.quantity) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't update item");
      setEditingId(null);
      setEditDraft(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update item");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-xl font-semibold text-ink">Stock</h1>
        <p className="text-sm text-ink-soft">
          Items available to add to invoices.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-rust-tint px-3 py-2 text-sm text-rust">
          {error}
        </p>
      )}

      <form
        onSubmit={addItem}
        className="mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface p-4"
      >
        <label className="flex min-w-[160px] flex-1 flex-col gap-1">
          <span className="text-xs text-ink-soft">Item name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
          />
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-xs text-ink-soft">Unit</span>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="pcs"
            className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
          />
        </label>
        <label className="flex w-28 flex-col gap-1">
          <span className="text-xs text-ink-soft">Price</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
          />
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-xs text-ink-soft">Quantity</span>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
          />
        </label>
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-1.5 rounded-md bg-pine px-3 py-1.5 text-sm font-medium text-surface hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={15} /> Add item
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
          <Boxes className="mx-auto mb-2 text-ink-soft" size={22} />
          <p className="text-sm text-ink-soft">
            No stock items yet — add your first one above.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-flat text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 text-right font-medium">Price</th>
                <th className="px-4 py-2.5 text-right font-medium">
                  Quantity
                </th>
                <th className="w-20 px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const editing = editingId === item.id;
                const low = item.quantity <= 5;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-4 py-2.5 text-ink">
                      {editing ? (
                        <input
                          value={editDraft?.name}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, name: e.target.value } : d
                            )
                          }
                          className="w-full rounded-md border border-line-strong bg-surface px-2 py-1 text-sm outline-none focus:border-pine"
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {editing ? (
                        <input
                          value={editDraft?.unit}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, unit: e.target.value } : d
                            )
                          }
                          className="w-20 rounded-md border border-line-strong bg-surface px-2 py-1 text-sm outline-none focus:border-pine"
                        />
                      ) : (
                        item.unit || "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular text-ink">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={editDraft?.price}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, price: e.target.value } : d
                            )
                          }
                          className="w-24 rounded-md border border-line-strong bg-surface px-2 py-1 text-right text-sm outline-none focus:border-pine"
                        />
                      ) : (
                        formatMoney(Number(item.price))
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          value={editDraft?.quantity}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, quantity: e.target.value } : d
                            )
                          }
                          className="w-20 rounded-md border border-line-strong bg-surface px-2 py-1 text-right text-sm outline-none focus:border-pine"
                        />
                      ) : (
                        <span
                          className={`font-mono tabular ${
                            low ? "font-semibold text-rust" : "text-ink"
                          }`}
                        >
                          {item.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        {editing ? (
                          <>
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="rounded p-1.5 text-pine hover:bg-pine-tint"
                              aria-label="Save"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditDraft(null);
                              }}
                              className="rounded p-1.5 text-ink-soft hover:bg-line/60"
                              aria-label="Cancel"
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              className="rounded p-1.5 text-ink-soft hover:bg-line/60 hover:text-ink"
                              aria-label="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="rounded p-1.5 text-ink-soft hover:bg-rust-tint hover:text-rust"
                              aria-label="Remove"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
