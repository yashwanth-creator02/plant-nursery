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
  History,
  FolderArchive,
  ImageIcon,
  Percent,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { SignatureModal } from "./SignatureModal";
import { AdminInvoiceSettingsModal } from "./AdminInvoiceSettingsModal";
import { CustomInvoiceNumberModal } from "./CustomInvoiceNumberModal";
import { SalesAnalyticsModal } from "./SalesAnalyticsModal";
import { ExportDataModal } from "./ExportDataModal";

type ManagedUser = {
  id: string;
  username: string;
  role: "admin" | "staff";
  createdAt: string;
};

type InvoiceVersionInfo = {
  id?: string;
  version: number;
  businessName: string;
  subheading1?: string | null;
  subheading2?: string | null;
  address: string;
  mobiles?: string | null;
  gstin?: string | null;
  updatedAt?: string | Date;
  isCurrent?: boolean;
  invoiceCount?: number;
  totalRevenue?: number;
};

export function ProfilePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout, refresh } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "admin">("profile");

  const [invoiceVersions, setInvoiceVersions] = useState<InvoiceVersionInfo[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const [cgstRate, setCgstRate] = useState("2.50");
  const [sgstRate, setSgstRate] = useState("2.50");
  const [taxRatesSaving, setTaxRatesSaving] = useState(false);
  const [taxRatesSuccess, setTaxRatesSuccess] = useState("");
  const [taxRatesError, setTaxRatesError] = useState("");

  function loadInvoiceVersions() {
    setLoadingVersions(true);
    fetch("/api/settings/invoice-details", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (data.settings) {
          setCgstRate(data.settings.cgstRate !== undefined ? String(data.settings.cgstRate) : "2.50");
          setSgstRate(data.settings.sgstRate !== undefined ? String(data.settings.sgstRate) : "2.50");
        }
        if (data.versions && Array.isArray(data.versions)) {
          setInvoiceVersions(data.versions);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVersions(false));
  }

  async function handleSaveTaxRates() {
    setTaxRatesSaving(true);
    setTaxRatesError("");
    setTaxRatesSuccess("");
    try {
      const res = await fetch("/api/settings/invoice-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cgstRate,
          sgstRate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update tax rates");
      setTaxRatesSuccess("Tax rates updated successfully!");
      window.dispatchEvent(new Event("invoiceSettingsUpdated"));
      loadInvoiceVersions();
      setTimeout(() => setTaxRatesSuccess(""), 3000);
    } catch (err) {
      setTaxRatesError(err instanceof Error ? err.message : "Error saving tax rates");
    } finally {
      setTaxRatesSaving(false);
    }
  }

  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingInvoices, setDeletingInvoices] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // QR Code Settings State
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrSuccess, setQrSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nursery Logo Settings State
  const [logoData, setLogoData] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [logoSuccess, setLogoSuccess] = useState("");
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [adminSettingsModalOpen, setAdminSettingsModalOpen] = useState(false);
  const [customNumberModalOpen, setCustomNumberModalOpen] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>("");
  const [, setSavingSignature] = useState(false);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
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
      loadLogo();
      loadTodaySales();
      if (isAdmin) {
        loadUsers();
        loadInvoiceVersions();
      }

      const handleInvoiceSettingsUpdated = () => {
        if (isAdmin) loadInvoiceVersions();
      };
      window.addEventListener("invoiceSettingsUpdated", handleInvoiceSettingsUpdated);
      return () => {
        window.removeEventListener("invoiceSettingsUpdated", handleInvoiceSettingsUpdated);
      };
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
    const confirmRemoveQrMsg = language === "kn"
      ? "ಪಾವತಿ QR ಕೋಡ್ ಅನ್ನು ತೆಗೆದುಹಾಕಬೇಕೇ? ಸಿಬ್ಬಂದಿ ಮತ್ತು ಗ್ರಾಹಕರಿಗೆ ಇನ್ನು ಮುಂದೆ QR ಕೋಡ್ ಕಾಣಿಸುವುದಿಲ್ಲ."
      : "Remove the payment QR code? Staff and customers will no longer see a QR code.";
    if (!confirm(confirmRemoveQrMsg)) {
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

  async function loadLogo() {
    setLoadingLogo(true);
    try {
      const res = await fetch("/api/settings/logo", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.logoData) {
        setLogoData(data.logoData);
      } else {
        setLogoData(null);
      }
    } catch {
      // ignore
    } finally {
      setLoadingLogo(false);
    }
  }

  async function handleLogoFileUpload(file: File) {
    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    const isImage = file.type.startsWith("image/");
    if (!isSvg && !isImage) {
      setLogoError("Please select a valid image file (SVG, PNG, JPG, or WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo file is too large. Please select a file under 2MB.");
      return;
    }

    setUploadingLogo(true);
    setLogoError("");
    setLogoSuccess("");

    if (isSvg) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const rawSvg = reader.result as string;
          const res = await fetch("/api/settings/logo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logoData: rawSvg.trim() }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to update logo");
          setLogoData(data.logoData);
          setLogoSuccess("Nursery logo updated successfully! It applies to all future & draft bills.");
          setTimeout(() => setLogoSuccess(""), 4000);
          window.dispatchEvent(new CustomEvent("nurseryLogoUpdated", { detail: { logoData: data.logoData } }));
        } catch (e) {
          setLogoError(e instanceof Error ? e.message : "Upload failed");
        } finally {
          setUploadingLogo(false);
        }
      };
      reader.onerror = () => {
        setLogoError("Could not read SVG file");
        setUploadingLogo(false);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUri = reader.result as string;
          const res = await fetch("/api/settings/logo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logoData: dataUri }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to update logo");
          setLogoData(data.logoData);
          setLogoSuccess("Nursery logo updated successfully! It applies to all future & draft bills.");
          setTimeout(() => setLogoSuccess(""), 4000);
          window.dispatchEvent(new CustomEvent("nurseryLogoUpdated", { detail: { logoData: data.logoData } }));
        } catch (e) {
          setLogoError(e instanceof Error ? e.message : "Upload failed");
        } finally {
          setUploadingLogo(false);
        }
      };
      reader.onerror = () => {
        setLogoError("Could not read image file");
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleRemoveLogo() {
    const confirmRemoveLogoMsg = language === "kn"
      ? "ಡೀಫಾಲ್ಟ್ ನರ್ಸರಿ ಲೋಗೋಗೆ ಮರುಹೊಂದಿಸಬೇಕೇ? ಭವಿಷ್ಯದ ಬಿಲ್‌ಗಳು ಡೀಫಾಲ್ಟ್ ಸಸ್ಯದ ಲೋಗೋವನ್ನು ಬಳಸುತ್ತವೆ."
      : "Reset to the default nursery plant logo? Future and draft bills will use the default plant logo.";
    if (!confirm(confirmRemoveLogoMsg)) {
      return;
    }
    setUploadingLogo(true);
    setLogoError("");
    setLogoSuccess("");
    try {
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoData: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset logo");
      setLogoData(null);
      setLogoSuccess("Logo reset to default plant logo.");
      setTimeout(() => setLogoSuccess(""), 3500);
      window.dispatchEvent(new CustomEvent("nurseryLogoUpdated", { detail: { logoData: null } }));
    } catch (e) {
      setLogoError(e instanceof Error ? e.message : "Failed to reset logo");
    } finally {
      setUploadingLogo(false);
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
    const msg = language === "kn"
      ? (isAdminTarget
          ? `ನಿರ್ವಾಹಕ "${targetUser.username}" ರನ್ನು ತೆಗೆದುಹಾಕಬೇಕೇ? ಅವರು ಎಲ್ಲಾ ಪ್ರವೇಶವನ್ನು ಕಳೆದುಕೊಳ್ಳುತ್ತಾರೆ.`
          : `ಬಳಕೆದಾರ "${targetUser.username}" ರನ್ನು ತೆಗೆದುಹಾಕಬೇಕೇ? ಅವರು ಇನ್ನು ಲಾಗಿನ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ.`)
      : (isAdminTarget
          ? `Remove admin "${targetUser.username}"? They will lose all admin and account access.`
          : `Remove user "${targetUser.username}"? They won't be able to log in anymore.`);

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

  async function handleDeleteAllInvoices() {
    const confirmed = window.confirm(
      language === "kn"
        ? "ಎಚ್ಚರಿಕೆ: ಇದು ಡೇಟಾಬೇಸ್‌ನಿಂದ ಎಲ್ಲಾ ಬಿಲ್‌ಗಳು ಮತ್ತು ಬಿಲ್ಲಿಂಗ್ ಇತಿಹಾಸವನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುತ್ತದೆ.\n\nಸ್ಟಾಕ್ ಮತ್ತು ಬಳಕೆದಾರರ ಖಾತೆಗಳನ್ನು ಅಳಿಸಲಾಗುವುದಿಲ್ಲ.\n\nಈ ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗುವುದಿಲ್ಲ.\n\nನೀವು ಎಲ್ಲಾ ಬಿಲ್‌ಗಳನ್ನು ಅಳಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?"
        : "WARNING: This will permanently delete ALL invoices and billing history from the database.\n\nStock inventory and user accounts will NOT be deleted.\n\nThis action CANNOT be undone.\n\nAre you sure you want to delete all invoices?",
    );
    if (!confirmed) return;

    const doubleCheck = window.confirm(
      language === "kn"
        ? "ಮತ್ತೊಮ್ಮೆ ದೃಢೀಕರಿಸಿ: ಎಲ್ಲಾ ಬಿಲ್‌ಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?"
        : "CONFIRM AGAIN: Are you absolutely sure you want to permanently delete all invoices?",
    );
    if (!doubleCheck) return;

    setDeletingInvoices(true);
    setError("");
    try {
      const res = await fetch("/api/invoices", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete invoices");
      alert(language === "kn" ? "ಎಲ್ಲಾ ಬಿಲ್‌ಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗಿದೆ." : "All invoices have been permanently deleted.");
      window.dispatchEvent(new Event("invoiceSequenceUpdated"));
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete invoices");
      setDeletingInvoices(false);
    }
  }

  async function handleClearAllData() {
    const confirmed = window.confirm(
      language === "kn"
        ? "ಎಚ್ಚರಿಕೆ: ಇದು ಡೇಟಾಬೇಸ್‌ನಿಂದ ಎಲ್ಲಾ ಬಿಲ್‌ಗಳು, ಸ್ಟಾಕ್ ಐಟಂಗಳು ಮತ್ತು ಇತರ ಬಳಕೆದಾರ ಖಾತೆಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುತ್ತದೆ.\n\nಈ ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗುವುದಿಲ್ಲ.\n\nನೀವು ಮುಂದುವರಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?"
        : "WARNING: This will permanently delete all invoices, line items, stock items, and other user accounts from the database.\n\nThis action CANNOT be undone.\n\nAre you sure you want to proceed?",
    );
    if (!confirmed) return;

    setClearing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/clear-data", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear database");
      alert(language === "kn" ? "ಡೇಟಾಬೇಸ್ ಅನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ." : "Database has been completely cleared.");
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
            {isAdmin ? t("profileTitleAdmin") : t("profileTitleStaff")}
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
              <User size={14} /> {t("tabProfile")}
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
              <ShieldCheck size={14} /> {t("tabAdmin")}
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
                  <span className="text-xs capitalize font-medium text-ink-soft">{user?.role === "admin" ? t("adminRole") : t("staffRole")}</span>
                </div>
              </div>
            </div>



            {/* Digital Signature Section */}
            <div className="border-b border-line px-5 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {t("digitalSignatureSection")}
                </span>
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-pine-deep hover:underline cursor-pointer"
                >
                  <PenTool size={12} />
                  <span>{signaturePreview ? t("editSignatureBtn") : t("createSignatureBtn")}</span>
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
                    {t("resetSignatureBtn")}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-ink-soft/80">
                  {t("defaultSignatureNote")}
                </p>
              )}
            </div>

            {/* Sales & Revenue Analytics Section (Available to ALL users) */}
            <div className="border-b border-line px-5 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {t("salesAnalyticsSection")}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-pine-deep bg-pine-tint px-1.5 py-0.5 rounded">
                  <Sparkles size={10} /> Live
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-3">
                {isAdmin
                  ? t("salesAnalyticsAdminDesc")
                  : t("salesAnalyticsStaffDesc")}
              </p>

              {/* Today's Quick Snapshot Card */}
              <div className="rounded-xl border border-line bg-paper p-3 mb-3">
                <div className="flex items-center justify-between text-xs text-ink-soft mb-1">
                  <span>{t("todayTotalSalesLabel")}</span>
                  <span className="font-semibold text-ink">
                    {todaySalesSummary
                      ? `${todaySalesSummary.count} ${t("billsBadge")}`
                      : "..."}
                  </span>
                </div>
                <div className="font-serif text-xl font-bold text-pine-deep mb-2">
                  ₹{Number(todaySalesSummary?.total || 0).toLocaleString("en-IN")}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-xs">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="text-ink-soft truncate">{t("onlineUpiLabel")}:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400 font-mono ml-auto">
                      ₹{Number(todaySalesSummary?.online || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-ink-soft truncate">{t("cashOfflineLabel")}:</span>
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
                  <span>{t("viewFullSalesAnalyticsBtn")}</span>
                </div>
                <ChevronRight size={15} className="opacity-80" />
              </button>
            </div>

            {/* Custom Invoice Number Series Section (Available to ALL users) */}
            <div className="border-b border-line px-5 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {t("invoiceSeriesSection")}
                </span>
                {nextInvoiceNumber && (
                  <span className="text-[10px] font-mono font-bold bg-blue-50 text-[#1b365d] border border-blue-200 px-1.5 py-0.5 rounded">
                    {t("nextSeriesLabel")} {nextInvoiceNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-soft mb-2.5">
                {t("invoiceSeriesDesc")}
              </p>
              <button
                type="button"
                onClick={() => setCustomNumberModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-paper px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-line/50 cursor-pointer"
              >
                <Hash size={14} /> {t("setCustomInvoiceNumberBtn")}
              </button>
            </div>

            {/* Log out button */}
            <div className="px-5 py-4">
              <button
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-line-strong px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/50 cursor-pointer"
              >
                <LogOut size={15} /> {t("logoutBtn")}
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
                  {t("nurserySalesAnalyticsTitle")}
                </span>
                <span className="rounded bg-pine-tint px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pine-deep">
                  Live Reports
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-3">
                {t("nurserySalesAnalyticsDesc")}
              </p>
              <button
                type="button"
                onClick={() => setSalesModalOpen(true)}
                className="flex w-full items-center justify-between rounded-lg border border-pine/30 bg-pine-tint/40 px-3.5 py-2.5 text-xs font-semibold text-pine-deep hover:bg-pine-tint transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} />
                  <span>{t("openSalesAnalyticsBtn")}</span>
                </div>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* 1. Admin Tax Rates Configuration (CGST / SGST) */}
            <div className="px-5 py-4 border-b border-line">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {t("taxRatesTitle")}
                </span>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                  Live Tax Settings
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-3">
                {t("taxRatesDesc")}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-ink">{t("cgstRateLabel")}</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="50"
                      value={cgstRate}
                      onChange={(e) => setCgstRate(e.target.value)}
                      placeholder="2.50"
                      className="w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs font-mono font-bold text-ink outline-none focus:border-pine pr-7"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-soft pointer-events-none">%</span>
                  </div>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-ink">{t("sgstRateLabel")}</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="50"
                      value={sgstRate}
                      onChange={(e) => setSgstRate(e.target.value)}
                      placeholder="2.50"
                      className="w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs font-mono font-bold text-ink outline-none focus:border-pine pr-7"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-soft pointer-events-none">%</span>
                  </div>
                </label>
              </div>

              {taxRatesSuccess && (
                <div className="mb-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded">
                  {taxRatesSuccess}
                </div>
              )}
              {taxRatesError && (
                <div className="mb-2.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded">
                  {taxRatesError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveTaxRates}
                disabled={taxRatesSaving}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-pine px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-pine-deep transition-all cursor-pointer disabled:opacity-50"
              >
                <Percent size={14} />
                <span>{taxRatesSaving ? t("savingTaxRatesBtn") : t("saveTaxRatesBtn")}</span>
              </button>
            </div>

            {/* 2. Admin Invoice Header & Details */}
            <div className="px-5 py-4">
              <div className="mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {t("invoiceDetailsHeaderTitle")}
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-2.5">
                {t("invoiceDetailsHeaderDesc")}
              </p>
              <button
                type="button"
                onClick={() => setAdminSettingsModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-paper px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-line/50 cursor-pointer"
              >
                <Building2 size={14} /> {t("editInvoiceHeaderBtn")}
              </button>

              {/* Past & Active Invoice Versions History */}
              <div className="mt-4 pt-3 border-t border-line/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <History size={13} className="text-pine" />
                    <span>{t("versionHistoryTitle")}</span>
                  </div>
                  <span className="text-[11px] font-mono text-ink-soft">
                    {invoiceVersions.length} {t("versionLabel").toLowerCase()}(s)
                  </span>
                </div>

                {loadingVersions ? (
                  <div className="py-4 text-center text-xs text-ink-soft flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Loading versions…
                  </div>
                ) : invoiceVersions.length === 0 ? (
                  <p className="text-xs text-ink-soft">No versions recorded yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {invoiceVersions.map((v) => (
                      <div
                        key={v.version}
                        className={`rounded-lg border p-3 text-xs transition-all ${
                          v.isCurrent
                            ? "border-pine/50 bg-pine-tint/20 dark:bg-pine-tint/10 shadow-xs"
                            : "border-line bg-paper-flat/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-ink">
                              {t("versionLabel")} {v.version}
                            </span>
                            {v.isCurrent ? (
                              <span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider">
                                {t("currentActiveBadge")}
                              </span>
                            ) : (
                              <span className="rounded bg-paper border border-line text-ink-soft px-1.5 py-0.2 text-[10px] font-medium">
                                {t("pastVersionBadge")}
                              </span>
                            )}
                          </div>
                          {v.updatedAt && (
                            <span className="text-[10px] text-ink-soft/70 font-mono">
                              {new Date(v.updatedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5 mb-2.5 text-[11px] text-ink-soft">
                          <div className="font-semibold text-ink truncate">{v.businessName}</div>
                          {v.subheading1 && (
                            <div className="italic text-[10px] text-ink-soft/80 truncate">
                              {v.subheading1}
                            </div>
                          )}
                          <div className="text-ink-soft/90 line-clamp-1">{v.address}</div>
                          <div className="flex items-center gap-3 text-[10px] text-ink-soft/80 font-mono mt-1 flex-wrap">
                            {v.gstin && <span>GSTIN: {v.gstin}</span>}
                            {v.mobiles && <span>{t("mobilesLabel")} {v.mobiles}</span>}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-line/60 pt-2 text-[11px]">
                          <div className="flex items-center gap-2 text-ink-soft">
                            <span>
                              <strong className="font-semibold text-ink">{v.invoiceCount ?? 0}</strong> {t("billsBadge")}
                            </span>
                            <span>•</span>
                            <span className="font-mono font-semibold text-pine-deep">
                              ₹{Number(v.totalRevenue ?? 0).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              router.push(`/invoices?version=${v.version}`);
                            }}
                            className="inline-flex items-center gap-1 font-semibold text-pine-deep hover:underline cursor-pointer"
                            title={`Filter invoices created under Version ${v.version}`}
                          >
                            <span>{t("viewBillsBtn")}</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Payment QR Code Upload Section (Admin only) */}
            <div className="px-5 py-4">
              <div className="mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {t("paymentQrTitle")}
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-3">
                {t("paymentQrDesc")}
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
                      <RefreshCw size={13} /> {uploadingQr ? "..." : t("changeQrBtn")}
                    </button>
                    <button
                      type="button"
                      disabled={uploadingQr}
                      onClick={handleRemoveQr}
                      className="flex items-center justify-center gap-1 rounded-md border border-rust/30 bg-rust-tint/40 px-2.5 py-1.5 text-xs font-medium text-rust hover:bg-rust-tint cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={13} /> {t("removeQrBtn")}
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
                      {uploadingQr ? "..." : t("uploadQrPrompt")}
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

            {/* 3. Nursery Logo Upload Section (Admin only) */}
            <div className="px-5 py-4 border-t border-line">
              <div className="mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {t("nurseryLogoTitle")}
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-3">
                {t("nurseryLogoDesc")}
              </p>

              {logoError && (
                <p className="mb-3 rounded-md bg-rust-tint px-3 py-2 text-xs text-rust">
                  {logoError}
                </p>
              )}

              {logoSuccess && (
                <p className="mb-3 flex items-center gap-1.5 rounded-md bg-pine-tint px-3 py-2 text-xs text-pine-deep">
                  <Check size={14} /> {logoSuccess}
                </p>
              )}

              {/* Hidden file input for logo */}
              <input
                type="file"
                ref={logoFileInputRef}
                accept="image/svg+xml,image/*,.svg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoFileUpload(file);
                  e.target.value = "";
                }}
              />

              {loadingLogo ? (
                <div className="flex items-center justify-center py-6 text-xs text-ink-soft gap-2">
                  <Loader2 size={15} className="animate-spin" /> Loading nursery logo…
                </div>
              ) : logoData ? (
                <div className="rounded-lg border border-line bg-paper-flat/70 p-3 flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center p-2 rounded border border-line bg-white shadow-xs">
                    {logoData.trim().startsWith("<svg") ? (
                      <div
                        className="h-16 w-16 flex items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:w-auto [&>svg]:h-auto object-contain text-[#1b365d]"
                        dangerouslySetInnerHTML={{ __html: logoData }}
                      />
                    ) : (
                      <img
                        src={logoData}
                        alt="Nursery Custom Logo"
                        className="h-16 w-auto max-w-[160px] object-contain"
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-ink-soft">
                    {t("activeLogoNote")}
                  </span>

                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={() => logoFileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-line/50 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} /> {uploadingLogo ? "..." : t("changeLogoBtn")}
                    </button>
                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={handleRemoveLogo}
                      className="flex items-center justify-center gap-1 rounded-md border border-rust/30 bg-rust-tint/40 px-2.5 py-1.5 text-xs font-medium text-rust hover:bg-rust-tint cursor-pointer disabled:opacity-50"
                      title="Reset to default plant logo"
                    >
                      <Trash2 size={13} /> {t("resetLogoBtn")}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !uploadingLogo && logoFileInputRef.current?.click()}
                  className="rounded-lg border-2 border-dashed border-line-strong/80 p-5 flex flex-col items-center justify-center gap-2 text-center bg-paper-flat/40 hover:bg-paper-flat cursor-pointer transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pine-tint text-pine-deep">
                    {uploadingLogo ? (
                      <Loader2 size={22} className="animate-spin" />
                    ) : (
                      <svg
                        className="h-7 w-7 opacity-90"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2z" />
                        <path d="M12 18V9" strokeWidth="2" />
                        <path d="M12 13c-2.5 0-4-2-4-4 2 0 4 1.5 4 4z" fill="currentColor" fillOpacity="0.25" />
                        <path d="M12 11c2.5 0 4-2 4-4-2 0-4 1.5-4 4z" fill="currentColor" fillOpacity="0.25" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink">
                      {uploadingLogo ? "..." : t("uploadLogoPrompt")}
                    </div>
                    <div className="text-[11px] text-ink-soft mt-0.5">
                      Supports SVG (recommended), PNG, JPG, or WEBP (max 2MB)
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-pine px-3 py-1 text-xs font-medium text-surface shadow-xs hover:opacity-90 cursor-pointer"
                  >
                    <Upload size={12} /> Select Logo File
                  </button>
                </div>
              )}
            </div>

            {/* 3. Manage Users Section */}
            <div className="px-5 py-4">
              <h3 className="mb-2 font-serif text-sm font-semibold text-ink">
                {t("manageUsersTitle")}
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
                  placeholder={t("usernameCol")}
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
                    <option value="staff">{t("staffRole")}</option>
                    <option value="admin">{t("adminRole")}</option>
                  </select>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-1.5 rounded-md bg-pine px-3.5 py-1.5 text-xs font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus size={13} /> {submitting ? t("addingUserBtn") : t("addUserBtn")}
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
                            {t("adminRole")} (You)
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
                              <option value="staff">{t("staffRole")}</option>
                              <option value="admin">{t("adminRole")}</option>
                            </select>
                            <button
                              onClick={() => removeUser(u)}
                              className="rounded p-1 text-ink-soft transition-colors hover:bg-rust-tint hover:text-rust cursor-pointer"
                              title={`${t("removeUserBtn")} ${u.role === "admin" ? t("adminRole") : t("staffRole")} ${u.username}`}
                              aria-label={`${t("removeUserBtn")} ${u.username}`}
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

            {/* 3.5 Nursery Data Backup & Export (Admin only) */}
            <div className="px-5 py-4 bg-paper-flat/40">
              <div className="mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {t("exportDataModalTitle")}
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-3">
                Export all invoices, inventory, plant photos, digital signatures, and spreadsheets into a destination folder named after the website with accurate nested folders.
              </p>
              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                className="flex w-full items-center justify-between rounded-lg bg-pine px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-pine-deep transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FolderArchive size={15} />
                  <span>{t("exportFolderBtn")}</span>
                </div>
                <ChevronRight size={15} className="opacity-80" />
              </button>
            </div>

            {/* 4. Danger Zone */}
            <div className="px-5 py-4">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-rust">
                {t("dangerZoneTitle")}
              </h4>
              <p className="mb-3 text-xs text-ink-soft">
                {t("deleteAllInvoicesDesc")}
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleDeleteAllInvoices}
                  disabled={deletingInvoices || clearing}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-rust/40 bg-rust-tint/60 px-3 py-2 text-xs font-semibold text-rust transition-colors hover:bg-rust hover:text-surface disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={14} />
                  {deletingInvoices ? t("deletingInvoicesBtn") : t("deleteAllInvoicesBtn")}
                </button>

                <button
                  type="button"
                  onClick={handleClearAllData}
                  disabled={clearing || deletingInvoices}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 px-3 py-2 text-xs font-semibold hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={14} />
                  {clearing ? "Clearing database…" : "Clear Entire Database Data"}
                </button>
              </div>
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
        onClose={() => {
          setAdminSettingsModalOpen(false);
          if (isAdmin) loadInvoiceVersions();
        }}
        onSuccess={() => {
          if (isAdmin) loadInvoiceVersions();
        }}
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
        onNavigate={(invoiceId) => {
          setSalesModalOpen(false);
          onClose();
          router.push(`/invoices/${invoiceId}`);
        }}
        isAdmin={isAdmin}
      />

      <ExportDataModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
}
