// src/lib/language-context.tsx

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translateItemName } from "./plant-translations";

export type Language = "en" | "kn";

export interface Translations {
  // Brand & Nursery Header
  brandName: string;
  brandSubtitle: string;
  brandFullName: string;
  subheading1: string;
  subheading2: string;
  nurseryAddress: string;
  mobilesLabel: string;
  gstinLabel: string;
  versionLabel: string;

  // Bill Sheet & Receipt Labels
  billOfSuppliers: string;
  billNo: string;
  date: string;
  time: string;
  toCustomer: string;
  customerDetailsLabel: string;
  paymentMode: string;
  cash: string;
  credit: string;
  onlineUpi: string;
  slNo: string;
  particulars: string;
  rate: string;
  qty: string;
  amount: string;
  total: string;
  totalAmount: string;
  amountInWords: string;
  rsLabel: string;
  digitallySigned: string;
  forNursery: string;
  authorizedSignatory: string;
  proprietor: string;
  termsConditions: string;
  term1: string;
  term2: string;

  // Bill Preview Screen & Action Bar
  backToEdit: string;
  finalizedBillPreview: string;
  billLanguage: string;
  step2Indicator: string;
  saveAsDraft: string;
  saving: string;
  payWithCash: string;
  payOnline: string;
  printBill: string;
  finalizing: string;
  addDigitalSignature: string;
  scanAndPay: string;
  amountToPay: string;

  // Bill Entry Form (Step 1)
  step1Title: string;
  nextPreview: string;
  section1Title: string;
  requiredForReceipt: string;
  customerNameLabel: string;
  customerNamePlaceholder: string;
  customerDetailsPlaceholder: string;
  notesLabel: string;
  notesPlaceholder: string;
  section2Title: string;
  selectFromStock: string;
  searchPlantPlaceholder: string;
  customItemTab: string;
  stockCatalogTab: string;
  customNameLabel: string;
  customPriceLabel: string;
  addToBill: string;
  forceAdd: string;
  proceedToPreview: string;
  emptyItemsNotice: string;
  subtotal: string;
  lineTotal: string;
  actions: string;
  removeItem: string;
  inStock: string;
  outOfStock: string;
  shortage: string;

  // Navigation & Shell
  navNewInvoice: string;
  navInvoices: string;
  navStock: string;
  navGallery: string;
  light: string;
  dark: string;
  loading: string;
  language: string;
  toggleLanguageAria: string;
  switchToEn: string;
  switchToKn: string;
  engLabel: string;
  kanLabel: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Brand & Nursery Header
    brandName: "Sri Vijaya Lakshmi",
    brandSubtitle: "Nursery & Farm",
    brandFullName: "Sri Vijaya Lakshmi Nursery",
    subheading1: "(Approved by Department of Horticulture)",
    subheading2: "(All Kinds of Plants Production and Suppliers)",
    nurseryAddress: "Harige B. H. Road, Shimoga - 577203",
    mobilesLabel: "Mob:",
    gstinLabel: "GSTIN:",
    versionLabel: "Version",

    // Bill Sheet & Receipt Labels
    billOfSuppliers: "BILL OF SUPPLIERS",
    billNo: "No.",
    date: "Date:",
    time: "Time:",
    toCustomer: "To,",
    customerDetailsLabel: "Customer details / Location:",
    paymentMode: "Payment:",
    cash: "CASH",
    credit: "CREDIT",
    onlineUpi: "ONLINE UPI",
    slNo: "Sl. No.",
    particulars: "Particulars / Description of Goods",
    rate: "Rate (₹)",
    qty: "Qty.",
    amount: "Amount (₹)",
    total: "TOTAL",
    totalAmount: "Total Amount:",
    amountInWords: "Amount in words:",
    rsLabel: "Rs",
    digitallySigned: "Digitally Signed",
    forNursery: "For Sri Vijaya Lakshmi Nursery",
    authorizedSignatory: "Authorized Signatory",
    proprietor: "Proprietor",
    termsConditions: "Terms & Conditions",
    term1: "1. Goods once sold cannot be returned or exchanged.",
    term2: "2. Plants are living goods; please inspect upon receipt.",

    // Bill Preview Screen & Action Bar
    backToEdit: "Back to Edit Bill",
    finalizedBillPreview: "Finalized Bill Preview",
    billLanguage: "Bill Language:",
    step2Indicator: "Step 2: Preview & Payment",
    saveAsDraft: "Save draft",
    saving: "Saving…",
    payWithCash: "Pay with Cash",
    payOnline: "Pay with Online",
    printBill: "Print Bill",
    finalizing: "Finalizing…",
    addDigitalSignature: "Add Digital Signature",
    scanAndPay: "Scan & Pay Online",
    amountToPay: "Amount to Pay",

    // Bill Entry Form (Step 1)
    step1Title: "Enter Bill Details & Items",
    nextPreview: "Next: Preview & Payment",
    section1Title: "1. Bill & Customer Details",
    requiredForReceipt: "Required for receipt",
    customerNameLabel: "Customer Name",
    customerNamePlaceholder: "e.g. Ramesh Kumar",
    customerDetailsPlaceholder: "e.g. Harige, Shimoga - 9845012345",
    notesLabel: "Internal Notes (Optional)",
    notesPlaceholder: "e.g. Advance paid via UPI, deliver by Sunday",
    section2Title: "2. Items in Bill",
    selectFromStock: "Select item from stock",
    searchPlantPlaceholder: "Search plant or item…",
    customItemTab: "+ Custom item",
    stockCatalogTab: "From stock",
    customNameLabel: "Item Name / Description",
    customPriceLabel: "Price per unit (₹)",
    addToBill: "Add to bill",
    forceAdd: "Force Add",
    proceedToPreview: "Proceed to Bill Preview",
    emptyItemsNotice: "No items added yet. Pick from stock or enter custom items above.",
    subtotal: "Subtotal:",
    lineTotal: "Line Total (₹)",
    actions: "Actions",
    removeItem: "Remove item",
    inStock: "in stock",
    outOfStock: "out of stock",
    shortage: "Shortage",

    // Navigation & Shell
    navNewInvoice: "New Invoice",
    navInvoices: "Invoices",
    navStock: "Stock",
    navGallery: "Gallery",
    light: "Light",
    dark: "Dark",
    loading: "Loading…",
    language: "Language",
    toggleLanguageAria: "Switch language between English and Kannada",
    switchToEn: "Switch to English",
    switchToKn: "Switch to Kannada (ಕನ್ನಡ)",
    engLabel: "ENG",
    kanLabel: "ಕನ್ನಡ",
  },

  kn: {
    // Brand & Nursery Header
    brandName: "ಶ್ರೀ ವಿಜಯಲಕ್ಷ್ಮಿ",
    brandSubtitle: "ನರ್ಸರಿ ಮತ್ತು ಫಾರ್ಮ್",
    brandFullName: "ಶ್ರೀ ವಿಜಯಲಕ್ಷ್ಮಿ ನರ್ಸರಿ",
    subheading1: "(ತೋಟಗಾರಿಕೆ ಇಲಾಖೆಯಿಂದ ಅನುಮೋದಿಸಲ್ಪಟ್ಟಿದೆ)",
    subheading2: "(ಎಲ್ಲಾ ರೀತಿಯ ಗಿಡಗಳ ಉತ್ಪಾದಕರು ಮತ್ತು ಸರಬರಾಜುದಾರರು)",
    nurseryAddress: "ಹರಿಗೆ ಬಿ. ಹೆಚ್. ರಸ್ತೆ, ಶಿವಮೊಗ್ಗ - 577203",
    mobilesLabel: "ಮೊಬೈಲ್:",
    gstinLabel: "ಜಿಎಸ್‌ಟಿ ಸಂಖ್ಯೆ:",
    versionLabel: "ಆವೃತ್ತಿ",

    // Bill Sheet & Receipt Labels
    billOfSuppliers: "ಪೂರೈಕೆದಾರರ ಬಿಲ್",
    billNo: "ಸಂ.",
    date: "ದಿನಾಂಕ:",
    time: "ಸಮಯ:",
    toCustomer: "ಶ್ರೀ / ಮೆಸರ್ಸ್:",
    customerDetailsLabel: "ವಿಳಾಸ / ಸ್ಥಳ:",
    paymentMode: "ಪಾವತಿ:",
    cash: "ನಗದು",
    credit: "ಉದ್ದರಿ",
    onlineUpi: "ಆನ್‌ಲೈನ್ ಯುಪಿಐ",
    slNo: "ಕ್ರ.ಸಂ.",
    particulars: "ವಿವರಣೆ / ಸರಕುಗಳ ವಿವರ",
    rate: "ದರ (₹)",
    qty: "ಪ್ರಮಾಣ",
    amount: "ಮೊತ್ತ (₹)",
    total: "ಒಟ್ಟು ಮೊತ್ತ",
    totalAmount: "ಒಟ್ಟು ಮೊತ್ತ:",
    amountInWords: "ಮೊತ್ತ ಅಕ್ಷರಗಳಲ್ಲಿ:",
    rsLabel: "ರೂ.",
    digitallySigned: "ಡಿಜಿಟಲ್ ಸಹಿ ಮಾಡಲಾಗಿದೆ",
    forNursery: "ಶ್ರೀ ವಿಜಯಲಕ್ಷ್ಮಿ ನರ್ಸರಿ ಪರವಾಗಿ",
    authorizedSignatory: "ಅಧಿಕೃತ ಸಹಿ",
    proprietor: "ಮಾಲೀಕರು",
    termsConditions: "ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು",
    term1: "೧. ಒಮ್ಮೆ ಮಾರಾಟವಾದ ಸರಕುಗಳನ್ನು ಹಿಂಪಡೆಯಲಾಗುವುದಿಲ್ಲ ಅಥವಾ ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ.",
    term2: "೨. ಸಸ್ಯಗಳು ಜೀವಂತ ವಸ್ತುಗಳಾಗಿವೆ; ಸ್ವೀಕರಿಸಿದ ತಕ್ಷಣ ಪರಿಶೀಲಿಸಿ.",

    // Bill Preview Screen & Action Bar
    backToEdit: "ಬಿಲ್ ತಿದ್ದುಪಡಿಗೆ ಹಿಂತಿರುಗಿ",
    finalizedBillPreview: "ಅಂತಿಮಗೊಂಡ ಬಿಲ್ ಮುನ್ನೋಟ",
    billLanguage: "ಬಿಲ್ ಭಾಷೆ:",
    step2Indicator: "ಹಂತ 2: ಮುನ್ನೋಟ ಮತ್ತು ಪಾವತಿ",
    saveAsDraft: "ಕರಡಾಗಿ ಉಳಿಸಿ",
    saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ…",
    payWithCash: "ನಗದಿನಲ್ಲಿ ಪಾವತಿಸಿ",
    payOnline: "ಆನ್‌ಲೈನ್ ಪಾವತಿ (UPI)",
    printBill: "ಬಿಲ್ ಮುದ್ರಿಸಿ",
    finalizing: "ಅಂತಿಮಗೊಳಿಸಲಾಗುತ್ತಿದೆ…",
    addDigitalSignature: "ಡಿಜಿಟಲ್ ಸಹಿ ಸೇರಿಸಿ",
    scanAndPay: "ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಆನ್‌ಲೈನ್ ಪಾವತಿಸಿ",
    amountToPay: "ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ",

    // Bill Entry Form (Step 1)
    step1Title: "ಬಿಲ್ ವಿವರಗಳು ಮತ್ತು ವಸ್ತುಗಳನ್ನು ನಮೂದಿಸಿ",
    nextPreview: "ಮುಂದಿನದು: ಮುನ್ನೋಟ ಮತ್ತು ಪಾವತಿ",
    section1Title: "1. ಬಿಲ್ ಮತ್ತು ಗ್ರಾಹಕರ ವಿವರಗಳು",
    requiredForReceipt: "ರಶೀದಿಗೆ ಅಗತ್ಯವಿದೆ",
    customerNameLabel: "ಗ್ರಾಹಕರ ಹೆಸರು",
    customerNamePlaceholder: "ಉದಾ: ರಮೇಶ್ ಗೌಡ",
    customerDetailsPlaceholder: "ಉದಾ: ಹರಿಗೆ, ಶಿವಮೊಗ್ಗ - 9845012345",
    notesLabel: "ಆಂತರಿಕ ಟಿಪ್ಪಣಿಗಳು (ಐಚ್ಛಿಕ)",
    notesPlaceholder: "ಉದಾ: ಮುಂಗಡ ಪಾವತಿಸಲಾಗಿದೆ, ಭಾನುವಾರ ತಲುಪಿಸಿ",
    section2Title: "2. ಬಿಲ್‌ನಲ್ಲಿರುವ ವಸ್ತುಗಳು",
    selectFromStock: "ದಾಸ್ತಾನಿನಿಂದ ಸಸ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    searchPlantPlaceholder: "ಸಸ್ಯ ಅಥವಾ ವಸ್ತುವನ್ನು ಹುಡುಕಿ…",
    customItemTab: "+ ಕಸ್ಟಮ್ ವಸ್ತು",
    stockCatalogTab: "ದಾಸ್ತಾನಿನಿಂದ",
    customNameLabel: "ವಸ್ತುವಿನ ಹೆಸರು / ವಿವರಣೆ",
    customPriceLabel: "ಪ್ರತಿ ಯೂನಿಟ್ ದರ (₹)",
    addToBill: "ಬಿಲ್‌ಗೆ ಸೇರಿಸಿ",
    forceAdd: "ಬಲವಂತವಾಗಿ ಸೇರಿಸಿ",
    proceedToPreview: "ಬಿಲ್ ಮುನ್ನೋಟಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ",
    emptyItemsNotice: "ಈ ಬಿಲ್‌ಗೆ ಇನ್ನೂ ಯಾವುದೇ ವಸ್ತುಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ. ಮೇಲಿನಿಂದ ಸಸ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    subtotal: "ಉಪಮೊತ್ತ:",
    lineTotal: "ಒಟ್ಟು (₹)",
    actions: "ಕ್ರಮಗಳು",
    removeItem: "ವಸ್ತು ತೆಗೆದುಹಾಕಿ",
    inStock: "ದಾಸ್ತಾನಿನಲ್ಲಿದೆ",
    outOfStock: "ದಾಸ್ತಾನು ಮುಗಿದಿದೆ",
    shortage: "ಕೊರತೆ",

    // Navigation & Shell
    navNewInvoice: "ಹೊಸ ಬಿಲ್",
    navInvoices: "ಬಿಲ್‌ಗಳು",
    navStock: "ದಾಸ್ತಾನು",
    navGallery: "ಗ್ಯಾಲರಿ",
    light: "ಬೆಳಕು",
    dark: "ಕತ್ತಲೆ",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    language: "ಭಾಷೆ",
    toggleLanguageAria: "ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ ನಡುವೆ ಭಾಷೆ ಬದಲಾಯಿಸಿ",
    switchToEn: "ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಾಯಿಸಿ (English)",
    switchToKn: "ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ",
    engLabel: "ENG",
    kanLabel: "ಕನ್ನಡ",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
  tLang: (key: keyof Translations, lang?: Language) => string;
  translateItem: (name: string, lang?: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "svl_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "kn") {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch {}
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  const toggleLanguage = () => {
    const next: Language = language === "en" ? "kn" : "en";
    setLanguage(next);
  };

  const t = (key: keyof Translations): string => {
    return translations[language][key] ?? translations.en[key] ?? String(key);
  };

  const tLang = (key: keyof Translations, targetLang?: Language): string => {
    const lang = targetLang || language;
    return translations[lang][key] ?? translations.en[key] ?? String(key);
  };

  const translateItem = (name: string, targetLang?: Language): string => {
    return translateItemName(name, targetLang || language);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        tLang,
        translateItem,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
