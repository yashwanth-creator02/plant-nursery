// src/components/ProfilePanel.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  LogOut,
  UserPlus,
  Trash2,
  Sun,
  Moon,
  PenTool,
  Building2,
  Hash,
  User,
  ShieldCheck,
  QrCode,
  Upload,
  Loader2,
  Check,
  RefreshCw,
  TrendingUp,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SignatureModal } from "./SignatureModal";
import { AdminInvoiceSettingsModal } from "./AdminInvoiceSettingsModal";
import { CustomInvoiceNumberModal } from "./CustomInvoiceNumberModal";
import { SalesAnalyticsModal } from "./SalesAnalyticsModal";

type ManagedUser = {
  id: string;
  username: string;
  role: "admin" | "staff";
  createdAt: string;
};

export function ProfilePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "admin">("profile");

  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // QR Code Settings State
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrSuccess, setQrSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [adminSettingsModalOpen, setAdminSettingsModalOpen] = useState(false);
  const [customNumberModalOpen, setCustomNumberModalOpen] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>("");
  const [, setSavingSignature] = useState(false);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [todaySalesSummary, setTodaySalesSummary] = useState<{
    total: number;
    online: number;
    cash: number;
    count: number;
  } | null>(null);

  function loadTodaySales() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    fetch(
      `/api/sales/analytics?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.summary) {
          setTodaySalesSummary({
            total: d.summary.totalRevenue || 0,
            online: d.summary.onlineRevenue || 0,
            cash: d.summary.cashRevenue || 0,
            count: d.summary.totalInvoices || 0,
          });
        }
      })
      .catch(() => {});
  }

  const isAdmin = user?.role === "admin";

  async function handleSaveSignature(sig: string) {
    try {
      setSavingSignature(true);
      const res = await fetch("/api/users/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: sig }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save signature");

      const savedSig = data.signature;
      if (savedSig) {
        localStorage.setItem("svl_digital_signature", savedSig);
      } else {
        localStorage.removeItem("svl_digital_signature");
      }
      setSignaturePreview(savedSig);
      await refresh();
      window.dispatchEvent(new Event("signatureUpdated"));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save signature to cloud.");
    } finally {
      setSavingSignature(false);
    }
  }

  async function handleResetSignature() {
    try {
      await fetch("/api/users/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: null }),
      });
      localStorage.removeItem("svl_digital_signature");
      setSignaturePreview(null);
      await refresh();
      window.dispatchEvent(new Event("signatureUpdated"));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset signature.");
    }
  }

  function loadInvoiceSequence() {
    fetch("/api/settings/invoice-sequence")
      .then((r) => r.json())
      .then((d) => {
        if (d.nextInvoiceNumber) setNextInvoiceNumber(d.nextInvoiceNumber);
      })
      .catch(() => {});
  }

  async function loadQrCode() {
    setLoadingQr(true);
    try {
      const res = await fetch("/api/settings/qr-code", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.qrCodeData) {
        setQrCodeData(data.qrCodeData);
      } else {
        setQrCodeData(null);
      }
    } catch {
      // ignore
    } finally {
      setLoadingQr(false);
    }
  }

  useEffect(() => {
    if (open) {
      setIsDark(document.documentElement.classList.contains("dark"));
      const initialSig = user?.signature || localStorage.getItem("svl_digital_signature");
      setSignaturePreview(initialSig);
      fetch("/api/users/signature")
        .then(async (r) => {
          if (!r.ok) return;
          const d = await r.json();
          if (d.signature !== undefined) {
            setSignaturePreview(d.signature);
            if (d.signature) {
              localStorage.setItem("svl_digital_signature", d.signature);
            } else {
              localStorage.removeItem("svl_digital_signature");
            }
          }
        })
        .catch(() => {});
      loadInvoiceSequence();
      loadQrCode();
      loadTodaySales();
      if (isAdmin) {
        loadUsers();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAdmin]);

  function setThemeMode(dark: boolean) {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }

  async function handleQrFileUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setQrError("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setQrError("Image is too large. Please select an image under 5MB.");
      return;
    }

    setUploadingQr(true);
    setQrError("");
    setQrSuccess("");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUri = reader.result as string;
        const res = await fetch("/api/settings/qr-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrCodeData: dataUri }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to upload QR code");
        setQrCodeData(dataUri);
        setQrSuccess("Payment QR code saved successfully!");
        setTimeout(() => setQrSuccess(""), 4000);
        window.dispatchEvent(new Event("qrCodeUpdated"));
      } catch (e) {
        setQrError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploadingQr(false);
      }
    };
    reader.onerror = () => {
      setQrError("Could not read image file");
      setUploadingQr(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleRemoveQr() {
    if (!confirm("Remove the payment QR code? Staff and customers will no longer see a QR code.")) {
      return;
    }
    setUploadingQr(true);
    setQrError("");
    setQrSuccess("");
    try {
      const res = await fetch("/api/settings/qr-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeData: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove QR code");
      setQrCodeData(null);
      setQrSuccess("Payment QR code removed.");
      setTimeout(() => setQrSuccess(""), 3500);
      window.dispatchEvent(new Event("qrCodeUpdated"));
    } catch (e) {
      setQrError(e instanceof Error ? e.message : "Failed to remove QR code");
    } finally {
      setUploadingQr(false);
    }
  }

  async function loadUsers() {
    setLoadingUsers(true);
    setError("");
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load users");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewUsername("");
      setNewPassword("");
      setNewRole("staff");
      loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add user");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRole(id: string, role: "admin" | "staff") {
    setError("");
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't update role");
      loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update role");
    }
  }

  async function removeUser(targetUser: ManagedUser) {
    const isAdminTarget = targetUser.role === "admin";
    const msg = isAdminTarget
      ? `Remove admin "${targetUser.username}"? They will lose all admin and account access.`
      : `Remove user "${targetUser.username}"? They won't be able to log in anymore.`;

    if (!confirm(msg)) {
      return;
    }
    setError("");
    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't remove user");
      loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove user");
    }
  }

  async function handleClearAllData() {
    const confirmed = window.confirm(
      "WARNING: This will permanently delete all invoices, line items, stock items, and other user accounts from the database.\n\nThis action CANNOT be undone.\n\nAre you sure you want to proceed?",
    );
    if (!confirmed) return;

    setClearing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/clear-data", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear database");
      alert("Database has been completely cleared.");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't clear database");
      setClearing(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-ink/20 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex h-full w-full max-w-[85vw] sm:max-w-md flex-col overflow-y-auto border-l border-line bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-serif text-base font-semibold text-ink">
            {isAdmin ? "Account & Settings" : "Account Profile"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-soft hover:bg-line/60 hover:text-ink cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher (Above theme icons & content, visible to admin) */}
        {isAdmin && (
          <div className="flex border-b border-line bg-paper-flat px-4 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "border-pine text-pine-deep bg-surface rounded-t-md font-bold shadow-xs"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              <User size={14} /> Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "border-pine text-pine-deep bg-surface rounded-t-md font-bold shadow-xs"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              <ShieldCheck size={14} /> Admin Panel
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* PROFILE TAB CONTENT                                       */}
        {/* ========================================================= */}
        {(!isAdmin || activeTab === "profile") && (
          <div className="flex flex-col">
            {/* User Identity Info */}
            <div className="flex items-center gap-3 border-b border-line px-5 py-4 bg-paper-flat/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine text-base font-semibold text-surface shadow-xs">
                {user?.username?.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">
                  {user?.username}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs capitalize font-medium text-ink-soft">{user?.role}</span>
                  {isAdmin && (
                    <span className="rounded bg-pine-tint px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider text-pine-deep">
                      Admin Access
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Theme Toggle Section */}
            <div className="border-b border-line px-5 py-3.5">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Appearance &amp; Theme
              </div>
              <div className="flex items-center rounded-md border border-line bg-paper p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setThemeMode(false)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 font-medium transition-all cursor-pointer ${
                    !isDark
                      ? "bg-surface text-pine-deep shadow-sm font-semibold"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Sun size={13} />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode(true)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 font-medium transition-all cursor-pointer ${
                    isDark
                      ? "bg-surface text-pine-deep shadow-sm font-semibold"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Moon size={13} />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Digital Signature Section */}
            <div className="border-b border-line px-5 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Digital Signature
                </span>
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-pine-deep hover:underline cursor-pointer"
                >
                  <PenTool size={12} />
                  <span>{signaturePreview ? "Edit Signature" : "Create Signature"}</span>
                </button>
              </div>

              {signaturePreview ? (
                <div className="rounded-lg border border-[#1b365d]/30 bg-blue-50/40 p-2.5 flex items-center justify-between">
                  {signaturePreview.startsWith("data:image") || signaturePreview.startsWith("http") ? (
                    <img
                      src={signaturePreview}
                      alt="Saved signature"
                      className="h-8 max-w-[140px] object-contain"
                    />
                  ) : (
                    <span className="font-serif italic font-bold text-sm text-[#1b365d]">
                      {signaturePreview.replace("text:", "")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleResetSignature}
                    className="text-[11px] text-rust hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <p className="text-xs text-ink-soft/80">
                  Default cursive signature active. Click above to draw or type a custom signature.
                </p>
              )}
            </div>

            {/* Sales & Revenue Analytics Section (Available to ALL users) */}
            <div className="border-b border-line px-5 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Sales &amp; Revenue Analytics
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-pine-deep bg-pine-tint px-1.5 py-0.5 rounded">
                  <Sparkles size={10} /> Live
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-3">
                {isAdmin
                  ? "View nursery-wide sales, online UPI & counter cash breakdowns, and staff reports."
                  : "View your personal sales figures, online UPI payments, and cash collections."}
              </p>

              {/* Today's Quick Snapshot Card */}
              <div className="rounded-xl border border-line bg-paper p-3 mb-3">
                <div className="flex items-center justify-between text-xs text-ink-soft mb-1">
                  <span>Today's Total Sales</span>
                  <span className="font-semibold text-ink">
                    {todaySalesSummary
                      ? `${todaySalesSummary.count} bill(s)`
                      : "Loading..."}
                  </span>
                </div>
                <div className="font-serif text-xl font-bold text-pine-deep mb-2">
                  ₹{Number(todaySalesSummary?.total || 0).toLocaleString("en-IN")}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-xs">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="text-ink-soft truncate">Online:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400 font-mono ml-auto">
                      ₹{Number(todaySalesSummary?.online || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-ink-soft truncate">Cash:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono ml-auto">
                      ₹{Number(todaySalesSummary?.cash || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Open full analytics modal */}
              <button
                type="button"
                onClick={() => setSalesModalOpen(true)}
                className="flex w-full items-center justify-between gap-2 rounded-lg bg-pine px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-pine-deep transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} />
                  <span>View Full Sales Analytics</span>
                </div>
                <ChevronRight size={15} className="opacity-80" />
              </button>
            </div>

            {/* Custom Invoice Number Series Section (Available to ALL users) */}
            <div className="border-b border-line px-5 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Invoice Number Series
                </span>
                {nextInvoiceNumber && (
                  <span className="text-[10px] font-mono font-bold bg-blue-50 text-[#1b365d] border border-blue-200 px-1.5 py-0.5 rounded">
                    Next: {nextInvoiceNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-soft mb-2.5">
                Set a custom starting invoice number. Subsequent invoices will automatically continue from this series.
              </p>
              <button
                type="button"
                onClick={() => setCustomNumberModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-paper px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-line/50 cursor-pointer"
              >
                <Hash size={14} /> Set Custom Invoice Number
              </button>
            </div>

            {/* Log out button */}
            <div className="px-5 py-4">
              <button
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-line-strong px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/50 cursor-pointer"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ADMIN TAB CONTENT (Admin only)                           */}
        {/* ========================================================= */}
        {isAdmin && activeTab === "admin" && (
          <div className="flex flex-col divide-y divide-line">
            {/* 0. Nursery Sales Analytics & Reports */}
            <div className="px-5 py-4 bg-paper-flat/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Nursery Sales Analytics
                </span>
                <span className="rounded bg-pine-tint px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pine-deep">
                  Live Reports
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-3">
                Full analytics with Month, Date, Year, and Custom Length date filters across all staff members.
              </p>
              <button
                type="button"
                onClick={() => setSalesModalOpen(true)}
                className="flex w-full items-center justify-between rounded-lg border border-pine/30 bg-pine-tint/40 px-3.5 py-2.5 text-xs font-semibold text-pine-deep hover:bg-pine-tint transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} />
                  <span>Open Nursery Sales Analytics</span>
                </div>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* 1. Admin Invoice Header & Details */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Invoice Details &amp; Header
                </span>
                <span className="text-[10px] font-mono font-bold bg-pine-tint text-pine-deep px-1.5 py-0.5 rounded">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-2.5">
                Manage nursery business name, address, GSTIN, and mobile numbers across versions.
              </p>
              <button
                type="button"
                onClick={() => setAdminSettingsModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-paper px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-line/50 cursor-pointer"
              >
                <Building2 size={14} /> Edit Invoice Header &amp; Details
              </button>
            </div>

            {/* 2. Payment QR Code Upload Section (Admin only) */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Payment QR Code
                </span>
                <span className="text-[10px] font-mono font-bold bg-pine-tint text-pine-deep px-1.5 py-0.5 rounded">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-3">
                Upload a payment QR code or photo of your UPI QR card. This will be shown to customers when paying online.
              </p>

              {qrError && (
                <p className="mb-3 rounded-md bg-rust-tint px-3 py-2 text-xs text-rust">
                  {qrError}
                </p>
              )}

              {qrSuccess && (
                <p className="mb-3 flex items-center gap-1.5 rounded-md bg-pine-tint px-3 py-2 text-xs text-pine-deep">
                  <Check size={14} /> {qrSuccess}
                </p>
              )}

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleQrFileUpload(file);
                  e.target.value = "";
                }}
              />

              {loadingQr ? (
                <div className="flex items-center justify-center py-6 text-xs text-ink-soft gap-2">
                  <Loader2 size={15} className="animate-spin" /> Loading QR code…
                </div>
              ) : qrCodeData ? (
                <div className="rounded-lg border border-line bg-paper-flat/70 p-3 flex flex-col items-center gap-3">
                  <div className="relative group">
                    <img
                      src={qrCodeData}
                      alt="Uploaded Payment QR Code"
                      className="max-h-48 w-auto rounded border border-line bg-white object-contain shadow-xs p-1"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      disabled={uploadingQr}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-line/50 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} /> {uploadingQr ? "Uploading…" : "Change QR"}
                    </button>
                    <button
                      type="button"
                      disabled={uploadingQr}
                      onClick={handleRemoveQr}
                      className="flex items-center justify-center gap-1 rounded-md border border-rust/30 bg-rust-tint/40 px-2.5 py-1.5 text-xs font-medium text-rust hover:bg-rust-tint cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !uploadingQr && fileInputRef.current?.click()}
                  className="rounded-lg border-2 border-dashed border-line-strong/80 p-5 flex flex-col items-center justify-center gap-2 text-center bg-paper-flat/40 hover:bg-paper-flat cursor-pointer transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-tint text-pine-deep">
                    {uploadingQr ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <QrCode size={20} />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink">
                      {uploadingQr ? "Uploading QR image…" : "Upload QR Code or Photo"}
                    </div>
                    <div className="text-[11px] text-ink-soft mt-0.5">
                      Supports PNG, JPG, WEBP photo of QR card (max 5MB)
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={uploadingQr}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-pine px-3 py-1 text-xs font-medium text-surface shadow-xs hover:opacity-90"
                  >
                    <Upload size={12} /> Select Photo / Image
                  </button>
                </div>
              )}
            </div>

            {/* 3. Manage Users Section */}
            <div className="px-5 py-4">
              <h3 className="mb-2 font-serif text-sm font-semibold text-ink">
                Manage Users
              </h3>

              {error && (
                <p className="mb-3 rounded-md bg-rust-tint px-3 py-2 text-xs text-rust">
                  {error}
                </p>
              )}

              <form onSubmit={addUser} className="mb-4 flex flex-col gap-2">
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Username"
                  required
                  className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs outline-none focus:border-pine"
                />
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Temporary password"
                  type="text"
                  required
                  className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs outline-none focus:border-pine"
                />
                <div className="flex gap-2">
                  <select
                    value={newRole}
                    onChange={(e) =>
                      setNewRole(e.target.value as "admin" | "staff")
                    }
                    className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs outline-none focus:border-pine flex-1"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-1.5 rounded-md bg-pine px-3.5 py-1.5 text-xs font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus size={13} /> Add user
                  </button>
                </div>
              </form>

              <ul className="flex flex-col divide-y divide-line">
                {loadingUsers && (
                  <li className="py-2 text-xs text-ink-soft">Loading…</li>
                )}
                {users?.map((u) => {
                  const isCurrent = u.id === user?.id;
                  return (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-ink">
                          {u.username}
                        </div>
                        <div className="text-[11px] text-ink-soft">
                          Joined{" "}
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="rounded bg-pine-tint px-2 py-0.5 text-xs font-medium capitalize text-pine-deep">
                            Admin (You)
                          </span>
                        ) : (
                          <>
                            <select
                              value={u.role}
                              onChange={(e) =>
                                updateRole(
                                  u.id,
                                  e.target.value as "admin" | "staff",
                                )
                              }
                              className="rounded border border-line-strong bg-surface px-2 py-1 text-xs font-medium capitalize text-ink outline-none transition-colors focus:border-pine"
                              aria-label={`Change role for ${u.username}`}
                            >
                              <option value="staff">Staff</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => removeUser(u)}
                              className="rounded p-1 text-ink-soft transition-colors hover:bg-rust-tint hover:text-rust cursor-pointer"
                              title={`Remove ${u.role === "admin" ? "admin" : "user"} ${u.username}`}
                              aria-label={`Remove ${u.username}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* 4. Danger Zone */}
            <div className="px-5 py-4">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-rust">
                Danger Zone
              </h4>
              <p className="mb-3 text-xs text-ink-soft">
                Permanently delete all invoices, stock items, and reset database
                records. Your admin account will remain active.
              </p>
              <button
                type="button"
                onClick={handleClearAllData}
                disabled={clearing}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-rust/40 bg-rust-tint/60 px-3 py-2 text-xs font-semibold text-rust transition-colors hover:bg-rust hover:text-surface disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={14} />
                {clearing ? "Clearing database…" : "Clear all database data"}
              </button>
            </div>
          </div>
        )}
      </div>

      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSave={handleSaveSignature}
      />

      <AdminInvoiceSettingsModal
        open={adminSettingsModalOpen}
        onClose={() => setAdminSettingsModalOpen(false)}
      />

      <CustomInvoiceNumberModal
        isOpen={customNumberModalOpen}
        onClose={() => setCustomNumberModalOpen(false)}
        initialNumber={nextInvoiceNumber}
        onUpdated={(num) => {
          setNextInvoiceNumber(num);
          window.dispatchEvent(new Event("invoiceSequenceUpdated"));
        }}
      />

      <SalesAnalyticsModal
        open={salesModalOpen}
        onClose={() => {
          setSalesModalOpen(false);
          loadTodaySales();
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}
