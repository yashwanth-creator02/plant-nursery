// src/app/gallery/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Image as ImageIcon,
  Images,
  Plus,
} from "lucide-react";
import { GalleryStockItem } from "@/lib/types";
import { StockItemDetailModal } from "@/components/StockItemDetailModal";
import { StockPhotoUploadModal } from "@/components/StockPhotoUploadModal";

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "plants" | "non-plants">("all");
  const [photoFilter, setPhotoFilter] = useState<"all" | "with-photos" | "needs-photos">("all");

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<GalleryStockItem | null>(null);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetItemId, setUploadTargetItemId] = useState<string>("");

  // Load Gallery Data
  const loadGallery = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gallery");
      if (!res.ok) throw new Error("Failed to load gallery");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  // Filtered items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      // Photo presence filter
      const hasPhotos = item.images && item.images.length > 0;
      if (photoFilter === "with-photos" && !hasPhotos) return false;
      if (photoFilter === "needs-photos" && hasPhotos) return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchesName = item.name.toLowerCase().includes(q);
      const matchesCategory = item.category?.toLowerCase().includes(q);
      const matchesSub = item.subcategory?.toLowerCase().includes(q);
      const matchesDesc = item.images?.some((img) =>
        img.description?.toLowerCase().includes(q)
      );

      return matchesName || matchesCategory || matchesSub || matchesDesc;
    });
  }, [items, categoryFilter, photoFilter, searchQuery]);

  // Total stats
  const totalWithPhotos = useMemo(
    () => items.filter((i) => i.images && i.images.length > 0).length,
    [items]
  );

  // Detail modal open
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
  };

  // Upload modal open
  const openUploadModal = (targetStockItemId?: string) => {
    setUploadTargetItemId(targetStockItemId || (items[0]?.id ?? ""));
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
  };

  const handleUploadSuccess = async (updatedItemId: string) => {
    await loadGallery();
    // Also update selected item if currently open
    try {
      const res = await fetch("/api/gallery");
      if (res.ok) {
        const data = await res.json();
        const updated = (data.items || []).find((x: GalleryStockItem) => x.id === updatedItemId);
        if (updated && selectedItem?.id === updatedItemId) {
          setSelectedItem(updated);
        }
      }
    } catch {}
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Top Header & Overview */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-pine-deep sm:text-3xl">
            Stock Gallery
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Explore plant photos, inventory visuals, and upload images with camera or file drop.
          </p>
        </div>

        {/* Action Buttons - Clean Mobile Layout without redundant camera button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openUploadModal()}
            className="flex h-10 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg bg-pine px-4 text-xs sm:text-sm font-semibold text-surface shadow-sm transition-all hover:bg-pine-deep cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Sticky Search & Filter Bar */}
      <div className="sticky top-0 z-20 mb-6 rounded-xl border border-line bg-paper-flat/90 p-3 backdrop-blur-md shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/70"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by plant name, category, or photo description..."
              className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-xs sm:text-sm text-ink placeholder-ink-soft/60 focus:border-pine focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-soft hover:text-ink cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex rounded-lg border border-line bg-paper p-0.5 text-xs font-medium shrink-0">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                  categoryFilter === "all"
                    ? "bg-surface text-pine-deep font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                All Categories
              </button>
              <button
                onClick={() => setCategoryFilter("plants")}
                className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                  categoryFilter === "plants"
                    ? "bg-surface text-pine-deep font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Plants
              </button>
              <button
                onClick={() => setCategoryFilter("non-plants")}
                className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                  categoryFilter === "non-plants"
                    ? "bg-surface text-pine-deep font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Non-Plants
              </button>
            </div>

            {/* Photo presence filter */}
            <div className="flex rounded-lg border border-line bg-paper p-0.5 text-xs font-medium shrink-0">
              <button
                onClick={() => setPhotoFilter("all")}
                className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                  photoFilter === "all"
                    ? "bg-surface text-pine-deep font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setPhotoFilter("with-photos")}
                className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                  photoFilter === "with-photos"
                    ? "bg-surface text-pine-deep font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                With Photos ({totalWithPhotos})
              </button>
              <button
                onClick={() => setPhotoFilter("needs-photos")}
                className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                  photoFilter === "needs-photos"
                    ? "bg-surface text-pine-deep font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Needs Photos ({items.length - totalWithPhotos})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-xl border border-line bg-paper-flat"
            >
              <div className="aspect-4/3 w-full bg-line/40" />
              <div className="p-3">
                <div className="h-4 w-3/4 rounded bg-line/50 mb-1" />
                <div className="h-3 w-1/2 rounded bg-line/30" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pine-tint text-pine">
            <ImageIcon size={28} />
          </div>
          <h3 className="font-serif text-lg font-semibold text-ink">No items found</h3>
          <p className="mt-1 max-w-sm text-xs sm:text-sm text-ink-soft">
            {searchQuery
              ? `No stock items match "${searchQuery}". Try adjusting your search term or filters.`
              : photoFilter === "with-photos"
              ? "No items have photos yet. Tap 'Upload Photo' to add photos for your plants!"
              : "No stock items available. Add items in Stock management first."}
          </p>
          <div className="mt-5 flex gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="rounded-lg border border-line bg-paper px-3.5 py-2 text-xs font-medium text-ink hover:bg-line/40 cursor-pointer"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={() => openUploadModal()}
              className="rounded-lg bg-pine px-4 py-2 text-xs font-semibold text-surface hover:bg-pine-deep cursor-pointer"
            >
              Upload Photo
            </button>
          </div>
        </div>
      ) : (
        /* Rectangular Cards Grid */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredItems.map((item) => {
            const hasImages = item.images && item.images.length > 0;
            const primaryImage = item.images?.find((img) => img.isPrimary) || item.images?.[0];

            return (
              <div
                key={item.id}
                onClick={() => (hasImages ? openDetailModal(item) : openUploadModal(item.id))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    hasImages ? openDetailModal(item) : openUploadModal(item.id);
                  }
                }}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-paper-flat shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine"
              >
                {/* Rectangular Image Container (4:3 aspect ratio) */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-line/20">
                  {hasImages && primaryImage ? (
                    <img
                      src={primaryImage.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    /* Placeholder for items without images */
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-4 text-center text-ink-soft/70 transition-colors group-hover:text-pine">
                      <ImageIcon size={32} strokeWidth={1.5} />
                      <span className="text-[11px] font-medium">+ Add Photo</span>
                    </div>
                  )}

                  {/* Multi-Photo Count Badge */}
                  {hasImages && item.images.length > 1 && (
                    <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-ink/75 px-2 py-0.5 text-[10px] font-medium text-surface backdrop-blur-xs shadow-xs">
                      <Images size={11} />
                      <span>{item.images.length}</span>
                    </div>
                  )}
                </div>

                {/* Card Name */}
                <div className="flex min-h-[46px] items-center px-3.5 py-2.5">
                  <h3 className="font-serif text-sm font-semibold leading-snug tracking-tight text-ink group-hover:text-pine-deep line-clamp-2">
                    {item.name}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal Component */}
      <StockItemDetailModal
        item={selectedItem}
        onClose={closeDetailModal}
        onItemUpdated={handleItemUpdated}
        onImageDeleted={handleImageDeleted}
        onOpenUpload={(id) => openUploadModal(id)}
        showViewInStock={true}
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
