// src/components/CustomInvoiceNumberModal.tsx

"use client";

import { useEffect, useState } from "react";
import { Hash, X, Check, ArrowRight } from "lucide-react";
import { incrementInvoiceNumber } from "@/lib/invoice-format";
import { useLanguage } from "@/lib/language-context";

export function CustomInvoiceNumberModal({
  isOpen,
  onClose,
  onUpdated,
  initialNumber = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (newNextNumber: string) => void;
  initialNumber?: string;
}) {
  const { language, t } = useLanguage();
  const [customNumber, setCustomNumber] = useState(initialNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess("");
      if (initialNumber) {
        setCustomNumber(initialNumber);
      } else {
        fetch("/api/settings/invoice-sequence")
          .then((r) => r.json())
          .then((d) => {
            if (d.nextInvoiceNumber) setCustomNumber(d.nextInvoiceNumber);
          })
          .catch(() => {});
      }
    }
  }, [isOpen, initialNumber]);

  if (!isOpen) return null;

  const nextPreview = customNumber.trim()
    ? incrementInvoiceNumber(customNumber.trim())
    : "—";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customNumber.trim();
    if (!trimmed) {
      setError("Please enter a valid invoice number.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings/invoice-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextInvoiceNumber: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update invoice number series.");
      }

      setSuccess(`Invoice series updated to start at ${trimmed}`);
      onUpdated(trimmed);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating invoice number.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-pine-tint p-1.5 text-pine-deep">
              <Hash size={18} />
            </div>
            <h2 className="font-serif text-lg font-bold text-ink">
              {t("customInvoiceModalTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-soft hover:bg-line/60 hover:text-ink cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <p className="text-xs leading-relaxed text-ink-soft">
            {t("customInvoiceModalDesc")}
          </p>

          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">
              {language === "kn" ? "ಮುಂದಿನ ಇನ್‌ವಾಯ್ಸ್ ಸಂಖ್ಯೆ" : "Next Invoice Number"}
            </label>
            <input
              type="text"
              value={customNumber}
              onChange={(e) => setCustomNumber(e.target.value)}
              placeholder="e.g. INV-2026-0100, SVL-050, or 1001"
              required
              className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 font-mono text-sm font-semibold text-ink outline-none focus:border-pine focus:ring-1 focus:ring-pine"
            />
          </div>

          {customNumber.trim() && (
            <div className="rounded-lg border border-line-strong/60 bg-paper-flat/60 p-3 text-xs">
              <div className="text-ink-soft mb-1 font-medium">{t("seriesPreviewLabel")}</div>
              <div className="flex items-center gap-2 font-mono font-bold text-[#1b365d]">
                <span className="rounded bg-blue-50 px-2 py-0.5 border border-blue-200">
                  {customNumber.trim()}
                </span>
                <ArrowRight size={14} className="text-ink-soft" />
                <span className="rounded bg-blue-50 px-2 py-0.5 border border-blue-200">
                  {nextPreview}
                </span>
                <span className="text-ink-soft font-normal text-[11px]">{language === "kn" ? "...ಮುಂದುವರಿಯುತ್ತದೆ" : "...and continuing"}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-rust/30 bg-rust-tint p-2.5 text-xs text-rust">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800">
              <Check size={14} />
              {success}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-line-strong px-4 py-2 text-xs font-medium text-ink-soft hover:bg-line/40 hover:text-ink cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-pine px-4 py-2 text-xs font-semibold text-surface hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? (language === "kn" ? "ಉಳಿಸಲಾಗುತ್ತಿದೆ..." : "Saving...") : t("saveInvoiceSeriesBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
