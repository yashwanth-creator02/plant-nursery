// src/app/api/export/data/route.ts

import { NextResponse } from "next/server";
import { desc, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  businessSettings,
  invoices,
  stockItems,
  stockItemImages,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/session";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function escapeCsvCell(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  const str = String(cell);
  if (str.includes(",") || str.includes("\"") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  // Include UTF-8 BOM so Excel opens Hindi/Kannada/English cleanly
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
}

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required to export all nursery data." },
        { status: 403 }
      );
    }

    // 1. Fetch Business Settings
    const allSettings = await db
      .select()
      .from(businessSettings)
      .orderBy(desc(businessSettings.version));

    const activeSettings = allSettings[0] || {
      version: 1,
      businessName: "Sri Vijaya Lakshmi Nursery",
      subheading1: "(Approved by Department of Horticulture)",
      subheading2: "(All Kinds of Plants Production and Suppliers)",
      address: "Harige B. H. Road, Shimoga - 577203",
      mobiles: "7353025302, 9448140483, 9606602194",
      gstin: "29ADXPV1295N2Z6",
      qrCodeData: null,
      updatedAt: new Date(),
    };

    const websiteName = (activeSettings.businessName || "Sri Vijaya Lakshmi Nursery").trim();
    // Directory-safe website folder name
    const websiteFolderName = websiteName.replace(/[\\/:*?"<>|]/g, "_").trim() || "Sri_Vijaya_Lakshmi_Nursery";

    // 2. Fetch Invoices with Items and Creator
    const allInvoices = await db.query.invoices.findMany({
      orderBy: [desc(invoices.createdAt)],
      with: {
        items: true,
        createdByUser: {
          columns: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    // 3. Fetch Stock Items with Images
    const allStock = await db.query.stockItems.findMany({
      orderBy: [asc(stockItems.name)],
      with: {
        images: {
          orderBy: [desc(stockItemImages.isPrimary), desc(stockItemImages.createdAt)],
        },
      },
    });

    // 4. Fetch Users (omitting passwords!)
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        signature: users.signature,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.username));

    // 5. Build CSVs
    // Invoices CSV
    const invoiceHeaders = [
      "Invoice Number",
      "Date",
      "Time",
      "Customer Name",
      "Customer Details",
      "Status",
      "Payment Mode",
      "Total (INR)",
      "Version",
      "Created By",
      "Finalized At",
      "Notes",
    ];

    const invoiceRows = allInvoices.map((inv) => {
      const d = new Date(inv.createdAt);
      return [
        inv.invoiceNumber,
        d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }),
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        inv.customerName || "",
        inv.customerDetails || "",
        inv.status,
        inv.paymentMode,
        inv.total,
        inv.version || 1,
        inv.createdByUser?.username || "",
        inv.finalizedAt ? new Date(inv.finalizedAt).toISOString() : "",
        inv.notes || "",
      ];
    });
    const invoicesCsv = generateCsv(invoiceHeaders, invoiceRows);

    // Line Items CSV
    const lineItemHeaders = [
      "Invoice Number",
      "Customer Name",
      "Item Sl No",
      "Particulars / Plant Name",
      "Quantity",
      "Unit Price (INR)",
      "Line Total (INR)",
      "Payment Mode",
      "Date",
    ];
    const lineItemRows: (string | number)[][] = [];
    allInvoices.forEach((inv) => {
      const d = new Date(inv.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      inv.items.forEach((it, idx) => {
        lineItemRows.push([
          inv.invoiceNumber,
          inv.customerName || "",
          idx + 1,
          it.name,
          it.quantity,
          it.price,
          it.lineTotal,
          inv.paymentMode,
          d,
        ]);
      });
    });
    const lineItemsCsv = generateCsv(lineItemHeaders, lineItemRows);

    // Stock Items CSV
    const stockHeaders = [
      "ID",
      "Name",
      "Category",
      "Subcategory",
      "Quantity",
      "Unit",
      "Price (INR)",
      "Description",
      "Images Count",
      "Created At",
      "Updated At",
    ];
    const stockRows = allStock.map((s) => [
      s.id,
      s.name,
      s.category,
      s.subcategory,
      s.quantity,
      s.unit,
      s.price,
      s.description || "",
      s.images.length,
      new Date(s.createdAt).toISOString(),
      new Date(s.updatedAt).toISOString(),
    ]);
    const stockCsv = generateCsv(stockHeaders, stockRows);

    // 6. Categories & Subcategories breakdown
    const categoriesMap: Record<string, Set<string>> = {};
    allStock.forEach((s) => {
      const cat = s.category || "other";
      const sub = s.subcategory || "other";
      if (!categoriesMap[cat]) categoriesMap[cat] = new Set();
      categoriesMap[cat].add(sub);
    });
    const categoriesSummary = Object.entries(categoriesMap).map(([category, subs]) => ({
      category,
      subcategories: Array.from(subs),
      itemCount: allStock.filter((s) => (s.category || "other") === category).length,
    }));

    // 7. Image Manifest (Stock images, signatures, and QR code)
    type ExportImageItem = {
      id: string;
      category: "stock" | "signature" | "qr" | "logo";
      targetRelativePath: string;
      downloadUrl: string;
      storagePath?: string;
      dataUri?: string;
    };

    const imageFiles: ExportImageItem[] = [];

    // Stock images
    allStock.forEach((s) => {
      const catFolder = sanitizeFilename(s.category || "other");
      const subFolder = sanitizeFilename(s.subcategory || "other");
      const itemName = sanitizeFilename(s.name || "plant");

      s.images.forEach((img, idx) => {
        const extMatch = img.imageUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i);
        const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
        const filename = `${itemName}_${idx + 1}.${ext}`;
        imageFiles.push({
          id: img.id,
          category: "stock",
          targetRelativePath: `images/stock/${catFolder}/${subFolder}/${filename}`,
          downloadUrl: img.imageUrl,
          storagePath: img.storagePath,
        });
      });
    });

    // User signatures
    allUsers.forEach((u) => {
      if (u.signature) {
        if (u.signature.startsWith("data:image")) {
          imageFiles.push({
            id: `sig-${u.id}`,
            category: "signature",
            targetRelativePath: `images/signatures/${sanitizeFilename(u.username)}-signature.png`,
            downloadUrl: `/api/export/image?userId=${u.id}`,
            dataUri: u.signature,
          });
        } else if (u.signature.startsWith("http")) {
          imageFiles.push({
            id: `sig-${u.id}`,
            category: "signature",
            targetRelativePath: `images/signatures/${sanitizeFilename(u.username)}-signature.png`,
            downloadUrl: u.signature,
          });
        }
      }
    });

    // QR code image
    if (activeSettings.qrCodeData) {
      imageFiles.push({
        id: "payment-qr",
        category: "qr",
        targetRelativePath: "business-details/payment-qr.png",
        downloadUrl: "/api/export/image?type=qr",
        dataUri: activeSettings.qrCodeData,
      });
    }

    // Nursery Logo
    if (activeSettings.logoData) {
      const isSvg = activeSettings.logoData.trim().startsWith("<svg") || activeSettings.logoData.startsWith("data:image/svg+xml");
      const ext = isSvg ? "svg" : "png";
      imageFiles.push({
        id: "nursery-logo",
        category: "logo",
        targetRelativePath: `business-details/nursery-logo.${ext}`,
        downloadUrl: "/api/export/image?type=logo",
        dataUri: activeSettings.logoData.startsWith("data:") ? activeSettings.logoData : undefined,
      });
    }

    // 8. Construct Individual Invoices
    const individualInvoices = allInvoices.map((inv) => ({
      fileName: `${sanitizeFilename(inv.invoiceNumber)}.json`,
      content: {
        invoiceNumber: inv.invoiceNumber,
        version: inv.version,
        customerName: inv.customerName,
        customerDetails: inv.customerDetails,
        status: inv.status,
        paymentMode: inv.paymentMode,
        total: inv.total,
        notes: inv.notes,
        createdAt: inv.createdAt,
        finalizedAt: inv.finalizedAt,
        createdBy: inv.createdByUser?.username,
        items: inv.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          lineTotal: it.lineTotal,
        })),
        headerSnapshot: inv.headerSnapshot ? JSON.parse(inv.headerSnapshot) : null,
      },
    }));

    // 9. README / Manifest documentation
    const readmeText = `=====================================================
${websiteName} - Complete Data Backup & Export
=====================================================

Export Generated On: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
Active Version: Version ${activeSettings.version}
GSTIN: ${activeSettings.gstin || "N/A"}
Contact: ${activeSettings.mobiles || "N/A"}
Address: ${activeSettings.address || "N/A"}

SUMMARY OF EXPORTED CONTENTS:
-----------------------------------------------------
- Total Invoices: ${allInvoices.length}
- Total Stock Items: ${allStock.length}
- Total Staff Members: ${allUsers.length}
- Total Plant Images: ${imageFiles.filter((i) => i.category === "stock").length}
- Digital Signatures: ${imageFiles.filter((i) => i.category === "signature").length}

FOLDER HIERARCHY:
-----------------------------------------------------
/${websiteFolderName}/
  ├── README.txt                        (This document)
  ├── manifest.json                     (Machine-readable export summary)
  ├── business-details/
  │   ├── current-settings.json         (Active business & nursery details)
  │   ├── versions-history.json         (All historical invoice header versions)
  │   └── payment-qr.png                (Payment QR code, if configured)
  ├── invoices/
  │   ├── invoices.json                 (Full JSON dump of all invoices & line items)
  │   ├── invoices.csv                  (Spreadsheet summary of all invoices)
  │   ├── line-items.csv                (Detailed line items across all invoices)
  │   └── individual/                   (Individual JSON files per invoice)
  │       ├── INV-2026-0001.json
  │       └── ...
  ├── inventory/
  │   ├── stock-items.json              (Full stock list with categories & prices)
  │   ├── stock-items.csv               (Spreadsheet inventory for Excel/Sheets)
  │   └── categories-summary.json       (Categories & subcategories breakdown)
  ├── images/
  │   ├── stock/                        (Plant images organized by Category/Subcategory)
  │   └── signatures/                   (Digital signatures of staff members)
  └── staff/
      └── users.json                    (Staff usernames, roles, creation dates)

=====================================================
`;

    const manifest = {
      websiteName,
      websiteFolderName,
      exportedAt: new Date().toISOString(),
      activeVersion: activeSettings.version,
      stats: {
        totalInvoices: allInvoices.length,
        totalStockItems: allStock.length,
        totalStaff: allUsers.length,
        totalImages: imageFiles.length,
      },
    };

    return NextResponse.json({
      websiteName,
      websiteFolderName,
      manifest,
      readmeText,
      businessDetails: {
        current: activeSettings,
        versions: allSettings,
      },
      invoices: {
        all: allInvoices,
        csv: invoicesCsv,
        lineItemsCsv: lineItemsCsv,
        individual: individualInvoices,
      },
      inventory: {
        stockItems: allStock,
        csv: stockCsv,
        categories: categoriesSummary,
      },
      staff: allUsers,
      imageFiles,
    });
  } catch (err: unknown) {
    console.error("Export data error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
