// src/components/StockItemDetailModal.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  Trash2,
  Boxes,
  Plus,
  Loader2,
  Image as ImageIcon,
  Globe,
  Sparkles,
  Languages,
  RotateCw,
} from "lucide-react";
import { GalleryStockItem, StockItemImage, StockCategory, StockSubcategory } from "@/lib/types";
import {
  useLanguage,
  translateCategory,
  translateSubcategory,
  translateUnit,
} from "@/lib/language-context";
import { translateOnTheFly } from "@/lib/translator";

interface StockItemDetailModalProps {
  item: GalleryStockItem | null;
  onClose: () => void;
  onItemUpdated?: (updatedItem: GalleryStockItem) => void;
  onImageDeleted?: (itemId: string, imageId: string) => void;
  onOpenUpload?: (itemId: string) => void;
  showViewInStock?: boolean;
}

export function StockItemDetailModal({
  item,
  onClose,
  onItemUpdated,
  onImageDeleted,
  onOpenUpload,
  showViewInStock = true,
}: StockItemDetailModalProps) {
  const { language, t, translateItem } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editedDescText, setEditedDescText] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  // Categories & Subcategories from DB
  const [categories, setCategories] = useState<StockCategory[]>([
    { id: "plants", name: "Plants", nameKn: "ಗಿಡಗಳು", slug: "plants" },
    { id: "non-plants", name: "Non-Plants", nameKn: "ಇತರ ವಸ್ತುಗಳು", slug: "non-plants" },
  ]);
  const [subcategories, setSubcategories] = useState<StockSubcategory[]>([]);

  // Bilingual Plant & Inventory Details Editing State
  const [editingBilingual, setEditingBilingual] = useState(false);
  const [editNameEn, setEditNameEn] = useState("");
  const [editNameKn, setEditNameKn] = useState("");
  const [editDescEn, setEditDescEn] = useState("");
  const [editDescKn, setEditDescKn] = useState("");
  const [editCategory, setEditCategory] = useState("plants");
  const [editSubcategory, setEditSubcategory] = useState("fruit");
  const [editUnit, setEditUnit] = useState("pcs");
  const [editPrice, setEditPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [translatingNameKn, setTranslatingNameKn] = useState(false);
  const [translatingNameEn, setTranslatingNameEn] = useState(false);
  const [translatingDescKn, setTranslatingDescKn] = useState(false);
  const [translatingDescEn, setTranslatingDescEn] = useState(false);
  const [savingBilingual, setSavingBilingual] = useState(false);
  const [activeDescTab, setActiveDescTab] = useState<"kn" | "en">("kn");
  const [editedDescKnText, setEditedDescKnText] = useState("");
  const [translatingImgDescKn, setTranslatingImgDescKn] = useState(false);
  const [autoTranslatedDescKn, setAutoTranslatedDescKn] = useState("");
  const [autoTranslatedImgDescKn, setAutoTranslatedImgDescKn] = useState("");

  // Load categories and subcategories on mount
  useEffect(() => {
    fetch("/api/stock/categories", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});

    fetch("/api/stock/subcategories", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && Array.isArray(data.subcategories) && data.subcategories.length > 0) {
          setSubcategories(data.subcategories);
        }
      })
      .catch(() => {});
  }, []);

  // Reset index and state when item changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setEditingDesc(false);
    setEditingBilingual(false);
    if (item?.images?.[0]) {
      setEditedDescText(item.images[0].description || "");
      setEditedDescKnText(item.images[0].descriptionKn || "");
    } else {
      setEditedDescText("");
      setEditedDescKnText("");
    }
    setEditNameEn(item?.name || "");
    setEditNameKn(item?.nameKn || "");
    setEditDescEn(item?.description || "");
    setEditDescKn(item?.descriptionKn || "");
    setEditCategory(item?.category || "plants");
    setEditSubcategory(item?.subcategory || "fruit");
    setEditUnit(item?.unit || "pcs");
    setEditPrice(item?.price?.toString() || "0");
    setEditQuantity(item?.quantity?.toString() || "0");
    setActiveDescTab(language === "kn" ? "kn" : "en");
    setAutoTranslatedDescKn("");
    setAutoTranslatedImgDescKn("");

    // If active language is Kannada and item has no Kannada description, translate on the fly
    if (language === "kn" && item && !item.descriptionKn && item.description) {
      translateOnTheFly(item.description, "kn", "en").then((trans) => {
        if (trans) setAutoTranslatedDescKn(trans);
      });
    }
  }, [item, language]);

  if (!item) return null;

  const hasImages = item.images && item.images.length > 0;
  const currentImage: StockItemImage | undefined = hasImages
    ? item.images[selectedImageIndex] || item.images[0]
    : undefined;

  const handleSelectImageIndex = (index: number) => {
    setSelectedImageIndex(index);
    setEditingDesc(false);
    if (item.images?.[index]) {
      setEditedDescText(item.images[index].description || "");
      setEditedDescKnText(item.images[index].descriptionKn || "");
    }
  };

  const handleTranslateImgDescToKn = async () => {
    if (!editedDescText.trim()) return;
    try {
      setTranslatingImgDescKn(true);
      const translated = await translateOnTheFly(editedDescText.trim(), "kn", "en");
      if (translated) {
        setEditedDescKnText(translated);
      }
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setTranslatingImgDescKn(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!currentImage) return;
    try {
      setSavingDesc(true);
      const res = await fetch(`/api/gallery/images/${currentImage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editedDescText.trim(),
          descriptionKn: editedDescKnText.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to update description");

      // Update in-memory item
      const updatedImages = item.images.map((img, idx) =>
        idx === selectedImageIndex
          ? {
              ...img,
              description: editedDescText.trim(),
              descriptionKn: editedDescKnText.trim(),
            }
          : img
      );
      const updatedItem: GalleryStockItem = { ...item, images: updatedImages };
      onItemUpdated?.(updatedItem);
      setEditingDesc(false);
    } catch (err) {
      console.error("Failed to save description:", err);
      alert("Failed to save description. Please try again.");
    } finally {
      setSavingDesc(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!currentImage) return;
    if (!confirm("Are you sure you want to delete this photo? This cannot be undone.")) {
      return;
    }

    try {
      setDeletingImage(true);
      const res = await fetch(`/api/gallery/images/${currentImage.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete image");

      const remainingImages = item.images.filter((img) => img.id !== currentImage.id);
      const updatedItem: GalleryStockItem = { ...item, images: remainingImages };

      onImageDeleted?.(item.id, currentImage.id);
      onItemUpdated?.(updatedItem);

      if (remainingImages.length > 0) {
        setSelectedImageIndex(0);
        setEditedDescText(remainingImages[0]?.description || "");
      } else {
        setSelectedImageIndex(0);
        setEditedDescText("");
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
      alert("Failed to delete image. Please try again.");
    } finally {
      setDeletingImage(false);
    }
  };

  // On-the-fly Google Translation handlers
  const handleTranslateName = async () => {
    if (!editNameEn.trim()) return;
    setTranslatingNameKn(true);
    try {
      const translated = await translateOnTheFly(editNameEn, "kn", "en");
      if (translated) setEditNameKn(translated);
    } finally {
      setTranslatingNameKn(false);
    }
  };

  const handleTranslateNameEn = async () => {
    if (!editNameKn.trim()) return;
    setTranslatingNameEn(true);
    try {
      const translated = await translateOnTheFly(editNameKn, "en", "kn");
      if (translated) setEditNameEn(translated);
    } finally {
      setTranslatingNameEn(false);
    }
  };

  const handleTranslateDescToKn = async () => {
    if (!editDescEn.trim()) return;
    setTranslatingDescKn(true);
    try {
      const translated = await translateOnTheFly(editDescEn, "kn", "en");
      if (translated) setEditDescKn(translated);
    } finally {
      setTranslatingDescKn(false);
    }
  };

  const handleTranslateDescToEn = async () => {
    if (!editDescKn.trim()) return;
    setTranslatingDescEn(true);
    try {
      const translated = await translateOnTheFly(editDescKn, "en", "kn");
      if (translated) setEditDescEn(translated);
    } finally {
      setTranslatingDescEn(false);
    }
  };

  const handleSaveBilingualDetails = async () => {
    try {
      setSavingBilingual(true);
      let finalNameKn = editNameKn.trim();
      if (!finalNameKn && editNameEn.trim()) {
        try {
          finalNameKn = await translateOnTheFly(editNameEn.trim(), "kn", "en");
          if (finalNameKn) setEditNameKn(finalNameKn);
        } catch {}
      }

      const priceNum = Math.max(0, parseFloat(editPrice) || 0);
      const qtyNum = Math.max(0, parseInt(editQuantity, 10) || 0);

      const res = await fetch(`/api/stock/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editNameEn.trim() || finalNameKn || item.name,
          nameKn: finalNameKn || null,
          category: editCategory || item.category || "plants",
          subcategory: editSubcategory || item.subcategory || "other",
          unit: editUnit.trim() || item.unit || "pcs",
          price: priceNum,
          quantity: qtyNum,
          description: editDescEn.trim() || null,
          descriptionKn: editDescKn.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update item details");
      const updatedItem: GalleryStockItem = {
        ...item,
        name: editNameEn.trim() || finalNameKn || item.name,
        nameKn: finalNameKn || null,
        category: editCategory || item.category || "plants",
        subcategory: editSubcategory || item.subcategory || "other",
        unit: editUnit.trim() || item.unit || "pcs",
        price: priceNum.toFixed(2),
        quantity: qtyNum,
        description: editDescEn.trim() || null,
        descriptionKn: editDescKn.trim() || null,
      };
      onItemUpdated?.(updatedItem);
      setEditingBilingual(false);
      window.dispatchEvent(new Event("stockUpdated"));
    } catch (err) {
      console.error("Failed to save item details:", err);
      alert("Failed to save item details. Please try again.");
    } finally {
      setSavingBilingual(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-line bg-paper-flat shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
          <div className="min-w-0 pr-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="font-serif text-lg font-bold text-pine-deep truncate sm:text-xl">
                {language === "kn"
                  ? item.nameKn || translateItem(item.name, "kn")
                  : item.name}
              </h2>
              {language !== "kn" && item.nameKn ? (
                <span className="text-xs font-normal text-ink-soft">({item.nameKn})</span>
              ) : null}
            </div>
            <span className="text-xs capitalize text-ink-soft font-sans">
              {translateCategory(item.category, language)} • {translateSubcategory(item.subcategory || "other", language)}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!editingBilingual && (
              <button
                type="button"
                onClick={() => setEditingBilingual(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-pine-deep hover:border-pine hover:bg-pine/10 cursor-pointer transition-colors shadow-2xs font-sans"
                title={language === "kn" ? "ವಸ್ತುವನ್ನು ಸಂಪಾದಿಸಿ" : "Edit Item Details"}
              >
                <Edit2 size={12} />
                <span>{language === "kn" ? "ಸಂಪಾದಿಸಿ" : "Edit Item"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-line/60 hover:text-ink cursor-pointer"
              title={language === "kn" ? "ಮುಚ್ಚಿ" : "Close"}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Main Image or Placeholder */}
          {hasImages && currentImage ? (
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-line bg-black/5 flex items-center justify-center">
              <img
                src={currentImage.imageUrl}
                alt={item.name}
                className="h-full w-full object-contain"
              />

              {/* Left/Right carousel navigation if multiple images */}
              {item.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIdx =
                        (selectedImageIndex - 1 + item.images.length) %
                        item.images.length;
                      handleSelectImageIndex(nextIdx);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/85 text-ink shadow-md backdrop-blur-xs hover:bg-surface cursor-pointer"
                    title="Previous Image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIdx =
                        (selectedImageIndex + 1) % item.images.length;
                      handleSelectImageIndex(nextIdx);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/85 text-ink shadow-md backdrop-blur-xs hover:bg-surface cursor-pointer"
                    title="Next Image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-line/10 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pine-tint text-pine">
                <ImageIcon size={26} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-ink">No photos added yet</p>
              <p className="max-w-xs text-xs text-ink-soft">
                Add plant visuals, variety reference images, or stock photos for this item.
              </p>
              {onOpenUpload && (
                <button
                  type="button"
                  onClick={() => onOpenUpload(item.id)}
                  className="mt-1 flex items-center gap-1.5 rounded-lg bg-pine px-3.5 py-1.5 text-xs font-semibold text-surface transition-colors hover:bg-pine-deep cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Upload First Photo</span>
                </button>
              )}
            </div>
          )}

          {/* Thumbnails if multiple images exist */}
          {hasImages && item.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {item.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => handleSelectImageIndex(idx)}
                  className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                    idx === selectedImageIndex
                      ? "border-pine ring-2 ring-pine/30"
                      : "border-line opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Photo Description Section (if has photos) */}
          {hasImages && currentImage && (
            <div className="rounded-xl border border-line bg-paper p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-pine">
                  {language === "kn" ? "ಫೋಟೋ ವಿವರಣೆ" : "Photo Description"}
                </span>
                {!editingDesc ? (
                  <button
                    onClick={() => {
                      setEditingDesc(true);
                      setEditedDescText(currentImage.description || "");
                      setEditedDescKnText(currentImage.descriptionKn || "");
                    }}
                    className="flex items-center gap-1 text-xs text-ink-soft hover:text-pine cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>
                      {language === "kn"
                        ? "ವಿವರಣೆ ಸಂಪಾದಿಸಿ"
                        : currentImage.description || currentImage.descriptionKn
                        ? "Edit"
                        : "Add Description"}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingDesc(false)}
                      disabled={savingDesc}
                      className="text-xs text-ink-soft hover:text-ink cursor-pointer px-1.5 py-0.5"
                    >
                      {language === "kn" ? "ರದ್ದು" : "Cancel"}
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      disabled={savingDesc}
                      className="flex items-center gap-1 rounded bg-pine px-2 py-0.5 text-xs font-medium text-surface hover:bg-pine-deep cursor-pointer"
                    >
                      {savingDesc ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      <span>{language === "kn" ? "ಉಳಿಸಿ" : "Save"}</span>
                    </button>
                  </div>
                )}
              </div>

              {editingDesc ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft mb-1 block">English</label>
                    <textarea
                      value={editedDescText}
                      onChange={(e) => setEditedDescText(e.target.value)}
                      rows={2}
                      placeholder="Describe this photo in English..."
                      className="w-full rounded-lg border border-line bg-surface p-2 text-xs text-ink focus:border-pine focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-ink-soft">ಕನ್ನಡ (Kannada)</label>
                      <button
                        type="button"
                        onClick={handleTranslateImgDescToKn}
                        disabled={translatingImgDescKn || !editedDescText.trim()}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-pine-deep hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {translatingImgDescKn ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Sparkles size={11} />
                        )}
                        <span>Translate to Kannada 🔄</span>
                      </button>
                    </div>
                    <textarea
                      value={editedDescKnText}
                      onChange={(e) => setEditedDescKnText(e.target.value)}
                      rows={2}
                      placeholder="ಫೋಟೋ ವಿವರಣೆ ಕನ್ನಡದಲ್ಲಿ..."
                      className="w-full rounded-lg border border-line bg-surface p-2 text-xs text-ink focus:border-pine focus:outline-none font-sans"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs sm:text-sm leading-relaxed text-ink space-y-1">
                  {language === "kn" ? (
                    currentImage.descriptionKn || autoTranslatedImgDescKn ? (
                      <p className="font-sans whitespace-pre-wrap">
                        {currentImage.descriptionKn || autoTranslatedImgDescKn}
                      </p>
                    ) : (
                      <span className="italic text-ink-soft font-sans">
                        ಯಾವುದೇ ಫೋಟೋ ವಿವರಣೆ ನೀಡಿಲ್ಲ. ವಿವರಣೆ ಸೇರಿಸಲು ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ.
                      </span>
                    )
                  ) : currentImage.description || currentImage.descriptionKn ? (
                    <div>
                      <p>{currentImage.description || currentImage.descriptionKn}</p>
                      {currentImage.description && currentImage.descriptionKn && (
                        <p className="text-[11px] text-ink-soft font-sans mt-0.5">{currentImage.descriptionKn}</p>
                      )}
                    </div>
                  ) : (
                    <span className="italic text-ink-soft">
                      No description provided yet. Click &quot;Add Description&quot; to describe this photo.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Plant Description & Bilingual Details Section */}
          <div className="rounded-xl border border-line bg-paper p-4">
            <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Globe size={14} className="text-pine" />
                <span className="text-xs font-bold uppercase tracking-wider text-pine font-sans">
                  {language === "kn" ? "ವಸ್ತು / ಸಸ್ಯದ ಮಾಹಿತಿ ಮತ್ತು ವಿವರಣೆ" : "Plant & Stock Item Details"}
                </span>
              </div>

              {!editingBilingual && (
                <button
                  type="button"
                  onClick={() => setEditingBilingual(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-pine-deep hover:underline cursor-pointer bg-pine/10 hover:bg-pine/20 px-2.5 py-1 rounded transition-colors font-sans"
                  title="Edit item details, price, quantity, and bilingual names"
                >
                  <Sparkles size={13} className="text-pine" />
                  <span>{language === "kn" ? "ವಸ್ತು ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ" : "Edit Item Details"}</span>
                </button>
              )}
            </div>

            {/* Bilingual Editing Form */}
            {editingBilingual ? (
              <div className="mt-2 space-y-3.5 rounded-lg border border-pine/30 bg-surface p-3.5 sm:p-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pine-deep">
                    <Languages size={14} />
                    <span>
                      {language === "kn"
                        ? "ದಾಸ್ತಾನು ವಸ್ತುವಿನ ಸಮಗ್ರ ಸಂಪಾದನೆ (ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ)"
                        : "Edit Stock Item Details (English & Kannada)"}
                    </span>
                  </div>
                  <span className="text-[10px] text-ink-soft bg-paper-flat px-1.5 py-0.5 rounded font-medium">
                    Google Translate Integrated
                  </span>
                </div>

                {/* Plant Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">
                        {language === "kn" ? "ಹೆಸರು (ಇಂಗ್ಲಿಷ್)" : "Name (English)"}
                      </span>
                      <button
                        type="button"
                        onClick={handleTranslateName}
                        disabled={translatingNameKn || !editNameEn.trim()}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-pine-deep hover:underline cursor-pointer disabled:opacity-50"
                        title="Translate English name into Kannada on the fly"
                      >
                        {translatingNameKn ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <RotateCw size={11} />
                        )}
                        <span>{language === "kn" ? "ಕನ್ನಡಕ್ಕೆ ಅನುವಾದಿಸು" : "Translate to Kannada 🔄"}</span>
                      </button>
                    </div>
                    <input
                      value={editNameEn}
                      onChange={(e) => setEditNameEn(e.target.value)}
                      placeholder="e.g. Chikoo / Sapota Plant"
                      className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs sm:text-sm text-ink outline-none focus:border-pine"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink font-sans">
                        {language === "kn" ? "ಹೆಸರು (ಕನ್ನಡ)" : "Name (Kannada / ಕನ್ನಡ)"}
                      </span>
                      <button
                        type="button"
                        onClick={handleTranslateNameEn}
                        disabled={translatingNameEn || !editNameKn.trim()}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-pine-deep hover:underline cursor-pointer disabled:opacity-50"
                        title="Translate Kannada name into English on the fly"
                      >
                        {translatingNameEn ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <RotateCw size={11} />
                        )}
                        <span>{language === "kn" ? "ಇಂಗ್ಲಿಷ್‌ಗೆ ಅನುವಾದಿಸು" : "Translate to English 🔄"}</span>
                      </button>
                    </div>
                    <input
                      value={editNameKn}
                      onChange={(e) => setEditNameKn(e.target.value)}
                      placeholder="ಉದಾ: ಚಿಕ್ಕು / ಸಪೋಟ ಗಿಡ"
                      className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs sm:text-sm text-ink outline-none focus:border-pine font-sans"
                    />
                  </label>
                </div>

                {/* Category & Subcategory Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-ink font-sans">
                      {language === "kn" ? "ವರ್ಗ (Category)" : "Category"}
                    </span>
                    <select
                      value={editCategory}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setEditCategory(newCat);
                        const catSubs = subcategories.filter(
                          (s) => s.category.toLowerCase() === newCat.toLowerCase()
                        );
                        setEditSubcategory(catSubs[0]?.slug || "other");
                      }}
                      className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs sm:text-sm text-ink outline-none focus:border-pine font-sans"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {language === "kn" ? (c.nameKn || translateCategory(c.name, "kn")) : c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-ink font-sans">
                      {language === "kn" ? "ಉಪವರ್ಗ / ಪ್ರಕಾರ (Subcategory)" : "Subcategory / Type"}
                    </span>
                    {(() => {
                      const curCat = editCategory.toLowerCase();
                      const catSubs = subcategories.filter(
                        (s) => s.category.toLowerCase() === curCat
                      );
                      return (
                        <select
                          value={editSubcategory}
                          onChange={(e) => setEditSubcategory(e.target.value)}
                          className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs sm:text-sm text-ink outline-none focus:border-pine font-sans"
                        >
                          {catSubs.map((s) => (
                            <option key={s.slug} value={s.slug}>
                              {language === "kn" ? (s.nameKn || translateSubcategory(s.name, "kn")) : s.name}
                            </option>
                          ))}
                          {!catSubs.some((s) => s.slug === "other") && (
                            <option value="other">
                              {language === "kn" ? "ಇತರ (Other)" : "Other"}
                            </option>
                          )}
                        </select>
                      );
                    })()}
                  </label>
                </div>

                {/* Price, Quantity, Unit Fields */}
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-ink font-sans">
                      {language === "kn" ? "ಬೆಲೆ (₹ Price)" : "Price (₹)"}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="0.00"
                      className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs sm:text-sm text-ink outline-none focus:border-pine font-mono"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-ink font-sans">
                      {language === "kn" ? "ಪ್ರಮಾಣ (Quantity)" : "Stock Quantity"}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      placeholder="0"
                      className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs sm:text-sm text-ink outline-none focus:border-pine font-mono"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-ink font-sans">
                      {language === "kn" ? "ಘಟಕ (Unit)" : "Unit"}
                    </span>
                    <input
                      type="text"
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      placeholder="pcs, kg, bag..."
                      className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs sm:text-sm text-ink outline-none focus:border-pine"
                    />
                  </label>
                </div>

                {/* Description Fields */}
                <div className="space-y-2.5 pt-1">
                  <label className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">
                        {language === "kn" ? "ವಿವರಣೆ (ಇಂಗ್ಲಿಷ್)" : "Description (English)"}
                      </span>
                      <button
                        type="button"
                        onClick={handleTranslateDescToKn}
                        disabled={translatingDescKn || !editDescEn.trim()}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-pine-deep hover:underline cursor-pointer disabled:opacity-50"
                        title="Translate English description into Kannada on the fly"
                      >
                        {translatingDescKn ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Sparkles size={11} />
                        )}
                        <span>{language === "kn" ? "ಕನ್ನಡಕ್ಕೆ ಅನುವಾದಿಸು" : "Translate to Kannada 🔄"}</span>
                      </button>
                    </div>
                    <textarea
                      value={editDescEn}
                      onChange={(e) => setEditDescEn(e.target.value)}
                      rows={3}
                      placeholder="Plant variety details, blossom color, fruit yield, watering notes..."
                      className="w-full rounded-md border border-line-strong bg-surface p-2 text-xs sm:text-sm text-ink outline-none focus:border-pine"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink font-sans">
                        {language === "kn" ? "ವಿವರಣೆ (ಕನ್ನಡ)" : "Description (Kannada / ಕನ್ನಡ ವಿವರಣೆ)"}
                      </span>
                      <button
                        type="button"
                        onClick={handleTranslateDescToEn}
                        disabled={translatingDescEn || !editDescKn.trim()}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-pine-deep hover:underline cursor-pointer disabled:opacity-50"
                        title="Translate Kannada description into English on the fly"
                      >
                        {translatingDescEn ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Sparkles size={11} />
                        )}
                        <span>{language === "kn" ? "ಇಂಗ್ಲಿಷ್‌ಗೆ ಅನುವಾದಿಸು" : "Translate to English 🔄"}</span>
                      </button>
                    </div>
                    <textarea
                      value={editDescKn}
                      onChange={(e) => setEditDescKn(e.target.value)}
                      rows={3}
                      placeholder="ಗಿಡದ ವಿವರಣೆ, ಹೂವಿನ ಬಣ್ಣ, ಹಣ್ಣಿನ ಇಳುವರಿ, ಬೆಳೆಸುವ ವಿಧಾನ..."
                      className="w-full rounded-md border border-line-strong bg-surface p-2 text-xs sm:text-sm text-ink outline-none focus:border-pine font-sans"
                    />
                  </label>
                </div>

                {/* Save / Cancel Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-line">
                  <button
                    type="button"
                    onClick={() => {
                      setEditNameEn(item.name || "");
                      setEditNameKn(item.nameKn || "");
                      setEditCategory(item.category || "plants");
                      setEditSubcategory(item.subcategory || "other");
                      setEditUnit(item.unit || "pcs");
                      setEditPrice(item.price?.toString() || "0");
                      setEditQuantity(item.quantity?.toString() || "0");
                      setEditDescEn(item.description || "");
                      setEditDescKn(item.descriptionKn || "");
                      setEditingBilingual(false);
                    }}
                    disabled={savingBilingual}
                    className="rounded px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink cursor-pointer"
                  >
                    {language === "kn" ? "ರದ್ದುಮಾಡಿ" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBilingualDetails}
                    disabled={savingBilingual}
                    className="inline-flex items-center gap-1.5 rounded-md bg-pine px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-pine-deep cursor-pointer disabled:opacity-50"
                  >
                    {savingBilingual ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                    <span>
                      {savingBilingual
                        ? language === "kn" ? "ಉಳಿಸಲಾಗುತ್ತಿದೆ…" : "Saving..."
                        : language === "kn" ? "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ" : "Save Changes"}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Viewing Mode: Tabbed Kannada / English Description Display */
              <div className="space-y-2">
                {language === "kn" ? (
                  /* Pure Kannada Display */
                  <div className="text-xs sm:text-sm leading-relaxed text-ink font-sans">
                    {item.descriptionKn || autoTranslatedDescKn ? (
                      <p className="whitespace-pre-wrap">{item.descriptionKn || autoTranslatedDescKn}</p>
                    ) : (
                      <p className="italic text-ink-soft">
                        ಯಾವುದೇ ವಿವರಣೆ ನೀಡಿಲ್ಲ. ವಿವರಣೆ ಸೇರಿಸಲು ಮೇಲೆ &quot;ವಿವರಣೆ ಸಂಪಾದಿಸಿ&quot; ಕ್ಲಿಕ್ ಮಾಡಿ.
                      </p>
                    )}
                  </div>
                ) : (
                  /* English / Multi-tab Display */
                  <>
                    <div className="flex items-center gap-2 border-b border-line/60 pb-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveDescTab("en")}
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors cursor-pointer ${
                          activeDescTab === "en"
                            ? "bg-pine text-white font-semibold"
                            : "text-ink-soft hover:text-ink"
                        }`}
                      >
                        <span>English</span>
                        {item.description && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDescTab("kn")}
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors cursor-pointer ${
                          activeDescTab === "kn"
                            ? "bg-pine text-white font-semibold"
                            : "text-ink-soft hover:text-ink"
                        }`}
                      >
                        <span>ಕನ್ನಡ (Kannada)</span>
                        {item.descriptionKn && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                      </button>
                    </div>

                    <div className="text-xs sm:text-sm leading-relaxed text-ink">
                      {activeDescTab === "en" ? (
                        item.description ? (
                          <p className="whitespace-pre-wrap">{item.description}</p>
                        ) : (
                          <p className="italic text-ink-soft">
                            No English description provided yet. Click &quot;Edit in English &amp; Kannada&quot; above to add.
                          </p>
                        )
                      ) : item.descriptionKn ? (
                        <p className="font-sans whitespace-pre-wrap">{item.descriptionKn}</p>
                      ) : (
                        <p className="italic text-ink-soft">
                          ಕನ್ನಡದಲ್ಲಿ ಯಾವುದೇ ವಿವರಣೆ ನೀಡಿಲ್ಲ.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Stock Details Quick Glance */}
          <div className="rounded-xl border border-line bg-paper p-3 text-xs font-sans">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                {language === "kn" ? "ದಾಸ್ತಾನು ತ್ವರಿತ ಮಾಹಿತಿ" : "Stock Quick Summary"}
              </span>
              {!editingBilingual && (
                <button
                  type="button"
                  onClick={() => setEditingBilingual(true)}
                  className="text-[11px] font-semibold text-pine-deep hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Edit2 size={11} />
                  <span>{language === "kn" ? "ಸಂಪಾದಿಸಿ" : "Edit"}</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <span className="block text-[11px] text-ink-soft">
                  {language === "kn" ? "ಬೆಲೆ" : "Price"}
                </span>
                <span className="font-semibold text-ink">₹{item.price}</span>
              </div>
              <div>
                <span className="block text-[11px] text-ink-soft">
                  {language === "kn" ? "ದಾಸ್ತಾನು" : "Stock In Hand"}
                </span>
                <span className="font-semibold text-ink">
                  {item.quantity} {translateUnit(item.unit || "pcs", language)}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-ink-soft">
                  {language === "kn" ? "ವರ್ಗ" : "Category"}
                </span>
                <span className="font-medium capitalize text-ink">
                  {translateCategory(item.category, language)}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-ink-soft">
                  {language === "kn" ? "ಉಪವರ್ಗ" : "Subcategory"}
                </span>
                <span className="font-medium capitalize text-ink">
                  {translateSubcategory(item.subcategory || "other", language)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions - Optimized for Mobile Screen Placement */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-line bg-paper px-4 py-3 sm:px-6">
          {hasImages && currentImage ? (
            <button
              onClick={handleDeleteImage}
              disabled={deletingImage}
              className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-rust transition-colors hover:bg-rust-tint/40 cursor-pointer"
            >
              {deletingImage ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              <span>{language === "kn" ? "ಫೋಟೋ ಅಳಿಸಿ" : "Delete Photo"}</span>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div
            className={`grid ${
              showViewInStock && onOpenUpload ? "grid-cols-2" : "grid-cols-1"
            } sm:flex items-center gap-2 w-full sm:w-auto`}
          >
            {showViewInStock && (
              <Link
                href="/stock"
                className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-line/40 text-center"
              >
                <Boxes size={14} />
                <span>{language === "kn" ? "ದಾಸ್ತಾನಿನಲ್ಲಿ ನೋಡಿ" : "View in Stock"}</span>
              </Link>
            )}

            {onOpenUpload && (
              <button
                type="button"
                onClick={() => onOpenUpload(item.id)}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-pine px-3.5 py-2 text-xs font-semibold text-surface transition-colors hover:bg-pine-deep cursor-pointer text-center shadow-xs"
              >
                <Plus size={14} />
                <span>
                  {language === "kn"
                    ? hasImages
                      ? "ಇನ್ನೊಂದು ಫೋಟೋ ಸೇರಿಸಿ"
                      : "ಫೋಟೋ ಸೇರಿಸಿ"
                    : hasImages
                    ? "Add Another Photo"
                    : "Add Photo"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
