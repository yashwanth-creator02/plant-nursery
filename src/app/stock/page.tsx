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
  Layers,
  FlaskConical,
  Shovel,
  Wrench,
  Tag,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { formatMoney, StockItem, StockSubcategory, GalleryStockItem } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { StockItemDetailModal } from "@/components/StockItemDetailModal";
import { StockPhotoUploadModal } from "@/components/StockPhotoUploadModal";

const DEFAULT_PLANT_SUBS: StockSubcategory[] = [
  { id: "fruit", category: "plants", name: "Fruit Plants", slug: "fruit" },
  { id: "flower", category: "plants", name: "Flower Plants", slug: "flower" },
  { id: "ornamental", category: "plants", name: "Ornamental Plants", slug: "ornamental" },
  { id: "medicinal", category: "plants", name: "Medicinal Plants", slug: "medicinal" },
  { id: "other", category: "plants", name: "Other Plants", slug: "other" },
];

const DEFAULT_NON_PLANT_SUBS: StockSubcategory[] = [
  { id: "pots", category: "non-plants", name: "Pots & Planters", slug: "pots" },
  { id: "fertilizers", category: "non-plants", name: "Fertilizers & Manure", slug: "fertilizers" },
  { id: "soil", category: "non-plants", name: "Soil & Substrates", slug: "soil" },
  { id: "tools", category: "non-plants", name: "Gardening Tools", slug: "tools" },
  { id: "general", category: "non-plants", name: "General Supplies", slug: "general" },
];

function getSubcategoryIcon(slug: string, category: "plants" | "non-plants") {
  const s = slug.toLowerCase();
  switch (s) {
    // Plants
    case "fruit":
      return Apple;
    case "flower":
      return Flower2;
    case "ornamental":
      return Trees;
    case "medicinal":
      return ShieldPlus;
    case "other":
      return Sparkles;
    // Non-plants
    case "pots":
      return Layers;
    case "fertilizers":
      return FlaskConical;
    case "soil":
      return Shovel;
    case "tools":
      return Wrench;
    case "general":
      return Package;
    default:
      return category === "plants" ? Sprout : Tag;
  }
}

export default function StockPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState<GalleryStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Subcategories from Database
  const [subcategories, setSubcategories] = useState<StockSubcategory[]>([]);

  // Category & Subcategory Filtering States
  const [selectedCategory, setSelectedCategory] = useState<"all" | "plants" | "non-plants">("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // In-place Add Subcategory States
  const [isAddingSub, setIsAddingSub] = useState<"plants" | "non-plants" | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [savingSub, setSavingSub] = useState(false);
  const [subError, setSubError] = useState("");

  // Detail & Upload Modal States
  const [selectedItem, setSelectedItem] = useState<GalleryStockItem | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetItemId, setUploadTargetItemId] = useState<string>("");

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

  function loadSubcategories() {
    fetch("/api/stock/subcategories", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && Array.isArray(data.subcategories) && data.subcategories.length > 0) {
          setSubcategories(data.subcategories);
        }
      })
      .catch((e) => console.error("Could not load subcategories:", e));
  }

  useEffect(() => {
    load();
    loadSubcategories();
  }, []);

  // Modal Handlers
  const openDetailModal = (item: GalleryStockItem) => {
    setSelectedItem(item);
  };

  const closeDetailModal = () => {
    setSelectedItem(null);
  };

  const handleItemUpdated = (updatedItem: GalleryStockItem) => {
    setSelectedItem(updatedItem);
    setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
  };

  const handleImageDeleted = (itemId: string, imageId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, images: i.images.filter((img) => img.id !== imageId) }
          : i
      )
    );
    if (selectedItem?.id === itemId) {
      setSelectedItem((prev) =>
        prev
          ? { ...prev, images: prev.images.filter((img) => img.id !== imageId) }
          : null
      );
    }
  };

  const openUploadModal = (targetStockItemId?: string) => {
    setUploadTargetItemId(targetStockItemId || (items[0]?.id ?? ""));
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
  };

  const handleUploadSuccess = async (updatedItemId: string) => {
    await load();
    try {
      const res = await fetch("/api/stock", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const updated = (data.items || []).find((x: GalleryStockItem) => x.id === updatedItemId);
        if (updated && selectedItem?.id === updatedItemId) {
          setSelectedItem(updated);
        }
      }
    } catch {}
  };

  async function handleDeleteSubcategory(e: React.MouseEvent, sub: StockSubcategory) {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete the "${sub.name}" subcategory?`)) {
      return;
    }

    setSubError("");
    try {
      const res = await fetch(`/api/stock/subcategories?id=${sub.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete subcategory");
      }

      setSubcategories((prev) => prev.filter((s) => s.id !== sub.id));
      if (selectedSubcategory === sub.slug) {
        setSelectedSubcategory("all");
      }
      load();
    } catch (err) {
      setSubError(err instanceof Error ? err.message : "Failed to delete subcategory");
    }
  }

  const plantSubcategories = useMemo(() => {
    const fromDb = subcategories.filter((s) => s.category === "plants");
    return fromDb.length > 0 ? fromDb : DEFAULT_PLANT_SUBS;
  }, [subcategories]);

  const nonPlantSubcategories = useMemo(() => {
    const fromDb = subcategories.filter((s) => s.category === "non-plants");
    return fromDb.length > 0 ? fromDb : DEFAULT_NON_PLANT_SUBS;
  }, [subcategories]);

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
      const itemSub = (item.subcategory || (itemCat === "plants" ? "other" : "general")).toLowerCase();

      // Filter by top-level category
      if (selectedCategory !== "all" && itemCat !== selectedCategory) {
        return false;
      }

      // Filter by subcategory
      if (
        selectedCategory !== "all" &&
        selectedSubcategory !== "all" &&
        itemSub !== selectedSubcategory.toLowerCase()
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
  }, [items, searchQuery, selectedCategory, selectedSubcategory]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      const chosenSubcategory =
        subcategory ||
        (category === "plants"
          ? plantSubcategories[0]?.slug || "fruit"
          : nonPlantSubcategories[0]?.slug || "general");

      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || (category === "plants" ? "Plant" : "Supply Item"),
          unit: unit || "pcs",
          price: Number(price) || 0,
          quantity: Number(quantity) || 0,
          category,
          subcategory: chosenSubcategory,
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
    const isPlant = (item.category || "plants") === "plants";
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      unit: item.unit || "pcs",
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      category: (item.category as "plants" | "non-plants") || "plants",
      subcategory:
        item.subcategory ||
        (isPlant
          ? plantSubcategories[0]?.slug || "fruit"
          : nonPlantSubcategories[0]?.slug || "general"),
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

  async function handleCreateSubcategory(e: React.FormEvent) {
    e.preventDefault();
    if (!isAddingSub || !newSubName.trim()) return;

    setSavingSub(true);
    setSubError("");
    try {
      const res = await fetch("/api/stock/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubName.trim(),
          category: isAddingSub,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add subcategory");

      const created: StockSubcategory = data.subcategory;
      setSubcategories((prev) => {
        if (prev.some((s) => s.category === created.category && s.slug === created.slug)) {
          return prev;
        }
        return [...prev, created];
      });

      // Select the new subcategory in filter and form
      setSelectedSubcategory(created.slug);
      setSubcategory(created.slug);

      // Reset inline form
      setIsAddingSub(null);
      setNewSubName("");
    } catch (err) {
      setSubError(err instanceof Error ? err.message : "Failed to add subcategory");
    } finally {
      setSavingSub(false);
    }
  }

  function renderCategoryBadge(cat?: string, sub?: string | null) {
    const isPlant = (cat || "plants") === "plants";
    const currentSub = (sub || (isPlant ? "other" : "general")).toLowerCase();

    const currentList = isPlant ? plantSubcategories : nonPlantSubcategories;
    const foundSub = currentList.find((s) => s.slug.toLowerCase() === currentSub);
    const label =
      foundSub?.name ||
      (currentSub.charAt(0).toUpperCase() + currentSub.slice(1));
    const Icon = getSubcategoryIcon(currentSub, isPlant ? "plants" : "non-plants");

    if (!isPlant) {
      let colorClasses = "bg-slate-100 border-slate-200 text-slate-700";
      if (currentSub === "pots") {
        colorClasses = "bg-amber-50/90 border-amber-200 text-amber-800";
      } else if (currentSub === "fertilizers") {
        colorClasses = "bg-blue-50 border-blue-200 text-blue-800";
      } else if (currentSub === "soil") {
        colorClasses = "bg-stone-100 border-stone-200 text-stone-800";
      } else if (currentSub === "tools") {
        colorClasses = "bg-violet-50 border-violet-200 text-violet-800";
      }

      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${colorClasses}`}
        >
          <Icon size={11} />
          <span>{label}</span>
        </span>
      );
    }

    let colorClasses = "bg-pine-tint border-pine/20 text-pine-deep";
    if (currentSub === "fruit") {
      colorClasses = "bg-amber-50 border-amber-200 text-amber-800";
    } else if (currentSub === "flower") {
      colorClasses = "bg-pink-50 border-pink-200 text-pink-700";
    } else if (currentSub === "ornamental") {
      colorClasses = "bg-emerald-50 border-emerald-200 text-emerald-800";
    } else if (currentSub === "medicinal") {
      colorClasses = "bg-teal-50 border-teal-200 text-teal-800";
    }

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${colorClasses}`}
      >
        <Icon size={11} />
        <span>{label}</span>
      </span>
    );
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
              onClick={() => {
                setCategory("plants");
                setSubcategory(plantSubcategories[0]?.slug || "fruit");
              }}
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
              onClick={() => {
                setCategory("non-plants");
                setSubcategory(nonPlantSubcategories[0]?.slug || "pots");
              }}
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

        {/* Subcategory Selector for Plants */}
        {category === "plants" && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink-soft mr-1">Plant Type:</span>
            {plantSubcategories.map((sub) => {
              const Icon = getSubcategoryIcon(sub.slug, "plants");
              const isSelected = subcategory === sub.slug;
              return (
                <button
                  key={sub.slug}
                  type="button"
                  onClick={() => setSubcategory(sub.slug)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-pine text-surface font-semibold shadow-xs"
                      : "border border-line bg-paper-flat/80 text-ink-soft hover:bg-surface hover:text-ink"
                  }`}
                >
                  <Icon size={12} />
                  <span>{sub.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Subcategory Selector for Non-Plants */}
        {category === "non-plants" && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink-soft mr-1">Item Type:</span>
            {nonPlantSubcategories.map((sub) => {
              const Icon = getSubcategoryIcon(sub.slug, "non-plants");
              const isSelected = subcategory === sub.slug;
              return (
                <button
                  key={sub.slug}
                  type="button"
                  onClick={() => setSubcategory(sub.slug)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-pine text-surface font-semibold shadow-xs"
                      : "border border-line bg-paper-flat/80 text-ink-soft hover:bg-surface hover:text-ink"
                  }`}
                >
                  <Icon size={12} />
                  <span>{sub.name}</span>
                </button>
              );
            })}
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
              placeholder={
                category === "plants"
                  ? "e.g. Alphonso Mango, Kashmiri Rose"
                  : "e.g. 10-inch Clay Pot, Vermicompost"
              }
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
      {/* CATEGORY FILTER & TYPES DISPLAY WITH '+' IN-PLACE ADDITION    */}
      {/* ============================================================ */}
      <div className="mb-4 flex flex-col gap-2.5">
        {/* Main Category Bar (Side by Side Icons) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedSubcategory("all");
              setIsAddingSub(null);
              setSubError("");
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
              setSelectedSubcategory("all");
              setIsAddingSub(null);
              setSubError("");
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
              setSelectedSubcategory("all");
              setIsAddingSub(null);
              setSubError("");
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

        {/* Secondary Subcategories Row for Plants with in-place '+' */}
        {selectedCategory === "plants" && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-pine/20 bg-pine-tint/25 p-2 animate-in fade-in duration-150">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-pine-deep">
              Plant Types:
            </span>

            {/* "All Plants" pill */}
            <button
              type="button"
              onClick={() => setSelectedSubcategory("all")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                selectedSubcategory === "all"
                  ? "bg-pine text-surface font-semibold shadow-xs"
                  : "bg-surface/90 text-ink-soft hover:bg-surface hover:text-ink border border-line"
              }`}
            >
              <Sprout size={13} />
              <span>All Plants</span>
              <span
                className={`rounded-full px-1.5 py-0.1 text-[10px] ${
                  selectedSubcategory === "all"
                    ? "bg-white/25 text-surface font-bold"
                    : "text-ink-soft/70"
                }`}
              >
                {plantCount}
              </span>
            </button>

            {/* Dynamic plant subcategories */}
            {plantSubcategories.map((sub) => {
              const Icon = getSubcategoryIcon(sub.slug, "plants");
              const active = selectedSubcategory === sub.slug;
              const count = items.filter(
                (i) =>
                  (i.category || "plants") === "plants" &&
                  (i.subcategory || "other").toLowerCase() === sub.slug.toLowerCase()
              ).length;

              return (
                <div
                  key={sub.slug}
                  onClick={() => setSelectedSubcategory(sub.slug)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none ${
                    active
                      ? "bg-pine text-surface font-semibold shadow-xs"
                      : "bg-surface/90 text-ink-soft hover:bg-surface hover:text-ink border border-line"
                  }`}
                >
                  <Icon size={13} />
                  <span>{sub.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.1 text-[10px] ${
                      active ? "bg-white/25 text-surface font-bold" : "text-ink-soft/70"
                    }`}
                  >
                    {count}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSubcategory(e, sub)}
                      className={`ml-0.5 rounded p-0.5 transition-colors cursor-pointer ${
                        active
                          ? "text-white/80 hover:bg-white/20 hover:text-white"
                          : "text-ink-soft/70 hover:bg-rust-tint hover:text-rust"
                      }`}
                      title={`Delete "${sub.name}" plant type (Admin only)`}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* In-place '+' Button / Input Form for Plants */}
            {isAddingSub === "plants" ? (
              <form
                onSubmit={handleCreateSubcategory}
                className="flex items-center gap-1 rounded-md border border-pine bg-surface px-1.5 py-0.5 shadow-xs animate-in fade-in duration-100"
              >
                <input
                  type="text"
                  autoFocus
                  value={newSubName}
                  onChange={(e) => {
                    setNewSubName(e.target.value);
                    if (subError) setSubError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsAddingSub(null);
                      setNewSubName("");
                      setSubError("");
                    }
                  }}
                  placeholder="e.g. Succulents, Bonsai"
                  disabled={savingSub}
                  className="w-32 sm:w-40 rounded px-1.5 py-0.5 text-xs text-ink placeholder:text-ink-soft/60 outline-none"
                />
                <button
                  type="submit"
                  disabled={savingSub || !newSubName.trim()}
                  className="flex items-center justify-center rounded bg-pine p-1 text-surface hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  title="Save plant type"
                >
                  {savingSub ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSub(null);
                    setNewSubName("");
                    setSubError("");
                  }}
                  className="flex items-center justify-center rounded p-1 text-ink-soft hover:bg-line/60 cursor-pointer"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsAddingSub("plants");
                  setNewSubName("");
                  setSubError("");
                }}
                className="flex items-center gap-1 rounded-md border border-dashed border-pine/40 bg-surface/80 px-2 py-1 text-xs font-semibold text-pine-deep hover:border-pine hover:bg-pine-tint/40 transition-all cursor-pointer shadow-2xs"
                title="Add new plant subcategory"
              >
                <Plus size={13} />
                <span>Add Type</span>
              </button>
            )}

            {subError && isAddingSub === "plants" && (
              <span className="text-[11px] font-medium text-rust ml-1">{subError}</span>
            )}
          </div>
        )}

        {/* Secondary Subcategories Row for Non-Plants with in-place '+' */}
        {selectedCategory === "non-plants" && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2 animate-in fade-in duration-150">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Non-Plant Types:
            </span>

            {/* "All Non-Plants" pill */}
            <button
              type="button"
              onClick={() => setSelectedSubcategory("all")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                selectedSubcategory === "all"
                  ? "border-pine bg-pine text-surface font-semibold shadow-xs"
                  : "bg-surface/90 text-ink-soft hover:bg-surface hover:text-ink border border-line"
              }`}
            >
              <Package size={13} />
              <span>All Non-Plants</span>
              <span
                className={`rounded-full px-1.5 py-0.1 text-[10px] ${
                  selectedSubcategory === "all"
                    ? "bg-white/25 text-surface font-bold"
                    : "text-ink-soft/70"
                }`}
              >
                {nonPlantCount}
              </span>
            </button>

            {/* Dynamic non-plant subcategories */}
            {nonPlantSubcategories.map((sub) => {
              const Icon = getSubcategoryIcon(sub.slug, "non-plants");
              const active = selectedSubcategory === sub.slug;
              const count = items.filter(
                (i) =>
                  i.category === "non-plants" &&
                  (i.subcategory || "general").toLowerCase() === sub.slug.toLowerCase()
              ).length;

              return (
                <div
                  key={sub.slug}
                  onClick={() => setSelectedSubcategory(sub.slug)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none ${
                    active
                      ? "border-pine bg-pine text-surface font-semibold shadow-xs"
                      : "bg-surface/90 text-ink-soft hover:bg-surface hover:text-ink border border-line"
                  }`}
                >
                  <Icon size={13} />
                  <span>{sub.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.1 text-[10px] ${
                      active ? "bg-white/25 text-surface font-bold" : "text-ink-soft/70"
                    }`}
                  >
                    {count}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSubcategory(e, sub)}
                      className={`ml-0.5 rounded p-0.5 transition-colors cursor-pointer ${
                        active
                          ? "text-white/80 hover:bg-white/20 hover:text-white"
                          : "text-ink-soft/70 hover:bg-rust-tint hover:text-rust"
                      }`}
                      title={`Delete "${sub.name}" item type (Admin only)`}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* In-place '+' Button / Input Form for Non-Plants */}
            {isAddingSub === "non-plants" ? (
              <form
                onSubmit={handleCreateSubcategory}
                className="flex items-center gap-1 rounded-md border border-pine bg-surface px-1.5 py-0.5 shadow-xs animate-in fade-in duration-100"
              >
                <input
                  type="text"
                  autoFocus
                  value={newSubName}
                  onChange={(e) => {
                    setNewSubName(e.target.value);
                    if (subError) setSubError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsAddingSub(null);
                      setNewSubName("");
                      setSubError("");
                    }
                  }}
                  placeholder="e.g. Pots, Pesticides, Soil"
                  disabled={savingSub}
                  className="w-32 sm:w-40 rounded px-1.5 py-0.5 text-xs text-ink placeholder:text-ink-soft/60 outline-none"
                />
                <button
                  type="submit"
                  disabled={savingSub || !newSubName.trim()}
                  className="flex items-center justify-center rounded bg-pine p-1 text-surface hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  title="Save non-plant type"
                >
                  {savingSub ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSub(null);
                    setNewSubName("");
                    setSubError("");
                  }}
                  className="flex items-center justify-center rounded p-1 text-ink-soft hover:bg-line/60 cursor-pointer"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsAddingSub("non-plants");
                  setNewSubName("");
                  setSubError("");
                }}
                className="flex items-center gap-1 rounded-md border border-dashed border-line-strong bg-surface/80 px-2 py-1 text-xs font-semibold text-ink-soft hover:border-pine hover:text-pine-deep hover:bg-pine-tint/30 transition-all cursor-pointer shadow-2xs"
                title="Add new supply subcategory"
              >
                <Plus size={13} />
                <span>Add Type</span>
              </button>
            )}

            {subError && isAddingSub === "non-plants" && (
              <span className="text-[11px] font-medium text-rust ml-1">{subError}</span>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* TOTAL INVENTORY SUMMARY & SEARCH BAR                         */}
      {/* ============================================================ */}
      {items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-ink-soft">
            {searchQuery || selectedCategory !== "all" || selectedSubcategory !== "all" ? (
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
              setSelectedSubcategory("all");
              setIsAddingSub(null);
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
                        <button
                          type="button"
                          onClick={() => openDetailModal(item)}
                          className="group inline-flex items-center gap-2 text-left font-semibold text-ink hover:text-pine transition-colors cursor-pointer"
                          title="Click to view photos and details"
                        >
                          <span className="group-hover:underline">{item.name}</span>
                          {item.images && item.images.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-pine-tint px-1.5 py-0.5 text-[10px] font-bold text-pine-deep shrink-0 shadow-2xs">
                              <ImageIcon size={10} />
                              <span>{item.images.length}</span>
                            </span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Category & Subcategory */}
                    <td className="px-4 py-2.5">
                      {editing ? (
                        <div className="flex flex-col gap-1">
                          <select
                            value={editDraft?.category}
                            onChange={(e) => {
                              const newCat = e.target.value as "plants" | "non-plants";
                              const defaultSub =
                                newCat === "plants"
                                  ? plantSubcategories[0]?.slug || "fruit"
                                  : nonPlantSubcategories[0]?.slug || "pots";
                              setEditDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      category: newCat,
                                      subcategory: defaultSub,
                                    }
                                  : d,
                              );
                            }}
                            className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-xs outline-none focus:border-pine"
                          >
                            <option value="plants">Plants</option>
                            <option value="non-plants">Non-Plants</option>
                          </select>

                          {editDraft?.category === "plants" ? (
                            <select
                              value={editDraft?.subcategory}
                              onChange={(e) =>
                                setEditDraft((d) =>
                                  d ? { ...d, subcategory: e.target.value } : d,
                                )
                              }
                              className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-[11px] outline-none focus:border-pine"
                            >
                              {plantSubcategories.map((s) => (
                                <option key={s.slug} value={s.slug}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={editDraft?.subcategory}
                              onChange={(e) =>
                                setEditDraft((d) =>
                                  d ? { ...d, subcategory: e.target.value } : d,
                                )
                              }
                              className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-[11px] outline-none focus:border-pine"
                            >
                              {nonPlantSubcategories.map((s) => (
                                <option key={s.slug} value={s.slug}>
                                  {s.name}
                                </option>
                              ))}
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

      {/* Detail Modal Component */}
      <StockItemDetailModal
        item={selectedItem}
        onClose={closeDetailModal}
        onItemUpdated={handleItemUpdated}
        onImageDeleted={handleImageDeleted}
        onOpenUpload={(id) => openUploadModal(id)}
        showViewInStock={false}
      />

      {/* Upload Modal Component */}
      <StockPhotoUploadModal
        open={uploadModalOpen}
        onClose={closeUploadModal}
        targetItemId={uploadTargetItemId}
        stockItems={items}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
