// src/components/StockPhotoUploadModal.tsx

"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  Upload,
  X,
  Camera,
  FolderOpen,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { StockItem, GalleryStockItem } from "@/lib/types";

interface StockPhotoUploadModalProps {
  open: boolean;
  onClose: () => void;
  targetItemId?: string;
  stockItems: (StockItem | GalleryStockItem)[];
  onUploadSuccess: (updatedItemId: string) => void;
}

export function StockPhotoUploadModal({
  open,
  onClose,
  targetItemId,
  stockItems,
  onUploadSuccess,
}: StockPhotoUploadModalProps) {
  const [uploadTargetItemId, setUploadTargetItemId] = useState<string>("");
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadIsPrimary, setUploadIsPrimary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Live Camera Viewfinder State
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setUploadError("");
      setCameraError("");
      if (targetItemId) {
        setUploadTargetItemId(targetItemId);
      } else if (stockItems.length > 0 && !uploadTargetItemId) {
        setUploadTargetItemId(stockItems[0].id);
      }
    } else {
      stopCameraStream();
      setUploadFile(null);
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl);
        setUploadPreviewUrl(null);
      }
      setUploadDescription("");
      setUploadIsPrimary(false);
    }
  }, [open, targetItemId, stockItems]);

  const searchableStockItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return stockItems;
    const q = itemSearchQuery.toLowerCase().trim();
    return stockItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.subcategory?.toLowerCase().includes(q)
    );
  }, [stockItems, itemSearchQuery]);

  const selectedStockItemObj = stockItems.find((i) => i.id === uploadTargetItemId);

  const startCameraStream = async () => {
    try {
      setCameraError("");
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 960 },
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
        "Camera access was denied or not supported. You can still use 'Upload File' or the device camera button below."
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

  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
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
        stopCameraStream();
      },
      "image/jpeg",
      0.92
    );
  };

  const handleFileChosen = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a valid image file (JPG, PNG, WebP, etc.).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Image is too large. Maximum allowed size is 15MB.");
      return;
    }

    setUploadError("");
    setUploadFile(file);
    if (uploadPreviewUrl) {
      URL.revokeObjectURL(uploadPreviewUrl);
    }
    setUploadPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select or capture a photo first.");
      return;
    }
    if (!uploadTargetItemId) {
      setUploadError("Please select which stock item this photo belongs to.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("stockItemId", uploadTargetItemId);
      if (uploadDescription.trim()) {
        formData.append("description", uploadDescription.trim());
      }
      if (uploadIsPrimary) {
        formData.append("isPrimary", "true");
      }

      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload photo.");
      }

      onUploadSuccess(uploadTargetItemId);
      onClose();
    } catch (err) {
      console.error("Photo upload error:", err);
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

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
            onClick={onClose}
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
                Selected: <strong>{selectedStockItemObj.name}</strong>
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
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-ink/80 px-2.5 py-1 text-xs font-medium text-surface backdrop-blur-xs hover:bg-ink cursor-pointer"
                  >
                    Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadFile(null);
                      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
                      setUploadPreviewUrl(null);
                    }}
                    className="rounded-lg bg-rust px-2.5 py-1 text-xs font-medium text-surface hover:bg-rust/90 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone & Camera Buttons */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChosen(e.dataTransfer.files[0]);
                  }
                }}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                  isDragOver
                    ? "border-pine bg-pine-tint/40 scale-[1.01]"
                    : "border-line bg-paper/60 hover:bg-paper"
                }`}
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-pine-tint text-pine">
                  <Upload size={20} />
                </div>
                <p className="text-xs font-medium text-ink">
                  Drag and drop your photo here, or browse files
                </p>
                <p className="mt-0.5 text-[11px] text-ink-soft">
                  Supports JPG, PNG, WEBP up to 15MB
                </p>

                {/* Camera & File Buttons */}
                <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                  {/* 1. File Browser */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-line/40 transition-colors cursor-pointer"
                  >
                    <FolderOpen size={14} />
                    <span>Browse Files</span>
                  </button>

                  {/* 2. Device Camera Button */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-line/40 transition-colors cursor-pointer"
                  >
                    <Camera size={14} className="text-pine" />
                    <span>Device Camera</span>
                  </button>

                  {/* 3. Live Webcam Stream */}
                  {typeof navigator !== "undefined" && navigator.mediaDevices && (
                    <button
                      type="button"
                      onClick={startCameraStream}
                      className="flex items-center gap-1.5 rounded-lg border border-pine/30 bg-pine-tint/50 px-3 py-1.5 text-xs font-semibold text-pine-deep hover:bg-pine-tint transition-colors cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>Webcam Viewfinder</span>
                    </button>
                  )}
                </div>

                {/* Hidden Native File Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChosen(e.target.files[0]);
                    }
                  }}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChosen(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}

            {cameraError && (
              <p className="mt-1.5 text-xs text-rust">{cameraError}</p>
            )}
          </div>

          {/* 3. Optional Photo Description */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink">
              Photo Description (Optional)
            </label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Grafted variety in 8-inch nursery bag, blossom state, healthy leaf growth..."
              className="w-full rounded-lg border border-line bg-paper p-2.5 text-xs text-ink placeholder-ink-soft/60 focus:border-pine focus:outline-none"
            />
          </div>

          {/* 4. Primary Cover Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={uploadIsPrimary}
              onChange={(e) => setUploadIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
            />
            <span className="text-xs font-medium text-ink">
              Set as primary photo for this plant in gallery
            </span>
          </label>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-line/40 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !uploadFile || !uploadTargetItemId}
              className="flex items-center gap-1.5 rounded-lg bg-pine px-4 py-1.5 text-xs font-semibold text-surface hover:bg-pine-deep disabled:opacity-50 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Uploading to Cloud...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Upload Photo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
