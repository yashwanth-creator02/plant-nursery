// src/lib/language-context.tsx

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  translateItemName,
  translateCategory,
  translateSubcategory,
  translateUnit,
} from "./plant-translations";

export {
  translateItemName,
  translateCategory,
  translateSubcategory,
  translateUnit,
};
export const translateItem = (name: string, targetLang: Language = "kn"): string => {
  return translateItemName(name, targetLang);
};

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
  thankYouNote: string;
  cgst: string;
  sgst: string;
  discount: string;
  discountPercent: string;
  discountAmount: string;
  taxableAmount: string;
  plantsTaxExempt: string;
  showBillableAmount: string;
  billableAmount: string;

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

  // Login Page
  loginTitle: string;
  loginSubtitle: string;
  usernameLabel: string;
  passwordLabel: string;
  signInButton: string;
  signingIn: string;
  loginAdminHelp: string;
  showPasswordAria: string;
  hidePasswordAria: string;

  // Sales Analytics
  salesAnalyticsTitle: string;
  salesAnalyticsSubtitle: string;
  filterToday: string;
  filterYesterday: string;
  filterThisWeek: string;
  filterThisMonth: string;
  filterLastMonth: string;
  filterQuarterly: string;
  filterHalfYearly: string;
  filterByMonth: string;
  filterByYear: string;
  filterSpecificDate: string;
  filterCustomRange: string;
  filterAllTime: string;
  quarterLabel: string;
  yearLabel: string;
  halfYearLabel: string;
  monthLabel: string;
  fromDateLabel: string;
  toDateLabel: string;
  staffFilterLabel: string;
  allStaffOption: string;
  allModesLabel: string;
  onlineUpiLabel: string;
  cashOfflineLabel: string;
  keyStatsTitle: string;
  billsBadge: string;
  financialTotalsSubtitle: string;
  visualizeDataBtn: string;
  hideChartsBtn: string;
  totalSalesMetric: string;
  onlineUpiMetric: string;
  cashOfflineMetric: string;
  avgBillValueMetric: string;
  finalizedBillsSuffix: string;
  onlineBillsSuffix: string;
  cashBillsSuffix: string;
  avgTransactionSizeSubtitle: string;
  visualStatsTitle: string;
  visualStatsSubtitle: string;
  revenueModeBtn: string;
  billCountModeBtn: string;
  timelineTitleHourly: string;
  timelineTitle7Day: string;
  timelineTitleDaily: string;
  timelineTitleMonthly: string;
  timelineTitleGeneric: string;
  hoverBarsHint: string;
  paymentSplitTitle: string;
  ticketDistributionTitle: string;
  staffContributionTitle: string;
  staffMembersActiveSuffix: string;
  invoicesBreakdownTitle: string;
  searchInvoicesPlaceholder: string;
  loadingSalesData: string;
  noSalesFoundTitle: string;
  noSalesFoundSubtitle: string;
  colInvoiceNo: string;
  colCustomer: string;
  colDateTime: string;
  colPaymentMode: string;
  colBilledBy: string;
  colAmount: string;
  colAction: string;
  viewInvoiceBtn: string;
  exportCsvBtn: string;
  walkInCustomer: string;

  // Profile & Admin Panel
  profileTitleAdmin: string;
  profileTitleStaff: string;
  tabProfile: string;
  tabAdmin: string;
  digitalSignatureSection: string;
  createSignatureBtn: string;
  editSignatureBtn: string;
  resetSignatureBtn: string;
  defaultSignatureNote: string;
  salesAnalyticsSection: string;
  salesAnalyticsAdminDesc: string;
  salesAnalyticsStaffDesc: string;
  todayTotalSalesLabel: string;
  viewFullSalesAnalyticsBtn: string;
  invoiceSeriesSection: string;
  invoiceSeriesDesc: string;
  nextSeriesLabel: string;
  setCustomInvoiceNumberBtn: string;
  logoutBtn: string;
  nurserySalesAnalyticsTitle: string;
  nurserySalesAnalyticsDesc: string;
  openSalesAnalyticsBtn: string;
  taxRatesTitle: string;
  taxRatesDesc: string;
  cgstRateLabel: string;
  sgstRateLabel: string;
  saveTaxRatesBtn: string;
  savingTaxRatesBtn: string;
  taxRatesSuccessMsg: string;
  taxRatesErrorMsg: string;
  invoiceDetailsHeaderTitle: string;
  invoiceDetailsHeaderDesc: string;
  editInvoiceHeaderBtn: string;
  versionHistoryTitle: string;
  currentActiveBadge: string;
  pastVersionBadge: string;
  viewBillsBtn: string;
  paymentQrTitle: string;
  paymentQrDesc: string;
  uploadQrPrompt: string;
  changeQrBtn: string;
  removeQrBtn: string;
  nurseryLogoTitle: string;
  nurseryLogoDesc: string;
  uploadLogoPrompt: string;
  changeLogoBtn: string;
  resetLogoBtn: string;
  activeLogoNote: string;
  manageUsersTitle: string;
  addUserBtn: string;
  addingUserBtn: string;
  usernameCol: string;
  roleCol: string;
  actionsCol: string;
  adminRole: string;
  staffRole: string;
  removeUserBtn: string;
  dangerZoneTitle: string;
  deleteAllInvoicesBtn: string;
  deleteAllInvoicesDesc: string;
  deletingInvoicesBtn: string;

  // Modals & Line Items
  customItemKannadaNameLabel: string;
  translating: string;
  translateToKannada: string;
  customItemTypePlant: string;
  customItemTypeNonPlant: string;
  customInvoiceModalTitle: string;
  customInvoiceModalDesc: string;
  seriesPreviewLabel: string;
  saveInvoiceSeriesBtn: string;
  signatureModalTitle: string;
  tabDraw: string;
  tabType: string;
  clearSignatureBtn: string;
  saveSignatureBtn: string;
  typeSignaturePlaceholder: string;
  exportDataModalTitle: string;
  exportZipBtn: string;
  exportFolderBtn: string;
  invoiceNotFoundMsg: string;
  backToInvoicesBtn: string;
  loadingInvoiceMsg: string;
  cancel: string;
  close: string;
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
    thankYouNote: "Thank you for shopping with us! Visit again",
    cgst: "CGST",
    sgst: "SGST",
    discount: "Discount",
    discountPercent: "Discount (%)",
    discountAmount: "Discount (₹)",
    taxableAmount: "Taxable Amount",
    plantsTaxExempt: "Plants (0% GST Exempt)",
    showBillableAmount: "Show Billable Amount",
    billableAmount: "Billable Amount",

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

    // Login Page
    loginTitle: "Sri Vijaya Lakshmi Nursery",
    loginSubtitle: "Bill of Suppliers & Stock Management",
    usernameLabel: "Username",
    passwordLabel: "Password",
    signInButton: "Sign in",
    signingIn: "Signing in…",
    loginAdminHelp: "Ask an admin if you need an account.",
    showPasswordAria: "Show password",
    hidePasswordAria: "Hide password",

    // Sales Analytics
    salesAnalyticsTitle: "Sales & Revenue Analytics",
    salesAnalyticsSubtitle: "Breakdown of online UPI, counter cash payments, and customer bills.",
    filterToday: "Today",
    filterYesterday: "Yesterday",
    filterThisWeek: "Last 7 Days",
    filterThisMonth: "This Month",
    filterLastMonth: "Last Month",
    filterQuarterly: "Quarterly",
    filterHalfYearly: "Half Yearly",
    filterByMonth: "By Month",
    filterByYear: "By Year",
    filterSpecificDate: "Specific Date",
    filterCustomRange: "Custom Range",
    filterAllTime: "All Time",
    quarterLabel: "Quarter:",
    yearLabel: "Year:",
    halfYearLabel: "Half-Year:",
    monthLabel: "Month:",
    fromDateLabel: "From:",
    toDateLabel: "To:",
    staffFilterLabel: "Staff:",
    allStaffOption: "All Staff (Entire Nursery)",
    allModesLabel: "All Modes",
    onlineUpiLabel: "Online (UPI)",
    cashOfflineLabel: "Cash",
    keyStatsTitle: "Key Statistics & Performance",
    billsBadge: "Bills",
    financialTotalsSubtitle: "Financial totals and payment mode breakdown",
    visualizeDataBtn: "Visualize Data",
    hideChartsBtn: "Hide Charts",
    totalSalesMetric: "Total Sales",
    onlineUpiMetric: "Online (UPI)",
    cashOfflineMetric: "Cash (Offline)",
    avgBillValueMetric: "Avg Bill Value",
    finalizedBillsSuffix: "finalized bill(s)",
    onlineBillsSuffix: "online bill(s)",
    cashBillsSuffix: "cash bill(s)",
    avgTransactionSizeSubtitle: "Average transaction size",
    visualStatsTitle: "Visual Statistics & Analytics",
    visualStatsSubtitle: "Interactive chart breakdowns by time, payment mode, and order ticket size",
    revenueModeBtn: "Revenue (₹)",
    billCountModeBtn: "Bill Count (#)",
    timelineTitleHourly: "Hourly Sales Velocity (06:00 AM – 10:00 PM)",
    timelineTitle7Day: "7-Day Sales Trend",
    timelineTitleDaily: "Daily Sales Performance",
    timelineTitleMonthly: "Monthly Performance",
    timelineTitleGeneric: "Sales Performance Timeline",
    hoverBarsHint: "(Hover over bars for details)",
    paymentSplitTitle: "Payment Method Split",
    ticketDistributionTitle: "Ticket Value Distribution",
    staffContributionTitle: "Staff Sales Contribution",
    staffMembersActiveSuffix: "Staff Members Active",
    invoicesBreakdownTitle: "Invoices Breakdown",
    searchInvoicesPlaceholder: "Search invoice or customer...",
    loadingSalesData: "Loading sales data...",
    noSalesFoundTitle: "No sales found",
    noSalesFoundSubtitle: "There are no finalized invoices matching the selected period or filters.",
    colInvoiceNo: "Invoice #",
    colCustomer: "Customer",
    colDateTime: "Date & Time",
    colPaymentMode: "Payment Mode",
    colBilledBy: "Billed By",
    colAmount: "Amount",
    colAction: "Action",
    viewInvoiceBtn: "View Bill",
    exportCsvBtn: "Export CSV",
    walkInCustomer: "Walk-in Customer",

    // Profile & Admin Panel
    profileTitleAdmin: "Account & Settings",
    profileTitleStaff: "Account Profile",
    tabProfile: "Profile",
    tabAdmin: "Admin Panel",
    digitalSignatureSection: "Digital Signature",
    createSignatureBtn: "Create Signature",
    editSignatureBtn: "Edit Signature",
    resetSignatureBtn: "Reset",
    defaultSignatureNote: "Default cursive signature active. Click above to draw or type a custom signature.",
    salesAnalyticsSection: "Sales & Revenue Analytics",
    salesAnalyticsAdminDesc: "View nursery-wide sales, online UPI & counter cash breakdowns, and staff reports.",
    salesAnalyticsStaffDesc: "View your personal sales figures, online UPI payments, and cash collections.",
    todayTotalSalesLabel: "Today's Total Sales",
    viewFullSalesAnalyticsBtn: "View Full Sales Analytics",
    invoiceSeriesSection: "Invoice Number Series",
    invoiceSeriesDesc: "Set a custom starting invoice number. Subsequent invoices will automatically continue from this series.",
    nextSeriesLabel: "Next:",
    setCustomInvoiceNumberBtn: "Set Custom Invoice Number",
    logoutBtn: "Log out",
    nurserySalesAnalyticsTitle: "Nursery Sales Analytics",
    nurserySalesAnalyticsDesc: "Full analytics with Month, Date, Year, and Custom Length date filters across all staff members.",
    openSalesAnalyticsBtn: "Open Nursery Sales Analytics",
    taxRatesTitle: "GST & Tax Rates (Non-Plants)",
    taxRatesDesc: "Configure CGST and SGST rates applied to non-plant items (pots, fertilizers, tools). Live plants remain 100% GST exempt.",
    cgstRateLabel: "CGST Rate (%)",
    sgstRateLabel: "SGST Rate (%)",
    saveTaxRatesBtn: "Save CGST & SGST Rates",
    savingTaxRatesBtn: "Saving Tax Rates...",
    taxRatesSuccessMsg: "Tax rates updated successfully!",
    taxRatesErrorMsg: "Error saving tax rates",
    invoiceDetailsHeaderTitle: "Invoice Details & Header",
    invoiceDetailsHeaderDesc: "Manage nursery business name, address, GSTIN, and mobile numbers across versions.",
    editInvoiceHeaderBtn: "Edit Invoice Header & Details",
    versionHistoryTitle: "Past & Active Invoice Versions",
    currentActiveBadge: "Current Active",
    pastVersionBadge: "Past Version",
    viewBillsBtn: "View Bills",
    paymentQrTitle: "Payment QR Code",
    paymentQrDesc: "Upload a payment QR code or photo of your UPI QR card. This will be shown to customers when paying online.",
    uploadQrPrompt: "Upload QR Code or Photo",
    changeQrBtn: "Change QR",
    removeQrBtn: "Remove",
    nurseryLogoTitle: "Nursery Logo (Invoice Header)",
    nurseryLogoDesc: "Upload your official nursery logo (SVG or image). This logo appears on all future and draft invoice headers.",
    uploadLogoPrompt: "Upload Nursery Logo",
    changeLogoBtn: "Change Logo",
    resetLogoBtn: "Reset to Default",
    activeLogoNote: "Active Custom Logo (shown on new & draft bills)",
    manageUsersTitle: "Manage Users",
    addUserBtn: "Add User",
    addingUserBtn: "Adding…",
    usernameCol: "Username",
    roleCol: "Role",
    actionsCol: "Actions",
    adminRole: "Admin",
    staffRole: "Staff",
    removeUserBtn: "Remove",
    dangerZoneTitle: "Danger Zone",
    deleteAllInvoicesBtn: "Delete All Invoices",
    deleteAllInvoicesDesc: "Permanently delete all invoices and billing history from the database.",
    deletingInvoicesBtn: "Deleting invoices...",

    // Modals & Line Items
    customItemKannadaNameLabel: "Item Name in Kannada (ಕನ್ನಡ)",
    translating: "Translating...",
    translateToKannada: "Translate to Kannada (AI)",
    customItemTypePlant: "🌱 Plant (0% GST)",
    customItemTypeNonPlant: "📦 Non-Plant (Taxable)",
    customInvoiceModalTitle: "Set Custom Invoice Number",
    customInvoiceModalDesc: "Set your custom starting invoice number. Subsequent invoices will automatically continue from this number series.",
    seriesPreviewLabel: "Series preview:",
    saveInvoiceSeriesBtn: "Save Series",
    signatureModalTitle: "Digital Signature",
    tabDraw: "Draw",
    tabType: "Type",
    clearSignatureBtn: "Clear",
    saveSignatureBtn: "Save Signature",
    typeSignaturePlaceholder: "Type your name or signatory...",
    exportDataModalTitle: "Data Backup & Export",
    exportZipBtn: "Download as ZIP",
    exportFolderBtn: "Export to Local Folder",
    invoiceNotFoundMsg: "Invoice not found.",
    backToInvoicesBtn: "Back to invoices",
    loadingInvoiceMsg: "Loading invoice…",
    cancel: "Cancel",
    close: "Close",
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
    thankYouNote: "ನಮ್ಮಲ್ಲಿ ಖರೀದಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! ಮತ್ತೆ ಭೇಟಿ ನೀಡಿ",
    cgst: "ಸಿ.ಜಿ.ಎಸ್.ಟಿ (CGST)",
    sgst: "ಎಸ್.ಜಿ.ಎಸ್.ಟಿ (SGST)",
    discount: "ರಿಯಾಯಿತಿ (Discount)",
    discountPercent: "ರಿಯಾಯಿತಿ (%)",
    discountAmount: "ರಿಯಾಯಿತಿ (₹)",
    taxableAmount: "ತೆರಿಗೆಗೆ ಒಳಪಡುವ ಮೊತ್ತ",
    plantsTaxExempt: "ಸಸ್ಯಗಳು (0% ಜಿಎಸ್‌ಟಿ ವಿನಾಯಿತಿ)",
    showBillableAmount: "ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ ತೋರಿಸಿ",
    billableAmount: "ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ",

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

    // Login Page
    loginTitle: "ಶ್ರೀ ವಿಜಯಲಕ್ಷ್ಮಿ ನರ್ಸರಿ",
    loginSubtitle: "ಪೂರೈಕೆದಾರರ ಬಿಲ್ ಮತ್ತು ದಾಸ್ತಾನು ನಿರ್ವಹಣೆ",
    usernameLabel: "ಬಳಕೆದಾರರ ಹೆಸರು",
    passwordLabel: "ಪಾಸ್‌ವರ್ಡ್",
    signInButton: "ಸೈನ್ ಇನ್",
    signingIn: "ಸೈನ್ ಇನ್ ಆಗುತ್ತಿದೆ…",
    loginAdminHelp: "ಖಾತೆಯ ಅಗತ್ಯವಿದ್ದರೆ ನಿರ್ವಾಹಕರನ್ನು (Admin) ಸಂಪರ್ಕಿಸಿ.",
    showPasswordAria: "ಪಾಸ್‌ವರ್ಡ್ ತೋರಿಸಿ",
    hidePasswordAria: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಡಿ",

    // Sales Analytics
    salesAnalyticsTitle: "ಮಾರಾಟ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ವರದಿಗಳು",
    salesAnalyticsSubtitle: "ಆನ್‌ಲೈನ್ ಯುಪಿಐ, ಕೌಂಟರ್ ನಗದು ಪಾವತಿಗಳು ಮತ್ತು ಬಿಲ್‌ಗಳ ವಿವರ.",
    filterToday: "ಇಂದು",
    filterYesterday: "ನಿನ್ನೆ",
    filterThisWeek: "ಕಳೆದ 7 ದಿನಗಳು",
    filterThisMonth: "ಈ ತಿಂಗಳು",
    filterLastMonth: "ಕಳೆದ ತಿಂಗಳು",
    filterQuarterly: "ತ್ರೈಮಾಸಿಕ",
    filterHalfYearly: "ಅರ್ಧವಾರ್ಷಿಕ",
    filterByMonth: "ತಿಂಗಳ ಪ್ರಕಾರ",
    filterByYear: "ವರ್ಷದ ಪ್ರಕಾರ",
    filterSpecificDate: "ನಿರ್ದಿಷ್ಟ ದಿನಾಂಕ",
    filterCustomRange: "ಕಸ್ಟಮ್ ಶ್ರೇಣಿ",
    filterAllTime: "ಎಲ್ಲಾ ಸಮಯ",
    quarterLabel: "ತ್ರೈಮಾಸಿಕ:",
    yearLabel: "ವರ್ಷ:",
    halfYearLabel: "ಅರ್ಧ-ವರ್ಷ:",
    monthLabel: "ತಿಂಗಳು:",
    fromDateLabel: "ಇಂದ:",
    toDateLabel: "ವರೆಗೆ:",
    staffFilterLabel: "ಸಿಬ್ಬಂದಿ:",
    allStaffOption: "ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ (ಸಂಪೂರ್ಣ ನರ್ಸರಿ)",
    allModesLabel: "ಎಲ್ಲಾ ವಿಧಾನಗಳು",
    onlineUpiLabel: "ಆನ್‌ಲೈನ್ (ಯುಪಿಐ)",
    cashOfflineLabel: "ನಗದು",
    keyStatsTitle: "ಪ್ರಮುಖ ಅಂಕಿಅಂಶಗಳು ಮತ್ತು ಸಾಧನೆ",
    billsBadge: "ಬಿಲ್‌ಗಳು",
    financialTotalsSubtitle: "ಹಣಕಾಸಿನ ಒಟ್ಟು ಮೊತ್ತ ಮತ್ತು ಪಾವತಿ ವಿಧಾನದ ವಿವರಣೆ",
    visualizeDataBtn: "ಚಾರ್ಟ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    hideChartsBtn: "ಚಾರ್ಟ್‌ಗಳನ್ನು ಮರೆಮಾಡಿ",
    totalSalesMetric: "ಒಟ್ಟು ಮಾರಾಟ",
    onlineUpiMetric: "ಆನ್‌ಲೈನ್ (ಯುಪಿಐ)",
    cashOfflineMetric: "ನಗದು (ಆಫ್‌ಲೈನ್)",
    avgBillValueMetric: "ಸರಾಸರಿ ಬಿಲ್ ಮೌಲ್ಯ",
    finalizedBillsSuffix: "ಅಂತಿಮಗೊಂಡ ಬಿಲ್‌ಗಳು",
    onlineBillsSuffix: "ಆನ್‌ಲೈನ್ ಬಿಲ್‌ಗಳು",
    cashBillsSuffix: "ನಗದು ಬಿಲ್‌ಗಳು",
    avgTransactionSizeSubtitle: "ಪ್ರತಿ ಬಿಲ್‌ನ ಸರಾಸರಿ ಮೊತ್ತ",
    visualStatsTitle: "ದೃಶ್ಯ ಅಂಕಿಅಂಶಗಳು ಮತ್ತು ವಿಶ್ಲೇಷಣೆ",
    visualStatsSubtitle: "ಸಮಯ, ಪಾವತಿ ವಿಧಾನ ಮತ್ತು ಆರ್ಡರ್ ಗಾತ್ರದ ಆಧಾರದ ಮೇಲೆ ಸಂವಾದಾತ್ಮಕ ಚಾರ್ಟ್‌ಗಳು",
    revenueModeBtn: "ಆದಾಯ (₹)",
    billCountModeBtn: "ಬಿಲ್ ಸಂಖ್ಯೆ (#)",
    timelineTitleHourly: "ಗಂಟೆಯ ಮಾರಾಟದ ವೇಗ (ಬೆಳಿಗ್ಗೆ 06:00 – ರಾತ್ರಿ 10:00)",
    timelineTitle7Day: "7-ದಿನಗಳ ಮಾರಾಟ ಪ್ರವೃತ್ತಿ",
    timelineTitleDaily: "ದೈನಂದಿನ ಮಾರಾಟದ ಸಾಧನೆ",
    timelineTitleMonthly: "ಮಾಸಿಕ ಸಾಧನೆ",
    timelineTitleGeneric: "ಮಾರಾಟ ಸಾಧನೆಯ ಟೈಮ್‌ಲೈನ್",
    hoverBarsHint: "(ವಿವರಗಳಿಗಾಗಿ ಬಾರ್‌ಗಳ ಮೇಲೆ ಕರ್ಸರ್ ತನ್ನಿ)",
    paymentSplitTitle: "ಪಾವತಿ ವಿಧಾನದ ಪಾಲು",
    ticketDistributionTitle: "ಬಿಲ್ ಮೊತ್ತದ ವಿತರಣೆ",
    staffContributionTitle: "ಸಿಬ್ಬಂದಿ ಮಾರಾಟ ಕೊಡುಗೆ",
    staffMembersActiveSuffix: "ಸಕ್ರಿಯ ಸಿಬ್ಬಂದಿ ಸದಸ್ಯರು",
    invoicesBreakdownTitle: "ಬಿಲ್‌ಗಳ ವಿವರ",
    searchInvoicesPlaceholder: "ಬಿಲ್ ಅಥವಾ ಗ್ರಾಹಕರನ್ನು ಹುಡುಕಿ...",
    loadingSalesData: "ಮಾರಾಟ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    noSalesFoundTitle: "ಯಾವುದೇ ಮಾರಾಟ ಕಂಡುಬಂದಿಲ್ಲ",
    noSalesFoundSubtitle: "ಆಯ್ಕೆಮಾಡಿದ ಅವಧಿಯಲ್ಲಿ ಯಾವುದೇ ಬಿಲ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
    colInvoiceNo: "ಬಿಲ್ ಸಂಖ್ಯೆ",
    colCustomer: "ಗ್ರಾಹಕರು",
    colDateTime: "ದಿನಾಂಕ ಮತ್ತು ಸಮಯ",
    colPaymentMode: "ಪಾವತಿ ವಿಧಾನ",
    colBilledBy: "ಬಿಲ್ ಮಾಡಿದವರು",
    colAmount: "ಮೊತ್ತ",
    colAction: "ಕ್ರಮ",
    viewInvoiceBtn: "ಬಿಲ್ ವೀಕ್ಷಿಸಿ",
    exportCsvBtn: "CSV ಗೆ ರಫ್ತು ಮಾಡಿ",
    walkInCustomer: "ಸ್ಥಳೀಯ ಗ್ರಾಹಕರು",

    // Profile & Admin Panel
    profileTitleAdmin: "ಖಾತೆ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    profileTitleStaff: "ಖಾತೆ ವಿವರ",
    tabProfile: "ಪ್ರೊಫೈಲ್",
    tabAdmin: "ನಿರ್ವಾಹಕ ಫಲಕ",
    digitalSignatureSection: "ಡಿಜಿಟಲ್ ಸಹಿ",
    createSignatureBtn: "ಸಹಿ ರಚಿಸಿ",
    editSignatureBtn: "ಸಹಿ ತಿದ್ದುಪಡಿ",
    resetSignatureBtn: "ಮರುಹೊಂದಿಸಿ",
    defaultSignatureNote: "ಡೀಫಾಲ್ಟ್ ಕರ್ಸಿವ್ ಸಹಿ ಸಕ್ರಿಯವಾಗಿದೆ. ಕಸ್ಟಮ್ ಸಹಿಗಾಗಿ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ.",
    salesAnalyticsSection: "ಮಾರಾಟ ಮತ್ತು ಆದಾಯ ವಿಶ್ಲೇಷಣೆ",
    salesAnalyticsAdminDesc: "ಸಂಪೂರ್ಣ ನರ್ಸರಿ ಮಾರಾಟ, ಆನ್‌ಲೈನ್ ಯುಪಿಐ ಮತ್ತು ನಗದು ವಿವರ, ಸಿಬ್ಬಂದಿ ವರದಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ.",
    salesAnalyticsStaffDesc: "ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾರಾಟ, ಆನ್‌ಲೈನ್ ಯುಪಿಐ ಪಾವತಿಗಳು ಮತ್ತು ನಗದು ಸಂಗ್ರಹಣೆಯನ್ನು ವೀಕ್ಷಿಸಿ.",
    todayTotalSalesLabel: "ಇಂದಿನ ಒಟ್ಟು ಮಾರಾಟ",
    viewFullSalesAnalyticsBtn: "ಸಂಪೂರ್ಣ ಮಾರಾಟ ವಿಶ್ಲೇಷಣೆ ವೀಕ್ಷಿಸಿ",
    invoiceSeriesSection: "ಬಿಲ್ ಸಂಖ್ಯೆ ಸರಣಿ",
    invoiceSeriesDesc: "ಕಸ್ಟಮ್ ಆರಂಭಿಕ ಬಿಲ್ ಸಂಖ್ಯೆಯನ್ನು ಹೊಂದಿಸಿ. ನಂತರದ ಬಿಲ್‌ಗಳು ಈ ಸರಣಿಯಿಂದ ಮುಂದುವರಿಯುತ್ತವೆ.",
    nextSeriesLabel: "ಮುಂದಿನದು:",
    setCustomInvoiceNumberBtn: "ಕಸ್ಟಮ್ ಬಿಲ್ ಸಂಖ್ಯೆ ಹೊಂದಿಸಿ",
    logoutBtn: "ಲಾಗ್ ಔಟ್",
    nurserySalesAnalyticsTitle: "ನರ್ಸರಿ ಮಾರಾಟ ವಿಶ್ಲೇಷಣೆ",
    nurserySalesAnalyticsDesc: "ತಿಂಗಳು, ದಿನಾಂಕ, ವರ್ಷ ಮತ್ತು ಕಸ್ಟಮ್ ಶ್ರೇಣಿಯ ಪ್ರಕಾರ ಸಂಪೂರ್ಣ ವರದಿಗಳು.",
    openSalesAnalyticsBtn: "ಮಾರಾಟ ವಿಶ್ಲೇಷಣೆಯನ್ನು ತೆರೆಯಿರಿ",
    taxRatesTitle: "ಜಿಎಸ್‌ಟಿ ಮತ್ತು ತೆರಿಗೆ ದರಗಳು (ಇತರ ವಸ್ತುಗಳು)",
    taxRatesDesc: "ಸಸ್ಯಗಳಲ್ಲದ ವಸ್ತುಗಳಿಗೆ (ಕುಂಡಗಳು, ಗೊಬ್ಬರ, ಉಪಕರಣಗಳು) CGST ಮತ್ತು SGST ದರಗಳನ್ನು ಹೊಂದಿಸಿ. ಸಸ್ಯಗಳು 100% ಜಿಎಸ್‌ಟಿ ಮುಕ್ತವಾಗಿರುತ್ತವೆ.",
    cgstRateLabel: "CGST ದರ (%)",
    sgstRateLabel: "SGST ದರ (%)",
    saveTaxRatesBtn: "CGST ಮತ್ತು SGST ದರಗಳನ್ನು ಉಳಿಸಿ",
    savingTaxRatesBtn: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    taxRatesSuccessMsg: "ತೆರಿಗೆ ದರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
    taxRatesErrorMsg: "ತೆರಿಗೆ ದರಗಳನ್ನು ಉಳಿಸುವಲ್ಲಿ ದೋಷ ಉಂಟಾಗಿದೆ",
    invoiceDetailsHeaderTitle: "ಬಿಲ್ ವಿವರಗಳು ಮತ್ತು ಶೀರ್ಷಿಕೆ",
    invoiceDetailsHeaderDesc: "ನರ್ಸರಿ ಹೆಸರು, ವಿಳಾಸ, ಜಿಎಸ್‌ಟಿ ಸಂಖ್ಯೆ ಮತ್ತು ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ.",
    editInvoiceHeaderBtn: "ಬಿಲ್ ಶೀರ್ಷಿಕೆ ಮತ್ತು ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ",
    versionHistoryTitle: "ಹಿಂದಿನ ಮತ್ತು ಪ್ರಸ್ತುತ ಬಿಲ್ ಆವೃತ್ತಿಗಳು",
    currentActiveBadge: "ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ",
    pastVersionBadge: "ಹಿಂದಿನ ಆವೃತ್ತಿ",
    viewBillsBtn: "ಬಿಲ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    paymentQrTitle: "ಪಾವತಿ ಕ್ಯೂಆರ್ ಕೋಡ್ (Payment QR)",
    paymentQrDesc: "ಆನ್‌ಲೈನ್ ಪಾವತಿಗಾಗಿ ಕ್ಯೂಆರ್ ಕೋಡ್ ಅಥವಾ ಯುಪಿಐ ಕಾರ್ಡ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
    uploadQrPrompt: "ಕ್ಯೂಆರ್ ಕೋಡ್ ಅಥವಾ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    changeQrBtn: "ಕ್ಯೂಆರ್ ಬದಲಾಯಿಸಿ",
    removeQrBtn: "ತೆಗೆದುಹಾಕಿ",
    nurseryLogoTitle: "ನರ್ಸರಿ ಲಾಂಛನ (Logo)",
    nurseryLogoDesc: "ಅಧಿಕೃತ ನರ್ಸರಿ ಲೋಗೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (SVG ಅಥವಾ ಚಿತ್ರ). ಇದು ಭವಿಷ್ಯದ ಮತ್ತು ಕರಡು ಬಿಲ್‌ಗಳಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ.",
    uploadLogoPrompt: "ನರ್ಸರಿ ಲಾಂಛನವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    changeLogoBtn: "ಲಾಂಛನ ಬದಲಾಯಿಸಿ",
    resetLogoBtn: "ಡೀಫಾಲ್ಟ್‌ಗೆ ಮರುಹೊಂದಿಸಿ",
    activeLogoNote: "ಸಕ್ರಿಯ ಲಾಂಛನ (ಹೊಸ ಮತ್ತು ಕರಡು ಬಿಲ್‌ಗಳಲ್ಲಿ ತೋರಿಸಲಾಗುತ್ತದೆ)",
    manageUsersTitle: "ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ",
    addUserBtn: "ಬಳಕೆದಾರರನ್ನು ಸೇರಿಸಿ",
    addingUserBtn: "ಸೇರಿಸಲಾಗುತ್ತಿದೆ...",
    usernameCol: "ಬಳಕೆದಾರರ ಹೆಸರು",
    roleCol: "ಪಾತ್ರ",
    actionsCol: "ಕ್ರಮಗಳು",
    adminRole: "ನಿರ್ವಾಹಕರು (Admin)",
    staffRole: "ಸಿಬ್ಬಂದಿ (Staff)",
    removeUserBtn: "ತೆಗೆದುಹಾಕಿ",
    dangerZoneTitle: "ಅಪಾಯ ವಲಯ (Danger Zone)",
    deleteAllInvoicesBtn: "ಎಲ್ಲಾ ಬಿಲ್‌ಗಳನ್ನು ಅಳಿಸಿ",
    deleteAllInvoicesDesc: "ಡೇಟಾಬೇಸ್‌ನಿಂದ ಎಲ್ಲಾ ಬಿಲ್‌ಗಳು ಮತ್ತು ಮಾರಾಟ ಇತಿಹಾಸವನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿಹಾಕಿ.",
    deletingInvoicesBtn: "ಅಳಿಸಲಾಗುತ್ತಿದೆ...",

    // Modals & Line Items
    customItemKannadaNameLabel: "ಕನ್ನಡದಲ್ಲಿ ವಸ್ತುವಿನ ಹೆಸರು",
    translating: "ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ...",
    translateToKannada: "ಕನ್ನಡಕ್ಕೆ ಅನುವಾದಿಸಿ (AI)",
    customItemTypePlant: "🌱 ಸಸ್ಯ (0% ಜಿಎಸ್‌ಟಿ)",
    customItemTypeNonPlant: "📦 ಇತರ ವಸ್ತು (ತೆರಿಗೆ ಸಹಿತ)",
    customInvoiceModalTitle: "ಕಸ್ಟಮ್ ಬಿಲ್ ಸಂಖ್ಯೆಯನ್ನು ಹೊಂದಿಸಿ",
    customInvoiceModalDesc: "ಆರಂಭಿಕ ಬಿಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ. ನಂತರದ ಬಿಲ್‌ಗಳು ಈ ಸರಣಿಯಿಂದ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮುಂದುವರಿಯುತ್ತವೆ.",
    seriesPreviewLabel: "ಸರಣಿ ಮುನ್ನೋಟ:",
    saveInvoiceSeriesBtn: "ಸರಣಿಯನ್ನು ಉಳಿಸಿ",
    signatureModalTitle: "ಡಿಜಿಟಲ್ ಸಹಿ",
    tabDraw: "ಬರೆಯಿರಿ (Draw)",
    tabType: "ಟೈಪ್ ಮಾಡಿ (Type)",
    clearSignatureBtn: "ಅಳಿಸಿಹಾಕಿ",
    saveSignatureBtn: "ಸಹಿಯನ್ನು ಉಳಿಸಿ",
    typeSignaturePlaceholder: "ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ...",
    exportDataModalTitle: "ಡೇಟಾ ಬ್ಯಾಕಪ್ ಮತ್ತು ರಫ್ತು",
    exportZipBtn: "ZIP ಫೈಲ್ ಆಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    exportFolderBtn: "ಸ್ಥಳೀಯ ಫೋಲ್ಡರ್‌ಗೆ ರಫ್ತು ಮಾಡಿ",
    invoiceNotFoundMsg: "ಬಿಲ್ ಕಂಡುಬಂದಿಲ್ಲ.",
    backToInvoicesBtn: "ಬಿಲ್‌ಗಳ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ",
    loadingInvoiceMsg: "ಬಿಲ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    cancel: "ರದ್ದುಮಾಡಿ",
    close: "ಮುಚ್ಚಿ",
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
      // 1. Check URL path prefix first (/kn or /en)
      const path = window.location.pathname;
      let detected: Language | null = null;
      if (path.startsWith("/kn/") || path === "/kn") {
        detected = "kn";
      } else if (path.startsWith("/en/") || path === "/en") {
        detected = "en";
      }

      // 2. Check localStorage
      if (!detected) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "en" || saved === "kn") {
          detected = saved;
        }
      }

      // 3. Check Cookie
      if (!detected) {
        const match = document.cookie.match(/svl_language=(en|kn)/);
        if (match) {
          detected = match[1] as Language;
        }
      }

      if (detected) {
        setLanguageState(detected);
        document.documentElement.lang = detected;
      }
    } catch {}
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `svl_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = lang;

      // Update URL prefix without reloading if on /en or /kn
      const currentPath = window.location.pathname;
      const search = window.location.search;
      if (currentPath.startsWith("/en") || currentPath.startsWith("/kn")) {
        const remaining = currentPath.replace(/^\/(en|kn)/, "") || "/";
        const newPath = `/${lang}${remaining === "/" ? "" : remaining}${search}`;
        window.history.pushState(null, "", newPath);
      }
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
