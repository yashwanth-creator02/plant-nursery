// src/components/InvoiceEditor.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Printer,
  Save,
  FilePlus2,
  Trash2,
  X,
  AlertTriangle,
  Banknote,
  QrCode,
  Check,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Tag,
  IndianRupee,
  Languages,
} from "lucide-react";
import {
  formatMoney,
  numberToIndianWords,
  InvoiceLineItem,
  InvoiceRecord,
  StockItem,
} from "@/lib/types";
import { SmartStockPicker } from "./SmartStockPicker";
import { useAuth } from "@/lib/auth-context";
import { useLanguage, Language } from "@/lib/language-context";
import { PreviewLanguageToggle } from "./LanguageToggle";
import { numberToKannadaWords, translateUnit } from "@/lib/plant-translations";
import { translateOnTheFly } from "@/lib/translator";

const DEFAULT_HEADER = {
  businessName: "SRI VIJAYALAKSHMI NURSERY",
  subheading1: "(Approved by Department of Horticulture)",
  subheading2: "All Kinds of Indoor & Outdoor Plants, Fruit Plants, Landscaping Materials",
  address: "Harige B. H. Road, Shimoga - 577203, Karnataka",
  mobiles: "7353025302, 9448140483, 9606602194",
  gstin: "29ADXPV1295N2Z6",
  discount: 0,
  logoData: null as string | null,
};

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `line-${Date.now()}-${keyCounter}`;
}

export function getInvoicePdfFileName(custName: string, invNum?: string | null): string {
  const cleanCust = (custName || "Customer")
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, " ")
    .trim() || "Customer";
  const cleanNum = (invNum || "Invoice")
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, " ")
    .trim() || "Invoice";
  return `${cleanCust}_${cleanNum}`;
}

function splitBusinessName(name: string) {
  const trimmed = (name || "").trim();
  const match = trimmed.match(/^(.*?)\s+(NURSERY|ನರ್ಸರಿ)$/i);
  if (!match) return { main: trimmed, suffix: "" };
  return { main: match[1].trim(), suffix: match[2] };
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

const INDIAN_MOBILE_RE = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/;

function splitCustomerDetails(details: string) {
  const raw = (details || "").trim();
  const match = raw.match(INDIAN_MOBILE_RE);
  if (!match) return { address: raw, phone: "" };
  const phone = match[0].trim();
  const address = raw
    .replace(match[0], " ")
    .replace(/^[\s,;:/\-]+|[\s,;:/\-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { address, phone };
}

function joinCustomerDetails(address: string, phone: string) {
  const cleanPhone = (phone || "").trim();
  const cleanAddress = (address || "")
    .replace(INDIAN_MOBILE_RE, " ")
    .replace(/^[\s,;:/\-]+|[\s,;:/\-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!cleanPhone) return cleanAddress;
  if (!cleanAddress) return cleanPhone;
  return `${cleanAddress}, ${cleanPhone}`;
}

function InvoiceSprig({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 56C18 44 30 32 56 10" />
      <path d="M18 46C14 35 18 27 27 23C29 33 26 42 18 46Z" />
      <path d="M28 36C25 25 29 17 38 13C40 23 37 32 28 36Z" />
      <path d="M39 25C37 15 41 8 50 4C51 13 48 21 39 25Z" />
      <path d="M15 49C25 50 33 46 38 38C29 36 20 39 15 49Z" />
      <path d="M26 39C35 41 43 37 48 29C39 27 31 30 26 39Z" />
    </svg>
  );
}

function InvoiceCategoryIcon({
  kind,
  className = "",
}: {
  kind: "plants" | "pots" | "soil" | "fertilizers";
  className?: string;
}) {
  if (kind === "plants") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M12 21V11" />
        <path d="M12 13C8 13 5 10 5 6C9 6 12 9 12 13Z" />
        <path d="M12 10C16 10 19 7 19 3C15 3 12 6 12 10Z" />
        <path d="M8 21H16" />
      </svg>
    );
  }
  if (kind === "pots") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M5 10H19L17.5 21H6.5L5 10Z" />
        <path d="M4 10H20" />
        <path d="M9 10C9 7 10 5 12 4C14 5 15 7 15 10" />
      </svg>
    );
  }
  if (kind === "soil") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M3 15C5 12 8 12 10 14C12 16 15 16 17 13C19 11 21 11 21 11" />
        <path d="M3 19C5 16 8 16 10 18C12 20 15 20 17 17C19 15 21 15 21 15" />
        <path d="M8 9C9 6 11 4 14 4C14 7 12 9 9 10" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 3H15L14 8H10L9 3Z" />
      <path d="M8 8H16V21H8V8Z" />
      <path d="M10 12H14" />
      <path d="M10 15H14" />
      <path d="M12 8V21" />
    </svg>
  );
}

function InvoiceCheck({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-[10px] w-[10px] shrink-0 items-center justify-center border border-[var(--invoice-line)] ${
        checked ? "bg-[var(--invoice-ink)] text-white" : "bg-white"
      }`}
      aria-hidden="true"
    >
      {checked ? (
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[8px] w-[8px]">
          <path d="M2.5 6L5 8.5L9.5 3.5" />
        </svg>
      ) : null}
    </span>
  );
}

function InvoiceLeafIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 4C12 4 5 8 5 16C5 18 6 20 6 20C8 14 13 10 19 9" />
      <path d="M6 20C10 18 14 15 16 11" />
    </svg>
  );
}

export function InvoiceEditor({
  initialInvoice,
}: {
  initialInvoice?: InvoiceRecord;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { language, t, tLang, translateItem } = useLanguage();
  const [previewLanguageOverride, setPreviewLanguageOverride] = useState<Language | null>(null);
  const billLanguage: Language = previewLanguageOverride ?? language;
  const isFinal = initialInvoice?.status === "final";

  const [step, setStep] = useState<"edit" | "preview">(isFinal ? "preview" : "edit");
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
  const initialCustomer = splitCustomerDetails(initialInvoice?.customerDetails ?? "");
  const [customerDetails, setCustomerDetails] = useState(initialCustomer.address);
  const [customerPhone, setCustomerPhone] = useState(initialCustomer.phone);
  const [notes, setNotes] = useState(initialInvoice?.notes ?? "");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "CREDIT">("CASH");
  // Invoice version & header snapshot
  let parsedInitialHeader: typeof DEFAULT_HEADER & {
    signature?: string | null;
    isSigned?: boolean;
  } = DEFAULT_HEADER;
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

  const [paymentTag, setPaymentTag] = useState<"cash" | "online">(
    initialInvoice?.paymentMode ?? "cash",
  );
  const [isSigned, setIsSigned] = useState(
    isFinal
      ? (parsedInitialHeader.isSigned ?? true)
      : true,
  );
  const [customSignature, setCustomSignature] = useState<string | null>(
    isFinal && parsedInitialHeader.signature !== undefined
      ? parsedInitialHeader.signature
      : null,
  );

  // QR Payment Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const [items, setItems] = useState<InvoiceLineItem[]>(
    initialInvoice?.items.map((i) => ({
      key: newKey(),
      stockItemId: i.stockItemId,
      name: i.name,
      nameKn: i.nameKn || i.stockItem?.nameKn || null,
      unit: i.unit || i.stockItem?.unit || null,
      price: Number(i.price),
      quantity: i.quantity,
      category: i.category || i.stockItem?.category || "plants",
      gstRate: i.gstRate !== undefined && i.gstRate !== null
        ? Number(i.gstRate)
        : i.stockItem?.gstRate !== undefined && i.stockItem?.gstRate !== null
        ? Number(i.stockItem.gstRate)
        : 0,
    })) ?? [],
  );

  const [stock, setStock] = useState<StockItem[]>([]);
  const [pickerStockId, setPickerStockId] = useState("");
  const [pickerQty, setPickerQty] = useState("1");
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNameKn, setCustomNameKn] = useState("");
  const [isTranslatingCustom, setIsTranslatingCustom] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customCategory, setCustomCategory] = useState<"plants" | "non-plants">("plants");
  const [customGstRate, setCustomGstRate] = useState<string>("0");

  // Step 2 Discount state (supports both % and ₹)
  const initialDiscount = Number(parsedInitialHeader.discount) || 0;
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [discountMoney, setDiscountMoney] = useState<string>(
    initialDiscount > 0 ? String(initialDiscount) : ""
  );

  // Step 2 Billable Amount Highlight Toggle
  const [showBillableHighlight, setShowBillableHighlight] = useState<boolean>(false);

  const [saving, setSaving] = useState<"draft" | "final" | null>(null);
  const [error, setError] = useState("");
  const [pendingShortage, setPendingShortage] = useState<{
    stockItemId: string;
    name: string;
    requestedQty: number;
    availableQty: number;
  } | null>(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [suggestedInvoiceNumber, setSuggestedInvoiceNumber] = useState<string>("");

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
    loadQrCode();
    const handleQrUpdate = () => loadQrCode();
    window.addEventListener("qrCodeUpdated", handleQrUpdate);
    return () => window.removeEventListener("qrCodeUpdated", handleQrUpdate);
  }, []);

  // Fetch current sequence number and sync on updates
  useEffect(() => {
    function fetchSequence() {
      fetch("/api/settings/invoice-sequence")
        .then((r) => r.json())
        .then((d) => {
          if (d.nextInvoiceNumber) {
            setSuggestedInvoiceNumber(d.nextInvoiceNumber);
            if (!initialInvoice && !invoiceId) {
              setInvoiceNumber((prev) => prev || d.nextInvoiceNumber);
            }
          }
        })
        .catch(() => {});
    }

    if (!initialInvoice && !invoiceId) {
      fetchSequence();
    }

    const handleSeqUpdate = () => {
      fetchSequence();
    };
    window.addEventListener("invoiceSequenceUpdated", handleSeqUpdate);

    return () => {
      window.removeEventListener("invoiceSequenceUpdated", handleSeqUpdate);
    };
  }, [initialInvoice, invoiceId]);

  // Restore unsaved draft on initial load for new invoice
  useEffect(() => {
    if (!initialInvoice && !invoiceId) {
      try {
        const savedDraft = localStorage.getItem("svl_invoice_draft_v1");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          const hasContent =
            Boolean(parsed.invoiceNumber?.trim()) ||
            Boolean(parsed.customerName?.trim()) ||
            Boolean(parsed.customerDetails?.trim()) ||
            Boolean(parsed.customerPhone?.trim()) ||
            Boolean(parsed.notes?.trim()) ||
            (Array.isArray(parsed.items) && parsed.items.length > 0) ||
            Boolean(parsed.customName?.trim()) ||
            Boolean(parsed.customPrice?.trim());

          if (hasContent) {
            if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
            if (parsed.customerName !== undefined) setCustomerName(parsed.customerName);
            if (parsed.customerDetails !== undefined || parsed.customerPhone !== undefined) {
              const restoredCustomer =
                parsed.customerPhone !== undefined
                  ? { address: parsed.customerDetails ?? "", phone: parsed.customerPhone }
                  : splitCustomerDetails(parsed.customerDetails ?? "");
              setCustomerDetails(restoredCustomer.address);
              setCustomerPhone(restoredCustomer.phone);
            }
            if (parsed.notes !== undefined) setNotes(parsed.notes);
            if (parsed.paymentMode) setPaymentMode(parsed.paymentMode);
            if (parsed.paymentTag) setPaymentTag(parsed.paymentTag);
            if (parsed.isSigned !== undefined) setIsSigned(parsed.isSigned);
            if (Array.isArray(parsed.items) && parsed.items.length > 0) {
              setItems(parsed.items);
            }
            if (parsed.customName !== undefined) setCustomName(parsed.customName);
            if (parsed.customNameKn !== undefined) setCustomNameKn(parsed.customNameKn);
            if (parsed.customPrice !== undefined) setCustomPrice(parsed.customPrice);
            if (parsed.customQty !== undefined) setCustomQty(parsed.customQty);
            if (parsed.customCategory !== undefined) setCustomCategory(parsed.customCategory);
            if (parsed.customGstRate !== undefined) setCustomGstRate(parsed.customGstRate);
            if (parsed.customMode !== undefined) setCustomMode(parsed.customMode);
            setRestoredDraft(true);
          }
        }
      } catch {}
    }
  }, [initialInvoice, invoiceId]);

  // Auto-dismiss the draft restored banner after a few seconds
  useEffect(() => {
    if (restoredDraft) {
      const timer = setTimeout(() => {
        setRestoredDraft(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [restoredDraft]);

  // Persist draft to localStorage on changes (only for unpersisted invoices)
  useEffect(() => {
    if (initialInvoice || invoiceId || isFinal) return;

    const hasContent =
      Boolean(invoiceNumber?.trim()) ||
      Boolean(customerName.trim()) ||
      Boolean(customerDetails.trim()) ||
      Boolean(customerPhone.trim()) ||
      Boolean(notes.trim()) ||
      items.length > 0 ||
      Boolean(customName.trim()) ||
      Boolean(customNameKn.trim()) ||
      Boolean(customPrice.trim());

    if (hasContent) {
      try {
        localStorage.setItem(
          "svl_invoice_draft_v1",
          JSON.stringify({
            invoiceNumber,
            customerName,
            customerDetails,
            customerPhone,
            notes,
            paymentMode,
            paymentTag,
            isSigned,
            items,
            customName,
            customNameKn,
            customPrice,
            customQty,
            customCategory,
            customGstRate,
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
    invoiceNumber,
    customerName,
    customerDetails,
    customerPhone,
    notes,
    paymentMode,
    isSigned,
    items,
    customName,
    customNameKn,
    customPrice,
    customQty,
    customCategory,
    customGstRate,
    customMode,
    paymentTag,
  ]);

  useEffect(() => {
    // If finalized, signature and header are frozen from snapshot
    if (isFinal) {
      if (parsedInitialHeader.signature !== undefined) {
        setCustomSignature(parsedInitialHeader.signature);
      }
      return;
    }

    // Load custom signature from profile / cloud or localStorage
    const savedSig = user?.signature || localStorage.getItem("svl_digital_signature");
    setCustomSignature(savedSig);

    const handleSigUpdate = () => {
      if (isFinal) return;
      setCustomSignature(user?.signature || localStorage.getItem("svl_digital_signature"));
    };
    window.addEventListener("signatureUpdated", handleSigUpdate);

    // If new unsaved invoice or draft, fetch active business settings
    if (!initialInvoice?.headerSnapshot || initialInvoice.status === "draft") {
      fetch("/api/settings/invoice-details")
        .then((r) => r.json())
        .then((d) => {
          if (d.settings) {
            setHeaderDetails((prev) => ({
              ...prev,
              ...d.settings,
            }));
            if (!initialInvoice) {
              setInvoiceVersion(d.settings.version || 1);
            }
          }
        })
        .catch(() => {});
    }

    const handleLogoUpdate = (e: Event) => {
      if (isFinal) return;
      const customEvent = e as CustomEvent<{ logoData: string | null }>;
      setHeaderDetails((prev) => ({
        ...prev,
        logoData: customEvent.detail?.logoData ?? null,
      }));
    };
    window.addEventListener("nurseryLogoUpdated", handleLogoUpdate as EventListener);

    if (!isFinal) {
      fetch("/api/stock", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setStock(d.items ?? []))
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("signatureUpdated", handleSigUpdate);
      window.removeEventListener("nurseryLogoUpdated", handleLogoUpdate as EventListener);
    };
  }, [isFinal, initialInvoice]);

  const effectiveInvoiceNumber = invoiceNumber || suggestedInvoiceNumber || "Invoice";

  const handlePrint = (overrideNum?: string | null) => {
    const num = overrideNum || invoiceNumber || suggestedInvoiceNumber;
    const pdfName = getInvoicePdfFileName(customerName, num);
    document.title = pdfName;
    window.print();
  };

  useEffect(() => {
    const handleBeforePrint = () => {
      document.title = getInvoicePdfFileName(customerName, effectiveInvoiceNumber);
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [customerName, effectiveInvoiceNumber]);

  useEffect(() => {
    if (step === "preview" || initialInvoice) {
      document.title = getInvoicePdfFileName(customerName, effectiveInvoiceNumber);
    }
    return () => {
      document.title = "Sri Vijayalakshmi Nursery — Invoices & Stock";
    };
  }, [customerName, effectiveInvoiceNumber, step, initialInvoice]);

  // 1. Gross Subtotal
  const grossTotal = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0),
    [items],
  );

  // 2. Discount Calculation (supports % or ₹)
  const discountAmount = useMemo(() => {
    const moneyVal = parseFloat(discountMoney);
    if (!isNaN(moneyVal) && moneyVal > 0) {
      return Math.min(moneyVal, grossTotal);
    }
    const pctVal = parseFloat(discountPercent);
    if (!isNaN(pctVal) && pctVal > 0) {
      return Math.min(Math.round(((grossTotal * pctVal) / 100) * 100) / 100, grossTotal);
    }
    return 0;
  }, [discountMoney, discountPercent, grossTotal]);

  // 3. Item-level Taxes (Live plants are 100% tax exempt 0% GST; Non-plants use their individual GST rates)
  const taxTiers = useMemo(() => {
    // Discount ratio
    const discountFactor = grossTotal > 0 ? (grossTotal - discountAmount) / grossTotal : 1;

    // Group non-plant items with positive GST rates
    const tiersMap = new Map<number, { taxable: number }>();

    for (const item of items) {
      const isPlant = !item.category || item.category === "plants";
      const gst = isPlant ? 0 : Number(item.gstRate || 0);
      if (isPlant || gst <= 0) continue;

      const itemGross = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      const itemTaxable = Math.max(0, itemGross * discountFactor);

      const existing = tiersMap.get(gst) || { taxable: 0 };
      existing.taxable += itemTaxable;
      tiersMap.set(gst, existing);
    }

    const result = Array.from(tiersMap.entries()).map(([gstRate, val]) => {
      const taxable = Math.round(val.taxable * 100) / 100;
      const cgstRate = Math.round((gstRate / 2) * 100) / 100;
      const sgstRate = Math.round((gstRate / 2) * 100) / 100;
      const cgst = Math.round(((taxable * cgstRate) / 100) * 100) / 100;
      const sgst = Math.round(((taxable * sgstRate) / 100) * 100) / 100;
      return {
        gstRate,
        cgstRate,
        sgstRate,
        taxableAmount: taxable,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalTax: Math.round((cgst + sgst) * 100) / 100,
      };
    });

    return result.sort((a, b) => a.gstRate - b.gstRate);
  }, [items, grossTotal, discountAmount]);

  const taxableAmount = useMemo(
    () => taxTiers.reduce((sum, t) => sum + t.taxableAmount, 0),
    [taxTiers]
  );

  const totalTaxAmount = useMemo(
    () => taxTiers.reduce((sum, t) => sum + t.totalTax, 0),
    [taxTiers]
  );

  // 4. Net Final Billable Total
  const finalTotal = useMemo(() => {
    const raw = grossTotal - discountAmount + totalTaxAmount;
    return Math.max(0, Math.round(raw * 100) / 100);
  }, [grossTotal, discountAmount, totalTaxAmount]);

  // Backward-compatible alias for existing total references
  const total = finalTotal;

  function handlePercentChange(val: string) {
    setDiscountPercent(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p >= 0 && grossTotal > 0) {
      const amt = Math.round(((grossTotal * p) / 100) * 100) / 100;
      setDiscountMoney(amt.toString());
    } else if (val === "") {
      setDiscountMoney("");
    }
  }

  function handleMoneyChange(val: string) {
    setDiscountMoney(val);
    const m = parseFloat(val);
    if (!isNaN(m) && m >= 0 && grossTotal > 0) {
      const pct = Math.round(((m / grossTotal) * 100) * 10) / 10;
      setDiscountPercent(pct.toString());
    } else if (val === "") {
      setDiscountPercent("");
    }
  }

  const invoiceDateObj = new Date(initialInvoice?.createdAt ?? Date.now());
  const dateLabel = invoiceDateObj.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const { main: businessMain, suffix: businessSuffix } = splitBusinessName(
    headerDetails.businessName || tLang("brandFullName", billLanguage),
  );
  const tableRowCount = Math.max(10, items.length);
  const isCreditPayment = paymentMode === "CREDIT";
  const isUpiPayment = !isCreditPayment && paymentTag === "online";
  const isCashPayment = !isCreditPayment && paymentTag === "cash";
  const amountInWords =
    finalTotal > 0
      ? billLanguage === "kn"
        ? numberToKannadaWords(finalTotal)
        : numberToIndianWords(finalTotal)
      : "";

  function addStockItem(force = false) {
    const stockItem = stock.find((s) => s.id === pickerStockId);
    if (!stockItem) return;
    const qty = pickerQty === "" ? 1 : Math.max(0, parseInt(pickerQty, 10) || 1);

    // Immediate stock check before adding to bill
    const existingInBill = items.find((i) => i.stockItemId === stockItem.id);
    const currentQtyInBill = existingInBill ? existingInBill.quantity : 0;
    const totalRequested = currentQtyInBill + qty;

    if (!force) {
      const displayName = language === "kn" ? (stockItem.nameKn || translateItem(stockItem.name, "kn")) : stockItem.name;
      if (stockItem.quantity <= 0) {
        setError(
          language === "kn"
            ? `"${displayName}" ಗೆ ಸಾಕಷ್ಟು ದಾಸ್ತಾನು ಇಲ್ಲ: ದಾಸ್ತಾನು ಖಾಲಿಯಾಗಿದೆ (0 ಲಭ್ಯವಿದೆ). ಹಾಗಿದ್ದರೂ ಸೇರಿಸಲು "ಬಲವಂತವಾಗಿ ಸೇರಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.`
            : `Insufficient stock for "${stockItem.name}": Out of stock (0 available). Click "Force Add" to add anyway.`
        );
        setPendingShortage({
          stockItemId: stockItem.id,
          name: stockItem.name,
          requestedQty: qty,
          availableQty: stockItem.quantity,
        });
        return;
      }
      if (totalRequested > stockItem.quantity) {
        setError(
          language === "kn"
            ? `"${displayName}" ಗೆ ಸಾಕಷ್ಟು ದಾಸ್ತಾನು ಇಲ್ಲ: ಒಟ್ಟು ಕೋರಿದ ಪ್ರಮಾಣ (${totalRequested}) ಲಭ್ಯವಿರುವ ದಾಸ್ತಾನನ್ನು (${stockItem.quantity}) ಮೀರಿದೆ. ಹಾಗಿದ್ದರೂ ಸೇರಿಸಲು "ಬಲವಂತವಾಗಿ ಸೇರಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.`
            : `Insufficient stock for "${stockItem.name}": Total requested quantity (${totalRequested}) exceeds available stock (${stockItem.quantity}). Click "Force Add" to add anyway.`
        );
        setPendingShortage({
          stockItemId: stockItem.id,
          name: stockItem.name,
          requestedQty: qty,
          availableQty: stockItem.quantity,
        });
        return;
      }
    }

    setError(""); // Clear error on valid or forced addition
    setPendingShortage(null);
    if (existingInBill) {
      updateItem(existingInBill.key, {
        quantity: totalRequested,
        nameKn: existingInBill.nameKn || stockItem.nameKn || null,
        unit: existingInBill.unit || stockItem.unit || null,
        gstRate: stockItem.category === "plants" ? 0 : (Number(stockItem.gstRate) || 0),
      });
    } else {
      setItems((prev) => [
        ...prev,
        {
          key: newKey(),
          stockItemId: stockItem.id,
          name: stockItem.name,
          nameKn: stockItem.nameKn || null,
          unit: stockItem.unit || "Nos",
          price: Number(stockItem.price) || 0,
          quantity: qty,
          category: stockItem.category || "plants",
          gstRate: stockItem.category === "plants" ? 0 : (Number(stockItem.gstRate) || 0),
        },
      ]);
    }
    setPickerStockId("");
    setPickerQty("1");
  }

  function addCustomItem() {
    const name = customName.trim() || "Item";
    const nameKn = customNameKn.trim() || null;
    const price = customPrice === "" ? 0 : Math.max(0, Number(customPrice) || 0);
    const quantity = customQty === "" ? 1 : Math.max(0, Number(customQty) || 1);
    const rate = customCategory === "plants" ? 0 : Math.max(0, parseFloat(customGstRate) || 0);
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        stockItemId: null,
        name,
        nameKn,
        unit: "Nos",
        price,
        quantity,
        category: customCategory,
        gstRate: rate,
      },
    ]);
    setCustomName("");
    setCustomNameKn("");
    setCustomPrice("");
    setCustomQty("1");
    setCustomCategory("plants");
    setCustomGstRate("0");
    setCustomMode(false);
  }

  function updateItem(key: string, patch: Partial<InvoiceLineItem>) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const updated = { ...i, ...patch };
        if (updated.stockItemId && patch.quantity !== undefined) {
          const s = stock.find((st) => st.id === updated.stockItemId);
          const displayName = language === "kn" ? (updated.nameKn || s?.nameKn || translateItem(updated.name, "kn")) : updated.name;
          if (s && updated.quantity > s.quantity) {
            setError(
              language === "kn"
                ? `ಸೂಚನೆ: "${displayName}" ಪ್ರಮಾಣವು (${updated.quantity}) ಲಭ್ಯವಿರುವ ದಾಸ್ತಾನನ್ನು (${s.quantity}) ಮೀರಿದೆ.`
                : `Notice: Quantity for "${updated.name}" (${updated.quantity}) exceeds available stock (${s.quantity}).`
            );
          } else if (s && updated.quantity <= s.quantity) {
            setError("");
          }
        }
        return updated;
      }),
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
    setStep("edit");
    setInvoiceId(null);
    setInvoiceNumber(null);
    setStatus("draft");
    setCustomerName("");
    setCustomerDetails("");
    setCustomerPhone("");
    setNotes("");
    setItems([]);
    setCustomName("");
    setCustomPrice("");
    setCustomQty("1");
    setCustomCategory("plants");
    setCustomMode(false);
    setDiscountPercent("");
    setDiscountMoney("");
    setShowBillableHighlight(false);
    setError("");
    setRestoredDraft(false);
    try {
      localStorage.removeItem("svl_invoice_draft_v1");
    } catch {}
  }

  function handleProceedToPreview() {
    if (items.length === 0) {
      setError("Please add at least one item to the bill before proceeding to preview.");
      return;
    }
    setError("");
    setStep("preview");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBackToEdit() {
    setError("");
    setStep("edit");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function persist(action: "draft" | "final", selectedPaymentMode?: "cash" | "online") {
    setSaving(action);
    setError("");
    const modeToSave = selectedPaymentMode ?? paymentTag ?? "cash";
    try {
      const hasShortage = items.some((i) => {
        if (!i.stockItemId) return false;
        const s = stock.find((st) => st.id === i.stockItemId);
        return s && (Number(i.quantity) || 0) > s.quantity;
      });

      const payload = {
        invoiceNumber: invoiceNumber?.trim() || undefined,
        customerName: customerName.trim(),
        customerDetails: joinCustomerDetails(customerDetails, customerPhone),
        notes: notes.trim(),
        force: hasShortage,
        paymentMode: modeToSave,
        discount: discountAmount,
        total: finalTotal,
        signature: customSignature,
        isSigned: isSigned,
        items: items.map((i) => ({
          stockItemId: i.stockItemId,
          name: i.name.trim() || "Item",
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 0,
          category: i.category || "plants",
          gstRate: i.category === "plants" ? 0 : (Number(i.gstRate) || 0),
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
      if (saved.paymentMode) {
        setPaymentTag(saved.paymentMode);
      } else if (selectedPaymentMode) {
        setPaymentTag(selectedPaymentMode);
      }
      if (selectedPaymentMode) setPaymentMode("CASH");
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
        setStep("preview");
        const finalNum = saved.invoiceNumber || invoiceNumber || suggestedInvoiceNumber;
        document.title = getInvoicePdfFileName(customerName, finalNum);
        // Direct print from rendered DOM to eliminate blank print bug
        requestAnimationFrame(() => {
          setTimeout(() => {
            handlePrint(finalNum);
          }, 150);
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save invoice");
    } finally {
      setSaving(null);
    }
  }

  const selectedStockItem = stock.find((s) => s.id === pickerStockId);
  const parsedPickerQty = pickerQty === "" ? 1 : Math.max(0, parseInt(pickerQty, 10) || 1);
  const existingInBill = selectedStockItem
    ? items.find((i) => i.stockItemId === selectedStockItem.id)
    : null;
  const currentQtyInBill = existingInBill ? existingInBill.quantity : 0;
  const totalRequestedPicker = currentQtyInBill + parsedPickerQty;
  const hasInsufficientQty = Boolean(
    selectedStockItem &&
      (selectedStockItem.quantity <= 0 || totalRequestedPicker > selectedStockItem.quantity)
  );

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
        <div className="mb-4 flex items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-900 shadow-xs animate-in fade-in duration-200 print:hidden">
          <span>Restored half-filled invoice draft from your browser storage.</span>
          <div className="ml-2 flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={clearDraft}
              className="rounded border border-amber-300 bg-white px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              Discard Draft
            </button>
            <button
              type="button"
              onClick={() => setRestoredDraft(false)}
              className="rounded p-0.5 text-amber-800 hover:bg-amber-200/60 cursor-pointer"
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}      {/* ============================================================ */}
      {/* STEP 1: FORM DATA ENTRY (when step === "edit" and not final) */}
      {/* ============================================================ */}
      {step === "edit" && status !== "final" ? (
        <div className="space-y-5 print:hidden">
          {/* Step Progress Pill */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-line bg-surface text-xs">
            <div className="flex items-center gap-2 font-medium text-pine-deep">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-pine text-surface text-[11px] font-bold">1</span>
              <span>{t("step1Title")}</span>
            </div>
            <div className="text-ink-soft flex items-center gap-1.5 text-[11px]">
              <span>{t("nextPreview")}</span>
              <ChevronRight size={13} />
            </div>
          </div>

          {/* Section 1: Customer & Invoice Details */}
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3.5 flex items-center justify-between">
              <span>{t("section1Title")}</span>
              <span className="text-[11px] font-normal lowercase tracking-normal text-ink-soft/70">{t("requiredForReceipt")}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3.5">
              {/* Invoice Number */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink">{t("billNo")}</span>
                <input
                  value={invoiceNumber || ""}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder={suggestedInvoiceNumber || "e.g. 101"}
                  className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-mono font-bold text-ink outline-none focus:border-pine"
                />
              </label>

              {/* Date */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink">{t("date")}</span>
                <div className="rounded-md border border-line bg-paper-flat px-3 py-2 text-sm font-mono font-medium text-ink">
                  {dateLabel}
                </div>
              </label>

              {/* Payment Type CASH / CREDIT */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink">{t("paymentMode")}</span>
                <div className="flex items-center rounded-md border border-line-strong bg-paper-flat p-0.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("CASH")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                      paymentMode === "CASH"
                        ? "bg-[#1b365d] text-white shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {t("cash")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("CREDIT")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                      paymentMode === "CREDIT"
                        ? "bg-[#1b365d] text-white shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {t("credit")}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Customer Name */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink">{t("customerNameLabel")} ({t("toCustomer").replace(/[,:]/g, "").trim()})</span>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t("customerNamePlaceholder")}
                  className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
                />
              </label>

              {/* Customer Phone */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink">{t("phoneLabel")}</span>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="98450 12345"
                  className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm font-mono text-ink outline-none focus:border-pine"
                />
              </label>

              {/* Customer Address */}
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-medium text-ink">{t("addressLabel")}</span>
                <input
                  value={customerDetails}
                  onChange={(e) => setCustomerDetails(e.target.value)}
                  placeholder={t("customerDetailsPlaceholder")}
                  className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-pine"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Items & Stock Picker */}
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-xs">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                {t("section2Title")} ({items.length})
              </h2>
              {items.length > 0 && (
                <span className="font-mono text-xs font-bold text-pine-deep">
                  {t("subtotal")} ₹ {formatMoney(grossTotal)}
                </span>
              )}
            </div>

            {/* Stock item selector / Custom item */}
            <div className="rounded-lg border border-line bg-paper-flat/50 p-3 mb-4">
              {!customMode ? (
                <div className="flex flex-col gap-2.5">
                  <div className="w-full flex flex-col gap-1">
                    <span className="text-xs font-medium text-ink">{t("selectFromStock")}</span>
                    <SmartStockPicker
                      stock={stock}
                      selectedId={pickerStockId}
                      onSelect={(item) => {
                        setPickerStockId(item?.id || "");
                        if (item) {
                          setTimeout(() => qtyInputRef.current?.focus(), 50);
                        }
                      }}
                      onEnterSubmit={() => addStockItem(hasInsufficientQty)}
                    />
                  </div>

                  <div className="flex items-end gap-2 w-full">
                    <label className="flex flex-col gap-1 w-20 shrink-0">
                      <span className="text-xs font-medium text-ink">{t("qty")}</span>
                      <input
                        ref={qtyInputRef}
                        type="number"
                        min={0}
                        value={pickerQty}
                        onChange={(e) => setPickerQty(e.target.value)}
                        placeholder="1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addStockItem(hasInsufficientQty);
                          }
                        }}
                        className="w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm text-center font-mono font-medium outline-none focus:border-pine h-[38px]"
                      />
                    </label>

                    {hasInsufficientQty ? (
                      <button
                        type="button"
                        onClick={() => addStockItem(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-red-700 shadow-sm cursor-pointer transition-colors whitespace-nowrap h-[38px]"
                        title={`Available in stock: ${selectedStockItem?.quantity ?? 0}. Click to force add.`}
                      >
                        <AlertTriangle size={15} className="text-white shrink-0" />
                        <span>{t("forceAdd")}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addStockItem(false)}
                        disabled={!pickerStockId}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-md bg-pine px-4 py-1.5 text-xs sm:text-sm font-medium text-surface hover:opacity-90 disabled:opacity-50 shadow-sm cursor-pointer whitespace-nowrap h-[38px]"
                      >
                        <Plus size={15} className="shrink-0" />
                        <span>{t("addToBill")}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCustomMode(true)}
                      className="hidden sm:inline-flex items-center rounded-md px-2.5 py-1.5 text-xs sm:text-sm font-medium text-pine-deep hover:underline cursor-pointer whitespace-nowrap h-[38px]"
                    >
                      {t("customItemTab")}
                    </button>
                  </div>

                  {/* Mobile-only subtle toggle link to avoid clutter */}
                  <div className="sm:hidden pt-0.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCustomMode(true)}
                      className="text-xs font-semibold text-pine-deep hover:underline cursor-pointer py-0.5"
                    >
                      {t("customItemTab")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="flex flex-col gap-1 w-full">
                      <span className="text-xs font-medium text-ink">{t("customNameLabel")} (English)</span>
                      <input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Mango Grafted Plant / Red Soil Bag"
                        className="w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine h-[38px]"
                      />
                    </label>

                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-ink">{t("customItemKannadaNameLabel")}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!customName.trim()) return;
                            setIsTranslatingCustom(true);
                            try {
                              const res = await translateOnTheFly(customName.trim(), "kn", "en");
                              if (res) setCustomNameKn(res);
                            } finally {
                              setIsTranslatingCustom(false);
                            }
                          }}
                          disabled={isTranslatingCustom || !customName.trim()}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-pine hover:text-pine-deep disabled:opacity-40 cursor-pointer"
                          title="Translate English name to Kannada"
                        >
                          {isTranslatingCustom ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Languages size={11} />
                          )}
                          <span>{isTranslatingCustom ? t("translating") : (language === "kn" ? "ಅನುವಾದಿಸು" : "Translate")}</span>
                        </button>
                      </div>
                      <input
                        value={customNameKn}
                        onChange={(e) => setCustomNameKn(e.target.value)}
                        placeholder="ಉದಾ: ಮಾವಿನ ಕಸಿ ಗಿಡ / ಕೆಂಪು ಮಣ್ಣಿನ ಚೀಲ"
                        className="w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-pine h-[38px]"
                      />
                    </div>
                  </div>

                  {/* Item Tax Category Selector */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-xs font-semibold text-ink-soft">
                      {language === "kn" ? "ವರ್ಗ:" : "Type:"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCategory("plants");
                        setCustomGstRate("0");
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                        customCategory === "plants"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-surface text-ink-soft border-line hover:bg-line/40"
                      }`}
                    >
                      {t("customItemTypePlant")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomCategory("non-plants")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                        customCategory === "non-plants"
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-surface text-ink-soft border-line hover:bg-line/40"
                      }`}
                    >
                      {t("customItemTypeNonPlant")}
                    </button>
                  </div>

                  {customCategory === "non-plants" && (
                    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-paper-flat p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">
                          {language === "kn" ? "ಜಿಎಸ್‌ಟಿ ದರ (GST %)" : "GST Rate (%)"}
                        </span>
                        <span className="text-[11px] text-ink-soft">
                          {language === "kn" ? "ಅನ್ವಯವಾಗುವ ಜಿಎಸ್‌ಟಿ ಆಯ್ಕೆಮಾಡಿ" : "Statutory non-plant tax tier"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {["0", "5", "12", "18", "28"].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setCustomGstRate(rate)}
                            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer border ${
                              customGstRate === rate
                                ? "bg-pine text-white border-pine shadow-xs"
                                : "bg-surface text-ink border-line hover:bg-line/40"
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                        <div className="relative ml-auto flex items-center w-24">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={customGstRate}
                            onChange={(e) => setCustomGstRate(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded border border-line-strong bg-surface px-2 py-1 text-xs font-mono outline-none focus:border-pine pr-5"
                          />
                          <span className="pointer-events-none absolute right-1.5 text-[11px] font-bold text-ink-soft">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap sm:flex-nowrap items-end gap-2">
                    <label className="flex flex-col gap-1 w-20 shrink-0">
                      <span className="text-xs font-medium text-ink">{t("qty")}</span>
                      <input
                        type="number"
                        min={0}
                        value={customQty}
                        onChange={(e) => setCustomQty(e.target.value)}
                        placeholder="1"
                        className="w-full rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm text-center font-mono outline-none focus:border-pine h-[38px]"
                      />
                    </label>

                    <label className="flex flex-col gap-1 w-28 shrink-0">
                      <span className="text-xs font-medium text-ink">{t("customPriceLabel")}</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm font-mono outline-none focus:border-pine h-[38px]"
                      />
                    </label>

                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <button
                        type="button"
                        onClick={addCustomItem}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-md bg-pine px-4 py-1.5 text-xs sm:text-sm font-medium text-surface hover:opacity-90 shadow-sm cursor-pointer whitespace-nowrap h-[38px]"
                      >
                        <Plus size={15} className="shrink-0" />
                        <span>{t("addToBill")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomMode(false)}
                        className="rounded-md px-2.5 py-1.5 text-xs sm:text-sm font-medium text-ink-soft hover:text-ink cursor-pointer whitespace-nowrap h-[38px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Added Items Table / List */}
            {items.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-line">
                {/* Mobile Card List (sm:hidden) */}
                <div className="sm:hidden divide-y divide-line/60 bg-surface">
                  {items.map((item, idx) => (
                    <div key={item.key} className="p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="font-mono text-xs font-bold text-ink-soft bg-paper-flat px-1.5 py-0.5 rounded shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-ink break-words leading-tight">
                              {language === "kn"
                                ? (item.nameKn || stock.find((s) => s.id === item.stockItemId)?.nameKn || translateItem(item.name, "kn"))
                                : item.name}
                            </div>
                            <div className="text-xs text-ink-soft mt-1">
                              ₹ {formatMoney(item.price)} × {item.quantity} = <strong className="font-mono font-bold text-pine-deep text-sm">₹ {formatMoney(item.price * item.quantity)}</strong>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextCat = item.category === "non-plants" ? "plants" : "non-plants";
                                  const defaultGst = nextCat === "plants" ? 0 : (stock.find((s) => s.id === item.stockItemId)?.gstRate ? Number(stock.find((s) => s.id === item.stockItemId)?.gstRate) : 18);
                                  updateItem(item.key, {
                                    category: nextCat,
                                    gstRate: defaultGst,
                                  });
                                }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                                  item.category === "non-plants"
                                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                }`}
                                title="Click to toggle between Plant (0% GST) and Non-Plant (Taxable)"
                              >
                                {item.category === "non-plants"
                                  ? (language === "kn" ? "ಸಸ್ಯೇತರ (ತೆರಿಗೆ)" : "Non-Plant (Taxable)")
                                  : (language === "kn" ? "ಸಸ್ಯ (0% ಜಿಎಸ್‌ಟಿ ವಿನಾಯಿತಿ)" : "Plant (0% GST)")}
                              </button>

                              {item.category === "non-plants" && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-ink-soft font-medium">GST:</span>
                                  <div className="relative inline-block w-[72px]">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      step="0.01"
                                      value={item.gstRate !== undefined && item.gstRate !== null ? item.gstRate : 0}
                                      onChange={(e) =>
                                        updateItem(item.key, {
                                          gstRate: e.target.value === "" ? 0 : Math.max(0, parseFloat(e.target.value)),
                                        })
                                      }
                                      className="w-full rounded border border-line-strong bg-paper-flat px-1.5 py-0.5 text-right font-mono text-xs text-ink outline-none focus:border-pine pr-4"
                                    />
                                    <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-ink-soft font-bold">
                                      %
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="p-1 rounded text-ink-soft hover:text-rust hover:bg-rust-tint/50 transition-colors shrink-0 cursor-pointer"
                          title={t("removeItem")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-line/40">
                        <label className="flex items-center gap-1.5 text-xs text-ink">
                          <span className="text-ink-soft shrink-0 font-medium">{t("qty")}:</span>
                          <input
                            type="number"
                            min={0}
                            value={item.quantity === 0 ? "0" : item.quantity || ""}
                            onChange={(e) =>
                              updateItem(item.key, {
                                quantity: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                              })
                            }
                            className="w-full rounded border border-line-strong bg-paper-flat px-2 py-1 text-center font-mono font-bold text-sm text-ink outline-none focus:border-pine"
                          />
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-ink">
                          <span className="text-ink-soft shrink-0 font-medium">{t("rate")}:</span>
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
                            className="w-full rounded border border-line-strong bg-paper-flat px-2 py-1 text-right font-mono font-bold text-sm text-ink outline-none focus:border-pine"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-paper-flat border-b border-line text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-10">#</th>
                        <th className="py-2 px-3">{t("particulars")}</th>
                        <th className="py-2 px-2 text-center w-20">{t("qty")}</th>
                        <th className="py-2 px-2 text-right w-24">{t("rate")}</th>
                        <th className="py-2 px-3 text-right w-28">{t("amount")}</th>
                        <th className="py-2 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60 bg-surface">
                      {items.map((item, idx) => (
                        <tr key={item.key} className="hover:bg-paper-flat/40 transition-colors">
                          <td className="py-2 px-2.5 text-center font-mono text-ink-soft font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-medium text-ink">
                            <div className="flex items-center gap-2">
                              <span>
                                {language === "kn"
                                  ? (item.nameKn || stock.find((s) => s.id === item.stockItemId)?.nameKn || translateItem(item.name, "kn"))
                                  : item.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextCat = item.category === "non-plants" ? "plants" : "non-plants";
                                  const defaultGst = nextCat === "plants" ? 0 : (stock.find((s) => s.id === item.stockItemId)?.gstRate ? Number(stock.find((s) => s.id === item.stockItemId)?.gstRate) : 18);
                                  updateItem(item.key, {
                                    category: nextCat,
                                    gstRate: defaultGst,
                                  });
                                }}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer border ${
                                  item.category === "non-plants"
                                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                }`}
                                title="Click to toggle between Plant (0% GST) and Non-Plant (Taxable)"
                              >
                                {item.category === "non-plants"
                                  ? (language === "kn" ? "ಸಸ್ಯೇತರ" : "Non-Plant")
                                  : (language === "kn" ? "ಸಸ್ಯ (0%)" : "Plant (0%)")}
                              </button>

                              {item.category === "non-plants" && (
                                <div className="relative inline-block w-[72px]">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    value={item.gstRate !== undefined && item.gstRate !== null ? item.gstRate : 0}
                                    onChange={(e) =>
                                      updateItem(item.key, {
                                        gstRate: e.target.value === "" ? 0 : Math.max(0, parseFloat(e.target.value)),
                                      })
                                    }
                                    className="w-full rounded border border-line-strong/60 bg-surface px-1 py-0.5 text-right font-mono text-[11px] text-ink outline-none focus:border-pine pr-4"
                                    title="Item statutory GST rate"
                                  />
                                  <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-ink-soft font-bold">
                                    %
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={item.quantity === 0 ? "0" : item.quantity || ""}
                              onChange={(e) =>
                                updateItem(item.key, {
                                  quantity: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                                })
                              }
                              className="w-16 rounded border border-line-strong/60 bg-surface px-1.5 py-1 text-center font-mono font-medium text-ink outline-none focus:border-pine"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
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
                              className="w-20 rounded border border-line-strong/60 bg-surface px-1.5 py-1 text-right font-mono text-ink outline-none focus:border-pine"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-ink tabular">
                            ₹ {formatMoney(item.price * item.quantity)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.key)}
                              className="p-1 rounded text-ink-soft hover:text-rust hover:bg-rust-tint/50 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Running Total Summary Footer */}
                <div className="bg-paper-flat border-t border-line px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-ink-soft">
                    <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                    {grossTotal > 0 && (
                      <span className="ml-2 font-medium italic text-ink-soft/80">
                        ({language === "kn" ? numberToKannadaWords(grossTotal) : numberToIndianWords(grossTotal)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Total:</span>
                    <span className="font-mono text-base sm:text-lg font-extrabold text-pine-deep tabular">
                      ₹ {formatMoney(grossTotal)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-line-strong/60 p-8 text-center text-xs text-ink-soft">
                No items added yet. Search stock plants above or add a custom item to begin building the bill.
              </div>
            )}
          </div>

          {/* Section 3: Notes & Options */}
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
              3. Notes &amp; Signature
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink">Internal Notes (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, delivery notes, vehicle number, etc."
                  rows={2}
                  className="w-full resize-none rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-pine"
                />
              </label>

              <div className="flex flex-col justify-between">
                <span className="text-xs font-medium text-ink">Digital Signature</span>
                <div className="flex items-center justify-between rounded-md border border-line bg-paper-flat p-2.5 mt-1">
                  <div className="text-xs text-ink">
                    <span className="font-semibold block">Proprietor Signature</span>
                    <span className="text-[11px] text-ink-soft">Include on printed invoice</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSigned(!isSigned)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      isSigned
                        ? "bg-[#1b365d] text-white"
                        : "border border-line-strong text-ink-soft hover:bg-line/40"
                    }`}
                  >
                    {isSigned ? "Included" : "None"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1 Error Banner */}
          {error && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-900 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600 shrink-0" />
                <span className="text-red-800">{error}</span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {pendingShortage && (
                  <button
                    type="button"
                    onClick={() => addStockItem(true)}
                    className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 shadow-xs cursor-pointer transition-colors"
                  >
                    Force Add to Bill
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setPendingShortage(null);
                  }}
                  className="text-xs underline font-semibold text-red-700 hover:text-red-900 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Bottom Actions for Step 1 */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => persist("draft")}
              disabled={saving !== null}
              className="flex items-center justify-center gap-1.5 rounded-md border border-line-strong px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-line/50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <Save size={15} />
              {saving === "draft" ? t("saving") : t("saveAsDraft")}
            </button>

            <button
              type="button"
              onClick={handleProceedToPreview}
              className="flex items-center justify-center gap-2 rounded-md bg-pine px-6 py-2.5 text-sm font-semibold text-surface shadow-sm transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap"
            >
              <span>{t("proceedToPreview")}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* STEP 2: BILL PREVIEW & PAYMENT / PRINT                       */
        /* ============================================================ */
        <div>
          {/* Top Bar for Preview Step with Back button */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
            {status !== "final" ? (
              <button
                type="button"
                onClick={handleBackToEdit}
                className="flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs sm:text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-line/50 cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft size={15} />
                <span>{t("backToEdit")}</span>
              </button>
            ) : (
              <div className="text-xs font-semibold text-ink-soft">
                {t("finalizedBillPreview")}
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                <span>{t("total")}:</span>
                <strong className="font-mono text-xs sm:text-sm text-pine-deep font-bold">₹ {formatMoney(finalTotal)}</strong>
              </span>

              {/* Show / Highlight Billable Amount Toggle Button */}
              <button
                type="button"
                onClick={() => setShowBillableHighlight((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                  showBillableHighlight
                    ? "bg-pine text-surface border-pine shadow-xs ring-1 ring-pine/30 font-bold"
                    : "bg-surface text-ink-soft border-line-strong hover:bg-line/40 hover:text-ink"
                }`}
                title="Highlight final billable amount prominently on invoice"
              >
                <IndianRupee size={12} />
                <span>{tLang("billableAmount", billLanguage)}: {showBillableHighlight ? "ON" : "OFF"}</span>
              </button>

              {/* Bill Preview Language Toggle (Overrides Global Language for Preview & Print) */}
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-line">
                <PreviewLanguageToggle
                  currentLang={billLanguage}
                  onLanguageChange={setPreviewLanguageOverride}
                />
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#1b365d] border border-blue-200 text-[11px] font-bold whitespace-nowrap">
                <CheckCircle2 size={12} />
                <span>{billLanguage === "kn" ? "ಹಂತ 2" : "Step 2"}</span>
              </div>
            </div>
          </div>

          {/* Step 2 Discount Section (percentage and money enterable) */}
          {status !== "final" && (
            <div className="mb-4 rounded-xl border border-line bg-surface p-3.5 sm:p-4 shadow-xs print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <Tag size={15} className="text-pine" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    {tLang("discount", billLanguage)}
                  </h3>
                </div>
                {discountAmount > 0 && (
                  <span className="font-mono text-xs font-bold text-rust bg-rust-tint px-2 py-0.5 rounded border border-rust/20">
                    - ₹ {formatMoney(discountAmount)} {billLanguage === "kn" ? "ಅನ್ವಯಿಸಲಾಗಿದೆ" : "applied"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Discount Percentage */}
                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                  <span className="font-semibold text-ink">{tLang("discountPercent", billLanguage)}</span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={discountPercent}
                      onChange={(e) => handlePercentChange(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm font-mono outline-none focus:border-pine pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-soft pointer-events-none">
                      %
                    </span>
                  </div>
                </label>

                {/* Discount Money Amount */}
                <label className="flex flex-col gap-1 text-xs text-ink-soft">
                  <span className="font-semibold text-ink">{tLang("discountAmount", billLanguage)}</span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={grossTotal}
                      step="1"
                      value={discountMoney}
                      onChange={(e) => handleMoneyChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm font-mono outline-none focus:border-pine pl-7"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-soft pointer-events-none">
                      ₹
                    </span>
                  </div>
                </label>
              </div>

              {/* Quick Presets */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-1 border-t border-line/40">
                <span className="text-[11px] text-ink-soft font-medium mr-1">Quick:</span>
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentChange(String(pct))}
                    className="rounded border border-line bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink hover:bg-line/50 cursor-pointer transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleMoneyChange(String(amt))}
                    className="rounded border border-line bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink hover:bg-line/50 cursor-pointer transition-colors"
                  >
                    ₹{amt}
                  </button>
                ))}
                {(discountPercent || discountMoney) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountPercent("");
                      setDiscountMoney("");
                    }}
                    className="rounded border border-rust/30 bg-rust-tint px-2 py-0.5 text-[11px] font-semibold text-rust hover:bg-rust/20 cursor-pointer ml-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Prominent Billable Amount Callout Banner (when enabled by user) */}
          {showBillableHighlight && (
            <div className="mb-4 rounded-xl border-2 border-pine bg-emerald-50 dark:bg-emerald-950/20 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pine text-surface font-bold text-base shadow-xs">
                  ₹
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-pine-deep block">
                    {tLang("billableAmount", billLanguage)}
                  </span>
                  <span className="text-xs text-pine/90 font-medium">
                    {items.length} {items.length === 1 ? "item" : "items"} • {taxableAmount > 0 ? `CGST + SGST applied on non-plants` : `Live Plants 100% Tax Exempt`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl sm:text-3xl font-black text-pine-deep tracking-tight">
                  ₹ {formatMoney(finalTotal)}
                </span>
                {discountAmount > 0 && (
                  <span className="block text-xs text-rust font-semibold">
                    (Saved ₹ {formatMoney(discountAmount)})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mobile horizontal scroll helper indicator */}
          <div className="sm:hidden mb-2 text-center text-[11px] font-medium text-ink-soft print:hidden">
            {billLanguage === "kn" ? "ಸಂಪೂರ್ಣ ಬಿಲ್ ಶೀಟ್ ವೀಕ್ಷಿಸಲು ಸಮತಲವಾಗಿ ಸ್ಕ್ರಾಲ್ ಮಾಡಿ" : "Scroll horizontally to view complete bill sheet"}
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
            {/* ============================================================ */}
            {/* PRINT SHEET: CLASSIC BILL-BOOK LAYOUT                         */}
            {/* ============================================================ */}

            {/* Brand Header: logo left, centered wordmark, script tagline right */}
            <div className="relative flex break-inside-avoid items-start gap-3">
              <div className="flex w-[82px] shrink-0 items-start justify-start pt-1">
                <div
                  id="nursery-logo-placeholder"
                  className="flex h-[70px] w-[70px] items-center justify-center overflow-hidden"
                  title={headerDetails.logoData ? (billLanguage === "kn" ? "ಶ್ರೀ ವಿಜಯಲಕ್ಷ್ಮಿ ನರ್ಸರಿ ಲಾಂಛನ" : "Sri Vijayalakshmi Nursery Logo") : "Botanical logo"}
                >
                  {headerDetails.logoData ? (
                    headerDetails.logoData.trim().startsWith("<svg") ? (
                      <div
                        className="flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full"
                        dangerouslySetInnerHTML={{ __html: headerDetails.logoData }}
                      />
                    ) : (
                      <img
                        src={headerDetails.logoData}
                        alt="Nursery Logo"
                        className="h-full w-full object-contain"
                      />
                    )
                  ) : (
                    <InvoiceSprig className="h-16 w-16 text-[var(--invoice-ink)]" />
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1 text-center">
                <div className="font-serif text-[25px] font-bold uppercase leading-none tracking-[0.06em] text-[var(--invoice-ink)]">
                  {businessMain}
                </div>
                {businessSuffix ? (
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="h-px flex-1 bg-[var(--invoice-line)]" />
                    <span className="whitespace-nowrap pl-[0.28em] font-serif text-[17px] font-semibold uppercase leading-none tracking-[0.28em] text-[var(--invoice-ink)]">
                      {businessSuffix}
                    </span>
                    <span className="h-px flex-1 bg-[var(--invoice-line)]" />
                  </div>
                ) : null}
                <p className="mt-1.5 text-[9.5px] font-semibold leading-tight text-[var(--invoice-ink)]">
                  {billLanguage === "kn" ? tLang("subheading1", "kn") : headerDetails.subheading1}
                </p>
                <p className="text-[9.5px] font-semibold leading-tight text-[var(--invoice-ink)]">
                  {billLanguage === "kn" ? tLang("subheading2", "kn") : headerDetails.subheading2}
                </p>
                <p className="mt-0.5 text-[10px] font-bold leading-tight text-[var(--invoice-ink)]">
                  {billLanguage === "kn" ? tLang("nurseryAddress", "kn") : headerDetails.address}
                </p>
              </div>

              <div className="flex w-[82px] shrink-0 flex-col items-center pt-2 text-center">
                <div
                  className={`text-[11px] font-semibold leading-[1.15] text-[var(--invoice-ink)] ${
                    billLanguage === "en" ? "invoice-script" : "font-serif"
                  }`}
                >
                  {tLang("tagline", billLanguage)}
                </div>
                <InvoiceSprig className="mt-1 h-5 w-14 text-[var(--invoice-ink)]/60" />
              </div>
            </div>

            {/* Category strip */}
            <div className="mt-2.5 grid grid-cols-4 border-y border-[var(--invoice-line)] py-1.5 text-[8.5px] font-semibold leading-tight text-[var(--invoice-ink)]">
              {[
                { kind: "plants" as const, label: "categoryPlants" as const },
                { kind: "pots" as const, label: "categoryPots" as const },
                { kind: "soil" as const, label: "categorySoil" as const },
                { kind: "fertilizers" as const, label: "categoryFertilizers" as const },
              ].map((category, index) => (
                <div
                  key={category.kind}
                  className={`flex items-center justify-center gap-1.5 px-1 ${
                    index < 3 ? "border-r border-[var(--invoice-line)]" : ""
                  }`}
                >
                  <InvoiceCategoryIcon kind={category.kind} className="h-4 w-4 shrink-0" />
                  <span>{tLang(category.label, billLanguage)}</span>
                </div>
              ))}
            </div>

            {/* GSTIN and Mobiles */}
            <div className="mt-1.5 flex items-center justify-between gap-3 border-b border-[var(--invoice-line)] pb-1 text-[9px] font-bold tracking-tight text-[var(--invoice-ink)]">
              <span className="min-w-0 truncate">{tLang("gstinLabel", billLanguage)} {headerDetails.gstin}</span>
              <span className="min-w-0 truncate text-right">{tLang("mobilesLabel", billLanguage)} {headerDetails.mobiles}</span>
            </div>

            {/* Document title */}
            <div className="mt-2 flex justify-center">
              <div className="border border-[var(--invoice-line)] px-10 py-1 font-serif text-[12px] font-bold uppercase tracking-[0.24em] text-[var(--invoice-ink)]">
                {tLang("billInvoiceTitle", billLanguage)}
              </div>
            </div>

            {/* Invoice metadata and payment mode */}
            <div className="mt-2 flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1.5 pt-1 text-[10px] font-semibold text-[var(--invoice-ink)]">
                <div className="flex items-baseline gap-1.5">
                  <span className="w-[38px] shrink-0">{tLang("billNo", billLanguage)}</span>
                  <span>:</span>
                  {status === "final" ? (
                    <span className="flex-1 border-b border-dotted border-[var(--invoice-line)] px-1 font-mono font-bold tracking-wider">
                      {invoiceNumber ?? "—"}
                    </span>
                  ) : (
                    <input
                      value={invoiceNumber || ""}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder={suggestedInvoiceNumber || "Invoice No."}
                      style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                      className="min-w-0 flex-1 border-b border-dotted border-[var(--invoice-line)] bg-transparent px-1 font-mono font-bold tracking-wider text-[var(--invoice-ink)] outline-none placeholder:text-[#1b365d]/50 focus:bg-blue-50/50"
                      title="Invoice number (editable)"
                    />
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="w-[38px] shrink-0">{tLang("date", billLanguage)}</span>
                  <span>:</span>
                  <span className="flex-1 border-b border-dotted border-[var(--invoice-line)] px-1 font-mono font-bold">
                    {dateLabel}
                  </span>
                </div>
              </div>

              <div className="w-[196px] shrink-0 border border-[var(--invoice-line)] p-1.5 text-[var(--invoice-ink)]">
                <p className="border-b border-[var(--invoice-line)] pb-0.5 text-[9px] font-bold uppercase tracking-wide">
                  {tLang("paymentModeTitle", billLanguage)}
                </p>
                <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <InvoiceCheck checked={isCashPayment} />
                    <span>{billLanguage === "en" ? titleCase(tLang("cash", billLanguage)) : tLang("cash", billLanguage)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <InvoiceCheck checked={isUpiPayment} />
                    <span className="capitalize">{tLang("upi", billLanguage)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <InvoiceCheck checked={false} />
                    <span>{tLang("card", billLanguage)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <InvoiceCheck checked={isCreditPayment} />
                    <span>{billLanguage === "en" ? titleCase(tLang("credit", billLanguage)) : tLang("credit", billLanguage)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer block */}
            <div className="mt-2 text-[10px] text-[var(--invoice-ink)]">
              <p className="font-bold">{tLang("toCustomer", billLanguage)}</p>
              <div className="mt-1 space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="w-[96px] shrink-0 font-semibold">{tLang("customerNameLabel", billLanguage)}</span>
                  <span>:</span>
                  {status === "final" ? (
                    <span className="min-h-[16px] flex-1 border-b border-dotted border-[var(--invoice-line)] px-1 font-medium">
                      {customerName || ""}
                    </span>
                  ) : (
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={billLanguage === "kn" ? "ಗ್ರಾಹಕರ ಹೆಸರು" : "Customer name"}
                      style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                      className="min-w-0 flex-1 border-b border-dotted border-[var(--invoice-line)] bg-transparent px-1 py-0.5 font-medium text-[var(--invoice-ink)] outline-none placeholder:text-[#1b365d]/50 focus:bg-blue-50/50"
                    />
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="w-[96px] shrink-0 font-semibold">{tLang("addressLabel", billLanguage)}</span>
                  <span>:</span>
                  {status === "final" ? (
                    <span className="min-h-[16px] flex-1 border-b border-dotted border-[var(--invoice-line)] px-1">
                      {customerDetails || ""}
                    </span>
                  ) : (
                    <input
                      value={customerDetails}
                      onChange={(e) => setCustomerDetails(e.target.value)}
                      placeholder={tLang("customerDetailsPlaceholder", billLanguage)}
                      style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                      className="min-w-0 flex-1 border-b border-dotted border-[var(--invoice-line)] bg-transparent px-1 py-0.5 text-[var(--invoice-ink)] outline-none placeholder:text-[#1b365d]/50 focus:bg-blue-50/50"
                    />
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="w-[96px] shrink-0 font-semibold">{tLang("phoneLabel", billLanguage)}</span>
                  <span>:</span>
                  {status === "final" ? (
                    <span className="min-h-[16px] flex-1 border-b border-dotted border-[var(--invoice-line)] px-1 font-mono">
                      {customerPhone || ""}
                    </span>
                  ) : (
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="98450 12345"
                      style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                      className="min-w-0 flex-1 border-b border-dotted border-[var(--invoice-line)] bg-transparent px-1 py-0.5 font-mono text-[var(--invoice-ink)] outline-none placeholder:text-[#1b365d]/50 focus:bg-blue-50/50"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Line-item table */}
            <div className="mt-2.5 border border-[var(--invoice-line)] text-[var(--invoice-ink)]">
              <div className="grid grid-cols-[36px_minmax(0,1fr)_44px_54px_82px_96px] border-b-2 border-[var(--invoice-line)] bg-[var(--invoice-fill)] text-center text-[9px] font-bold uppercase tracking-wide">
                <div className="flex items-center justify-center border-r border-[var(--invoice-line)] px-1 py-1.5">
                  {tLang("slNo", billLanguage)}
                </div>
                <div className="flex items-center justify-center border-r border-[var(--invoice-line)] px-1.5 py-1.5">
                  {tLang("itemNameDescription", billLanguage)}
                </div>
                <div className="flex items-center justify-center border-r border-[var(--invoice-line)] px-1 py-1.5">
                  {tLang("qty", billLanguage)}
                </div>
                <div className="flex items-center justify-center border-r border-[var(--invoice-line)] px-1 py-1.5">
                  {tLang("unitLabel", billLanguage)}
                </div>
                <div className="flex items-center justify-center border-r border-[var(--invoice-line)] px-1 py-1.5">
                  {tLang("rate", billLanguage)}
                </div>
                <div className="flex items-center justify-center px-1 py-1.5">
                  {tLang("amount", billLanguage)}
                </div>
              </div>

              {Array.from({ length: tableRowCount }).map((_, index) => {
                const item = items[index];
                if (!item) {
                  return (
                    <div
                      key={`blank-row-${index}`}
                      className="grid min-h-[27px] grid-cols-[36px_minmax(0,1fr)_44px_54px_82px_96px] border-b border-[var(--invoice-line)] last:border-b-0"
                    >
                      <div className="border-r border-[var(--invoice-line)]" />
                      <div className="border-r border-[var(--invoice-line)]" />
                      <div className="border-r border-[var(--invoice-line)]" />
                      <div className="border-r border-[var(--invoice-line)]" />
                      <div className="border-r border-[var(--invoice-line)]" />
                      <div />
                    </div>
                  );
                }

                const itemUnit = item.unit || stock.find((s) => s.id === item.stockItemId)?.unit || "Nos";
                const displayUnit = billLanguage === "kn" ? (translateUnit(itemUnit, "kn") || itemUnit) : itemUnit;

                return (
                  <div
                    key={item.key}
                    className="group grid min-h-[27px] grid-cols-[36px_minmax(0,1fr)_44px_54px_82px_96px] break-inside-avoid border-b border-[var(--invoice-line)] text-[9.5px] last:border-b-0"
                  >
                    <div className="flex items-center justify-center border-r border-[var(--invoice-line)] px-1 py-1 font-mono">
                      {index + 1}
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-1 border-r border-[var(--invoice-line)] px-1.5 py-1 font-medium">
                      <span className="min-w-0 break-words">
                        {billLanguage === "kn"
                          ? (item.nameKn || stock.find((s) => s.id === item.stockItemId)?.nameKn || translateItem(item.name, "kn"))
                          : item.name}
                      </span>
                      {status !== "final" && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="shrink-0 p-0.5 text-rust opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100 print:hidden"
                          title={tLang("removeItem", billLanguage)}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-center border-r border-[var(--invoice-line)] px-1 py-1 font-mono">
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
                          style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                          className="w-full bg-transparent text-center font-mono text-[var(--invoice-ink)] outline-none focus:bg-blue-50/70"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-center border-r border-[var(--invoice-line)] px-1 py-1 text-center">
                      {displayUnit}
                    </div>
                    <div className="flex items-center justify-end border-r border-[var(--invoice-line)] px-1.5 py-1 font-mono">
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
                          style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                          className="w-full bg-transparent text-right font-mono text-[var(--invoice-ink)] outline-none focus:bg-blue-50/70"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-end px-1.5 py-1 font-mono font-semibold tabular whitespace-nowrap">
                      {formatMoney(item.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Amount in words and totals */}
            <div className="mt-2.5 flex break-inside-avoid items-start gap-2.5 text-[var(--invoice-ink)]">
              <div className="min-w-0 flex-1 border border-[var(--invoice-line)]">
                <div className="border-b border-[var(--invoice-line)] bg-[var(--invoice-fill)] px-2 py-1 text-[9px] font-bold uppercase tracking-wide">
                  {tLang("amountInWords", billLanguage)}
                </div>
                <div className="min-h-[54px] px-2 py-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="shrink-0 text-[9px] font-bold">{tLang("rsLabel", billLanguage)}</span>
                    <span className="min-h-[14px] flex-1 border-b border-dotted border-[var(--invoice-line)] pb-0.5 text-[9.5px] font-medium leading-snug">
                      {amountInWords || "\u00A0"}
                    </span>
                  </div>
                  {taxableAmount === 0 && (
                    <p className="mt-1 text-[8px] font-normal italic opacity-70">
                      * {tLang("plantsTaxExempt", billLanguage)}
                    </p>
                  )}
                </div>
              </div>

              <div className={`w-[236px] shrink-0 border border-[var(--invoice-line)] text-[9.5px] ${showBillableHighlight ? "ring-2 ring-[var(--invoice-ink)] ring-offset-1" : ""}`}>
                <div className="flex items-center justify-between border-b border-[var(--invoice-line)] px-2 py-1">
                  <span className="font-semibold">{tLang("subtotal", billLanguage)}</span>
                  <span className="font-mono font-semibold tabular whitespace-nowrap">{formatMoney(grossTotal)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--invoice-line)] px-2 py-1">
                  <span className="font-semibold">
                    {tLang("discount", billLanguage)}
                    {discountPercent ? ` (${discountPercent}%)` : ""}
                  </span>
                  <span className="font-mono font-semibold tabular whitespace-nowrap">
                    {discountAmount > 0 ? `- ${formatMoney(discountAmount)}` : formatMoney(0)}
                  </span>
                </div>
                {taxTiers.map((tier) => (
                  <div key={`summary-tier-${tier.gstRate}`}>
                    <div className="flex items-center justify-between border-b border-[var(--invoice-line)] px-2 py-1 text-[8.5px]">
                      <span>{tLang("cgst", billLanguage)} @ {tier.cgstRate}%</span>
                      <span className="font-mono font-semibold tabular whitespace-nowrap">+ {formatMoney(tier.cgstAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--invoice-line)] px-2 py-1 text-[8.5px]">
                      <span>{tLang("sgst", billLanguage)} @ {tier.sgstRate}%</span>
                      <span className="font-mono font-semibold tabular whitespace-nowrap">+ {formatMoney(tier.sgstAmount)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-[var(--invoice-total)] px-2 py-2 text-white">
                  <span className="font-bold uppercase tracking-wide">{tLang("totalAmount", billLanguage)}</span>
                  <span className="whitespace-nowrap font-mono text-[11px] font-bold tabular">₹ {formatMoney(finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Notes and signature */}
            <div className="mt-2.5 flex break-inside-avoid items-start gap-2.5 text-[var(--invoice-ink)]">
              <div className="min-w-0 flex-1 border border-[var(--invoice-line)]">
                <div className="flex items-center gap-1.5 border-b border-[var(--invoice-line)] bg-[var(--invoice-fill)] px-2 py-1">
                  <InvoiceLeafIcon className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wide">{tLang("invoiceNotes", billLanguage)}</span>
                </div>
                <ul className="space-y-0.5 px-2.5 py-1.5 text-[8.5px] leading-snug">
                  {[tLang("term1", billLanguage), tLang("term2", billLanguage), tLang("term3", billLanguage), tLang("term4", billLanguage)].map((term, index) => (
                    <li key={`term-${index}`} className="flex gap-1">
                      <span className="shrink-0">•</span>
                      <span>{term.replace(/^\d+\.\s*/, "")}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-[214px] shrink-0 text-center">
                <div className="mb-1 flex min-h-[16px] items-center justify-center gap-1.5 text-[8px] print:hidden">
                  <span className="font-medium opacity-80">{tLang("digitallySigned", billLanguage)}:</span>
                  {status === "final" ? (
                    <span className="font-bold">
                      {isSigned ? (billLanguage === "kn" ? "ಸೇರಿಸಲಾಗಿದೆ (ಲಾಕ್ ಆಗಿದೆ)" : "Included (Locked)") : (billLanguage === "kn" ? "ಇಲ್ಲ" : "None")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSigned(!isSigned)}
                      className={`cursor-pointer px-1.5 py-0.5 text-[8px] font-semibold transition-colors ${
                        isSigned ? "bg-[var(--invoice-ink)] text-white" : "border border-[var(--invoice-line)] text-[var(--invoice-ink)] hover:bg-blue-50/50"
                      }`}
                    >
                      {isSigned ? (billLanguage === "kn" ? "ಸೇರಿಸಲಾಗಿದೆ" : "Included") : (billLanguage === "kn" ? "ಇಲ್ಲ" : "None")}
                    </button>
                  )}
                </div>

                <div className="flex min-h-[58px] items-end justify-center">
                  {isSigned ? (
                    customSignature && (customSignature.startsWith("data:image") || customSignature.startsWith("http")) ? (
                      <img
                        src={customSignature}
                        alt="Digital signature"
                        className="h-11 max-w-[150px] object-contain"
                      />
                    ) : customSignature && customSignature.startsWith("text:") ? (
                      <div className="py-1 font-serif text-xl font-bold italic text-[var(--invoice-ink)]">
                        {customSignature.replace("text:", "")}
                      </div>
                    ) : (
                      <svg
                        className="h-11 w-36 text-[var(--invoice-ink)]"
                        viewBox="0 0 160 55"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 36 C 22 14, 28 8, 36 24 C 44 40, 52 32, 60 18 C 66 8, 70 26, 76 34 C 82 42, 92 20, 100 16 C 108 12, 114 26, 122 30 C 130 34, 142 16, 150 24" />
                        <path d="M 8 40 Q 50 48, 105 42 T 154 38" strokeWidth="1.6" />
                        <path d="M 28 20 L 22 32" strokeWidth="1.8" />
                        <path d="M 68 16 C 72 12, 78 14, 76 22" strokeWidth="1.5" />
                      </svg>
                    )
                  ) : null}
                </div>

                <div className="mt-1 border-t border-[var(--invoice-line)] pt-1">
                  <p className="text-[9px] font-bold uppercase tracking-wide">{tLang("authorizedSignatory", billLanguage)}</p>
                  <p className="text-[8.5px] font-medium">{tLang("proprietor", billLanguage)}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative mt-3 break-inside-avoid border-t border-[#1b365d]/30 pt-2 text-center text-[var(--invoice-ink)]">
              <InvoiceSprig className="absolute left-0 top-1.5 h-5 w-10 opacity-35" />
              <InvoiceSprig className="absolute right-0 top-1.5 h-5 w-10 scale-x-[-1] opacity-35" />
              <p className={`text-[11px] font-semibold leading-tight ${billLanguage === "en" ? "invoice-script" : "font-serif"}`}>
                {tLang("invoiceFooterNote", billLanguage)}
              </p>
              <p className="mt-0.5 text-[7px] font-normal opacity-50 print:hidden">
                Version {invoiceVersion}
              </p>
            </div>
        </div>
      </div>
    </div>

          {/* Warning or error appears just below the invoice preview */}
          {error && (
            <div className="mt-4 mb-2 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-900 shadow-xs print:hidden">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600 shrink-0" />
                <span className="text-red-800 font-medium">{error}</span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {pendingShortage && (
                  <button
                    type="button"
                    onClick={() => addStockItem(true)}
                    className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 shadow-xs cursor-pointer transition-colors"
                  >
                    Force Add to Bill
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setPendingShortage(null);
                  }}
                  className="text-xs underline font-semibold text-red-700 hover:text-red-900 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Bottom Actions Toolbar in Step 2 */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
            {/* Left Side: Back button & Save as draft */}
            <div className="flex items-center gap-2">
              {status !== "final" && (
                <>
                  <button
                    type="button"
                    onClick={handleBackToEdit}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-md border border-line-strong px-3.5 py-2 text-xs sm:text-sm font-medium text-ink transition-colors hover:bg-line/50 cursor-pointer whitespace-nowrap"
                  >
                    <ArrowLeft size={15} /> {t("backToEdit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => persist("draft")}
                    disabled={saving !== null}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-md border border-line-strong px-3.5 py-2 text-xs sm:text-sm font-medium text-ink transition-colors hover:bg-line/50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Save size={15} />
                    {saving === "draft" ? t("saving") : t("saveAsDraft")}
                  </button>
                </>
              )}
            </div>

            {/* Right Side: Payment & Finalize Action Buttons */}
            <div className="flex items-center gap-2">
              {status !== "final" ? (
                <>
                  <button
                    type="button"
                    onClick={() => persist("final", "cash")}
                    disabled={saving !== null}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-md border border-pine bg-surface px-4 py-2.5 text-xs sm:text-sm font-semibold text-pine-deep shadow-xs transition-colors hover:bg-pine-tint/40 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Banknote size={16} />
                    {saving === "final" && paymentTag === "cash" ? t("finalizing") : t("payWithCash")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      loadQrCode();
                      setQrModalOpen(true);
                    }}
                    disabled={saving !== null}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-md bg-pine px-4 py-2.5 text-xs sm:text-sm font-semibold text-surface shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <QrCode size={16} />
                    {saving === "final" && paymentTag === "online" ? t("finalizing") : t("payOnline")}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handlePrint()}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md bg-pine px-5 py-2.5 text-sm font-medium text-surface shadow-sm transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap"
                >
                  <Printer size={15} /> {t("printBill")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Online Payment QR Code Popup Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs print:hidden">
          <div className="relative w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine-tint text-pine-deep">
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">{t("scanAndPay")}</h3>
                  <p className="text-[11px] text-ink-soft">{t("brandFullName")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="rounded p-1 text-ink-soft hover:bg-line/60 hover:text-ink cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Total Amount Box */}
            <div className="rounded-lg bg-blue-50/70 border border-blue-200/80 p-3 text-center mb-4">
              <div className="text-xs font-semibold text-[#1b365d]/80 uppercase tracking-wide">
                {t("amountToPay")}
              </div>
              <div className="text-2xl font-mono font-extrabold text-[#1b365d] mt-0.5">
                ₹ {formatMoney(total)}
              </div>
              {customerName && (
                <div className="text-xs text-[#1b365d]/75 mt-1 truncate">
                  Customer: <span className="font-semibold text-[#1b365d]">{customerName}</span>
                </div>
              )}
            </div>

            {/* QR Card Container */}
            <div className="flex flex-col items-center justify-center min-h-[220px] rounded-lg border border-line bg-paper-flat/60 p-4">
              {loadingQr ? (
                <div className="flex flex-col items-center gap-2 py-8 text-xs text-ink-soft">
                  <Loader2 size={24} className="animate-spin text-pine" />
                  <span>Loading payment QR…</span>
                </div>
              ) : qrCodeData ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-lg bg-white p-2.5 shadow-sm border border-line">
                    <img
                      src={qrCodeData}
                      alt="UPI Payment QR Code"
                      className="max-h-56 max-w-full object-contain rounded"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-ink-soft text-center">
                    Scan with PhonePe, GPay, Paytm or any UPI app
                  </span>
                </div>
              ) : (
                <div className="text-center py-6 px-3">
                  <QrCode size={36} className="mx-auto text-ink-soft/40 mb-2" />
                  <p className="text-xs font-semibold text-ink">No Payment QR Configured</p>
                  <p className="text-[11px] text-ink-soft mt-1 max-w-[220px]">
                    Admin has not uploaded a payment QR code yet in Admin Settings. You can still confirm payment below.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Action Buttons: Cancel and Done */}
            <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="rounded-md border border-line-strong px-4 py-2 text-xs font-medium text-ink hover:bg-line/50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setQrModalOpen(false);
                  persist("final", "online");
                }}
                disabled={saving !== null}
                className="flex items-center gap-1.5 rounded-md bg-pine px-4 py-2 text-xs font-semibold text-surface shadow-sm hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                <Check size={14} />
                Done (Received &amp; Print)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
