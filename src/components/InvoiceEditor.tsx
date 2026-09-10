// src/components/InvoiceEditor.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Printer, Save, FilePlus2, Trash2, Lock, PenTool, X } from "lucide-react";
import {
  formatMoney,
  numberToIndianWords,
  InvoiceLineItem,
  InvoiceRecord,
  StockItem,
} from "@/lib/types";

const DEFAULT_HEADER = {
  businessName: "SRI VIJAYA LAKSHMI NURSERY",
  subheading1: "(Approved by Department of Horticulture)",
  subheading2: "(All Kinds of Plants Production and Suppliers)",
  address: "Harige B. H. Road, Shimoga - 577203",
  mobiles: "7353025302, 9448140483, 9606602194",
  gstin: "29ADXPV1295N2Z6",
};

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `line-${Date.now()}-${keyCounter}`;
}

export function InvoiceEditor({
  initialInvoice,
}: {
  initialInvoice?: InvoiceRecord;
}) {
  const router = useRouter();
  const isFinal = initialInvoice?.status === "final";

  const [invoiceId, setInvoiceId] = useState(initialInvoice?.id ?? null);
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice?.invoiceNumber ?? null,
  );
  const [status, setStatus] = useState<"draft" | "final">(
    initialInvoice?.status ?? "draft",
  );
  const [customerName, setCustomerName] = useState(
    initialInvoice?.customerName ?? "",
  );
  const [customerDetails, setCustomerDetails] = useState(
    initialInvoice?.customerDetails ?? "",
  );
  const [notes, setNotes] = useState(initialInvoice?.notes ?? "");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "CREDIT">("CASH");
  const [isSigned, setIsSigned] = useState(true);
  const [customSignature, setCustomSignature] = useState<string | null>(null);

  // Invoice version & header snapshot
  let parsedInitialHeader = DEFAULT_HEADER;
  if (initialInvoice?.headerSnapshot) {
    try {
      parsedInitialHeader = {
        ...DEFAULT_HEADER,
        ...JSON.parse(initialInvoice.headerSnapshot),
      };
    } catch {}
  }

  const [invoiceVersion, setInvoiceVersion] = useState<number>(
    initialInvoice?.version ?? 1,
  );
  const [headerDetails, setHeaderDetails] = useState(parsedInitialHeader);

  const [items, setItems] = useState<InvoiceLineItem[]>(
    initialInvoice?.items.map((i) => ({
      key: newKey(),
      stockItemId: i.stockItemId,
      name: i.name,
      price: Number(i.price),
      quantity: i.quantity,
    })) ?? [],
  );

  const [stock, setStock] = useState<StockItem[]>([]);
  const [pickerStockId, setPickerStockId] = useState("");
  const [pickerQty, setPickerQty] = useState("1");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");

  const [saving, setSaving] = useState<"draft" | "final" | null>(null);
  const [error, setError] = useState("");
  const [restoredDraft, setRestoredDraft] = useState(false);

  // Restore unsaved draft on initial load for new invoice
  useEffect(() => {
    if (!initialInvoice && !invoiceId) {
      try {
        const savedDraft = localStorage.getItem("svl_invoice_draft_v1");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          const hasContent =
            Boolean(parsed.customerName?.trim()) ||
            Boolean(parsed.customerDetails?.trim()) ||
            Boolean(parsed.notes?.trim()) ||
            (Array.isArray(parsed.items) && parsed.items.length > 0) ||
            Boolean(parsed.customName?.trim()) ||
            Boolean(parsed.customPrice?.trim());

          if (hasContent) {
            if (parsed.customerName !== undefined) setCustomerName(parsed.customerName);
            if (parsed.customerDetails !== undefined) setCustomerDetails(parsed.customerDetails);
            if (parsed.notes !== undefined) setNotes(parsed.notes);
            if (parsed.paymentMode) setPaymentMode(parsed.paymentMode);
            if (parsed.isSigned !== undefined) setIsSigned(parsed.isSigned);
            if (Array.isArray(parsed.items) && parsed.items.length > 0) {
              setItems(parsed.items);
            }
            if (parsed.customName !== undefined) setCustomName(parsed.customName);
            if (parsed.customPrice !== undefined) setCustomPrice(parsed.customPrice);
            if (parsed.customQty !== undefined) setCustomQty(parsed.customQty);
            if (parsed.customMode !== undefined) setCustomMode(parsed.customMode);
            setRestoredDraft(true);
          }
        }
      } catch {}
    }
  }, [initialInvoice, invoiceId]);

  // Persist draft to localStorage on changes (only for unpersisted invoices)
  useEffect(() => {
    if (initialInvoice || invoiceId || isFinal) return;

    const hasContent =
      Boolean(customerName.trim()) ||
      Boolean(customerDetails.trim()) ||
      Boolean(notes.trim()) ||
      items.length > 0 ||
      Boolean(customName.trim()) ||
      Boolean(customPrice.trim());

    if (hasContent) {
      try {
        localStorage.setItem(
          "svl_invoice_draft_v1",
          JSON.stringify({
            customerName,
            customerDetails,
            notes,
            paymentMode,
            isSigned,
            items,
            customName,
            customPrice,
            customQty,
            customMode,
            savedAt: Date.now(),
          }),
        );
      } catch {}
    }
  }, [
    initialInvoice,
    invoiceId,
    isFinal,
    customerName,
    customerDetails,
    notes,
    paymentMode,
    isSigned,
    items,
    customName,
    customPrice,
    customQty,
    customMode,
  ]);

  useEffect(() => {
    // Load custom signature from profile localStorage
    const savedSig = localStorage.getItem("svl_digital_signature");
    setCustomSignature(savedSig);

    const handleSigUpdate = () => {
      setCustomSignature(localStorage.getItem("svl_digital_signature"));
    };
    window.addEventListener("signatureUpdated", handleSigUpdate);

    // If new unsaved invoice, fetch active business settings
    if (!initialInvoice?.headerSnapshot) {
      fetch("/api/settings/invoice-details")
        .then((r) => r.json())
        .then((d) => {
          if (d.settings) {
            setHeaderDetails(d.settings);
            if (!initialInvoice) {
              setInvoiceVersion(d.settings.version || 1);
            }
          }
        })
        .catch(() => {});
    }

    if (!isFinal) {
      fetch("/api/stock", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setStock(d.items ?? []))
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("signatureUpdated", handleSigUpdate);
    };
  }, [isFinal, initialInvoice]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0),
    [items],
  );

  const dateLabel = new Date(
    initialInvoice?.createdAt ?? Date.now(),
  ).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  function addStockItem() {
    const stockItem = stock.find((s) => s.id === pickerStockId);
    if (!stockItem) return;
    const qty = pickerQty === "" ? 1 : Math.max(0, parseInt(pickerQty, 10) || 1);
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        stockItemId: stockItem.id,
        name: stockItem.name,
        price: Number(stockItem.price) || 0,
        quantity: qty,
      },
    ]);
    setPickerStockId("");
    setPickerQty("1");
  }

  function addCustomItem() {
    const name = customName.trim() || "Item";
    const price = customPrice === "" ? 0 : Math.max(0, Number(customPrice) || 0);
    const quantity = customQty === "" ? 1 : Math.max(0, Number(customQty) || 1);
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        stockItemId: null,
        name,
        price,
        quantity,
      },
    ]);
    setCustomName("");
    setCustomPrice("");
    setCustomQty("1");
    setCustomMode(false);
  }

  function updateItem(key: string, patch: Partial<InvoiceLineItem>) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, ...patch } : i)),
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function clearDraft() {
    try {
      localStorage.removeItem("svl_invoice_draft_v1");
    } catch {}
    resetForm();
  }

  function resetForm() {
    setInvoiceId(null);
    setInvoiceNumber(null);
    setStatus("draft");
    setCustomerName("");
    setCustomerDetails("");
    setNotes("");
    setItems([]);
    setCustomName("");
    setCustomPrice("");
    setCustomQty("1");
    setCustomMode(false);
    setError("");
    setRestoredDraft(false);
    try {
      localStorage.removeItem("svl_invoice_draft_v1");
    } catch {}
  }

  async function persist(action: "draft" | "final") {
    setSaving(action);
    setError("");
    try {
      const payload = {
        customerName: customerName.trim(),
        customerDetails: customerDetails.trim(),
        notes: notes.trim(),
        items: items.map((i) => ({
          stockItemId: i.stockItemId,
          name: i.name.trim() || "Item",
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 0,
        })),
      };

      let res: Response;
      if (invoiceId) {
        res = await fetch(`/api/invoices/${invoiceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            action: action === "final" ? "finalize" : "save",
          }),
        });
      } else {
        res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            status: action === "final" ? "final" : "draft",
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save invoice");

      const saved = data.invoice as InvoiceRecord;
      setInvoiceId(saved.id);
      setInvoiceNumber(saved.invoiceNumber);
      setStatus(saved.status);
      if (saved.version) setInvoiceVersion(saved.version);
      if (saved.headerSnapshot) {
        try {
          setHeaderDetails(JSON.parse(saved.headerSnapshot));
        } catch {}
      }

      // Clear local storage draft upon saving
      try {
        localStorage.removeItem("svl_invoice_draft_v1");
      } catch {}
      setRestoredDraft(false);

      // Update URL without unmounting the component
      window.history.replaceState(null, "", `/invoices/${saved.id}`);

      if (action === "final") {
        // Direct print from rendered DOM to eliminate blank print bug
        requestAnimationFrame(() => {
          setTimeout(() => {
            window.print();
          }, 150);
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save invoice");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-6 py-4 sm:py-8">
      {/* Top Toolbar (screen only) */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-xl font-semibold text-ink">
              {status === "final" ? "Bill of Suppliers" : invoiceId ? "Edit Draft Bill" : "New Bill of Suppliers"}
            </h1>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1b365d] border border-blue-200">
              Version {invoiceVersion}
            </span>
          </div>
          {status === "draft" && (
            <span className="mt-0.5 inline-block rounded-full bg-rust-tint px-2 py-0.5 text-xs font-medium text-rust">
              Draft — not yet finalized
            </span>
          )}
        </div>
        <button
          onClick={() => {
            resetForm();
            router.push("/invoice");
          }}
          className="flex items-center gap-1.5 rounded-md border border-line-strong px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-line/50"
        >
          <FilePlus2 size={15} /> New bill
        </button>
      </div>

      {restoredDraft && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-900 print:hidden">
          <span>Restored half-filled invoice draft from your browser storage.</span>
          <button
            type="button"
            onClick={clearDraft}
            className="ml-3 rounded border border-amber-300 bg-white px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            Discard Draft
          </button>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-rust-tint px-3 py-2 text-sm text-rust print:hidden">
          {error}
        </p>
      )}

      {/* Mobile horizontal scroll helper indicator */}
      <div className="sm:hidden mb-2 text-center text-[11px] font-medium text-ink-soft print:hidden">
        Scroll horizontally to view complete bill sheet
      </div>

      {/* ============================================================ */}
      {/* SCROLLABLE SCAFFOLDING FOR MOBILE & TABLET                   */}
      {/* ============================================================ */}
      <div className="w-full overflow-x-auto pb-4 pt-1 print:overflow-visible print:p-0">
        <div className="min-w-[720px] mx-auto flex justify-center print:min-w-0 print:block">
          <div
            id="invoice-print"
            style={{ colorScheme: "light" }}
            className="w-[720px] shrink-0 rounded-lg border border-slate-300 bg-white p-6 sm:p-7 text-[#1b365d] shadow-md print:w-full print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none print:shrink"
          >
        {/* Top GSTIN & Mobiles Row */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold tracking-tight text-[#1b365d]">
          <span>GSTIN: {headerDetails.gstin}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100/80 text-[#1b365d] border border-blue-200">
              Version {invoiceVersion}
            </span>
            <span>Mob: {headerDetails.mobiles}</span>
          </div>
        </div>

        {/* Nursery Main Title */}
        <h1 className="mt-2 text-center font-serif text-xl sm:text-2xl md:text-[26px] font-extrabold uppercase tracking-wide text-[#1b365d]">
          {headerDetails.businessName}
        </h1>

        {/* Subtitle row with Logo Placeholder */}
        <div className="relative my-2 flex items-center justify-center min-h-[64px]">
          {/* ========================================================================= */}
          {/* LOGO PLACEHOLDER: Swap this container/SVG with your original logo SVG     */}
          {/* ========================================================================= */}
          <div
            id="nursery-logo-placeholder"
            className="sm:absolute left-0 top-1/2 sm:-translate-y-1/2 flex items-center justify-center shrink-0 mb-1 sm:mb-0"
            title="Logo Placeholder — Swap with your original SVG"
          >
            {/* START: NURSERY LOGO SVG PLACEHOLDER */}
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded border border-dashed border-[#1b365d]/50 bg-blue-50/60 text-[#1b365d]">
              <svg
                className="h-8 w-8 opacity-80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2z" />
                <path d="M12 18V9" strokeWidth="2" />
                <path d="M12 13c-2.5 0-4-2-4-4 2 0 4 1.5 4 4z" fill="currentColor" fillOpacity="0.25" />
                <path d="M12 11c2.5 0 4-2 4-4-2 0-4 1.5-4 4z" fill="currentColor" fillOpacity="0.25" />
              </svg>
            </div>
            {/* END: NURSERY LOGO SVG PLACEHOLDER */}
          </div>

          {/* Centered Government Approval & Address Details */}
          <div className="text-center text-[11px] sm:text-xs font-semibold text-[#1b365d] leading-tight px-14 sm:px-16">
            <p>{headerDetails.subheading1}</p>
            <p>{headerDetails.subheading2}</p>
            <p className="font-bold">{headerDetails.address}</p>
          </div>
        </div>

        {/* Document Title: BILL OF SUPPLIERS / CASH/CREDIT */}
        <div className="mt-2 text-center text-[#1b365d]">
          <span className="inline-block border-b border-[#1b365d] pb-0.5 font-bold uppercase tracking-wider text-xs sm:text-sm">
            BILL OF SUPPLIERS
          </span>
          <div className="mt-0.5 text-[11px] sm:text-xs font-bold tracking-wide">
            {status === "final" ? (
              paymentMode === "CASH" ? "CASH" : "CREDIT"
            ) : (
              <span className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode("CASH")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    paymentMode === "CASH" ? "bg-[#1b365d] text-white" : "hover:underline"
                  }`}
                >
                  CASH
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => setPaymentMode("CREDIT")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    paymentMode === "CREDIT" ? "bg-[#1b365d] text-white" : "hover:underline"
                  }`}
                >
                  CREDIT
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Metadata Lines: No. & Date. */}
        <div className="mt-3 flex items-baseline justify-between text-xs sm:text-sm font-semibold text-[#1b365d]">
          <div className="flex items-baseline gap-1.5 flex-1 max-w-[45%]">
            <span className="font-bold">No.</span>
            <span className="flex-1 font-mono font-bold tracking-wider border-b border-dotted border-[#1b365d] px-2 text-xs sm:text-sm text-[#1b365d]">
              {invoiceNumber ?? "—"}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 flex-1 max-w-[45%] justify-end">
            <span className="font-bold">Date.</span>
            <span className="font-mono font-bold border-b border-dotted border-[#1b365d] px-2 text-xs sm:text-sm text-[#1b365d] min-w-[120px] text-center">
              {dateLabel}
            </span>
          </div>
        </div>

        {/* Customer Address Block: "To, ......" */}
        <div className="mt-2 text-xs sm:text-sm text-[#1b365d]">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold shrink-0">To,</span>
            {status === "final" ? (
              <span className="flex-1 border-b border-dotted border-[#1b365d] px-2 font-medium">
                {customerName || "—"}
              </span>
            ) : (
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="flex-1 border-b border-dotted border-[#1b365d] bg-transparent px-2 py-0.5 text-xs sm:text-sm outline-none font-medium placeholder:text-[#1b365d]/40"
              />
            )}
          </div>
          <div className="mt-1 flex items-baseline">
            {status === "final" ? (
              <span className="w-full border-b border-dotted border-[#1b365d] px-2 text-xs font-normal min-h-[22px] block">
                {customerDetails || ""}
              </span>
            ) : (
              <input
                value={customerDetails}
                onChange={(e) => setCustomerDetails(e.target.value)}
                placeholder="Address / Phone number / Location"
                className="w-full border-b border-dotted border-[#1b365d] bg-transparent px-2 py-0.5 text-xs outline-none placeholder:text-[#1b365d]/40"
              />
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* THE TABLE: Rounded corners & continuous vertical blue lines  */}
        {/* ============================================================ */}
        <div className="mt-3 rounded-xl border-2 border-[#1b365d] overflow-hidden bg-white text-[#1b365d]">
          {/* Header Row */}
          <div className="grid grid-cols-[44px_1fr_60px_84px_100px] sm:grid-cols-[48px_1fr_68px_90px_110px] border-b-2 border-[#1b365d] text-center text-[11px] sm:text-xs font-bold bg-white">
            <div className="py-2 px-1 border-r border-[#1b365d] flex items-center justify-center">
              <span>Sl.<br />No.</span>
            </div>
            <div className="py-2 px-2 border-r border-[#1b365d] flex items-center justify-center">
              Particulars
            </div>
            <div className="py-2 px-1 border-r border-[#1b365d] flex items-center justify-center">
              Qty.
            </div>
            <div className="py-2 px-1 border-r border-[#1b365d] flex items-center justify-center">
              Rate
            </div>
            <div className="py-2 px-1 flex items-center justify-center">
              Amount
            </div>
          </div>

          {/* Table Body: Has fixed minimum height so vertical dividing lines run down */}
          <div className="relative min-h-[360px] sm:min-h-[420px] flex flex-col justify-between">
            {/* Continuous Vertical Blue Dividing Lines */}
            <div className="absolute inset-0 grid grid-cols-[44px_1fr_60px_84px_100px] sm:grid-cols-[48px_1fr_68px_90px_110px] pointer-events-none">
              <div className="border-r border-[#1b365d] h-full" />
              <div className="border-r border-[#1b365d] h-full" />
              <div className="border-r border-[#1b365d] h-full" />
              <div className="border-r border-[#1b365d] h-full" />
              <div className="h-full" />
            </div>

            {/* Line Items List */}
            <div className="relative z-10">
              {items.map((item, idx) => (
                <div
                  key={item.key}
                  className="grid grid-cols-[44px_1fr_60px_84px_100px] sm:grid-cols-[48px_1fr_68px_90px_110px] text-xs sm:text-sm border-b border-dotted border-[#1b365d]/40 group items-center"
                >
                  {/* Sl. No. */}
                  <div className="py-1.5 px-1 text-center font-mono font-medium">
                    {idx + 1}
                  </div>

                  {/* Particulars */}
                  <div className="py-1.5 px-2 font-medium flex items-center justify-between">
                    <span className="truncate pr-1">{item.name}</span>
                    {status !== "final" && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="opacity-0 group-hover:opacity-100 text-rust hover:text-red-700 print:hidden p-0.5 shrink-0"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Qty. */}
                  <div className="py-1.5 px-1 text-center font-mono">
                    {status === "final" ? (
                      item.quantity
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={item.quantity === 0 ? "0" : item.quantity || ""}
                        onChange={(e) =>
                          updateItem(item.key, {
                            quantity: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                          })
                        }
                        placeholder="0"
                        className="w-full text-center bg-transparent outline-none focus:bg-blue-50/70 font-mono font-medium"
                      />
                    )}
                  </div>

                  {/* Rate */}
                  <div className="py-1.5 px-1 text-right font-mono pr-2">
                    {status === "final" ? (
                      formatMoney(item.price)
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.price === 0 ? "0" : item.price || ""}
                        onChange={(e) =>
                          updateItem(item.key, {
                            price: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                          })
                        }
                        placeholder="0.00"
                        className="w-full text-right bg-transparent outline-none focus:bg-blue-50/70 font-mono"
                      />
                    )}
                  </div>

                  {/* Amount */}
                  <div className="py-1.5 px-2 text-right font-mono font-semibold tabular">
                    {formatMoney(item.price * item.quantity)}
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="p-8 text-center text-xs sm:text-sm text-[#1b365d]/60 italic print:hidden">
                  No items added yet. Use the selector below to add stock plants or custom items.
                </div>
              )}
            </div>

            {/* Bottom Row: Rs ..... (in words) on left, TOTAL box on right */}
            <div className="relative z-10">
              <div className="grid grid-cols-[44px_1fr_60px_84px_100px] sm:grid-cols-[48px_1fr_68px_90px_110px] border-t-2 border-[#1b365d] bg-white">
                {/* Sl. No. blank space */}
                <div className="border-r border-[#1b365d] py-2" />

                {/* Rs ..................... Amount in words */}
                <div className="border-r border-[#1b365d] px-2 py-2 flex items-baseline text-xs sm:text-sm font-semibold">
                  <span className="font-bold mr-1 shrink-0">Rs</span>
                  <span className="flex-1 border-b border-dotted border-[#1b365d] pb-0.5 text-[11px] sm:text-xs font-normal text-[#1b365d] truncate px-1">
                    {total > 0
                      ? numberToIndianWords(total)
                      : "......................................................................."}
                  </span>
                </div>

                {/* Qty blank space */}
                <div className="border-r border-[#1b365d] py-2" />

                {/* TOTAL box */}
                <div className="border-r border-[#1b365d] py-2 px-1 text-center font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center bg-blue-50/20">
                  TOTAL
                </div>

                {/* Total amount box */}
                <div className="py-2 px-2 text-right font-mono font-extrabold text-sm sm:text-base tabular flex items-center justify-end bg-blue-50/20">
                  {formatMoney(total)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SIGNATURE BLOCK: On-document toggle directly above Proprietor */}
        {/* ============================================================ */}
        <div className="mt-4 text-right text-[#1b365d] pr-2 sm:pr-4">
          <div className="flex items-center justify-between mb-1 print:hidden">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100/70 text-[#1b365d] border border-blue-200">
              Version {invoiceVersion}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-ink-soft">Digital Signature:</span>
              <button
                type="button"
                onClick={() => setIsSigned(!isSigned)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  isSigned
                    ? "bg-[#1b365d] text-white"
                    : "border border-line-strong text-ink-soft hover:bg-line/40"
                }`}
              >
                {isSigned ? "Included" : "None"}
              </button>
            </div>
          </div>

          <p className="font-bold text-xs sm:text-sm tracking-tight">
            For {headerDetails.businessName.includes("NURSERY") ? headerDetails.businessName : "Sri VijayaLakshmi Nursery & Farm"}
          </p>

          <div className="min-h-[56px] sm:min-h-[64px] flex items-center justify-end py-1">
            {isSigned ? (
              <div className="relative group inline-flex flex-col items-center justify-center">
                {customSignature && customSignature.startsWith("data:image") ? (
                  <img
                    src={customSignature}
                    alt="Digital signature"
                    className="h-11 sm:h-12 max-w-[150px] sm:max-w-[170px] object-contain"
                  />
                ) : customSignature && customSignature.startsWith("text:") ? (
                  <div className="font-serif italic font-bold text-xl sm:text-2xl text-[#1b365d] py-1">
                    {customSignature.replace("text:", "")}
                  </div>
                ) : (
                  <svg
                    className="h-11 sm:h-12 w-36 sm:w-40 text-[#1b365d]"
                    viewBox="0 0 160 55"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 36 C 22 14, 28 8, 36 24 C 44 40, 52 32, 60 18 C 66 8, 70 26, 76 34 C 82 42, 92 20, 100 16 C 108 12, 114 26, 122 30 C 130 34, 142 16, 150 24" />
                    <path d="M 8 40 Q 50 48, 105 42 T 154 38" strokeWidth="1.6" />
                    <path d="M 28 20 L 22 32" strokeWidth="1.8" />
                    <path d="M 68 16 C 72 12, 78 14, 76 22" strokeWidth="1.5" />
                  </svg>
                )}
                <span className="text-[9px] font-sans font-semibold tracking-wider text-[#1b365d]/75 uppercase -mt-0.5">
                  Digitally Signed
                </span>
                <button
                  type="button"
                  onClick={() => setIsSigned(false)}
                  className="absolute -top-1 -right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[#1b365d]/30 text-ink-soft hover:text-rust rounded-full p-0.5 text-[10px] print:hidden shadow-xs cursor-pointer"
                  title="Remove digital signature"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSigned(true)}
                className="rounded border border-dashed border-[#1b365d]/40 bg-blue-50/40 px-3 py-1.5 text-xs font-semibold text-[#1b365d] hover:bg-blue-100/60 print:hidden transition-colors cursor-pointer flex items-center gap-1.5"
                title="Click to add digital signature"
              >
                <PenTool size={12} /> Add Digital Signature
              </button>
            )}
          </div>

          <p className="font-bold text-xs sm:text-sm pr-4 sm:pr-6">
            Proprietor
          </p>
        </div>
      </div>
    </div>
  </div>

      {/* ============================================================ */}
      {/* EDITING TOOLBAR: Add from stock / custom line item (screen)  */}
      {/* ============================================================ */}
      {status !== "final" && (
        <div className="mt-5 rounded-lg border border-line bg-surface p-4 shadow-sm print:hidden">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Add Line Items to Bill
          </div>

          {!customMode ? (
            <div className="flex flex-wrap items-end gap-2.5">
              <label className="flex w-full min-w-[200px] sm:w-auto sm:flex-1 flex-col gap-1">
                <span className="text-xs text-ink-soft">Select item from stock</span>
                <select
                  value={pickerStockId}
                  onChange={(e) => setPickerStockId(e.target.value)}
                  className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
                >
                  <option value="">Choose a plant / item…</option>
                  {stock.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — Rs {formatMoney(Number(s.price))} ({s.quantity}{" "}
                      {s.unit || "pcs"} in stock)
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex w-full sm:w-auto items-end gap-2">
                <label className="flex w-20 flex-col gap-1">
                  <span className="text-xs text-ink-soft">Qty (optional)</span>
                  <input
                    type="number"
                    min={0}
                    value={pickerQty}
                    onChange={(e) => setPickerQty(e.target.value)}
                    placeholder="1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addStockItem();
                      }
                    }}
                    className="rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm outline-none focus:border-pine"
                  />
                </label>

                <button
                  type="button"
                  onClick={addStockItem}
                  disabled={!pickerStockId}
                  className="flex items-center gap-1.5 rounded-md bg-pine px-3.5 py-1.5 text-sm font-medium text-surface hover:opacity-90 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  <Plus size={15} /> Add to bill
                </button>

                <button
                  type="button"
                  onClick={() => setCustomMode(true)}
                  className="rounded-md px-2 py-1.5 text-sm font-medium text-pine-deep hover:underline cursor-pointer"
                >
                  + Custom item
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-2.5">
              <label className="flex w-full min-w-[160px] sm:w-auto sm:flex-1 flex-col gap-1">
                <span className="text-xs text-ink-soft">Description (optional)</span>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Item name (optional, defaults to Item)"
                  className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
                />
              </label>

              <div className="flex w-full sm:w-auto items-end gap-2">
                <label className="flex w-16 sm:w-20 flex-col gap-1">
                  <span className="text-xs text-ink-soft">Qty (optional)</span>
                  <input
                    type="number"
                    min={0}
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    placeholder="1"
                    className="rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm outline-none focus:border-pine"
                  />
                </label>

                <label className="flex w-24 flex-col gap-1">
                  <span className="text-xs text-ink-soft">Price Rs (optional)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="0.00"
                    className="rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm outline-none focus:border-pine"
                  />
                </label>

                <button
                  type="button"
                  onClick={addCustomItem}
                  className="flex items-center gap-1.5 rounded-md bg-pine px-3.5 py-1.5 text-sm font-medium text-surface hover:opacity-90 shadow-sm cursor-pointer"
                >
                  <Plus size={15} /> Add
                </button>

                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="rounded-md px-2 py-1.5 text-sm text-ink-soft hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Optional internal notes */}
          <div className="mt-4 pt-3 border-t border-line">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-soft">Internal Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, delivery notes, vehicle number, etc."
                rows={2}
                className="w-full resize-none rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine"
              />
            </label>
          </div>
        </div>
      )}

      {/* Bottom Actions Toolbar (screen only) */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 print:hidden">
        {status !== "final" && (
          <>
            <button
              onClick={() => persist("draft")}
              disabled={saving !== null}
              className="flex items-center gap-1.5 rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/50 disabled:opacity-50 cursor-pointer"
            >
              <Save size={15} />
              {saving === "draft" ? "Saving…" : "Save as draft"}
            </button>

            <button
              onClick={() => persist("final")}
              disabled={saving !== null}
              className="flex items-center gap-1.5 rounded-md bg-pine px-4 py-2 text-sm font-medium text-surface shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <Lock size={15} />
              {saving === "final" ? "Finalizing…" : "Finalize & print bill"}
            </button>
          </>
        )}

        {status === "final" && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-md bg-pine px-5 py-2 text-sm font-medium text-surface shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
          >
            <Printer size={15} /> Print Bill
          </button>
        )}
      </div>
    </div>
  );
}
