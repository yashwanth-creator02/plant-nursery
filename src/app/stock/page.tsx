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
  Languages,
} from "lucide-react";
import { formatMoney, StockItem, StockCategory, StockSubcategory, GalleryStockItem } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { StockItemDetailModal } from "@/components/StockItemDetailModal";
import { StockPhotoUploadModal } from "@/components/StockPhotoUploadModal";
import {
  useLanguage,
  translateCategory,
  translateSubcategory,
  translateUnit,
} from "@/lib/language-context";
import { translateOnTheFly } from "@/lib/translator";

const DEFAULT_CATEGORIES: StockCategory[] = [
  { id: "plants", name: "Plants", nameKn: "ಗಿಡಗಳು", slug: "plants" },
  { id: "non-plants", name: "Non-Plants", nameKn: "ಇತರ ವಸ್ತುಗಳು", slug: "non-plants" },
];

const DEFAULT_PLANT_SUBS: StockSubcategory[] = [
  { id: "fruit", category: "plants", name: "Fruit Plants", nameKn: "ಹಣ್ಣಿನ ಗಿಡಗಳು", slug: "fruit" },
  { id: "flower", category: "plants", name: "Flower Plants", nameKn: "ಹೂವಿನ ಗಿಡಗಳು", slug: "flower" },
  { id: "ornamental", category: "plants", name: "Ornamental Plants", nameKn: "ಅಲಂಕಾರಿಕ ಗಿಡಗಳು", slug: "ornamental" },
  { id: "medicinal", category: "plants", name: "Medicinal Plants", nameKn: "ಔಷಧೀಯ ಗಿಡಗಳು", slug: "medicinal" },
  { id: "other", category: "plants", name: "Other Plants", nameKn: "ಇತರ ಗಿಡಗಳು", slug: "other" },
];

const DEFAULT_NON_PLANT_SUBS: StockSubcategory[] = [
  { id: "pots", category: "non-plants", name: "Pots & Planters", nameKn: "ಕುಂಡಗಳು", slug: "pots" },
  { id: "fertilizers", category: "non-plants", name: "Fertilizers & Manure", nameKn: "ಗೊಬ್ಬರಗಳು", slug: "fertilizers" },
  { id: "soil", category: "non-plants", name: "Soil & Substrates", nameKn: "ಮಣ್ಣು ಮತ್ತು ಮಿಶ್ರಣ", slug: "soil" },
  { id: "tools", category: "non-plants", name: "Gardening Tools", nameKn: "ತೋಟಗಾರಿಕೆ ಉಪಕರಣಗಳು", slug: "tools" },
  { id: "general", category: "non-plants", name: "General Supplies", nameKn: "ಸಾಮಾನ್ಯ ಸಾಮಗ್ರಿಗಳು", slug: "general" },
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
  const { language, translateItem } = useLanguage();
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
  const [editingCategoryNameKn, setEditingCategoryNameKn] = useState("");
  const [translatingCategory, setTranslatingCategory] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameKn, setNewCategoryNameKn] = useState("");
  const [translatingNewCategory, setTranslatingNewCategory] = useState(false);
  const [savingNewCategory, setSavingNewCategory] = useState(false);

  // Subcategory Edit & Add States
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState("");
  const [editingSubNameKn, setEditingSubNameKn] = useState("");
  const [translatingEditSub, setTranslatingEditSub] = useState(false);
  const [savingEditSub, setSavingEditSub] = useState(false);
  const [isAddingSub, setIsAddingSub] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [newSubNameKn, setNewSubNameKn] = useState("");
  const [translatingNewSub, setTranslatingNewSub] = useState(false);
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
  const [nameKn, setNameKn] = useState("");
  const [translatingItemName, setTranslatingItemName] = useState(false);
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
    nameKn: string;
    unit: string;
    price: string;
    quantity: string;
    category: string;
    subcategory: string;
  } | null>(null);
  const [translatingInlineName, setTranslatingInlineName] = useState(false);

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
    const trimmedKn = newCategoryNameKn.trim();
    if (!trimmed && !trimmedKn) return;

    setSavingNewCategory(true);
    setCategoryError("");
    try {
      let knName = trimmedKn;
      if (!knName && trimmed) {
        try {
          knName = await translateOnTheFly(trimmed, "kn", "en");
        } catch {}
      }

      const res = await fetch("/api/stock/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed || knName,
          nameKn: knName || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");

      setCategories((prev) => [...prev, data.category]);
      setSelectedCategory(data.category.slug);
      setSelectedSubcategory("all");
      setIsAddingCategory(false);
      setNewCategoryName("");
      setNewCategoryNameKn("");
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
    const trimmedKn = editingCategoryNameKn.trim();
    if (!trimmed && !trimmedKn) return;

    setSavingCategory(true);
    setCategoryError("");
    try {
      let knName = trimmedKn;
      if (!knName && trimmed) {
        try {
          knName = await translateOnTheFly(trimmed, "kn", "en");
        } catch {}
      }

      const res = await fetch("/api/stock/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategoryId,
          name: trimmed || knName,
          nameKn: knName || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename category");

      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategoryId
            ? { ...c, name: trimmed || knName, nameKn: knName || null }
            : c
        )
      );
      setEditingCategoryId(null);
      setEditingCategoryName("");
      setEditingCategoryNameKn("");
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
      if (cat.slug.toLowerCase() === "others" || cat.slug.toLowerCase() === "other") {
        const otherCats = categories.filter(
          (c) => c.slug.toLowerCase() !== cat.slug.toLowerCase()
        );
        setReassignTarget(otherCats[0]?.slug || "plants");
      } else {
        setReassignTarget("others");
      }
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
          if (cat.slug.toLowerCase() === "others" || cat.slug.toLowerCase() === "other") {
            const otherCats = categories.filter(
              (c) => c.slug.toLowerCase() !== cat.slug.toLowerCase()
            );
            setReassignTarget(otherCats[0]?.slug || "plants");
          } else {
            setReassignTarget("others");
          }
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
    if (!isAddingSub) return;
    const trimmed = newSubName.trim();
    const trimmedKn = newSubNameKn.trim();
    if (!trimmed && !trimmedKn) return;

    setSavingSub(true);
    setCategoryError("");
    try {
      let knName = trimmedKn;
      if (!knName && trimmed) {
        try {
          knName = await translateOnTheFly(trimmed, "kn", "en");
        } catch {}
      }

      const res = await fetch("/api/stock/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed || knName,
          nameKn: knName || null,
          category: isAddingSub,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add subcategory");

      const created: StockSubcategory = data.subcategory;
      setSubcategories((prev) => {
        if (prev.some((s) => s.category === created.category && s.slug === created.slug)) {
          return prev.map((s) =>
            s.category === created.category && s.slug === created.slug ? created : s
          );
        }
        return [...prev, created];
      });

      setSelectedSubcategory(created.slug);
      setSubcategory(created.slug);
      setIsAddingSub(null);
      setNewSubName("");
      setNewSubNameKn("");
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
    const trimmedKn = editingSubNameKn.trim();
    if (!trimmed && !trimmedKn) return;

    setSavingEditSub(true);
    setCategoryError("");
    try {
      let knName = trimmedKn;
      if (!knName && trimmed) {
        try {
          knName = await translateOnTheFly(trimmed, "kn", "en");
        } catch {}
      }

      const res = await fetch("/api/stock/subcategories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSubId,
          name: trimmed || knName,
          nameKn: knName || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename subcategory");

      setSubcategories((prev) =>
        prev.map((s) =>
          s.id === editingSubId
            ? { ...s, name: trimmed || knName, nameKn: knName || null }
            : s
        )
      );
      setEditingSubId(null);
      setEditingSubName("");
      setEditingSubNameKn("");
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
      const knName = item.nameKn || translateItem(item.name, "kn");
      const nameMatch = item.name.toLowerCase().includes(q) || knName.toLowerCase().includes(q);
      const unitMatch = (item.unit || "").toLowerCase().includes(q);
      const priceMatch = item.price.toString().includes(q);
      const qtyMatch = item.quantity.toString().includes(q);
      const subMatch = itemSub.includes(q) || translateSubcategory(itemSub, "kn").toLowerCase().includes(q);
      const catMatch = itemCat.includes(q) || translateCategory(itemCat, "kn").toLowerCase().includes(q);
      const descMatch = (item.description || "").toLowerCase().includes(q) || (item.descriptionKn || "").toLowerCase().includes(q);

      return nameMatch || unitMatch || priceMatch || qtyMatch || subMatch || catMatch || descMatch;
    });
  }, [items, searchQuery, selectedCategory, selectedSubcategory, translateItem]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanNameKn = nameKn.trim();
    if (!cleanName && !cleanNameKn) return;

    setAdding(true);
    setError("");
    try {
      const catSubs = subcategories.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase()
      );
      const chosenSubcategory = subcategory || catSubs[0]?.slug || "other";

      let finalNameKn = cleanNameKn;
      if (!finalNameKn && cleanName) {
        try {
          finalNameKn = await translateOnTheFly(cleanName, "kn", "en");
        } catch {}
      }

      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName || finalNameKn || "Stock Item",
          nameKn: finalNameKn || null,
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
      setNameKn("");
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
      nameKn: item.nameKn || "",
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
      let finalNameKn = editDraft.nameKn.trim();
      if (!finalNameKn && editDraft.name.trim()) {
        try {
          finalNameKn = await translateOnTheFly(editDraft.name.trim(), "kn", "en");
        } catch {}
      }

      const res = await fetch(`/api/stock/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editDraft.name.trim() || finalNameKn || "Stock Item",
          nameKn: finalNameKn || null,
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
    const label = language === "kn"
      ? translateSubcategory(currentSub, "kn")
      : foundSub?.name || (currentSub.charAt(0).toUpperCase() + currentSub.slice(1));
    const Icon = getSubcategoryIcon(currentSub, currentCat);

    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-soft shadow-2xs font-sans"
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
          <h1 className="font-serif text-xl font-semibold text-ink">
            {language === "kn" ? "ದಾಸ್ತಾನು ನಿರ್ವಹಣೆ" : "Stock Inventory"}
          </h1>
          <p className="text-sm text-ink-soft font-sans">
            {language === "kn"
              ? "ಸಸ್ಯಗಳು, ಸಾಮಗ್ರಿಗಳು ಮತ್ತು ದಾಸ್ತಾನು ವಸ್ತುಗಳನ್ನು ನಿರ್ವಹಿಸಿ."
              : "Manage plants, supplies, and stock items available for invoices."}
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
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-sans">
            {language === "kn" ? "ದಾಸ್ತಾನಿಗೆ ಹೊಸ ವಸ್ತು ಸೇರಿಸಿ" : "Add New Item to Inventory"}
          </span>

          {/* Category Toggle: Dynamic Buttons */}
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-line-strong bg-paper p-0.5 text-xs font-sans">
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
                  <span>{language === "kn" ? (c.nameKn || translateCategory(c.name, "kn")) : c.name}</span>
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
            <div className="mb-3 flex flex-wrap items-center gap-1.5 font-sans">
              <span className="text-xs font-medium text-ink-soft mr-1">
                {language === "kn" ? "ಪ್ರಕಾರ:" : "Type:"}
              </span>
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
                    <span>{language === "kn" ? (sub.nameKn || translateSubcategory(sub.name, "kn")) : sub.name}</span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Inputs row */}
        <div className="flex flex-wrap items-end gap-2.5 font-sans">
          {/* Item Name in English */}
          <label className="flex w-full sm:min-w-[170px] sm:flex-1 flex-col gap-1">
            <span className="text-xs text-ink-soft">
              {language === "kn"
                ? "ಹೆಸರು (ಇಂಗ್ಲಿಷ್)"
                : category === "plants"
                ? "Plant Name (English)"
                : "Item Name (English)"}
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

          {/* Item Name in Kannada with Live Translate */}
          <label className="flex w-full sm:min-w-[170px] sm:flex-1 flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-soft">
                {language === "kn" ? "ಹೆಸರು (ಕನ್ನಡ)" : "Name (Kannada / ಕನ್ನಡ)"}
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (!name.trim()) return;
                  setTranslatingItemName(true);
                  try {
                    const translated = await translateOnTheFly(name.trim(), "kn", "en");
                    if (translated) setNameKn(translated);
                  } finally {
                    setTranslatingItemName(false);
                  }
                }}
                disabled={translatingItemName || !name.trim()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-pine hover:text-pine-deep disabled:opacity-40 cursor-pointer"
                title="Translate English name to Kannada"
              >
                {translatingItemName ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Languages size={11} />
                )}
                <span>{language === "kn" ? "ಅನುವಾದಿಸು" : "Translate 🔄"}</span>
              </button>
            </div>
            <input
              value={nameKn}
              onChange={(e) => setNameKn(e.target.value)}
              placeholder={
                category === "plants"
                  ? "ಉದಾ. ಆಲ್ಫಾನ್ಸೋ ಮಾವು, ಕಾಶ್ಮೀರಿ ಗುಲಾಬಿ"
                  : "ಉದಾ. 10-ಇಂಚಿನ ಕುಂಡ, ವರ್ಮಿಕಾಂಪೋಸ್ಟ್"
              }
              className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine font-sans"
            />
          </label>

          <div className="flex w-full sm:w-auto flex-wrap sm:flex-nowrap items-end gap-2">
            <label className="flex w-20 flex-col gap-1">
              <span className="text-xs text-ink-soft">{language === "kn" ? "ಘಟಕ" : "Unit"}</span>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={language === "kn" ? "ಸಂಖ್ಯೆ" : "pcs"}
                className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
              />
            </label>
            <label className="flex w-24 flex-col gap-1">
              <span className="text-xs text-ink-soft">{language === "kn" ? "ದರ (₹)" : "Price (₹)"}</span>
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
              <span className="text-xs text-ink-soft">{language === "kn" ? "ಪ್ರಮಾಣ" : "Quantity"}</span>
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
              <Plus size={15} /> {language === "kn" ? "ವಸ್ತು ಸೇರಿಸಿ" : "Add item"}
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
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer font-sans ${
              selectedCategory === "all"
                ? "border-pine bg-pine text-surface shadow-xs"
                : "border-line-strong bg-surface text-ink-soft hover:bg-line/40 hover:text-ink"
            }`}
          >
            <Boxes size={15} />
            <span>{language === "kn" ? "ಎಲ್ಲಾ ವಸ್ತುಗಳು" : "All Items"}</span>
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
                  className="flex flex-wrap items-center gap-1.5 rounded-lg border border-pine bg-surface p-1.5 shadow-xs animate-in fade-in"
                >
                  <input
                    type="text"
                    autoFocus
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    disabled={savingCategory}
                    className="w-28 sm:w-36 rounded border border-line-strong px-2 py-1 text-xs text-ink outline-none focus:border-pine"
                    placeholder="English name"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editingCategoryNameKn}
                      onChange={(e) => setEditingCategoryNameKn(e.target.value)}
                      disabled={savingCategory}
                      className="w-28 sm:w-36 rounded border border-line-strong px-2 py-1 text-xs text-ink outline-none focus:border-pine font-sans"
                      placeholder="Kannada (ಕನ್ನಡ)"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingCategoryName.trim()) return;
                        setTranslatingCategory(true);
                        try {
                          const res = await translateOnTheFly(editingCategoryName.trim(), "kn", "en");
                          if (res) setEditingCategoryNameKn(res);
                        } finally {
                          setTranslatingCategory(false);
                        }
                      }}
                      disabled={translatingCategory || !editingCategoryName.trim()}
                      className="flex items-center justify-center rounded border border-pine/30 bg-pine-tint/40 p-1 text-pine-deep hover:bg-pine-tint disabled:opacity-40 cursor-pointer"
                      title="Translate English name to Kannada"
                    >
                      {translatingCategory ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="submit"
                      disabled={savingCategory || (!editingCategoryName.trim() && !editingCategoryNameKn.trim())}
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
                        setEditingCategoryNameKn("");
                      }}
                      className="flex items-center justify-center rounded p-1 text-ink-soft hover:bg-line/60 cursor-pointer"
                      title="Cancel"
                    >
                      <X size={12} />
                    </button>
                  </div>
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
                className={`group inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none font-sans ${
                  isSelected
                    ? "border-pine bg-pine text-surface shadow-xs"
                    : "border-line-strong bg-surface text-ink-soft hover:bg-line/40 hover:text-ink"
                }`}
              >
                <CatIcon size={15} />
                <span>{language === "kn" ? (cat.nameKn || translateCategory(cat.name, "kn")) : cat.name}</span>
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
                    setEditingCategoryNameKn(cat.nameKn || "");
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
                    title={`Delete "${cat.name}" category`}
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
              className="flex flex-wrap items-center gap-1.5 rounded-lg border border-pine bg-surface p-1.5 shadow-xs animate-in fade-in"
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
                    setNewCategoryNameKn("");
                  }
                }}
                placeholder={language === "kn" ? "ಹೆಸರು (ಇಂಗ್ಲಿಷ್)" : "English name"}
                disabled={savingNewCategory}
                className="w-28 sm:w-36 rounded border border-line-strong px-2 py-1 text-xs text-ink placeholder:text-ink-soft/60 outline-none focus:border-pine"
              />
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newCategoryNameKn}
                  onChange={(e) => {
                    setNewCategoryNameKn(e.target.value);
                    if (categoryError) setCategoryError("");
                  }}
                  placeholder={language === "kn" ? "ಹೆಸರು (ಕನ್ನಡ)" : "Kannada (ಕನ್ನಡ)"}
                  disabled={savingNewCategory}
                  className="w-28 sm:w-36 rounded border border-line-strong px-2 py-1 text-xs text-ink placeholder:text-ink-soft/60 outline-none focus:border-pine font-sans"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newCategoryName.trim()) return;
                    setTranslatingNewCategory(true);
                    try {
                      const res = await translateOnTheFly(newCategoryName.trim(), "kn", "en");
                      if (res) setNewCategoryNameKn(res);
                    } finally {
                      setTranslatingNewCategory(false);
                    }
                  }}
                  disabled={translatingNewCategory || !newCategoryName.trim()}
                  className="flex items-center justify-center rounded border border-pine/30 bg-pine-tint/40 p-1 text-pine-deep hover:bg-pine-tint disabled:opacity-40 cursor-pointer"
                  title="Translate English name to Kannada"
                >
                  {translatingNewCategory ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="submit"
                  disabled={savingNewCategory || (!newCategoryName.trim() && !newCategoryNameKn.trim())}
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
                    setNewCategoryNameKn("");
                  }}
                  className="flex items-center justify-center rounded p-1 text-ink-soft hover:bg-line/60 cursor-pointer"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsAddingCategory(true);
                setNewCategoryName("");
                setNewCategoryNameKn("");
                setCategoryError("");
              }}
              className="flex items-center gap-1 rounded-lg border border-dashed border-pine/50 bg-surface/80 px-3 py-2 text-xs font-semibold text-pine-deep hover:border-pine hover:bg-pine-tint/40 transition-all cursor-pointer shadow-2xs font-sans"
              title="Add new major category"
            >
              <Plus size={14} />
              <span>{language === "kn" ? "ವರ್ಗ ಸೇರಿಸಿ" : "Add Category"}</span>
            </button>
          )}
        </div>

        {/* Dynamic Subcategories / Types Row */}
        {selectedCategory !== "all" && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-pine/20 bg-pine-tint/25 p-2 animate-in fade-in duration-150 font-sans">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-pine-deep">
              {language === "kn"
                ? `${translateCategory(selectedCategory, "kn")} ಪ್ರಕಾರಗಳು:`
                : `${currentCatObj?.name || selectedCategory} Types:`}
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
              <span>
                {language === "kn"
                  ? `ಎಲ್ಲಾ ${translateCategory(selectedCategory, "kn")}`
                  : `All ${currentCatObj?.name || "Items"}`}
              </span>
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
                    className="flex flex-wrap items-center gap-1.5 rounded-md border border-pine bg-surface p-1 shadow-xs animate-in fade-in"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingSubName}
                      onChange={(e) => setEditingSubName(e.target.value)}
                      disabled={savingEditSub}
                      className="w-24 sm:w-32 rounded border border-line-strong px-1.5 py-0.5 text-xs text-ink outline-none focus:border-pine"
                      placeholder="Type (English)"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingSubNameKn}
                        onChange={(e) => setEditingSubNameKn(e.target.value)}
                        disabled={savingEditSub}
                        className="w-24 sm:w-32 rounded border border-line-strong px-1.5 py-0.5 text-xs text-ink outline-none focus:border-pine font-sans"
                        placeholder="Type (ಕನ್ನಡ)"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editingSubName.trim()) return;
                          setTranslatingEditSub(true);
                          try {
                            const res = await translateOnTheFly(editingSubName.trim(), "kn", "en");
                            if (res) setEditingSubNameKn(res);
                          } finally {
                            setTranslatingEditSub(false);
                          }
                        }}
                        disabled={translatingEditSub || !editingSubName.trim()}
                        className="flex items-center justify-center rounded border border-pine/30 bg-pine-tint/40 p-1 text-pine-deep hover:bg-pine-tint disabled:opacity-40 cursor-pointer"
                        title="Translate type name to Kannada"
                      >
                        {translatingEditSub ? <Loader2 size={11} className="animate-spin" /> : <Languages size={11} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="submit"
                        disabled={savingEditSub || (!editingSubName.trim() && !editingSubNameKn.trim())}
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
                          setEditingSubNameKn("");
                        }}
                        className="flex items-center justify-center rounded p-1 text-ink-soft hover:bg-line/60 cursor-pointer"
                        title="Cancel"
                      >
                        <X size={11} />
                      </button>
                    </div>
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
                  <span>{language === "kn" ? (sub.nameKn || translateSubcategory(sub.name, "kn")) : sub.name}</span>
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
                      setEditingSubNameKn(sub.nameKn || "");
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
                      title={`Delete "${sub.name}" type`}
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
                className="flex flex-wrap items-center gap-1.5 rounded-md border border-pine bg-surface p-1 shadow-xs animate-in fade-in duration-100"
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
                      setNewSubNameKn("");
                    }
                  }}
                  placeholder={language === "kn" ? "ಪ್ರಕಾರ (ಇಂಗ್ಲಿಷ್)" : "Type (English)"}
                  disabled={savingSub}
                  className="w-24 sm:w-32 rounded border border-line-strong px-1.5 py-0.5 text-xs text-ink placeholder:text-ink-soft/60 outline-none focus:border-pine"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newSubNameKn}
                    onChange={(e) => {
                      setNewSubNameKn(e.target.value);
                      if (categoryError) setCategoryError("");
                    }}
                    placeholder={language === "kn" ? "ಪ್ರಕಾರ (ಕನ್ನಡ)" : "Type (ಕನ್ನಡ)"}
                    disabled={savingSub}
                    className="w-24 sm:w-32 rounded border border-line-strong px-1.5 py-0.5 text-xs text-ink placeholder:text-ink-soft/60 outline-none focus:border-pine font-sans"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newSubName.trim()) return;
                      setTranslatingNewSub(true);
                      try {
                        const res = await translateOnTheFly(newSubName.trim(), "kn", "en");
                        if (res) setNewSubNameKn(res);
                      } finally {
                        setTranslatingNewSub(false);
                      }
                    }}
                    disabled={translatingNewSub || !newSubName.trim()}
                    className="flex items-center justify-center rounded border border-pine/30 bg-pine-tint/40 p-1 text-pine-deep hover:bg-pine-tint disabled:opacity-40 cursor-pointer"
                    title="Translate English type to Kannada"
                  >
                    {translatingNewSub ? <Loader2 size={11} className="animate-spin" /> : <Languages size={11} />}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="submit"
                    disabled={savingSub || (!newSubName.trim() && !newSubNameKn.trim())}
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
                      setNewSubNameKn("");
                    }}
                    className="flex items-center justify-center rounded p-1 text-ink-soft hover:bg-line/60 cursor-pointer"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </div>
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
                <span>{language === "kn" ? "ಪ್ರಕಾರ ಸೇರಿಸಿ" : "Add Type"}</span>
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
                {language === "kn" ? (
                  <>
                    ತೋರಿಸಲಾಗುತ್ತಿದೆ <strong className="text-ink">{filteredItems.length}</strong> /{" "}
                    {items.length} ವಸ್ತುಗಳು
                  </>
                ) : (
                  <>
                    Showing <strong className="text-ink">{filteredItems.length}</strong> of{" "}
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </>
                )}
              </span>
            ) : (
              <span>
                {language === "kn" ? (
                  <>
                    ಒಟ್ಟು ದಾಸ್ತಾನು: <strong className="text-ink">{items.length}</strong> ವಸ್ತುಗಳು
                  </>
                ) : (
                  <>
                    Total inventory: <strong className="text-ink">{items.length}</strong>{" "}
                    {items.length === 1 ? "item" : "items"}
                  </>
                )}
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
              placeholder={language === "kn" ? "ಹೆಸರು, ಪ್ರಕಾರ, ಬೆಲೆಯ ಮೂಲಕ ಹುಡುಕಿ..." : "Search by name, type, price..."}
              className="w-full rounded-md border border-line-strong bg-surface py-1.5 pl-9 pr-8 text-sm outline-none placeholder:text-ink-soft/70 focus:border-pine"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-soft hover:text-ink cursor-pointer"
                aria-label={language === "kn" ? "ಹುಡುಕಾಟ ತೆರವುಗೊಳಿಸಿ" : "Clear search"}
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
        <p className="text-sm text-ink-soft">
          {language === "kn" ? "ದಾಸ್ತಾನು ಲೋಡ್ ಆಗುತ್ತಿದೆ…" : "Loading stock…"}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
          <Boxes className="mx-auto mb-2 text-ink-soft" size={22} />
          <p className="text-sm text-ink-soft">
            {language === "kn"
              ? "ಇನ್ನೂ ಯಾವುದೇ ದಾಸ್ತಾನು ವಸ್ತುಗಳಿಲ್ಲ — ಮೇಲೆ ನಿಮ್ಮ ಮೊದಲ ಸಸ್ಯ ಅಥವಾ ವಸ್ತುವನ್ನು ಸೇರಿಸಿ."
              : "No stock items yet — add your first plant or item above."}
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
          <Boxes className="mx-auto mb-2 text-ink-soft" size={22} />
          <p className="text-sm text-ink-soft">
            {searchQuery
              ? (language === "kn"
                  ? `"${searchQuery}" ಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ದಾಸ್ತಾನು ವಸ್ತುಗಳು ಕಂಡುಬಂದಿಲ್ಲ.`
                  : `No stock items match "${searchQuery}".`)
              : (language === "kn"
                  ? "ಈ ವರ್ಗ ಫಿಲ್ಟರ್‌ಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ದಾಸ್ತಾನು ವಸ್ತುಗಳಿಲ್ಲ."
                  : "No stock items match this category filter.")}
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
            {language === "kn" ? "ಎಲ್ಲಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಮರುಹೊಂದಿಸಿ" : "Reset all filters"}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-flat text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-medium">{language === "kn" ? "ವಸ್ತು / ಸಸ್ಯದ ಹೆಸರು" : "Item"}</th>
                <th className="px-4 py-2.5 font-medium">{language === "kn" ? "ವರ್ಗ" : "Category"}</th>
                <th className="px-4 py-2.5 font-medium">{language === "kn" ? "ಘಟಕ" : "Unit"}</th>
                <th className="px-4 py-2.5 text-right font-medium">{language === "kn" ? "ದರ" : "Price"}</th>
                <th className="px-4 py-2.5 text-right font-medium">{language === "kn" ? "ಪ್ರಮಾಣ" : "Quantity"}</th>
                <th className="w-20 px-4 py-2.5">{language === "kn" ? "ಕ್ರಮಗಳು" : ""}</th>
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
                        <div className="flex flex-col gap-1.5 min-w-[200px] sm:min-w-[240px]">
                          <div>
                            <span className="text-[10px] font-semibold text-ink-soft block font-sans mb-0.5">
                              {language === "kn" ? "ಹೆಸರು (ಇಂಗ್ಲಿಷ್):" : "Name (English):"}
                            </span>
                            <input
                              value={editDraft?.name}
                              onChange={(e) =>
                                setEditDraft((d) =>
                                  d ? { ...d, name: e.target.value } : d,
                                )
                              }
                              placeholder="English name"
                              className="w-full rounded border border-line-strong bg-surface px-2 py-1 text-xs outline-none focus:border-pine"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] font-semibold text-ink-soft block font-sans">
                                {language === "kn" ? "ಹೆಸರು (ಕನ್ನಡ):" : "Name (Kannada / ಕನ್ನಡ):"}
                              </span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!editDraft?.name.trim()) return;
                                  setTranslatingInlineName(true);
                                  try {
                                    const res = await translateOnTheFly(editDraft.name.trim(), "kn", "en");
                                    if (res) {
                                      setEditDraft((d) => d ? { ...d, nameKn: res } : d);
                                    }
                                  } finally {
                                    setTranslatingInlineName(false);
                                  }
                                }}
                                disabled={translatingInlineName || !editDraft?.name.trim()}
                                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-pine hover:text-pine-deep disabled:opacity-40 cursor-pointer"
                                title="Translate to Kannada"
                              >
                                {translatingInlineName ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <Languages size={10} />
                                )}
                                <span>{language === "kn" ? "ಅನುವಾದಿಸು" : "Translate 🔄"}</span>
                              </button>
                            </div>
                            <input
                              value={editDraft?.nameKn}
                              onChange={(e) =>
                                setEditDraft((d) =>
                                  d ? { ...d, nameKn: e.target.value } : d,
                                )
                              }
                              placeholder="ಕನ್ನಡ ಹೆಸರು"
                              className="w-full rounded border border-line-strong bg-surface px-2 py-1 text-xs outline-none focus:border-pine font-sans"
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openDetailModal(item)}
                          className="group inline-flex items-center gap-2 text-left font-semibold text-ink hover:text-pine transition-colors cursor-pointer"
                          title={language === "kn" ? "ವಿವರಗಳು ಮತ್ತು ಫೋಟೋಗಳನ್ನು ವೀಕ್ಷಿಸಿ" : "Click to view photos and details"}
                        >
                          <span className="group-hover:underline">
                            {language === "kn" ? (item.nameKn || translateItem(item.name, "kn")) : item.name}
                          </span>
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
                                {language === "kn" ? (c.nameKn || translateCategory(c.name, "kn")) : c.name}
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
                                    {language === "kn" ? (s.nameKn || translateSubcategory(s.name, "kn")) : s.name}
                                  </option>
                                ))}
                                {!list.some((s) => s.slug === "other") && (
                                  <option value="other">
                                    {language === "kn" ? "ಇತರ" : "Other"}
                                  </option>
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
                        translateUnit(item.unit || "pcs", language)
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
                              title={language === "kn" ? "ಉಳಿಸಿ" : "Save changes"}
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
                              title={language === "kn" ? "ರದ್ದುಮಾಡಿ" : "Cancel edit"}
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
                              title={language === "kn" ? "ತಿದ್ದುಪಡಿ ಮಾಡಿ" : "Edit item"}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="rounded p-1.5 text-ink-soft hover:bg-rust-tint hover:text-rust cursor-pointer"
                              aria-label="Remove"
                              title={language === "kn" ? "ದಾಸ್ತಾನಿನಿಂದ ಅಳಿಸಿ" : "Delete item"}
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
                  {language === "kn" ? "ಸಕ್ರಿಯ ದಾಸ್ತಾನು ವಸ್ತುಗಳು ಕಂಡುಬಂದಿವೆ" : "Active Stock Items Detected"}
                </h3>
                <p className="text-xs text-ink-soft">
                  {reassignModal.type === "subcategory"
                    ? (language === "kn" ? "ಉಪವರ್ಗ" : "Subcategory")
                    : (language === "kn" ? "ಮುಖ್ಯ ವರ್ಗ" : "Major Category")}
                  : <strong className="text-ink">{reassignModal.name}</strong>
                </p>
              </div>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-ink-soft">
              {language === "kn" ? (
                <>
                  <strong className="text-ink">"{reassignModal.name}"</strong> ಗೆ ನಿಯೋಜಿಸಲಾದ{" "}
                  <strong className="font-semibold text-pine-deep">
                    {reassignModal.itemCount} ಸಕ್ರಿಯ ದಾಸ್ತಾನು ವಸ್ತುಗಳು
                  </strong>{" "}
                  ಇವೆ. ಅಳಿಸುವ ಮುನ್ನ, ಈ ವಸ್ತುಗಳನ್ನು ಯಾವ ವರ್ಗಕ್ಕೆ ಮರುನಿಯೋಜಿಸಬೇಕೆಂದು ಆಯ್ಕೆಮಾಡಿ:
                </>
              ) : (
                <>
                  There {reassignModal.itemCount === 1 ? "is" : "are"}{" "}
                  <strong className="font-semibold text-pine-deep">
                    {reassignModal.itemCount} active stock item{reassignModal.itemCount === 1 ? "" : "s"}
                  </strong>{" "}
                  assigned to <strong className="text-ink">"{reassignModal.name}"</strong>.
                  Before deleting, choose which tag to reassign these items to:
                </>
              )}
            </p>

            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                {language === "kn" ? "ವಸ್ತುಗಳನ್ನು ಮರುನಿಯೋಜಿಸಿ:" : "Reassign Items To:"}
              </label>
              <select
                value={reassignTarget}
                onChange={(e) => setReassignTarget(e.target.value)}
                disabled={reassigning}
                className="w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-xs font-medium text-ink outline-none focus:border-pine"
              >
                {reassignModal.type === "subcategory" ? (
                  <>
                    {reassignModal.slug.toLowerCase() !== "other" &&
                      reassignModal.slug.toLowerCase() !== "others" && (
                        <option value="other">
                          {language === "kn" ? "ಇತರ (ಅಗತ್ಯವಿದ್ದರೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ರಚಿಸಲಾಗುತ್ತದೆ)" : "Others (\"other\" - auto-created if needed)"}
                        </option>
                      )}
                    {subcategories
                      .filter(
                        (s) =>
                          s.category.toLowerCase() ===
                            (reassignModal.category || "").toLowerCase() &&
                          s.slug.toLowerCase() !== reassignModal.slug.toLowerCase() &&
                          s.slug.toLowerCase() !== "other" &&
                          s.slug.toLowerCase() !== "others"
                      )
                      .map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {language === "kn" ? (s.nameKn || translateSubcategory(s.name, "kn")) : s.name}
                        </option>
                      ))}
                  </>
                ) : (
                  <>
                    {reassignModal.slug.toLowerCase() !== "others" &&
                      reassignModal.slug.toLowerCase() !== "other" && (
                        <option value="others">
                          {language === "kn" ? "ಇತರ (ಅಗತ್ಯವಿದ್ದರೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ರಚಿಸಲಾಗುತ್ತದೆ)" : "Others (\"others\" - auto-created if needed)"}
                        </option>
                      )}
                    {categories
                      .filter(
                        (c) =>
                          c.slug.toLowerCase() !== reassignModal.slug.toLowerCase() &&
                          c.slug.toLowerCase() !== "others" &&
                          c.slug.toLowerCase() !== "other"
                      )
                      .map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {language === "kn" ? (c.nameKn || translateCategory(c.name, "kn")) : c.name}{" "}
                          {language === "kn" ? "(ಉಪವರ್ಗವು 'ಇತರ' ಆಗಿರುತ್ತದೆ)" : "(Subcategory will default to \"other\")"}
                        </option>
                      ))}
                  </>
                )}
              </select>
              <p className="mt-1.5 text-[11px] text-ink-soft/80">
                {language === "kn"
                  ? `ಅಳಿಸುವ ಮೊದಲು ಎಲ್ಲಾ ${reassignModal.itemCount} ವಸ್ತುಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಮರುನಿಯೋಜಿಸಲಾಗುತ್ತದೆ.`
                  : `All ${reassignModal.itemCount} item${reassignModal.itemCount === 1 ? "" : "s"} will be safely reassigned before deletion.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReassignModal(null)}
                disabled={reassigning}
                className="rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-ink-soft hover:bg-paper hover:text-ink transition-colors cursor-pointer"
              >
                {language === "kn" ? "ರದ್ದುಮಾಡಿ" : "Cancel"}
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
                    <span>{language === "kn" ? "ಮರುನಿಯೋಜಿಸಿ ಅಳಿಸಲಾಗುತ್ತಿದೆ..." : "Reassigning & Deleting..."}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>{language === "kn" ? "ಮರುನಿಯೋಜಿಸಿ ಮತ್ತು ಅಳಿಸಿ" : "Reassign & Delete"}</span>
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
