// src/app/gallery/page.tsx

"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Upload,
  Camera,
  X,
  Check,
  Image as ImageIcon,
  Images,
  Edit2,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Loader2,
  Sparkles,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { GalleryStockItem, StockItemImage } from "@/lib/types";

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "plants" | "non-plants">("all");
  const [photoFilter, setPhotoFilter] = useState<"all" | "with-photos" | "needs-photos">("all");

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<GalleryStockItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editedDescText, setEditedDescText] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetItemId, setUploadTargetItemId] = useState<string>("");
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadIsPrimary, setUploadIsPrimary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Live Camera Viewfinder State (for desktop/laptop webcams)
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");

  // Hidden native file input refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

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
  const totalPhotosCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.images?.length || 0), 0),
    [items]
  );

  // Handle opening Detail Modal
  const openDetailModal = (item: GalleryStockItem) => {
    setSelectedItem(item);
    setSelectedImageIndex(0);
    setEditingDesc(false);
    setEditedDescText(item.images?.[0]?.description || "");
  };

  const closeDetailModal = () => {
    setSelectedItem(null);
    setEditingDesc(false);
  };

  const currentImage: StockItemImage | undefined =
    selectedItem?.images?.[selectedImageIndex];

  // Switch image in detail modal
  const handleSelectImageIndex = (index: number) => {
    setSelectedImageIndex(index);
    setEditingDesc(false);
    if (selectedItem?.images?.[index]) {
      setEditedDescText(selectedItem.images[index].description || "");
    }
  };

  // Save updated description
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

      // Update local state
      const updatedDesc = editedDescText.trim();
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== selectedItem?.id) return it;
          return {
            ...it,
            images: it.images.map((img) =>
              img.id === currentImage.id ? { ...img, description: updatedDesc } : img
            ),
          };
        })
      );
      if (selectedItem) {
        setSelectedItem({
          ...selectedItem,
          images: selectedItem.images.map((img) =>
            img.id === currentImage.id ? { ...img, description: updatedDesc } : img
          ),
        });
      }
      setEditingDesc(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving description");
    } finally {
      setSavingDesc(false);
    }
  };

  // Delete current image
  const handleDeleteImage = async () => {
    if (!currentImage) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this photo from the nursery storage?"
    );
    if (!confirmDelete) return;

    try {
      setDeletingImage(true);
      const res = await fetch(`/api/gallery/images/${currentImage.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete image");

      // Update local state
      const deletedId = currentImage.id;
      const nextImages = selectedItem?.images.filter((img) => img.id !== deletedId) || [];

      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== selectedItem?.id) return it;
          return { ...it, images: nextImages };
        })
      );

      if (selectedItem) {
        if (nextImages.length === 0) {
          closeDetailModal();
        } else {
          setSelectedItem({ ...selectedItem, images: nextImages });
          setSelectedImageIndex(0);
          setEditedDescText(nextImages[0]?.description || "");
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting image");
    } finally {
      setDeletingImage(false);
    }
  };

  // Open Upload Modal
  const openUploadModal = (targetStockItemId?: string) => {
    setUploadModalOpen(true);
    setUploadTargetItemId(targetStockItemId || (items[0]?.id ?? ""));
    setItemSearchQuery("");
    setUploadFile(null);
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    setUploadPreviewUrl(null);
    setUploadDescription("");
    setUploadIsPrimary(false);
    setUploadError("");
    stopCameraStream();
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    stopCameraStream();
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    setUploadPreviewUrl(null);
    setUploadFile(null);
  };

  // Handle selected file
  const handleFileChosen = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (JPG, PNG, WebP, etc.)");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Image size must be under 15MB");
      return;
    }

    setUploadError("");
    setUploadFile(file);
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    const objectUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(objectUrl);
    stopCameraStream();
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChosen(e.dataTransfer.files[0]);
    }
  };

  // Live Camera Stream Handlers
  const startCameraStream = async () => {
    try {
      setCameraError("");
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // rear camera on phones, standard webcam on laptops
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraActive(false);
      setCameraError(
        "Camera access was denied or not supported. You can still use 'Upload File' or the native camera button."
      );
    }
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture photo from live video stream
  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        handleFileChosen(capturedFile);
      },
      "image/jpeg",
      0.92
    );
  };

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please choose, drop, or capture a photo first.");
      return;
    }
    if (!uploadTargetItemId) {
      setUploadError("Please select a stock item for this image.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("stockItemId", uploadTargetItemId);
      formData.append("description", uploadDescription);
      formData.append("isPrimary", uploadIsPrimary ? "true" : "false");

      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Reload gallery to get fresh state with relations
      await loadGallery();

      // If the detail modal was opened for this item, update it
      if (selectedItem && selectedItem.id === uploadTargetItemId) {
        const freshItem = items.find((i) => i.id === uploadTargetItemId);
        if (freshItem) {
          setSelectedItem(freshItem);
        }
      }

      closeUploadModal();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  // Stock Items matching item search in upload modal
  const searchableStockItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return items;
    const q = itemSearchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.subcategory?.toLowerCase().includes(q)
    );
  }, [items, itemSearchQuery]);

  const selectedStockItemObj = items.find((i) => i.id === uploadTargetItemId);

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

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile Camera Quick-Access Button */}
          <label
            htmlFor="mobile-quick-camera"
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-paper px-3.5 text-xs font-semibold text-ink transition-colors hover:bg-line/50 cursor-pointer md:hidden active:scale-95"
            title="Snap Photo with Camera"
          >
            <Camera size={16} className="text-pine" />
            <span>Camera</span>
          </label>
          <input
            id="mobile-quick-camera"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const f = e.target.files[0];
                openUploadModal();
                handleFileChosen(f);
                e.target.value = "";
              }
            }}
          />

          {/* Primary Upload Button */}
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
              className="h-10 w-full rounded-lg border border-line bg-paper pl-10 pr-10 text-xs sm:text-sm text-ink placeholder-ink-soft/60 transition-colors focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-soft hover:text-ink cursor-pointer"
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category & Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {/* Category tabs */}
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

                {/* Card Name Only (as requested: "the cards onlt contain name image") */}
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

      {/* ========================================================================= */}
      {/* 1. DETAIL POPUP MODAL (Shows image, description, and item details) */}
      {/* ========================================================================= */}
      {selectedItem && currentImage && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={closeDetailModal}
            aria-hidden="true"
          />

          <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-line bg-paper-flat shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
              <div className="min-w-0 pr-3">
                <h2 className="font-serif text-lg font-bold text-pine-deep truncate sm:text-xl">
                  {selectedItem.name}
                </h2>
                <span className="text-xs capitalize text-ink-soft">
                  {selectedItem.category} • {selectedItem.subcategory || "General"}
                </span>
              </div>
              <button
                onClick={closeDetailModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-line/60 hover:text-ink cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Full Image Display */}
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-line bg-black/5 flex items-center justify-center">
                <img
                  src={currentImage.imageUrl}
                  alt={selectedItem.name}
                  className="h-full w-full object-contain"
                />

                {/* Left/Right carousel navigation if multiple images */}
                {selectedItem.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextIdx =
                          (selectedImageIndex - 1 + selectedItem.images.length) %
                          selectedItem.images.length;
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
                          (selectedImageIndex + 1) % selectedItem.images.length;
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

              {/* Thumbnails if multiple images exist */}
              {selectedItem.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {selectedItem.images.map((img, idx) => (
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

              {/* Description Section (as requested: "a popup should come contaiinig the despription of the image") */}
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
                    {currentImage.description || (
                      <span className="italic text-ink-soft">
                        No description provided for this photo yet. Click &quot;Add Description&quot; to describe this variety.
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Stock Details Quick Glance */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-paper p-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="block text-[11px] text-ink-soft">Price</span>
                  <span className="font-semibold text-ink">₹{selectedItem.price}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-ink-soft">Stock In Hand</span>
                  <span className="font-semibold text-ink">
                    {selectedItem.quantity} {selectedItem.unit || "pcs"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-ink-soft">Category</span>
                  <span className="font-medium capitalize text-ink">
                    {selectedItem.category}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-ink-soft">Subcategory</span>
                  <span className="font-medium capitalize text-ink">
                    {selectedItem.subcategory || "Other"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-4 py-3 sm:px-6">
              <button
                onClick={handleDeleteImage}
                disabled={deletingImage}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-rust transition-colors hover:bg-rust-tint/40 cursor-pointer"
              >
                {deletingImage ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>Delete Photo</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={`/stock`}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-line/40"
                >
                  <Boxes size={14} />
                  <span>View in Stock</span>
                </Link>

                <button
                  onClick={() => {
                    openUploadModal(selectedItem.id);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-pine px-3.5 py-1.5 text-xs font-semibold text-surface transition-colors hover:bg-pine-deep cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Another Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. UPLOAD MODAL (Drag-and-Drop, Native Camera, & Live Camera Viewfinder) */}
      {/* ========================================================================= */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={closeUploadModal}
            aria-hidden="true"
          />

          <div className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-line bg-paper-flat shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-tint text-pine">
                  <Upload size={16} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-pine-deep">
                    Upload Plant Photo
                  </h2>
                  <p className="text-[11px] text-ink-soft">
                    Add photo via file drop, file browser, or camera capture.
                  </p>
                </div>
              </div>
              <button
                onClick={closeUploadModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-line/60 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleUploadSubmit}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
            >
              {uploadError && (
                <div className="rounded-lg border border-rust/40 bg-rust-tint/40 p-3 text-xs text-rust">
                  {uploadError}
                </div>
              )}

              {/* 1. Target Stock Item Selector */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink">
                  Select Stock Item *
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Search plant item..."
                    className="h-8 w-full rounded-lg border border-line bg-paper px-3 text-xs text-ink placeholder-ink-soft/60 focus:border-pine focus:outline-none"
                  />
                  <select
                    value={uploadTargetItemId}
                    onChange={(e) => setUploadTargetItemId(e.target.value)}
                    required
                    className="h-9 w-full rounded-lg border border-line bg-paper px-3 text-xs text-ink focus:border-pine focus:outline-none"
                  >
                    {searchableStockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.category}) — ₹{item.price}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedStockItemObj && (
                  <span className="mt-1 block text-[11px] text-ink-soft">
                    Selected: <strong>{selectedStockItemObj.name}</strong> (
                    {selectedStockItemObj.images?.length || 0} existing photos)
                  </span>
                )}
              </div>

              {/* 2. File Upload / Camera Zone */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink">
                  Image File or Camera Capture *
                </label>

                {/* If live camera stream is active */}
                {cameraActive ? (
                  <div className="relative overflow-hidden rounded-xl border border-pine bg-black">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="aspect-4/3 w-full object-cover"
                    />
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 px-4">
                      <button
                        type="button"
                        onClick={captureLivePhoto}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-pine-deep shadow-lg ring-4 ring-pine/40 transition-transform active:scale-90 cursor-pointer"
                        title="Snap Photo"
                      >
                        <Camera size={22} />
                      </button>
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-surface backdrop-blur-xs hover:bg-black cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : uploadPreviewUrl ? (
                  /* Image Preview Container */
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-line bg-paper shadow-inner">
                    <img
                      src={uploadPreviewUrl}
                      alt="Upload preview"
                      className="h-full w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        URL.revokeObjectURL(uploadPreviewUrl);
                        setUploadPreviewUrl(null);
                      }}
                      className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-ink/75 px-2.5 py-1 text-xs font-medium text-surface backdrop-blur-xs hover:bg-ink cursor-pointer"
                    >
                      <X size={13} />
                      <span>Change Photo</span>
                    </button>
                  </div>
                ) : (
                  /* Dropzone & Camera Buttons */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                      isDragOver
                        ? "border-pine bg-pine-tint/40"
                        : "border-line bg-paper hover:border-line-strong"
                    }`}
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pine-tint text-pine">
                      <ImageIcon size={24} />
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-ink">
                      Drag and drop image here
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-soft">
                      Supports JPG, PNG, WebP up to 15MB
                    </p>

                    {/* Camera & File Buttons */}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {/* 1. File Picker */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 text-xs font-medium text-ink shadow-xs hover:bg-line/40 cursor-pointer"
                      >
                        <FolderOpen size={14} />
                        <span>Choose File</span>
                      </button>

                      {/* 2. Mobile/Tablet Native Camera Button */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 text-xs font-medium text-ink shadow-xs hover:bg-line/40 cursor-pointer"
                      >
                        <Camera size={14} className="text-pine" />
                        <span>Device Camera</span>
                      </button>

                      {/* 3. Live Webcam Viewfinder Button (for desktop/web) */}
                      <button
                        type="button"
                        onClick={startCameraStream}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 text-xs font-medium text-ink shadow-xs hover:bg-line/40 cursor-pointer"
                      >
                        <Sparkles size={14} className="text-pine" />
                        <span>Webcam Viewfinder</span>
                      </button>
                    </div>

                    {/* Hidden inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChosen(e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                    />

                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChosen(e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                    />
                  </div>
                )}
                {cameraError && (
                  <p className="mt-1.5 text-xs text-rust">{cameraError}</p>
                )}
              </div>

              {/* 3. Photo Description Input (as requested) */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink">
                  Image Description (Optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g., Blooming red hibiscus, 2 years old, potted in 12-inch ceramic planter..."
                  className="w-full rounded-lg border border-line bg-paper p-2.5 text-xs sm:text-sm text-ink placeholder-ink-soft/60 focus:border-pine focus:outline-none"
                />
              </div>

              {/* 4. Set as Primary Checkbox */}
              <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadIsPrimary}
                  onChange={(e) => setUploadIsPrimary(e.target.checked)}
                  className="rounded border-line text-pine focus:ring-pine cursor-pointer"
                />
                <span>Set as primary photo for this stock item</span>
              </label>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  disabled={isUploading}
                  className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink hover:bg-line/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile || !uploadTargetItemId}
                  className="flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2 text-xs font-semibold text-surface shadow-xs hover:bg-pine-deep disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Uploading to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Save & Upload</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
