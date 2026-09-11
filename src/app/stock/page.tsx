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
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { formatMoney, StockItem, StockCategory, StockSubcategory, GalleryStockItem } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { StockItemDetailModal } from "@/components/StockItemDetailModal";
import { StockPhotoUploadModal } from "@/components/StockPhotoUploadModal";

const DEFAULT_CATEGORIES: StockCategory[] = [
  { id: "plants", name: "Plants", slug: "plants" },
  { id: "non-plants", name: "Non-Plants", slug: "non-plants" },
];

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

function getSubcategoryIcon(slug: string, category: string) {
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
    case "others":
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

  // Categories & Subcategories from Database
  const [categories, setCategories] = useState<StockCategory[]>(DEFAULT_CATEGORIES);
  const [subcategories, setSubcategories] = useState<StockSubcategory[]>([]);
  const [categoryError, setCategoryError] = useState("");

  // Category & Subcategory Filtering States
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Major Category Edit & Add States
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingNewCategory, setSavingNewCategory] = useState(false);

  // Subcategory Edit & Add States
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState("");
  const [savingEditSub, setSavingEditSub] = useState(false);
  const [isAddingSub, setIsAddingSub] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [savingSub, setSavingSub] = useState(false);

  // Reassignment Modal State
  const [reassignModal, setReassignModal] = useState<{
    type: "category" | "subcategory";
    id: string;
    name: string;
    slug: string;
    itemCount: number;
    category?: string;
  } | null>(null);
  const [reassignTarget, setReassignTarget] = useState("");
  const [reassigning, setReassigning] = useState(false);

  // Detail & Upload Modal States
  const [selectedItem, setSelectedItem] = useState<GalleryStockItem | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetItemId, setUploadTargetItemId] = useState<string>("");

  // Add Item Form States
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState<string>("plants");
  const [subcategory, setSubcategory] = useState("fruit");
  const [adding, setAdding] = useState(false);

  // Inline Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    unit: string;
    price: string;
    quantity: string;
    category: string;
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

  function loadCategories() {
    fetch("/api/stock/categories", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch((e) => console.error("Could not load categories:", e));
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
    loadCategories();
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

  // Counts by major category
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      const cat = (item.category || "plants").toLowerCase();
      map[cat] = (map[cat] || 0) + 1;
    }
    return map;
  }, [items]);

  // Subcategories for current selection
  const currentCategorySubs = useMemo(() => {
    if (selectedCategory === "all") return [];
    const fromDb = subcategories.filter(
      (s) => s.category.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (fromDb.length > 0) return fromDb;
    if (selectedCategory === "plants") return DEFAULT_PLANT_SUBS;
    if (selectedCategory === "non-plants") return DEFAULT_NON_PLANT_SUBS;
    return [];
  }, [subcategories, selectedCategory]);

  const currentCatObj = useMemo(() => {
    return categories.find((c) => c.slug.toLowerCase() === selectedCategory.toLowerCase());
  }, [categories, selectedCategory]);

  // Major Category Handlers
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    setSavingNewCategory(true);
    setCategoryError("");
    try {
      const res = await fetch("/api/stock/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");

      setCategories((prev) => [...prev, data.category]);
      setSelectedCategory(data.category.slug);
      setSelectedSubcategory("all");
      setIsAddingCategory(false);
      setNewCategoryName("");
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSavingNewCategory(false);
    }
  }

  async function handleSaveCategoryEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategoryId) return;
    const trimmed = editingCategoryName.trim();
    if (!trimmed) return;

    setSavingCategory(true);
    setCategoryError("");
    try {
      const res = await fetch("/api/stock/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCategoryId, name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename category");

      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategoryId ? { ...c, name: trimmed } : c))
      );
      setEditingCategoryId(null);
      setEditingCategoryName("");
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to rename category");
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(e: React.MouseEvent, cat: StockCategory) {
    e.stopPropagation();
    setCategoryError("");

    const count = categoryCounts[cat.slug.toLowerCase()] || 0;
    if (count > 0) {
      setReassignModal({
        type: "category",
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        itemCount: count,
      });
      const otherCats = categories.filter((c) => c.slug !== cat.slug);
      setReassignTarget(otherCats[0]?.slug || "plants");
      return;
    }

    if (!confirm(`Are you sure you want to delete the "${cat.name}" category?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/stock/categories?id=${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresReassignment) {
          setReassignModal({
            type: "category",
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            itemCount: data.itemCount,
          });
          const otherCats = categories.filter((c) => c.slug !== cat.slug);
          setReassignTarget(otherCats[0]?.slug || "plants");
          return;
        }
        throw new Error(data.error || "Failed to delete category");
      }

      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      if (selectedCategory === cat.slug) {
        setSelectedCategory("all");
      }
      load();
      loadSubcategories();
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to delete category");
    }
  }

  // Subcategory Handlers
  async function handleCreateSubcategory(e: React.FormEvent) {
    e.preventDefault();
    if (!isAddingSub || !newSubName.trim()) return;

    setSavingSub(true);
    setCategoryError("");
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

      setSelectedSubcategory(created.slug);
      setSubcategory(created.slug);
      setIsAddingSub(null);
      setNewSubName("");
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to add subcategory");
    } finally {
      setSavingSub(false);
    }
  }

  async function handleSaveSubcategoryEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSubId) return;
    const trimmed = editingSubName.trim();
    if (!trimmed) return;

    setSavingEditSub(true);
    setCategoryError("");
    try {
      const res = await fetch("/api/stock/subcategories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingSubId, name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename subcategory");

      setSubcategories((prev) =>
        prev.map((s) => (s.id === editingSubId ? { ...s, name: trimmed } : s))
      );
      setEditingSubId(null);
      setEditingSubName("");
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to rename subcategory");
    } finally {
      setSavingEditSub(false);
    }
  }

  async function handleDeleteSubcategory(e: React.MouseEvent, sub: StockSubcategory) {
    e.stopPropagation();
    setCategoryError("");

    const count = items.filter(
      (i) =>
        (i.category || "plants").toLowerCase() === sub.category.toLowerCase() &&
        (i.subcategory || "other").toLowerCase() === sub.slug.toLowerCase()
    ).length;

    if (count > 0) {
      setReassignModal({
        type: "subcategory",
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        itemCount: count,
        category: sub.category,
      });
      const otherSubs = subcategories.filter(
        (s) => s.category.toLowerCase() === sub.category.toLowerCase() && s.slug !== sub.slug
      );
      const defaultTarget =
        otherSubs.find((s) => s.slug === "other" || s.slug === "general")?.slug ||
        otherSubs[0]?.slug ||
        "other";
      setReassignTarget(defaultTarget);
      return;
    }

    if (!confirm(`Are you sure you want to delete the "${sub.name}" subcategory?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/stock/subcategories?id=${sub.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresReassignment) {
          setReassignModal({
            type: "subcategory",
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            itemCount: data.itemCount,
            category: sub.category,
          });
          setReassignTarget("other");
          return;
        }
        throw new Error(data.error || "Failed to delete subcategory");
      }

      setSubcategories((prev) => prev.filter((s) => s.id !== sub.id));
      if (selectedSubcategory === sub.slug) {
        setSelectedSubcategory("all");
      }
      load();
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to delete subcategory");
    }
  }

  // Confirm Reassign and Delete
  async function handleConfirmReassignment() {
    if (!reassignModal) return;
    setReassigning(true);
    setCategoryError("");

    try {
      if (reassignModal.type === "subcategory") {
        const res = await fetch(
          `/api/stock/subcategories?id=${reassignModal.id}&reassignTo=${encodeURIComponent(reassignTarget)}`,
          { method: "DELETE" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to reassign and delete subcategory");

        setSubcategories((prev) => prev.filter((s) => s.id !== reassignModal.id));
        if (selectedSubcategory === reassignModal.slug) {
          setSelectedSubcategory(reassignTarget);
        }
      } else {
        const res = await fetch(
          `/api/stock/categories?id=${reassignModal.id}&reassignTo=${encodeURIComponent(reassignTarget)}`,
          { method: "DELETE" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to reassign and delete category");

        setCategories((prev) => prev.filter((c) => c.id !== reassignModal.id));
        if (selectedCategory === reassignModal.slug) {
          setSelectedCategory(reassignTarget);
        }
        loadSubcategories();
      }
      setReassignModal(null);
      load();
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to reassign items");
    } finally {
      setReassigning(false);
    }
  }

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const itemCat = (item.category || "plants").toLowerCase();
      const itemSub = (item.subcategory || "other").toLowerCase();

      // Filter by top-level category
      if (selectedCategory !== "all" && itemCat !== selectedCategory.toLowerCase()) {
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
      const catSubs = subcategories.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase()
      );
      const chosenSubcategory = subcategory || catSubs[0]?.slug || "other";

      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Stock Item",
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
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      unit: item.unit || "pcs",
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      category: item.category || "plants",
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
    const currentCat = (cat || "plants").toLowerCase();
    const currentSub = (sub || "other").toLowerCase();

    const foundSub = subcategories.find(
      (s) => s.category.toLowerCase() === currentCat && s.slug.toLowerCase() === currentSub
    );
    const label =
      foundSub?.name ||
      (currentSub.charAt(0).toUpperCase() + currentSub.slice(1));
    const Icon = getSubcategoryIcon(currentSub, currentCat);

    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-soft shadow-2xs"
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
          {/* Category Toggle: Dynamic Buttons */}
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-line-strong bg-paper p-0.5 text-xs">
            {categories.map((c) => {
              const isPlants = c.slug === "plants";
              const Icon = isPlants ? Sprout : Package;
              const isSelected = category.toLowerCase() === c.slug.toLowerCase();
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => {
                    setCategory(c.slug);
                    const catSubs = subcategories.filter(
                      (s) => s.category.toLowerCase() === c.slug.toLowerCase()
                    );
                    setSubcategory(catSubs[0]?.slug || "other");
                  }}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-surface text-pine-deep font-semibold shadow-xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Icon size={13} />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subcategory Selector for Current Category */}
        {(() => {
          const catSubs = subcategories.filter(
            (s) => s.category.toLowerCase() === category.toLowerCase()
          );
          const list =
            catSubs.length > 0
              ? catSubs
              : category === "plants"
              ? DEFAULT_PLANT_SUBS
              : category === "non-plants"
              ? DEFAULT_NON_PLANT_SUBS
              : [];

          if (list.length === 0) return null;

          return (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-ink-soft mr-1">Type:</span>
              {list.map((sub) => {
                const Icon = getSubcategoryIcon(sub.slug, category);
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
          );
        })()}

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
        {/* Prominent Category & Subcategory Error Banner */}
        {categoryError && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-rust/30 bg-rust-tint/40 px-3.5 py-2.5 text-xs text-rust-deep animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rust" />
              <span className="font-medium">{categoryError}</span>
            </div>
            <button
              type="button"
              onClick={() => setCategoryError("")}
              className="cursor-pointer text-rust hover:opacity-75 p-1 rounded hover:bg-rust-tint/60"
              title="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Main Category Bar (Side by Side Icons + Edit/Delete + Add) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* "All Items" Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedSubcategory("all");
              setIsAddingSub(null);
              setIsAddingCategory(false);
              setEditingCategoryId(null);
              setEditingSubId(null);
              setCategoryError("");
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

          {/* Dynamic Major Categories */}
          {categories.map((cat) => {
            const isPlants = cat.slug === "plants";
            const CatIcon = isPlants ? Sprout : Package;
            const isSelected = selectedCategory.toLowerCase() === cat.slug.toLowerCase();
            const count = categoryCounts[cat.slug.toLowerCase()] || 0;

            if (editingCategoryId === cat.id) {
              return (
                <form
                  key={cat.id}
                  onSubmit={handleSaveCategoryEdit}
                  className="flex items-center gap-1 rounded-lg border border-pine bg-surface px-2 py-1 shadow-xs animate-in fade-in"
                >
                  <input
                    type="text"
                    autoFocus
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    disabled={savingCategory}
                    className="w-28 sm:w-36 rounded px-1.5 py-0.5 text-xs text-ink outline-none"
                    placeholder="Category name"
                  />
                  <button
                    type="submit"
                    disabled={savingCategory || !editingCategoryName.trim()}
                    className="flex items-center justify-center rounded bg-pine p-1 text-surface hover:opacity-90 disabled:opacity-40 cursor-pointer"
                    title="Save category name"
                  >
                    {savingCategory ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setEditingCategoryName("");
                    }}
                    className="flex items-center justify-center rounded p-1 text-ink-soft hover:bg-line/60 cursor-pointer"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </form>
              );
            }

            return (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  setSelectedSubcategory("all");
                  setIsAddingSub(null);
                  setIsAddingCategory(false);
                  setEditingCategoryId(null);
                  setEditingSubId(null);
                  setCategoryError("");
                }}
                className={`group inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none ${
                  isSelected
                    ? "border-pine bg-pine text-surface shadow-xs"
                    : "border-line-strong bg-surface text-ink-soft hover:bg-line/40 hover:text-ink"
                }`}
              >
                <CatIcon size={15} />
                <span>{cat.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isSelected
                      ? "bg-white/25 text-surface"
                      : "bg-pine-tint text-pine-deep"
                  }`}
                >
                  {count}
                </span>

                {/* Edit Category Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategoryId(cat.id);
                    setEditingCategoryName(cat.name);
                    setCategoryError("");
                  }}
                  className={`ml-0.5 rounded p-0.5 transition-colors cursor-pointer ${
                    isSelected
                      ? "text-white/80 hover:bg-white/20 hover:text-white"
                      : "text-ink-soft/60 hover:bg-line hover:text-ink"
                  }`}
                  title={`Rename "${cat.name}" category`}
                >
                  <Pencil size={11} />
                </button>

                {/* Delete Category Button (Admin only) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCategory(e, cat)}
                    className={`rounded p-0.5 transition-colors cursor-pointer ${
                      isSelected
                        ? "text-white/80 hover:bg-white/20 hover:text-white"
                        : "text-ink-soft/60 hover:bg-rust-tint hover:text-rust"
                    }`}
                    title={`Delete "${cat.name}" category (Admin only)`}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}

          {/* In-place Add Major Category */}
          {isAddingCategory ? (
            <form
              onSubmit={handleCreateCategory}
              className="flex items-center gap-1 rounded-lg border border-pine bg-surface px-2 py-1 shadow-xs animate-in fade-in"
            >
              <input
                type="text"
                autoFocus
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  if (categoryError) setCategoryError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsAddingCategory(false);
                    setNewCategoryName("");
                  }
                }}
                placeholder="e.g. Fertilizers, Tools"
                disabled={savingNewCategory}
                className="w-32 sm:w-44 rounded px-1.5 py-0.5 text-xs text-ink placeholder:text-ink-soft/60 outline-none"
              />
              <button
                type="submit"
                disabled={savingNewCategory || !newCategoryName.trim()}
                className="flex items-center justify-center rounded bg-pine p-1 text-surface hover:opacity-90 disabled:opacity-40 cursor-pointer"
                title="Save new category"
              >
                {savingNewCategory ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName("");
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
                setIsAddingCategory(true);
                setNewCategoryName("");
                setCategoryError("");
              }}
              className="flex items-center gap-1 rounded-lg border border-dashed border-pine/50 bg-surface/80 px-3 py-2 text-xs font-semibold text-pine-deep hover:border-pine hover:bg-pine-tint/40 transition-all cursor-pointer shadow-2xs"
              title="Add new major category"
            >
              <Plus size={14} />
              <span>Add Category</span>
            </button>
          )}
        </div>

        {/* Dynamic Subcategories / Types Row */}
        {selectedCategory !== "all" && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-pine/20 bg-pine-tint/25 p-2 animate-in fade-in duration-150">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-pine-deep">
              {currentCatObj?.name || selectedCategory} Types:
            </span>

            {/* "All [Category]" pill */}
            <button
              type="button"
              onClick={() => setSelectedSubcategory("all")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                selectedSubcategory === "all"
                  ? "bg-pine text-surface font-semibold shadow-xs"
                  : "bg-surface/90 text-ink-soft hover:bg-surface hover:text-ink border border-line"
              }`}
            >
              {selectedCategory === "plants" ? <Sprout size={13} /> : <Package size={13} />}
              <span>All {currentCatObj?.name || "Items"}</span>
              <span
                className={`rounded-full px-1.5 py-0.1 text-[10px] ${
                  selectedSubcategory === "all"
                    ? "bg-white/25 text-surface font-bold"
                    : "text-ink-soft/70"
                }`}
              >
                {categoryCounts[selectedCategory.toLowerCase()] || 0}
              </span>
            </button>

            {/* Mapped Subcategories */}
            {currentCategorySubs.map((sub) => {
              const Icon = getSubcategoryIcon(sub.slug, selectedCategory);
              const active = selectedSubcategory.toLowerCase() === sub.slug.toLowerCase();
              const count = items.filter(
                (i) =>
                  (i.category || "plants").toLowerCase() === selectedCategory.toLowerCase() &&
                  (i.subcategory || "other").toLowerCase() === sub.slug.toLowerCase()
              ).length;

              if (editingSubId === sub.id) {
                return (
                  <form
                    key={sub.id || sub.slug}
                    onSubmit={handleSaveSubcategoryEdit}
                    className="flex items-center gap-1 rounded-md border border-pine bg-surface px-1.5 py-0.5 shadow-xs animate-in fade-in"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingSubName}
                      onChange={(e) => setEditingSubName(e.target.value)}
                      disabled={savingEditSub}
                      className="w-24 sm:w-32 rounded px-1 py-0.5 text-xs text-ink outline-none"
                    />
                    <button
                      type="submit"
                      disabled={savingEditSub || !editingSubName.trim()}
                      className="flex items-center justify-center rounded bg-pine p-1 text-surface hover:opacity-90 disabled:opacity-40 cursor-pointer"
                      title="Save type name"
                    >
                      {savingEditSub ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubId(null);
                        setEditingSubName("");
                      }}
                      className="flex items-center justify-center rounded p-1 text-ink-soft hover:bg-line/60 cursor-pointer"
                      title="Cancel"
                    >
                      <X size={11} />
                    </button>
                  </form>
                );
              }

              return (
                <div
                  key={sub.id || sub.slug}
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

                  {/* Rename Subcategory */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSubId(sub.id);
                      setEditingSubName(sub.name);
                      setCategoryError("");
                    }}
                    className={`ml-0.5 rounded p-0.5 transition-colors cursor-pointer ${
                      active
                        ? "text-white/80 hover:bg-white/20 hover:text-white"
                        : "text-ink-soft/60 hover:bg-line hover:text-ink"
                    }`}
                    title={`Rename "${sub.name}" type`}
                  >
                    <Pencil size={11} />
                  </button>

                  {/* Delete Subcategory (Admin only) */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSubcategory(e, sub)}
                      className={`ml-0.5 rounded p-0.5 transition-colors cursor-pointer ${
                        active
                          ? "text-white/80 hover:bg-white/20 hover:text-white"
                          : "text-ink-soft/70 hover:bg-rust-tint hover:text-rust"
                      }`}
                      title={`Delete "${sub.name}" type (Admin only)`}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* In-place '+' Button / Form for Subcategory */}
            {isAddingSub === selectedCategory ? (
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
                    if (categoryError) setCategoryError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsAddingSub(null);
                      setNewSubName("");
                    }
                  }}
                  placeholder="e.g. Succulents, Pots"
                  disabled={savingSub}
                  className="w-32 sm:w-40 rounded px-1.5 py-0.5 text-xs text-ink placeholder:text-ink-soft/60 outline-none"
                />
                <button
                  type="submit"
                  disabled={savingSub || !newSubName.trim()}
                  className="flex items-center justify-center rounded bg-pine p-1 text-surface hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  title="Save type"
                >
                  {savingSub ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSub(null);
                    setNewSubName("");
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
                  setIsAddingSub(selectedCategory);
                  setNewSubName("");
                  setCategoryError("");
                }}
                className="flex items-center gap-1 rounded-md border border-dashed border-pine/40 bg-surface/80 px-2 py-1 text-xs font-semibold text-pine-deep hover:border-pine hover:bg-pine-tint/40 transition-all cursor-pointer shadow-2xs"
                title={`Add new type under ${currentCatObj?.name || selectedCategory}`}
              >
                <Plus size={13} />
                <span>Add Type</span>
              </button>
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
                              const newCat = e.target.value;
                              const catSubs = subcategories.filter(
                                (s) => s.category.toLowerCase() === newCat.toLowerCase()
                              );
                              setEditDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      category: newCat,
                                      subcategory: catSubs[0]?.slug || "other",
                                    }
                                  : d,
                              );
                            }}
                            className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-xs outline-none focus:border-pine"
                          >
                            {categories.map((c) => (
                              <option key={c.slug} value={c.slug}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          {(() => {
                            const curCat = (editDraft?.category || "plants").toLowerCase();
                            const catSubs = subcategories.filter(
                              (s) => s.category.toLowerCase() === curCat
                            );
                            const list =
                              catSubs.length > 0
                                ? catSubs
                                : curCat === "plants"
                                ? DEFAULT_PLANT_SUBS
                                : curCat === "non-plants"
                                ? DEFAULT_NON_PLANT_SUBS
                                : [];

                            return (
                              <select
                                value={editDraft?.subcategory}
                                onChange={(e) =>
                                  setEditDraft((d) =>
                                    d ? { ...d, subcategory: e.target.value } : d,
                                  )
                                }
                                className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-[11px] outline-none focus:border-pine"
                              >
                                {list.map((s) => (
                                  <option key={s.slug} value={s.slug}>
                                    {s.name}
                                  </option>
                                ))}
                                {!list.some((s) => s.slug === "other") && (
                                  <option value="other">Other</option>
                                )}
                              </select>
                            );
                          })()}
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

      {/* Reassign & Delete Stock Modal */}
      {reassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink sm:text-base">
                  Active Stock Items Detected
                </h3>
                <p className="text-xs text-ink-soft">
                  {reassignModal.type === "subcategory" ? "Subcategory" : "Major Category"}:{" "}
                  <strong className="text-ink">{reassignModal.name}</strong>
                </p>
              </div>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-ink-soft">
              There {reassignModal.itemCount === 1 ? "is" : "are"}{" "}
              <strong className="font-semibold text-pine-deep">
                {reassignModal.itemCount} active stock item{reassignModal.itemCount === 1 ? "" : "s"}
              </strong>{" "}
              assigned to <strong className="text-ink">"{reassignModal.name}"</strong>.
              Before deleting, choose which tag to reassign these items to:
            </p>

            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Reassign Items To:
              </label>
              <select
                value={reassignTarget}
                onChange={(e) => setReassignTarget(e.target.value)}
                disabled={reassigning}
                className="w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-xs font-medium text-ink outline-none focus:border-pine"
              >
                {reassignModal.type === "subcategory" ? (
                  <>
                    <option value="other">Others / Default ("other")</option>
                    {subcategories
                      .filter(
                        (s) =>
                          s.category.toLowerCase() ===
                            (reassignModal.category || "").toLowerCase() &&
                          s.slug.toLowerCase() !== reassignModal.slug.toLowerCase() &&
                          s.slug.toLowerCase() !== "other"
                      )
                      .map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {s.name}
                        </option>
                      ))}
                  </>
                ) : (
                  <>
                    {categories
                      .filter((c) => c.slug.toLowerCase() !== reassignModal.slug.toLowerCase())
                      .map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name} (Subcategory will default to "other")
                        </option>
                      ))}
                  </>
                )}
              </select>
              <p className="mt-1.5 text-[11px] text-ink-soft/80">
                All {reassignModal.itemCount} item{reassignModal.itemCount === 1 ? "" : "s"} will be safely reassigned before deletion.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReassignModal(null)}
                disabled={reassigning}
                className="rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-ink-soft hover:bg-paper hover:text-ink transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassignment}
                disabled={reassigning || !reassignTarget}
                className="flex items-center gap-1.5 rounded-lg bg-rust px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rust-deep transition-all cursor-pointer disabled:opacity-50"
              >
                {reassigning ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Reassigning & Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Reassign & Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
