// src/components/AdminInvoiceSettingsModal.tsx

"use client";

import { useEffect, useState } from "react";
import { X, Check, Building2, AlertTriangle, History, ChevronRight, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentVersion, setCurrentVersion] = useState(1);
  const [activeTab, setActiveTab] = useState<"edit" | "history">("edit");
  const [pastVersions, setPastVersions] = useState<any[]>([]);

  const [businessName, setBusinessName] = useState("");
  const [subheading1, setSubheading1] = useState("");
  const [subheading2, setSubheading2] = useState("");
  const [address, setAddress] = useState("");
  const [mobiles, setMobiles] = useState("");
  const [gstin, setGstin] = useState("");
  const [cgstRate, setCgstRate] = useState("2.50");
  const [sgstRate, setSgstRate] = useState("2.50");

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError("");
      setShowConfirm(false);
      setActiveTab("edit");
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
          setCgstRate(s.cgstRate !== undefined ? String(s.cgstRate) : "2.50");
          setSgstRate(s.sgstRate !== undefined ? String(s.sgstRate) : "2.50");
          if (data.versions && Array.isArray(data.versions)) {
            setPastVersions(data.versions);
          }
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
          cgstRate,
          sgstRate,
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
              Invoice Header Settings
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

        {/* Tab switcher: Edit vs History */}
        <div className="flex border-b border-line mt-3">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "edit"
                ? "border-pine text-pine-deep font-bold"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Building2 size={13} />
            <span>Edit Header Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "history"
                ? "border-pine text-pine-deep font-bold"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <History size={13} />
            <span>Version History</span>
            {pastVersions.length > 0 && (
              <span className="rounded-full bg-paper-flat px-1.5 py-0.2 font-mono text-[10px] text-ink-soft border border-line">
                {pastVersions.length}
              </span>
            )}
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
        ) : activeTab === "edit" ? (
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

            {/* Non-Plant Goods Tax Rates Configuration */}
            <div className="rounded-lg border border-line bg-paper/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  Tax Rates (Non-Plant Goods Only)
                </span>
                <span className="text-[10px] font-semibold text-pine bg-pine-tint px-2 py-0.5 rounded-full">
                  Live Plants = 0% Tax Exempt
                </span>
              </div>
              <p className="text-[11px] text-ink-soft leading-tight">
                Live plants are 100% tax-free under GST law. Taxes set below will apply only to non-plant inventory items (e.g. pots, vermicompost, fertilizers, cocopeat, tools).
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                  <span className="font-semibold text-ink">CGST (%)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={cgstRate}
                    onChange={(e) => setCgstRate(e.target.value)}
                    className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm font-mono outline-none focus:border-pine"
                    placeholder="2.50"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                  <span className="font-semibold text-ink">SGST (%)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={sgstRate}
                    onChange={(e) => setSgstRate(e.target.value)}
                    className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm font-mono outline-none focus:border-pine"
                    placeholder="2.50"
                  />
                </label>
              </div>
            </div>

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
        ) : (
          <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {pastVersions.length === 0 ? (
              <p className="py-8 text-center text-xs text-ink-soft">
                No past versions recorded.
              </p>
            ) : (
              pastVersions.map((v) => (
                <div
                  key={v.version}
                  className={`rounded-xl border p-3.5 text-xs transition-all ${
                    v.isCurrent
                      ? "border-pine/50 bg-pine-tint/20 dark:bg-pine-tint/10 shadow-xs"
                      : "border-line bg-paper-flat/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-ink">
                        Version {v.version}
                      </span>
                      {v.isCurrent ? (
                        <span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider">
                          Current Active
                        </span>
                      ) : (
                        <span className="rounded bg-paper border border-line text-ink-soft px-1.5 py-0.2 text-[10px] font-medium">
                          Past Version
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

                  <div className="space-y-1 mb-3 text-[11px] text-ink-soft">
                    <div className="font-semibold text-ink text-sm">{v.businessName}</div>
                    {v.subheading1 && (
                      <div className="italic text-[10px] text-ink-soft/80">{v.subheading1}</div>
                    )}
                    {v.subheading2 && (
                      <div className="italic text-[10px] text-ink-soft/80">{v.subheading2}</div>
                    )}
                    <div className="text-ink-soft/90">{v.address}</div>
                    <div className="flex items-center gap-4 text-[10px] text-ink-soft/80 font-mono mt-1 flex-wrap">
                      {v.gstin && <span>GSTIN: {v.gstin}</span>}
                      {v.mobiles && <span>Mobiles: {v.mobiles}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-line/60 pt-2.5 text-[11px]">
                    <div className="flex items-center gap-2 text-ink-soft">
                      <span>
                        <strong className="font-semibold text-ink">{v.invoiceCount ?? 0}</strong> bill(s)
                      </span>
                      <span>•</span>
                      <span className="font-mono font-semibold text-pine-deep">
                        ₹{Number(v.totalRevenue ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBusinessName(v.businessName || "");
                          setSubheading1(v.subheading1 || "");
                          setSubheading2(v.subheading2 || "");
                          setAddress(v.address || "");
                          setMobiles(v.mobiles || "");
                          setGstin(v.gstin || "");
                          setCgstRate(v.cgstRate !== undefined ? String(v.cgstRate) : "2.50");
                          setSgstRate(v.sgstRate !== undefined ? String(v.sgstRate) : "2.50");
                          setActiveTab("edit");
                        }}
                        className="inline-flex items-center gap-1 rounded border border-line bg-surface px-2 py-1 text-[11px] font-medium text-ink hover:bg-line/40 cursor-pointer shadow-xs"
                        title="Copy details into editor form"
                      >
                        <Copy size={11} />
                        <span>Copy to Form</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          router.push(`/invoices?version=${v.version}`);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-pine-tint px-2 py-1 text-[11px] font-semibold text-pine-deep hover:bg-pine/20 cursor-pointer"
                        title={`Filter invoices created under Version ${v.version}`}
                      >
                        <span>View Bills</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="mt-4 flex justify-end border-t border-line pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-line px-4 py-1.5 text-xs font-medium text-ink-soft hover:bg-line/40 cursor-pointer"
              >
                Close
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
