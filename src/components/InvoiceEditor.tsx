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
  Lock,
  PenTool,
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
  Percent,
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
import { numberToKannadaWords } from "@/lib/plant-translations";
import { translateOnTheFly } from "@/lib/translator";

const DEFAULT_HEADER = {
  businessName: "SRI VIJAYA LAKSHMI NURSERY",
  subheading1: "(Approved by Department of Horticulture)",
  subheading2: "(All Kinds of Plants Production and Suppliers)",
  address: "Harige B. H. Road, Shimoga - 577203",
  mobiles: "7353025302, 9448140483, 9606602194",
  gstin: "29ADXPV1295N2Z6",
  cgstRate: "2.50",
  sgstRate: "2.50",
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
  const [customerDetails, setCustomerDetails] = useState(
    initialInvoice?.customerDetails ?? "",
  );
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
      price: Number(i.price),
      quantity: i.quantity,
      category: (i as any).category || "plants",
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
            Boolean(parsed.notes?.trim()) ||
            (Array.isArray(parsed.items) && parsed.items.length > 0) ||
            Boolean(parsed.customName?.trim()) ||
            Boolean(parsed.customPrice?.trim());

          if (hasContent) {
            if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
            if (parsed.customerName !== undefined) setCustomerName(parsed.customerName);
            if (parsed.customerDetails !== undefined) setCustomerDetails(parsed.customerDetails);
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
            notes,
            paymentMode,
            paymentTag,
            isSigned,
            items,
            customName,
            customNameKn,
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
    invoiceNumber,
    customerName,
    customerDetails,
    notes,
    paymentMode,
    isSigned,
    items,
    customName,
    customNameKn,
    customPrice,
    customQty,
    customMode,
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
      document.title = "Sri Vijaya Lakshmi Nursery — Invoices & Stock";
    };
  }, [customerName, effectiveInvoiceNumber, step, initialInvoice]);

  // 1. Gross Subtotals
  const plantsSubtotal = useMemo(
    () =>
      items
        .filter((i) => !i.category || i.category === "plants")
        .reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0),
    [items],
  );

  const nonPlantsSubtotal = useMemo(
    () =>
      items
        .filter((i) => i.category && i.category !== "plants")
        .reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0),
    [items],
  );

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

  // Discount proportion applied to non-plants
  const discountOnNonPlants = useMemo(() => {
    if (grossTotal <= 0 || nonPlantsSubtotal <= 0 || discountAmount <= 0) return 0;
    return (discountAmount * nonPlantsSubtotal) / grossTotal;
  }, [discountAmount, grossTotal, nonPlantsSubtotal]);

  // 3. Taxes (Exclusive to non-plant goods; live plants are 100% tax exempt)
  const taxableAmount = Math.max(0, nonPlantsSubtotal - discountOnNonPlants);

  const cgstRateNum = parseFloat(String(headerDetails.cgstRate ?? "2.50")) || 0;
  const sgstRateNum = parseFloat(String(headerDetails.sgstRate ?? "2.50")) || 0;

  const cgstAmount = useMemo(() => {
    if (taxableAmount <= 0 || cgstRateNum <= 0) return 0;
    return Math.round(((taxableAmount * cgstRateNum) / 100) * 100) / 100;
  }, [taxableAmount, cgstRateNum]);

  const sgstAmount = useMemo(() => {
    if (taxableAmount <= 0 || sgstRateNum <= 0) return 0;
    return Math.round(((taxableAmount * sgstRateNum) / 100) * 100) / 100;
  }, [taxableAmount, sgstRateNum]);

  // 4. Net Final Billable Total
  const finalTotal = useMemo(() => {
    const raw = grossTotal - discountAmount + cgstAmount + sgstAmount;
    return Math.max(0, Math.round(raw * 100) / 100);
  }, [grossTotal, discountAmount, cgstAmount, sgstAmount]);

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
  const timeLabel = invoiceDateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

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
      });
    } else {
      setItems((prev) => [
        ...prev,
        {
          key: newKey(),
          stockItemId: stockItem.id,
          name: stockItem.name,
          nameKn: stockItem.nameKn || null,
          price: Number(stockItem.price) || 0,
          quantity: qty,
          category: stockItem.category || "plants",
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
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        stockItemId: null,
        name,
        nameKn,
        price,
        quantity,
        category: customCategory,
      },
    ]);
    setCustomName("");
    setCustomNameKn("");
    setCustomPrice("");
    setCustomQty("1");
    setCustomCategory("plants");
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
        customerDetails: customerDetails.trim(),
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

              {/* Customer Details / Address / Phone */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink">{t("customerDetailsLabel")}</span>
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
                          <span>{isTranslatingCustom ? t("translating") : (language === "kn" ? "ಅನುವಾದಿಸು 🔄" : "Translate 🔄")}</span>
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
                      onClick={() => setCustomCategory("plants")}
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
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(item.key, {
                                    category: item.category === "non-plants" ? "plants" : "non-plants",
                                  })
                                }
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                                  item.category === "non-plants"
                                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                }`}
                                title="Click to toggle between Plant (0% GST) and Non-Plant (Taxable)"
                              >
                                {item.category === "non-plants"
                                  ? (language === "kn" ? "📦 ಸಸ್ಯೇತರ (ತೆರಿಗೆ)" : "📦 Non-Plant (Taxable)")
                                  : (language === "kn" ? "🌱 ಸಸ್ಯ (0% ಜಿಎಸ್‌ಟಿ)" : "🌱 Plant (0% GST)")}
                              </button>
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
                                onClick={() =>
                                  updateItem(item.key, {
                                    category: item.category === "non-plants" ? "plants" : "non-plants",
                                  })
                                }
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer border ${
                                  item.category === "non-plants"
                                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                }`}
                                title="Click to toggle between Plant (0% GST) and Non-Plant (Taxable)"
                              >
                                {item.category === "non-plants"
                                  ? (language === "kn" ? "📦 ಸಸ್ಯೇತರ" : "📦 Non-Plant")
                                  : (language === "kn" ? "🌱 ಸಸ್ಯ (0%)" : "🌱 Plant (0%)")}
                              </button>
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
            {/* Top GSTIN & Mobiles Row (Clean contact info without big version badge) */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold tracking-tight text-[#1b365d]">
              <span>{tLang("gstinLabel", billLanguage)} {headerDetails.gstin}</span>
              <span>{tLang("mobilesLabel", billLanguage)} {headerDetails.mobiles}</span>
            </div>

            {/* Nursery Logo placed right on top of business name, centered */}
            <div className="mt-3 mb-1.5 flex items-center justify-center">
              <div
                id="nursery-logo-placeholder"
                className="flex items-center justify-center shrink-0"
                title={headerDetails.logoData ? (billLanguage === "kn" ? "ಶ್ರೀ ವಿಜಯಲಕ್ಷ್ಮಿ ನರ್ಸರಿ ಲಾಂಛನ" : "Sri Vijaya Lakshmi Nursery Logo") : "Logo Placeholder"}
              >
                {headerDetails.logoData ? (
                  headerDetails.logoData.trim().startsWith("<svg") ? (
                    <div
                      className="h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:w-auto [&>svg]:h-auto object-contain text-[#1b365d]"
                      dangerouslySetInnerHTML={{ __html: headerDetails.logoData }}
                    />
                  ) : (
                    <img
                      src={headerDetails.logoData}
                      alt="Nursery Logo"
                      className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
                    />
                  )
                ) : (
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded border border-dashed border-[#1b365d]/50 bg-blue-50/60 text-[#1b365d]">
                    <svg
                      className="h-7 w-7 opacity-80"
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
                )}
              </div>
            </div>

            {/* Nursery Main Title */}
            <h1 className="text-center font-serif text-xl sm:text-2xl md:text-[26px] font-extrabold uppercase tracking-wide text-[#1b365d]">
              {billLanguage === "kn"
                ? (tLang("brandFullName", "kn") || "ಶ್ರೀ ವಿಜಯಲಕ್ಷ್ಮಿ ನರ್ಸರಿ")
                : headerDetails.businessName}
            </h1>

            {/* Centered Government Approval & Address Details */}
            <div className="text-center text-[11px] sm:text-xs font-semibold text-[#1b365d] leading-tight px-14 sm:px-16 my-1.5">
              <p>{billLanguage === "kn" ? tLang("subheading1", "kn") : headerDetails.subheading1}</p>
              <p>{billLanguage === "kn" ? tLang("subheading2", "kn") : headerDetails.subheading2}</p>
              <p className="font-bold">{billLanguage === "kn" ? tLang("nurseryAddress", "kn") : headerDetails.address}</p>
            </div>

            {/* Document Title: BILL OF SUPPLIERS / CASH/CREDIT */}
            <div className="mt-2 text-center text-[#1b365d]">
              <span className="inline-block border-b border-[#1b365d] pb-0.5 font-bold uppercase tracking-wider text-xs sm:text-sm">
                {tLang("billOfSuppliers", billLanguage)}
              </span>
              <div className="mt-0.5 text-[11px] sm:text-xs font-bold tracking-wide">
                {status === "final" ? (
                  paymentMode === "CASH" ? tLang("cash", billLanguage) : tLang("credit", billLanguage)
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode("CASH")}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        paymentMode === "CASH" ? "bg-[#1b365d] text-white" : "hover:underline"
                      }`}
                    >
                      {tLang("cash", billLanguage)}
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => setPaymentMode("CREDIT")}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        paymentMode === "CREDIT" ? "bg-[#1b365d] text-white" : "hover:underline"
                      }`}
                    >
                      {tLang("credit", billLanguage)}
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Metadata Lines: No. & Date. */}
            <div className="mt-3 flex items-baseline justify-between text-xs sm:text-sm font-semibold text-[#1b365d]">
              <div className="flex items-baseline gap-1.5 flex-1 max-w-[45%]">
                <span className="font-bold">{tLang("billNo", billLanguage)}</span>
                {status === "final" ? (
                  <span className="flex-1 font-mono font-bold tracking-wider border-b border-dotted border-[#1b365d] px-2 text-xs sm:text-sm text-[#1b365d]">
                    {invoiceNumber ?? "—"}
                  </span>
                ) : (
                  <input
                    value={invoiceNumber || ""}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder={suggestedInvoiceNumber || "Invoice No."}
                    style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                    className="flex-1 font-mono font-bold tracking-wider border-b border-dotted border-[#1b365d] bg-transparent px-2 text-xs sm:text-sm text-[#1b365d] outline-none placeholder:text-[#1b365d]/50 focus:bg-blue-50/50"
                    title="Invoice number (editable)"
                  />
                )}
              </div>
              <div className="flex items-baseline gap-1.5 flex-1 max-w-[50%] justify-end">
                <span className="font-bold">{tLang("date", billLanguage)}</span>
                <span className="font-mono font-bold border-b border-dotted border-[#1b365d] px-2 text-xs sm:text-sm text-[#1b365d] min-w-[120px] text-right">
                  {dateLabel} <span className="text-[10px] sm:text-xs font-normal text-[#1b365d]/85 font-sans whitespace-nowrap ml-1">{timeLabel}</span>
                </span>
              </div>
            </div>

            {/* Customer Address Block: "To, ......" */}
            <div className="mt-2 text-xs sm:text-sm text-[#1b365d]">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold shrink-0">{tLang("toCustomer", billLanguage)}</span>
                {status === "final" ? (
                  <span className="flex-1 border-b border-dotted border-[#1b365d] px-2 font-medium">
                    {customerName || "—"}
                  </span>
                ) : (
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={billLanguage === "kn" ? "ಗ್ರಾಹಕರ ಹೆಸರು" : "Customer name"}
                    style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                    className="flex-1 border-b border-dotted border-[#1b365d] bg-transparent px-2 py-0.5 text-xs sm:text-sm outline-none font-medium text-[#1b365d] placeholder:text-[#1b365d]/50"
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
                    placeholder={billLanguage === "kn" ? "ವಿಳಾಸ / ಫೋನ್ ಸಂಖ್ಯೆ / ಸ್ಥಳ" : "Address / Phone number / Location"}
                    style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                    className="w-full border-b border-dotted border-[#1b365d] bg-transparent px-2 py-0.5 text-xs outline-none text-[#1b365d] placeholder:text-[#1b365d]/50"
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
                  <span>{billLanguage === "kn" ? "ಕ್ರ.ಸಂ." : <>Sl.<br />No.</>}</span>
                </div>
                <div className="py-2 px-2 border-r border-[#1b365d] flex items-center justify-center">
                  {tLang("particulars", billLanguage)}
                </div>
                <div className="py-2 px-1 border-r border-[#1b365d] flex items-center justify-center">
                  {tLang("qty", billLanguage)}
                </div>
                <div className="py-2 px-1 border-r border-[#1b365d] flex items-center justify-center">
                  {tLang("rate", billLanguage)}
                </div>
                <div className="py-2 px-1 flex items-center justify-center">
                  {tLang("amount", billLanguage)}
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
                        <span className="truncate pr-1">
                          {billLanguage === "kn"
                            ? (item.nameKn || stock.find((s) => s.id === item.stockItemId)?.nameKn || translateItem(item.name, "kn"))
                            : item.name}
                        </span>
                        {status !== "final" && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="opacity-0 group-hover:opacity-100 text-rust hover:text-red-700 print:hidden p-0.5 shrink-0"
                            title={tLang("removeItem", billLanguage)}
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
                            style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                            className="w-full text-center bg-transparent outline-none focus:bg-blue-50/70 font-mono font-medium text-[#1b365d]"
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
                            style={{ color: "#1b365d", WebkitTextFillColor: "#1b365d" }}
                            className="w-full text-right bg-transparent outline-none focus:bg-blue-50/70 font-mono text-[#1b365d]"
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
                      {tLang("emptyItemsNotice", billLanguage)}
                    </div>
                  )}
                </div>

                {/* Bottom Calculation Rows */}
                <div className="relative z-10">
                  {/* If discount or non-plant taxes exist, show Subtotal row */}
                  {(discountAmount > 0 || taxableAmount > 0) && (
                    <div className="grid grid-cols-[44px_1fr_60px_84px_100px] sm:grid-cols-[48px_1fr_68px_90px_110px] border-t-2 border-[#1b365d] bg-white text-xs">
                      <div className="border-r border-[#1b365d] py-1.5" />
                      <div className="border-r border-[#1b365d] px-2 py-1.5 font-semibold text-[#1b365d]">
                        {tLang("subtotal", billLanguage)}
                      </div>
                      <div className="border-r border-[#1b365d] py-1.5" />
                      <div className="border-r border-[#1b365d] py-1.5 px-1 text-center font-bold text-xs uppercase bg-blue-50/10">
                        {tLang("subtotal", billLanguage)}
                      </div>
                      <div className="py-1.5 px-2 text-right font-mono font-bold text-xs sm:text-sm tabular bg-blue-50/10">
                        {formatMoney(grossTotal)}
                      </div>
                    </div>
                  )}

                  {/* Discount Row (if discount applied) */}
                  {discountAmount > 0 && (
                    <div className="grid grid-cols-[44px_1fr_60px_84px_100px] sm:grid-cols-[48px_1fr_68px_90px_110px] border-t border-[#1b365d]/40 bg-white text-xs">
                      <div className="border-r border-[#1b365d] py-1.5" />
                      <div className="border-r border-[#1b365d] px-2 py-1.5 font-medium text-[#1b365d] flex items-center justify-between">
                        <span>{tLang("discount", billLanguage)} {discountPercent ? `(${discountPercent}%)` : ""}</span>
                      </div>
                      <div className="border-r border-[#1b365d] py-1.5" />
                      <div className="border-r border-[#1b365d] py-1.5 px-1 text-center font-bold text-xs uppercase text-rust">
                        {tLang("discount", billLanguage)}
                      </div>
                      <div className="py-1.5 px-2 text-right font-mono font-bold text-xs sm:text-sm tabular text-rust">
                        - {formatMoney(discountAmount)}
                      </div>
                    </div>
                  )}

                  {/* CGST & SGST Rows (applied strictly to non-plants) */}
                  {taxableAmount > 0 && (
                    <>
                      {/* CGST */}
                      <div className="grid grid-cols-[44px_1fr_60px_84px_100px] sm:grid-cols-[48px_1fr_68px_90px_110px] border-t border-[#1b365d]/40 bg-white text-xs">
                        <div className="border-r border-[#1b365d] py-1.5" />
                        <div className="border-r border-[#1b365d] px-2 py-1.5 text-[10px] sm:text-xs text-[#1b365d]">
                          <span>{tLang("cgst", billLanguage)} @ {cgstRateNum}% ({billLanguage === "kn" ? "ಸಸ್ಯೇತರ ಸರಕುಗಳ ಮೇಲೆ" : "on non-plants"} ₹{formatMoney(taxableAmount)})</span>
                        </div>
                        <div className="border-r border-[#1b365d] py-1.5" />
                        <div className="border-r border-[#1b365d] py-1.5 px-1 text-center font-bold text-[11px] uppercase">
                          CGST
                        </div>
                        <div className="py-1.5 px-2 text-right font-mono font-semibold text-xs sm:text-sm tabular">
                          + {formatMoney(cgstAmount)}
                        </div>
                      </div>

                      {/* SGST */}
                      <div className="grid grid-cols-[44px_1fr_60px_84px_100px] sm:grid-cols-[48px_1fr_68px_90px_110px] border-t border-[#1b365d]/40 bg-white text-xs">
                        <div className="border-r border-[#1b365d] py-1.5" />
                        <div className="border-r border-[#1b365d] px-2 py-1.5 text-[10px] sm:text-xs text-[#1b365d]">
                          <span>{tLang("sgst", billLanguage)} @ {sgstRateNum}% ({billLanguage === "kn" ? "ಸಸ್ಯೇತರ ಸರಕುಗಳ ಮೇಲೆ" : "on non-plants"} ₹{formatMoney(taxableAmount)})</span>
                        </div>
                        <div className="border-r border-[#1b365d] py-1.5" />
                        <div className="border-r border-[#1b365d] py-1.5 px-1 text-center font-bold text-[11px] uppercase">
                          SGST
                        </div>
                        <div className="py-1.5 px-2 text-right font-mono font-semibold text-xs sm:text-sm tabular">
                          + {formatMoney(sgstAmount)}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Final TOTAL Row */}
                  <div className={`grid grid-cols-[44px_1fr_60px_84px_100px] sm:grid-cols-[48px_1fr_68px_90px_110px] ${discountAmount > 0 || taxableAmount > 0 ? "border-t border-[#1b365d]" : "border-t-2 border-[#1b365d]"} ${showBillableHighlight ? "bg-emerald-50/40" : "bg-white"}`}>
                    {/* Sl. No. blank space */}
                    <div className="border-r border-[#1b365d] py-2" />

                    {/* Rs ..................... Amount in words */}
                    <div className="border-r border-[#1b365d] px-2 py-2 flex flex-col justify-center text-xs sm:text-sm font-semibold">
                      <div className="flex items-baseline">
                        <span className="font-bold mr-1 shrink-0">{tLang("rsLabel", billLanguage)}</span>
                        <span className="flex-1 border-b border-dotted border-[#1b365d] pb-0.5 text-[11px] sm:text-xs font-normal text-[#1b365d] truncate px-1">
                          {finalTotal > 0
                            ? (billLanguage === "kn" ? numberToKannadaWords(finalTotal) : numberToIndianWords(finalTotal))
                            : "......................................................................."}
                        </span>
                      </div>
                      {taxableAmount === 0 && (
                        <span className="text-[9px] text-[#1b365d]/60 font-normal italic mt-0.5">
                          * {tLang("plantsTaxExempt", billLanguage)}
                        </span>
                      )}
                    </div>

                    {/* Qty blank space */}
                    <div className="border-r border-[#1b365d] py-2" />

                    {/* TOTAL box */}
                    <div className={`border-r border-[#1b365d] py-2 px-1 text-center font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center ${showBillableHighlight ? "bg-emerald-100 text-emerald-950 font-black" : "bg-blue-50/20"}`}>
                      {tLang("total", billLanguage)}
                    </div>

                    {/* Total amount box */}
                    <div className={`py-2 px-2 text-right font-mono font-extrabold text-sm sm:text-base tabular flex items-center justify-end ${showBillableHighlight ? "bg-emerald-100 text-emerald-950 font-black" : "bg-blue-50/20"}`}>
                      {formatMoney(finalTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* BOTTOM SECTION: Payment Mode Tag on Left, Signature on Right */}
            {/* ============================================================ */}
            <div className="mt-4 flex items-end justify-between text-[#1b365d] px-2 sm:px-4">
              {/* Bottom Left: Payment Mode Tag */}
              <div className="flex flex-col items-start gap-1 pb-1">
                <div className="inline-flex items-center gap-1.5 rounded border border-[#1b365d]/50 bg-blue-50/50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1b365d]">
                  <span className="text-[10px] font-medium text-[#1b365d]/75">{tLang("paymentMode", billLanguage)}</span>
                  <span className="font-extrabold">
                    {billLanguage === "kn"
                      ? (paymentTag === "cash" ? tLang("cash", "kn") : tLang("onlineUpi", "kn"))
                      : paymentTag.toUpperCase()}
                  </span>
                </div>
                {status === "draft" && (
                  <span className="text-[10px] text-[#1b365d]/70 print:hidden">
                    {billLanguage === "kn" ? "(ಅಂತಿಮಗೊಳಿಸಲು ಕೆಳಗಿನ 'ನಗದು' ಅಥವಾ 'ಆನ್‌ಲೈನ್' ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ)" : "(Click 'Pay with Cash' or 'Pay Online' below to finalize)"}
                  </span>
                )}
              </div>

              {/* Bottom Right: Signature Block */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1 print:hidden">
                  <span className="text-[11px] font-medium text-[#1b365d]/80">{tLang("digitallySigned", billLanguage)}:</span>
                  {status === "final" ? (
                    <span className="text-[11px] font-bold text-[#1b365d]">
                      {isSigned ? (billLanguage === "kn" ? "ಸೇರಿಸಲಾಗಿದೆ (ಲಾಕ್ ಆಗಿದೆ)" : "Included (Locked)") : (billLanguage === "kn" ? "ಇಲ್ಲ" : "None")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSigned(!isSigned)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        isSigned
                          ? "bg-[#1b365d] text-white"
                          : "border border-[#1b365d]/30 text-[#1b365d] hover:bg-blue-50/50"
                      }`}
                    >
                      {isSigned ? (billLanguage === "kn" ? "ಸೇರಿಸಲಾಗಿದೆ" : "Included") : (billLanguage === "kn" ? "ಇಲ್ಲ" : "None")}
                    </button>
                  )}
                </div>

                <p className="font-bold text-xs sm:text-sm tracking-tight">
                  {billLanguage === "kn"
                    ? tLang("forNursery", "kn")
                    : `For ${headerDetails.businessName.includes("NURSERY") ? headerDetails.businessName : "Sri VijayaLakshmi Nursery & Farm"}`}
                </p>

              <div className="min-h-[56px] sm:min-h-[64px] flex items-center justify-end py-1">
                {isSigned ? (
                  <div className="relative group inline-flex flex-col items-center justify-center">
                    {customSignature && (customSignature.startsWith("data:image") || customSignature.startsWith("http")) ? (
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
                      {tLang("digitallySigned", billLanguage)}
                    </span>
                    {status !== "final" && (
                      <button
                        type="button"
                        onClick={() => setIsSigned(false)}
                        className="absolute -top-1 -right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[#1b365d]/30 text-[#1b365d]/70 hover:text-rust rounded-full p-0.5 text-[10px] print:hidden shadow-xs cursor-pointer"
                        title="Remove digital signature"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ) : (
                  status !== "final" ? (
                    <button
                      type="button"
                      onClick={() => setIsSigned(true)}
                      className="rounded border border-dashed border-[#1b365d]/40 bg-blue-50/40 px-3 py-1.5 text-xs font-semibold text-[#1b365d] hover:bg-blue-100/60 print:hidden transition-colors cursor-pointer flex items-center gap-1.5"
                      title={tLang("addDigitalSignature", billLanguage)}
                    >
                      <PenTool size={12} /> {tLang("addDigitalSignature", billLanguage)}
                    </button>
                  ) : null
                )}
              </div>

              <p className="font-bold text-xs sm:text-sm pr-4 sm:pr-6">
                {tLang("proprietor", billLanguage)}
              </p>
            </div>
          </div>

          {/* Thank you note */}
          <div className="mt-3.5 pt-1.5 text-center text-xs sm:text-sm font-serif font-bold italic tracking-wide text-[#1b365d]/90">
            ~ {tLang("thankYouNote", billLanguage)} ~
          </div>

          {/* Footer: Left-aligned Disclaimers + Bottom-Left Watermark */}
          <div className="mt-2.5 pt-2 border-t border-dotted border-[#1b365d]/30 flex items-end justify-between px-1 sm:px-2">
            <div className="flex items-baseline gap-2.5">
              {/* Subtle Watermark Version Number in bottom left corner */}
              <span
                className="font-mono font-extrabold text-sm sm:text-base text-[#1b365d]/30 select-none tracking-tight shrink-0"
                title={`Invoice Version ${invoiceVersion}`}
              >
                #{invoiceVersion}
              </span>
              {/* Disclaimers formatted to the left */}
              <div className="text-[10px] text-[#1b365d]/75 space-y-0.5 text-left leading-tight">
                <p>{tLang("term1", billLanguage)}</p>
                <p>{tLang("term2", billLanguage)}</p>
              </div>
            </div>
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
