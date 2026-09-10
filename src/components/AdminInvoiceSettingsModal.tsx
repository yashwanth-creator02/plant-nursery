// src/components/AdminInvoiceSettingsModal.tsx

"use client";

import { useEffect, useState } from "react";
import { X, Check, Building2, AlertTriangle } from "lucide-react";
import { BusinessSettings } from "@/lib/types";

interface AdminInvoiceSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (updated: BusinessSettings) => void;
}

export function AdminInvoiceSettingsModal({
  open,
  onClose,
  onSuccess,
}: AdminInvoiceSettingsModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentVersion, setCurrentVersion] = useState(1);

  const [businessName, setBusinessName] = useState("");
  const [subheading1, setSubheading1] = useState("");
  const [subheading2, setSubheading2] = useState("");
  const [address, setAddress] = useState("");
  const [mobiles, setMobiles] = useState("");
  const [gstin, setGstin] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError("");
      setShowConfirm(false);
      fetch("/api/settings/invoice-details")
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to load settings");
          const s = data.settings as BusinessSettings;
          setCurrentVersion(s.version || 1);
          setBusinessName(s.businessName || "");
          setSubheading1(s.subheading1 || "");
          setSubheading2(s.subheading2 || "");
          setAddress(s.address || "");
          setMobiles(s.mobiles || "");
          setGstin(s.gstin || "");
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Error"))
        .finally(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  async function handleConfirmSave() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/settings/invoice-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          subheading1,
          subheading2,
          address,
          mobiles,
          gstin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update details");

      if (onSuccess) onSuccess(data.settings);
      setShowConfirm(false);
      onClose();
      window.dispatchEvent(new Event("invoiceSettingsUpdated"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error updating invoice details");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-pine" />
            <h3 className="font-serif text-base font-semibold text-ink">
              Invoice Header Settings (Admin Only)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-soft hover:bg-line/50 hover:text-ink"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-md bg-rust-tint px-3 py-2 text-xs text-rust">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-ink-soft">
            Loading invoice settings...
          </div>
        ) : (
          <div className="mt-4 space-y-3.5">
            <div className="flex items-center justify-between bg-paper px-3 py-2 rounded-md border border-line">
              <span className="text-xs font-medium text-ink-soft">
                Current Active Invoice Version
              </span>
              <span className="font-mono text-xs font-bold text-pine-deep bg-surface border border-line px-2 py-0.5 rounded">
                Version {currentVersion}
              </span>
            </div>

            <label className="flex flex-col gap-1 text-xs text-ink-soft">
              <span>Nursery / Business Name</span>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm outline-none focus:border-pine"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-ink-soft">
                <span>GSTIN</span>
                <input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm outline-none focus:border-pine font-mono"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-ink-soft">
                <span>Mobile Numbers</span>
                <input
                  value={mobiles}
                  onChange={(e) => setMobiles(e.target.value)}
                  className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm outline-none focus:border-pine"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs text-ink-soft">
              <span>Subtitle Line 1 (Approval)</span>
              <input
                value={subheading1}
                onChange={(e) => setSubheading1(e.target.value)}
                className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm outline-none focus:border-pine"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-ink-soft">
              <span>Subtitle Line 2 (Supplies)</span>
              <input
                value={subheading2}
                onChange={(e) => setSubheading2(e.target.value)}
                className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm outline-none focus:border-pine"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-ink-soft">
              <span>Address & Location</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm outline-none focus:border-pine"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2.5 border-t border-line pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-line px-3.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-line/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={!businessName.trim() || !address.trim()}
                className="flex items-center gap-1.5 rounded-md bg-pine px-4 py-1.5 text-xs font-medium text-surface shadow-xs hover:opacity-90 disabled:opacity-50"
              >
                <Check size={14} /> Save Details
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs rounded-xl">
            <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-2xl text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rust-tint text-rust">
                <AlertTriangle size={20} />
              </div>
              <h4 className="font-serif text-base font-bold text-ink">
                Confirm Permanent Change
              </h4>
              <p className="mt-2 text-xs font-semibold text-rust">
                &ldquo;you are about to permanetly change the invoice details.&rdquo;
              </p>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                This will increment active invoices to <strong>Version {currentVersion + 1}</strong>.
                Future invoices will use these new details, while existing invoices will remain
                permanently tagged as <strong>Version {currentVersion}</strong>.
              </p>

              <div className="mt-5 flex justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                  className="rounded-md border border-line px-3.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-line/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={submitting}
                  className="flex items-center gap-1 rounded-md bg-rust px-4 py-1.5 text-xs font-medium text-surface hover:opacity-90 disabled:opacity-50 shadow-xs"
                >
                  {submitting ? "Updating..." : "Confirm & Update"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
