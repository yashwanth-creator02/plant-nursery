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
} from "lucide-react";
import { GalleryStockItem, StockItemImage } from "@/lib/types";

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editedDescText, setEditedDescText] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  // Reset index and state when item changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setEditingDesc(false);
    if (item?.images?.[0]) {
      setEditedDescText(item.images[0].description || "");
    } else {
      setEditedDescText("");
    }
  }, [item]);

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
    }
  };

  const handleSaveDescription = async () => {
    if (!currentImage) return;
    try {
      setSavingDesc(true);
      const res = await fetch(`/api/gallery/images/${currentImage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editedDescText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update description");

      // Update in-memory item
      const updatedImages = item.images.map((img, idx) =>
        idx === selectedImageIndex ? { ...img, description: editedDescText.trim() } : img
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-line bg-paper-flat shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
          <div className="min-w-0 pr-3">
            <h2 className="font-serif text-lg font-bold text-pine-deep truncate sm:text-xl">
              {item.name}
            </h2>
            <span className="text-xs capitalize text-ink-soft">
              {item.category} • {item.subcategory || "General"}
            </span>
            {item.description && (
              <p className="mt-0.5 text-xs text-ink-soft/90 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-line/60 hover:text-ink cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
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
                  Photo Description
                </span>
                {!editingDesc ? (
                  <button
                    onClick={() => {
                      setEditingDesc(true);
                      setEditedDescText(currentImage.description || "");
                    }}
                    className="flex items-center gap-1 text-xs text-ink-soft hover:text-pine cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>{currentImage.description ? "Edit" : "Add Description"}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingDesc(false)}
                      disabled={savingDesc}
                      className="text-xs text-ink-soft hover:text-ink cursor-pointer px-1.5 py-0.5"
                    >
                      Cancel
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
                      <span>Save</span>
                    </button>
                  </div>
                )}
              </div>

              {editingDesc ? (
                <textarea
                  value={editedDescText}
                  onChange={(e) => setEditedDescText(e.target.value)}
                  rows={3}
                  placeholder="Describe this plant variety, blossom color, age, pot size, or special nursery notes..."
                  className="w-full rounded-lg border border-line bg-surface p-2.5 text-xs sm:text-sm text-ink focus:border-pine focus:outline-none"
                  autoFocus
                />
              ) : (
                <p className="text-xs sm:text-sm leading-relaxed text-ink">
                  {currentImage.description || item.description || (
                    <span className="italic text-ink-soft">
                      No description provided yet. Click &quot;Add Description&quot; to describe this variety.
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Plant Description if no photo or photo has separate description */}
          {!hasImages && item.description && (
            <div className="rounded-xl border border-line bg-paper p-4">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-pine">
                Plant Description
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-ink">
                {item.description}
              </p>
            </div>
          )}

          {/* Stock Details Quick Glance */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-paper p-3 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-[11px] text-ink-soft">Price</span>
              <span className="font-semibold text-ink">₹{item.price}</span>
            </div>
            <div>
              <span className="block text-[11px] text-ink-soft">Stock In Hand</span>
              <span className="font-semibold text-ink">
                {item.quantity} {item.unit || "pcs"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-ink-soft">Category</span>
              <span className="font-medium capitalize text-ink">
                {item.category}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-ink-soft">Subcategory</span>
              <span className="font-medium capitalize text-ink">
                {item.subcategory || "Other"}
              </span>
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
              <span>Delete Photo</span>
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
                <span>View in Stock</span>
              </Link>
            )}

            {onOpenUpload && (
              <button
                type="button"
                onClick={() => onOpenUpload(item.id)}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-pine px-3.5 py-2 text-xs font-semibold text-surface transition-colors hover:bg-pine-deep cursor-pointer text-center shadow-xs"
              >
                <Plus size={14} />
                <span>{hasImages ? "Add Another Photo" : "Add Photo"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
