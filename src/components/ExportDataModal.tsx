// src/components/ExportDataModal.tsx

"use client";

import { useState, useEffect } from "react";
import {
  X,
  FolderArchive,
  Download,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  HardDrive,
  Sparkles,
} from "lucide-react";
import JSZip from "jszip";

interface ExportDataModalProps {
  open: boolean;
  onClose: () => void;
}

type ExportDataPayload = {
  websiteName: string;
  websiteFolderName: string;
  manifest: {
    websiteName: string;
    websiteFolderName: string;
    exportedAt: string;
    activeVersion: number;
    stats: {
      totalInvoices: number;
      totalStockItems: number;
      totalStaff: number;
      totalImages: number;
    };
  };
  readmeText: string;
  businessDetails: {
    current: unknown;
    versions: unknown[];
  };
  invoices: {
    all: unknown[];
    csv: string;
    lineItemsCsv: string;
    individual: Array<{ fileName: string; content: unknown }>;
  };
  inventory: {
    stockItems: unknown[];
    csv: string;
    categories: unknown[];
  };
  staff: unknown[];
  imageFiles: Array<{
    id: string;
    category: "stock" | "signature" | "qr";
    targetRelativePath: string;
    downloadUrl: string;
    storagePath?: string;
    dataUri?: string;
  }>;
};

// Helper: Ensure subdirectories exist in FileSystemDirectoryHandle
async function getOrCreateDir(
  rootHandle: FileSystemDirectoryHandle,
  pathParts: string[]
): Promise<FileSystemDirectoryHandle> {
  let current = rootHandle;
  for (const part of pathParts) {
    if (!part) continue;
    current = await current.getDirectoryHandle(part, { create: true });
  }
  return current;
}

// Helper: Write file into FileSystemDirectoryHandle
async function writeToDir(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  content: string | Blob | ArrayBuffer
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await (fileHandle as any).createWritable();
  await writable.write(content);
  await writable.close();
}

export function ExportDataModal({ open, onClose }: ExportDataModalProps) {
  const [data, setData] = useState<ExportDataPayload | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string>("");

  const [isExporting, setIsExporting] = useState(false);
  const [exportMethod, setExportMethod] = useState<"folder" | "zip" | null>(null);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [completedInfo, setCompletedInfo] = useState<{
    fileCount: number;
    imageCount: number;
    method: "folder" | "zip";
    folderName: string;
  } | null>(null);

  // Check if File System Access API is supported
  const hasDirectoryPicker = typeof window !== "undefined" && "showDirectoryPicker" in window;

  useEffect(() => {
    if (open) {
      setError("");
      setCompletedInfo(null);
      setIsExporting(false);
      setExportProgress(0);
      setCurrentStep("");
      setLoadingData(true);

      fetch("/api/export/data")
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Failed to prepare export data");
          setData(json);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Error loading data"))
        .finally(() => setLoadingData(false));
    }
  }, [open]);

  if (!open) return null;

  async function fetchImageBuffer(item: ExportDataPayload["imageFiles"][0]): Promise<ArrayBuffer | null> {
    try {
      if (item.dataUri && item.dataUri.startsWith("data:image")) {
        const base64Data = item.dataUri.split(",")[1];
        if (!base64Data) return null;
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return bytes.buffer;
      }

      // Fetch via export image proxy to prevent CORS issues
      const proxyUrl = `/api/export/image?url=${encodeURIComponent(item.downloadUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  }

  // METHOD 1: Direct Folder Export via File System Access API
  async function handleExportToFolder() {
    if (!data) return;
    setError("");
    setIsExporting(true);
    setExportMethod("folder");
    setExportProgress(5);
    setCurrentStep("Please select a destination folder in the prompt...");

    try {
      // 1. Prompt user for parent destination folder
      const parentDirHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
      });

      setCurrentStep(`Creating "${data.websiteFolderName}" folder...`);
      setExportProgress(10);

      // 2. Create the website-named directory
      const siteDirHandle = await parentDirHandle.getDirectoryHandle(data.websiteFolderName, {
        create: true,
      });

      let filesWritten = 0;

      // 3. Write README & Manifest
      setCurrentStep("Writing README and Manifest...");
      await writeToDir(siteDirHandle, "README.txt", data.readmeText);
      await writeToDir(siteDirHandle, "manifest.json", JSON.stringify(data.manifest, null, 2));
      filesWritten += 2;
      setExportProgress(15);

      // 4. Write Business Details
      setCurrentStep("Writing business settings & versions...");
      const bizDir = await getOrCreateDir(siteDirHandle, ["business-details"]);
      await writeToDir(bizDir, "current-settings.json", JSON.stringify(data.businessDetails.current, null, 2));
      await writeToDir(bizDir, "versions-history.json", JSON.stringify(data.businessDetails.versions, null, 2));
      filesWritten += 2;
      setExportProgress(25);

      // 5. Write Invoices
      setCurrentStep("Writing invoices database & CSV spreadsheets...");
      const invDir = await getOrCreateDir(siteDirHandle, ["invoices"]);
      await writeToDir(invDir, "invoices.json", JSON.stringify(data.invoices.all, null, 2));
      await writeToDir(invDir, "invoices.csv", data.invoices.csv);
      await writeToDir(invDir, "line-items.csv", data.invoices.lineItemsCsv);
      filesWritten += 3;

      const invIndivDir = await getOrCreateDir(invDir, ["individual"]);
      for (const single of data.invoices.individual) {
        await writeToDir(invIndivDir, single.fileName, JSON.stringify(single.content, null, 2));
        filesWritten += 1;
      }
      setExportProgress(45);

      // 6. Write Inventory
      setCurrentStep("Writing stock inventory & categories...");
      const stockDir = await getOrCreateDir(siteDirHandle, ["inventory"]);
      await writeToDir(stockDir, "stock-items.json", JSON.stringify(data.inventory.stockItems, null, 2));
      await writeToDir(stockDir, "stock-items.csv", data.inventory.csv);
      await writeToDir(stockDir, "categories-summary.json", JSON.stringify(data.inventory.categories, null, 2));
      filesWritten += 3;
      setExportProgress(60);

      // 7. Write Staff
      setCurrentStep("Writing staff records...");
      const staffDir = await getOrCreateDir(siteDirHandle, ["staff"]);
      await writeToDir(staffDir, "users.json", JSON.stringify(data.staff, null, 2));
      filesWritten += 1;
      setExportProgress(65);

      // 8. Download & Write Images
      let imagesSaved = 0;
      const totalImages = data.imageFiles.length;
      if (totalImages > 0) {
        for (let i = 0; i < totalImages; i++) {
          const item = data.imageFiles[i];
          const progressPercent = 65 + Math.round(((i + 1) / totalImages) * 30);
          setExportProgress(progressPercent);
          setCurrentStep(`Downloading image ${i + 1} of ${totalImages}: ${item.targetRelativePath}...`);

          const buffer = await fetchImageBuffer(item);
          if (buffer) {
            const parts = item.targetRelativePath.split("/");
            const fileName = parts.pop()!;
            const targetSubDir = await getOrCreateDir(siteDirHandle, parts);
            await writeToDir(targetSubDir, fileName, buffer);
            imagesSaved += 1;
            filesWritten += 1;
          }
        }
      }

      setExportProgress(100);
      setCurrentStep("Export completed successfully!");
      setCompletedInfo({
        fileCount: filesWritten,
        imageCount: imagesSaved,
        method: "folder",
        folderName: data.websiteFolderName,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setCurrentStep("");
      } else {
        setError(err instanceof Error ? err.message : "Failed to export data to folder");
      }
    } finally {
      setIsExporting(false);
    }
  }

  // METHOD 2: Universal ZIP Archive Download
  async function handleExportToZip() {
    if (!data) return;
    setError("");
    setIsExporting(true);
    setExportMethod("zip");
    setExportProgress(10);
    setCurrentStep("Packaging nursery data into archive...");

    try {
      const zip = new JSZip();
      const siteFolder = zip.folder(data.websiteFolderName)!;
      let filesPackaged = 0;

      // 1. README & Manifest
      siteFolder.file("README.txt", data.readmeText);
      siteFolder.file("manifest.json", JSON.stringify(data.manifest, null, 2));
      filesPackaged += 2;
      setExportProgress(20);

      // 2. Business Details
      const bizFolder = siteFolder.folder("business-details")!;
      bizFolder.file("current-settings.json", JSON.stringify(data.businessDetails.current, null, 2));
      bizFolder.file("versions-history.json", JSON.stringify(data.businessDetails.versions, null, 2));
      filesPackaged += 2;
      setExportProgress(30);

      // 3. Invoices
      const invFolder = siteFolder.folder("invoices")!;
      invFolder.file("invoices.json", JSON.stringify(data.invoices.all, null, 2));
      invFolder.file("invoices.csv", data.invoices.csv);
      invFolder.file("line-items.csv", data.invoices.lineItemsCsv);
      filesPackaged += 3;

      const indFolder = invFolder.folder("individual")!;
      for (const single of data.invoices.individual) {
        indFolder.file(single.fileName, JSON.stringify(single.content, null, 2));
        filesPackaged += 1;
      }
      setExportProgress(50);

      // 4. Inventory
      const stockFolder = siteFolder.folder("inventory")!;
      stockFolder.file("stock-items.json", JSON.stringify(data.inventory.stockItems, null, 2));
      stockFolder.file("stock-items.csv", data.inventory.csv);
      stockFolder.file("categories-summary.json", JSON.stringify(data.inventory.categories, null, 2));
      filesPackaged += 3;

      // 5. Staff
      const staffFolder = siteFolder.folder("staff")!;
      staffFolder.file("users.json", JSON.stringify(data.staff, null, 2));
      filesPackaged += 1;
      setExportProgress(60);

      // 6. Download Images into ZIP
      let imagesSaved = 0;
      const totalImages = data.imageFiles.length;
      if (totalImages > 0) {
        for (let i = 0; i < totalImages; i++) {
          const item = data.imageFiles[i];
          const progressPercent = 60 + Math.round(((i + 1) / totalImages) * 25);
          setExportProgress(progressPercent);
          setCurrentStep(`Downloading image ${i + 1} of ${totalImages}: ${item.targetRelativePath}...`);

          const buffer = await fetchImageBuffer(item);
          if (buffer) {
            siteFolder.file(item.targetRelativePath, buffer);
            imagesSaved += 1;
            filesPackaged += 1;
          }
        }
      }

      // 7. Compress & Trigger Download
      setCurrentStep("Compressing archive bundle...");
      setExportProgress(90);
      const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
        setExportProgress(90 + Math.round((metadata.percent / 100) * 8));
      });

      const blobUrl = URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = `${data.websiteFolderName}_backup.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);

      setExportProgress(100);
      setCurrentStep("ZIP download complete!");
      setCompletedInfo({
        fileCount: filesPackaged,
        imageCount: imagesSaved,
        method: "zip",
        folderName: data.websiteFolderName,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to package ZIP archive");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine-tint text-pine-deep">
              <FolderArchive size={20} />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-ink">
                Export All Nursery Data
              </h3>
              <p className="text-[11px] text-ink-soft">
                Full backup into a structured folder named after the website
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded p-1 text-ink-soft hover:bg-line/50 hover:text-ink disabled:opacity-40 cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {error && (
          <div className="mt-3.5 flex items-start gap-2 rounded-lg bg-rust-tint p-3 text-xs text-rust">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {loadingData ? (
          <div className="py-12 text-center text-xs text-ink-soft flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-pine" />
            <span>Connecting to database and compiling data manifest…</span>
          </div>
        ) : completedInfo ? (
          /* Success Screen */
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="font-serif text-base font-bold text-ink">
              Data Successfully Exported!
            </h4>
            <p className="mt-1 text-xs text-ink-soft">
              {completedInfo.method === "folder"
                ? `Created folder "${completedInfo.folderName}" in your chosen destination.`
                : `Archive "${completedInfo.folderName}_backup.zip" downloaded.`}
            </p>

            <div className="mt-4 inline-flex items-center gap-3 rounded-lg border border-line bg-paper-flat px-4 py-2.5 text-xs text-ink-soft">
              <div>
                <strong className="font-semibold text-ink">{completedInfo.fileCount}</strong> Total Files
              </div>
              <span>•</span>
              <div>
                <strong className="font-semibold text-ink">{completedInfo.imageCount}</strong> Photos &amp; Signatures
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-pine px-6 py-2 text-xs font-semibold text-surface shadow-xs hover:bg-pine-deep cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Main Export Content */
          <div className="mt-4 space-y-4">
            {/* Target Folder Banner */}
            <div className="rounded-lg border border-pine/30 bg-pine-tint/30 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-pine-deep">
                <FolderOpen size={15} />
                <span>Destination Folder Name</span>
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-ink">
                /{data?.websiteFolderName || "Sri_Vijaya_Lakshmi_Nursery"}/
              </div>
              <p className="mt-1 text-[11px] text-ink-soft leading-relaxed">
                All data, images, invoices, and spreadsheets will be accurately structured inside this root folder.
              </p>
            </div>

            {/* Folder Hierarchy Preview */}
            <div className="rounded-lg border border-line bg-paper-flat p-3 text-xs">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft flex items-center justify-between">
                <span>Included Nested Structure</span>
                <span className="font-mono text-[10px] bg-surface border border-line px-1.5 py-0.5 rounded">
                  {data?.manifest.stats.totalInvoices ?? 0} bills • {data?.manifest.stats.totalStockItems ?? 0} stock
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-ink">
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet size={13} className="text-emerald-600 shrink-0" />
                  <span>invoices.csv &amp; line-items.csv</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileCode size={13} className="text-blue-600 shrink-0" />
                  <span>individual/INV-*.json</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet size={13} className="text-emerald-600 shrink-0" />
                  <span>inventory/stock-items.csv</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-purple-600 shrink-0" />
                  <span>images/stock/* &amp; signatures/</span>
                </div>
              </div>
            </div>

            {/* Progress Bar while exporting */}
            {isExporting && (
              <div className="rounded-lg border border-pine/40 bg-pine-tint/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-pine-deep flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin" />
                    {exportMethod === "folder" ? "Saving to destination folder…" : "Packing ZIP archive…"}
                  </span>
                  <span className="font-mono font-bold text-pine-deep">{exportProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full bg-pine transition-all duration-200"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                {currentStep && (
                  <div className="truncate text-[11px] text-ink-soft font-mono">
                    {currentStep}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {!isExporting && (
              <div className="space-y-2.5 pt-1">
                {/* Method A: Choose Destination Folder */}
                {hasDirectoryPicker ? (
                  <button
                    type="button"
                    onClick={handleExportToFolder}
                    className="flex w-full items-center justify-between rounded-lg bg-pine px-4 py-3 text-xs font-semibold text-white shadow-xs hover:bg-pine-deep transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <HardDrive size={16} />
                      <div className="text-left">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>Select Destination Folder &amp; Save</span>
                          <span className="rounded bg-white/20 px-1 py-0.2 text-[10px] uppercase font-bold">
                            Direct
                          </span>
                        </div>
                        <div className="text-[11px] text-white/80 font-normal">
                          Picks a local folder &amp; creates &ldquo;{data?.websiteFolderName}&rdquo; inside it
                        </div>
                      </div>
                    </div>
                    <FolderOpen size={16} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : null}

                {/* Method B: Download as ZIP Archive */}
                <button
                  type="button"
                  onClick={handleExportToZip}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    !hasDirectoryPicker
                      ? "bg-pine text-white hover:bg-pine-deep shadow-xs"
                      : "border-line-strong bg-paper hover:bg-line/40 text-ink"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Download size={15} />
                    <div className="text-left">
                      <div className="font-semibold">Download as ZIP Archive (.zip)</div>
                      <div className="text-[11px] text-ink-soft font-normal">
                        Contains &ldquo;{data?.websiteFolderName}/&rdquo; with all nested folders
                      </div>
                    </div>
                  </div>
                  <Sparkles size={14} className="opacity-60" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
