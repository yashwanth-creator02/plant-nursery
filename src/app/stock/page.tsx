// src/app/stock/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Boxes,
  Pencil,
  Check,
  X,
  Search,
  Sprout,
  Package,
  Apple,
  Flower2,
  Trees,
  ShieldPlus,
  Sparkles,
} from "lucide-react";
import { formatMoney, StockItem } from "@/lib/types";

const PLANT_SUBCATEGORIES = [
  { id: "all", label: "All Plants", icon: Sprout },
  { id: "fruit", label: "Fruit Plants", icon: Apple },
  { id: "flower", label: "Flower Plants", icon: Flower2 },
  { id: "ornamental", label: "Ornamental Plants", icon: Trees },
  { id: "medicinal", label: "Medicinal Plants", icon: ShieldPlus },
  { id: "other", label: "Other Plants", icon: Sparkles },
];

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Category Filtering States
  const [selectedCategory, setSelectedCategory] = useState<"all" | "plants" | "non-plants">("all");
  const [selectedPlantSubcategory, setSelectedPlantSubcategory] = useState<string>("all");

  // Add Item Form States
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState<"plants" | "non-plants">("plants");
  const [subcategory, setSubcategory] = useState("fruit");
  const [adding, setAdding] = useState(false);

  // Inline Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    unit: string;
    price: string;
    quantity: string;
    category: "plants" | "non-plants";
    subcategory: string;
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

  const plantCount = useMemo(
    () => items.filter((i) => (i.category || "plants") === "plants").length,
    [items]
  );
  const nonPlantCount = useMemo(
    () => items.filter((i) => i.category === "non-plants").length,
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const itemCat = (item.category || "plants").toLowerCase();
      const itemSub = (item.subcategory || "other").toLowerCase();

      // Filter by top-level category
      if (selectedCategory !== "all" && itemCat !== selectedCategory) {
        return false;
      }

      // Filter by plant subcategory
      if (
        selectedCategory === "plants" &&
        selectedPlantSubcategory !== "all" &&
        itemSub !== selectedPlantSubcategory
      ) {
        return false;
      }

      // Filter by search query
      if (!q) return true;
      const nameMatch = item.name.toLowerCase().includes(q);
      const unitMatch = (item.unit || "").toLowerCase().includes(q);
      const priceMatch = item.price.toString().includes(q);
      const qtyMatch = item.quantity.toString().includes(q);
      const subMatch = itemSub.includes(q);
      const catMatch = itemCat.includes(q);

      return nameMatch || unitMatch || priceMatch || qtyMatch || subMatch || catMatch;
    });
  }, [items, searchQuery, selectedCategory, selectedPlantSubcategory]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || (category === "plants" ? "Plant" : "Supply Item"),
          unit: unit || "pcs",
          price: Number(price) || 0,
          quantity: Number(quantity) || 0,
          category,
          subcategory: category === "plants" ? subcategory : "general",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't add item");
      setName("");
      setUnit("pcs");
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
      unit: item.unit || "pcs",
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      category: (item.category as "plants" | "non-plants") || "plants",
      subcategory: item.subcategory || "other",
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
          name: editDraft.name.trim(),
          unit: editDraft.unit.trim() || "pcs",
          price: Number(editDraft.price) || 0,
          quantity: Number(editDraft.quantity) || 0,
          category: editDraft.category,
          subcategory: editDraft.subcategory,
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

  function renderCategoryBadge(cat?: string, sub?: string | null) {
    const isPlant = (cat || "plants") === "plants";
    if (!isPlant) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
          <Package size={11} /> Non-Plant
        </span>
      );
    }

    switch (sub) {
      case "fruit":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            <Apple size={11} /> Fruit Plant
          </span>
        );
      case "flower":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 border border-pink-200 px-2 py-0.5 text-[11px] font-medium text-pink-700">
            <Flower2 size={11} /> Flower Plant
          </span>
        );
      case "ornamental":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
            <Trees size={11} /> Ornamental
          </span>
        );
      case "medicinal":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[11px] font-medium text-teal-800">
            <ShieldPlus size={11} /> Medicinal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-pine-tint border border-pine/20 px-2 py-0.5 text-[11px] font-medium text-pine-deep">
            <Sprout size={11} /> Plant
          </span>
        );
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-xl font-semibold text-ink">Stock Inventory</h1>
          <p className="text-sm text-ink-soft">
            Manage plants, supplies, and stock items available for invoices.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-rust-tint px-3 py-2 text-sm text-rust">
          {error}
        </p>
      )}

      {/* ============================================================ */}
      {/* ADD STOCK ITEM FORM (With Category & Subcategory Selectors)   */}
      {/* ============================================================ */}
      <form
        onSubmit={addItem}
        className="mb-6 rounded-lg border border-line bg-surface p-4 shadow-xs"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Add New Item to Inventory
          </span>

          {/* Category Toggle: Side by Side Buttons */}
          <div className="flex items-center gap-1 rounded-md border border-line-strong bg-paper p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setCategory("plants")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${
                category === "plants"
                  ? "bg-surface text-pine-deep font-semibold shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Sprout size={13} />
              <span>Plants</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory("non-plants")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${
                category === "non-plants"
                  ? "bg-surface text-pine-deep font-semibold shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Package size={13} />
              <span>Non-Plants</span>
            </button>
          </div>
        </div>

        {/* Plant Subcategory Selector (When Plants selected) */}
        {category === "plants" && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink-soft mr-1">Plant Type:</span>
            {PLANT_SUBCATEGORIES.filter((s) => s.id !== "all").map((sub) => {
              const Icon = sub.icon;
              const isSelected = subcategory === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubcategory(sub.id)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-pine text-surface font-semibold shadow-xs"
                      : "border border-line bg-paper-flat/80 text-ink-soft hover:bg-surface hover:text-ink"
                  }`}
                >
                  <Icon size={12} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Non-Plants Notice (When Non-Plants selected) */}
        {category === "non-plants" && (
          <div className="mb-3 rounded-md bg-paper-flat px-3 py-1.5 text-xs text-ink-soft">
            Adding non-plant supplies (Pots, Soil, Tools, Fertilizers). Future subcategories can be organized here.
          </div>
        )}

        {/* Inputs row */}
        <div className="flex flex-wrap items-end gap-2.5">
          <label className="flex w-full sm:min-w-[180px] sm:flex-1 flex-col gap-1">
            <span className="text-xs text-ink-soft">
              {category === "plants" ? "Plant name" : "Item name"}
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={category === "plants" ? "e.g. Alphonso Mango, Kashmiri Rose" : "e.g. 10-inch Clay Pot, Vermicompost"}
              className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
            />
          </label>

          <div className="flex w-full sm:w-auto flex-wrap sm:flex-nowrap items-end gap-2">
            <label className="flex w-20 flex-col gap-1">
              <span className="text-xs text-ink-soft">Unit</span>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs"
                className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
              />
            </label>
            <label className="flex w-24 flex-col gap-1">
              <span className="text-xs text-ink-soft">Price (₹)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
              />
            </label>
            <label className="flex w-20 flex-col gap-1">
              <span className="text-xs text-ink-soft">Quantity</span>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
              />
            </label>
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-1.5 rounded-md bg-pine px-4 py-1.5 text-sm font-semibold text-surface shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <Plus size={15} /> Add item
            </button>
          </div>
        </div>
      </form>

      {/* ============================================================ */}
      {/* CATEGORY FILTER: Above Total Inventory Line with Side-by-Side Icons */}
      {/* ============================================================ */}
      <div className="mb-4 flex flex-col gap-2.5">
        {/* Main Category Bar (Side by Side Icons) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedPlantSubcategory("all");
            }}
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "border-pine bg-pine text-surface shadow-xs"
                : "border-line-strong bg-surface text-ink-soft hover:bg-line/40 hover:text-ink"
            }`}
          >
            <Boxes size={15} />
            <span>All Items</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                selectedCategory === "all"
                  ? "bg-white/25 text-surface"
                  : "bg-line/70 text-ink"
              }`}
            >
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory("plants");
              setSelectedPlantSubcategory("all");
            }}
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === "plants"
                ? "border-pine bg-pine text-surface shadow-xs"
                : "border-line-strong bg-surface text-ink-soft hover:bg-line/40 hover:text-ink"
            }`}
          >
            <Sprout size={15} />
            <span>Plants</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                selectedCategory === "plants"
                  ? "bg-white/25 text-surface"
                  : "bg-pine-tint text-pine-deep"
              }`}
            >
              {plantCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory("non-plants");
              setSelectedPlantSubcategory("all");
            }}
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === "non-plants"
                ? "border-pine bg-pine text-surface shadow-xs"
                : "border-line-strong bg-surface text-ink-soft hover:bg-line/40 hover:text-ink"
            }`}
          >
            <Package size={15} />
            <span>Non-Plants</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                selectedCategory === "non-plants"
                  ? "bg-white/25 text-surface"
                  : "bg-line/70 text-ink"
              }`}
            >
              {nonPlantCount}
            </span>
          </button>
        </div>

        {/* Secondary Subcategories Row for Plants (Side by Side Icons) */}
        {selectedCategory === "plants" && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-pine/20 bg-pine-tint/25 p-2 animate-in fade-in duration-150">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-pine-deep">
              Plant Types:
            </span>
            {PLANT_SUBCATEGORIES.map((sub) => {
              const Icon = sub.icon;
              const active = selectedPlantSubcategory === sub.id;
              const count =
                sub.id === "all"
                  ? plantCount
                  : items.filter(
                      (i) => (i.category || "plants") === "plants" && i.subcategory === sub.id,
                    ).length;

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedPlantSubcategory(sub.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-pine text-surface font-semibold shadow-xs"
                      : "bg-surface/90 text-ink-soft hover:bg-surface hover:text-ink border border-line"
                  }`}
                >
                  <Icon size={13} />
                  <span>{sub.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.1 text-[10px] ${
                      active ? "bg-white/25 text-surface font-bold" : "text-ink-soft/70"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Non-Plants Info Row */}
        {selectedCategory === "non-plants" && (
          <div className="flex items-center justify-between rounded-lg border border-line bg-paper-flat px-3 py-2 text-xs text-ink-soft animate-in fade-in duration-150">
            <span>Showing non-plant supplies and materials.</span>
            <span className="text-[11px] font-medium text-pine-deep">
              (More subcategories: Fertilizers, Pots, Tools coming soon)
            </span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* TOTAL INVENTORY SUMMARY & SEARCH BAR                         */}
      {/* ============================================================ */}
      {items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-ink-soft">
            {searchQuery || selectedCategory !== "all" || selectedPlantSubcategory !== "all" ? (
              <span>
                Showing <strong className="text-ink">{filteredItems.length}</strong> of{" "}
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            ) : (
              <span>
                Total inventory: <strong className="text-ink">{items.length}</strong>{" "}
                {items.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, type, price..."
              className="w-full rounded-md border border-line-strong bg-surface py-1.5 pl-9 pr-8 text-sm outline-none placeholder:text-ink-soft/70 focus:border-pine"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-soft hover:text-ink cursor-pointer"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STOCK ITEMS TABLE / LIST                                     */}
      {/* ============================================================ */}
      {loading ? (
        <p className="text-sm text-ink-soft">Loading stock…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
          <Boxes className="mx-auto mb-2 text-ink-soft" size={22} />
          <p className="text-sm text-ink-soft">
            No stock items yet — add your first plant or item above.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
          <Boxes className="mx-auto mb-2 text-ink-soft" size={22} />
          <p className="text-sm text-ink-soft">
            {searchQuery
              ? `No stock items match "${searchQuery}".`
              : "No stock items match this category filter."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedPlantSubcategory("all");
            }}
            className="mt-3 inline-block text-xs font-medium text-pine-deep underline hover:opacity-80 cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-flat text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 text-right font-medium">Price</th>
                <th className="px-4 py-2.5 text-right font-medium">Quantity</th>
                <th className="w-20 px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const editing = editingId === item.id;
                const low = item.quantity <= 5;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-line last:border-0 hover:bg-paper-flat/40"
                  >
                    {/* Item Name */}
                    <td className="px-4 py-2.5 text-ink font-medium">
                      {editing ? (
                        <input
                          value={editDraft?.name}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, name: e.target.value } : d,
                            )
                          }
                          className="w-full rounded-md border border-line-strong bg-surface px-2 py-1 text-sm outline-none focus:border-pine"
                        />
                      ) : (
                        item.name
                      )}
                    </td>

                    {/* Category & Subcategory */}
                    <td className="px-4 py-2.5">
                      {editing ? (
                        <div className="flex flex-col gap-1">
                          <select
                            value={editDraft?.category}
                            onChange={(e) =>
                              setEditDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      category: e.target.value as "plants" | "non-plants",
                                    }
                                  : d,
                              )
                            }
                            className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-xs outline-none focus:border-pine"
                          >
                            <option value="plants">Plants</option>
                            <option value="non-plants">Non-Plants</option>
                          </select>
                          {editDraft?.category === "plants" && (
                            <select
                              value={editDraft?.subcategory}
                              onChange={(e) =>
                                setEditDraft((d) =>
                                  d ? { ...d, subcategory: e.target.value } : d,
                                )
                              }
                              className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-[11px] outline-none focus:border-pine"
                            >
                              <option value="fruit">Fruit Plants</option>
                              <option value="flower">Flower Plants</option>
                              <option value="ornamental">Ornamental Plants</option>
                              <option value="medicinal">Medicinal Plants</option>
                              <option value="other">Other Plants</option>
                            </select>
                          )}
                        </div>
                      ) : (
                        renderCategoryBadge(item.category, item.subcategory)
                      )}
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-2.5 text-ink-soft">
                      {editing ? (
                        <input
                          value={editDraft?.unit}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, unit: e.target.value } : d,
                            )
                          }
                          className="w-16 rounded-md border border-line-strong bg-surface px-2 py-1 text-sm outline-none focus:border-pine"
                        />
                      ) : (
                        item.unit || "pcs"
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-2.5 text-right font-mono tabular text-ink">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={editDraft?.price}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, price: e.target.value } : d,
                            )
                          }
                          className="w-20 rounded-md border border-line-strong bg-surface px-2 py-1 text-right text-sm outline-none focus:border-pine"
                        />
                      ) : (
                        formatMoney(Number(item.price))
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-2.5 text-right">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          value={editDraft?.quantity}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, quantity: e.target.value } : d,
                            )
                          }
                          className="w-16 rounded-md border border-line-strong bg-surface px-2 py-1 text-right text-sm outline-none focus:border-pine"
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

                    {/* Actions */}
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        {editing ? (
                          <>
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="rounded p-1.5 text-pine hover:bg-pine-tint cursor-pointer"
                              aria-label="Save"
                              title="Save changes"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditDraft(null);
                              }}
                              className="rounded p-1.5 text-ink-soft hover:bg-line/60 cursor-pointer"
                              aria-label="Cancel"
                              title="Cancel edit"
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              className="rounded p-1.5 text-ink-soft hover:bg-line/60 hover:text-ink cursor-pointer"
                              aria-label="Edit"
                              title="Edit item"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="rounded p-1.5 text-ink-soft hover:bg-rust-tint hover:text-rust cursor-pointer"
                              aria-label="Remove"
                              title="Delete item"
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
