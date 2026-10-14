import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices, users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const isAdmin = user.role === "admin";

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const paymentModeParam = searchParams.get("paymentMode");
    const categoryParam = searchParams.get("category"); // "all" | "plants" | "non-plants"
    const userIdParam = searchParams.get("userId");
    const searchParam = searchParams.get("search")?.trim().toLowerCase();

    const conditions = [eq(invoices.status, "final")];

    // Staff can strictly view only their own invoices
    if (!isAdmin) {
      conditions.push(eq(invoices.createdBy, user.id));
    } else if (userIdParam && userIdParam !== "all") {
      conditions.push(eq(invoices.createdBy, userIdParam));
    }

    // Payment mode filter (online vs cash)
    if (paymentModeParam === "online") {
      conditions.push(eq(invoices.paymentMode, "online"));
    } else if (paymentModeParam === "cash") {
      conditions.push(eq(invoices.paymentMode, "cash"));
    }

    // Start & End Date filters
    if (startDateParam) {
      const parsedStart = new Date(startDateParam);
      if (!isNaN(parsedStart.getTime())) {
        conditions.push(gte(invoices.createdAt, parsedStart));
      }
    }

    if (endDateParam) {
      const parsedEnd = new Date(endDateParam);
      if (!isNaN(parsedEnd.getTime())) {
        conditions.push(lte(invoices.createdAt, parsedEnd));
      }
    }

    const whereClause = and(...conditions);

    // Fetch matching invoices with staff details and line items
    const rows = await db.query.invoices.findMany({
      where: whereClause,
      orderBy: [desc(invoices.createdAt)],
      with: {
        createdByUser: {
          columns: {
            id: true,
            username: true,
            role: true,
          },
        },
        items: {
          columns: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            lineTotal: true,
            category: true,
            gstRate: true,
          },
          with: {
            stockItem: {
              columns: {
                id: true,
                category: true,
                subcategory: true,
              },
            },
          },
        },
      },
    });

    // Compute category breakdown per invoice
    const processedRows = rows.map((row) => {
      let rowPlantGross = 0;
      let rowNonPlantGross = 0;

      if (row.items && row.items.length > 0) {
        for (const item of row.items) {
          const isPlant =
            item.category === "plants" ||
            (!item.category && (!item.stockItem || item.stockItem.category === "plants"));
          const lineAmt =
            Number(item.lineTotal) ||
            (Number(item.price) * Number(item.quantity)) ||
            0;
          if (isPlant) {
            rowPlantGross += lineAmt;
          } else {
            rowNonPlantGross += lineAmt;
          }
        }
      } else {
        // Fallback for bills with no items recorded
        rowPlantGross = Number(row.total) || 0;
      }

      const rowTotalGross = rowPlantGross + rowNonPlantGross;
      const rowTotal = Number(row.total) || 0;

      let rowPlantsTotal = 0;
      let rowNonPlantsTotal = 0;

      if (rowTotalGross <= 0) {
        rowPlantsTotal = rowTotal;
        rowNonPlantsTotal = 0;
      } else if (rowNonPlantGross === 0) {
        rowPlantsTotal = rowTotal;
        rowNonPlantsTotal = 0;
      } else if (rowPlantGross === 0) {
        rowPlantsTotal = 0;
        rowNonPlantsTotal = rowTotal;
      } else {
        let discountAmt = 0;
        if (row.headerSnapshot) {
          try {
            const snap = JSON.parse(row.headerSnapshot);
            discountAmt = Number(snap.discount) || 0;
          } catch {}
        }
        const discountFactor = Math.max(0, (rowTotalGross - discountAmt) / rowTotalGross);
        rowPlantsTotal = Math.round(rowPlantGross * discountFactor * 100) / 100;
        rowNonPlantsTotal = Math.max(0, Math.round((rowTotal - rowPlantsTotal) * 100) / 100);
      }

      const hasPlants = rowPlantGross > 0 || (rowTotalGross === 0 && rowTotal > 0);
      const hasNonPlants = rowNonPlantGross > 0;
      const categoryType = hasPlants && hasNonPlants ? "mixed" : hasNonPlants ? "non-plants" : "plants";

      return {
        ...row,
        plantsTotal: rowPlantsTotal,
        nonPlantsTotal: rowNonPlantsTotal,
        hasPlants,
        hasNonPlants,
        categoryType,
      };
    });

    // Compute overall category sales totals before category filtering
    let allPlantsRevenue = 0;
    let allPlantsCount = 0;
    let allNonPlantsRevenue = 0;
    let allNonPlantsCount = 0;

    for (const r of processedRows) {
      allPlantsRevenue += r.plantsTotal;
      if (r.hasPlants) allPlantsCount++;
      allNonPlantsRevenue += r.nonPlantsTotal;
      if (r.hasNonPlants) allNonPlantsCount++;
    }

    // Filter rows by category if requested
    const categoryFilteredRows =
      categoryParam === "plants"
        ? processedRows.filter((r) => r.hasPlants)
        : categoryParam === "non-plants"
        ? processedRows.filter((r) => r.hasNonPlants)
        : processedRows;

    const filteredRows = searchParam
      ? categoryFilteredRows.filter(
          (r) =>
            r.invoiceNumber?.toLowerCase().includes(searchParam) ||
            r.customerName?.toLowerCase().includes(searchParam) ||
            r.customerDetails?.toLowerCase().includes(searchParam)
        )
      : categoryFilteredRows;

    let totalRevenue = 0;
    let onlineRevenue = 0;
    let onlineCount = 0;
    let cashRevenue = 0;
    let cashCount = 0;

    for (const row of categoryFilteredRows) {
      const amount =
        categoryParam === "plants"
          ? row.plantsTotal
          : categoryParam === "non-plants"
          ? row.nonPlantsTotal
          : (Number(row.total) || 0);

      totalRevenue += amount;
      if (row.paymentMode === "online") {
        onlineRevenue += amount;
        onlineCount++;
      } else {
        cashRevenue += amount;
        cashCount++;
      }
    }

    const totalInvoices = categoryFilteredRows.length;
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // Fetch staff list for admin dropdown
    let staffList: { id: string; username: string; role: string }[] = [];
    if (isAdmin) {
      staffList = await db
        .select({
          id: users.id,
          username: users.username,
          role: users.role,
        })
        .from(users)
        .orderBy(users.username);
    }

    // Extract available years for year selector
    const currentYear = new Date().getFullYear();
    let availableYears: number[] = [currentYear];
    try {
      const yearRows = await db
        .select({
          year: sql<number>`EXTRACT(YEAR FROM ${invoices.createdAt})::int`,
        })
        .from(invoices)
        .groupBy(sql`EXTRACT(YEAR FROM ${invoices.createdAt})`)
        .orderBy(desc(sql`EXTRACT(YEAR FROM ${invoices.createdAt})`));

      const distinctYears = yearRows
        .map((r) => r.year)
        .filter((y): y is number => typeof y === "number" && !isNaN(y));

      if (distinctYears.length > 0) {
        availableYears = Array.from(new Set([currentYear, ...distinctYears])).sort(
          (a, b) => b - a
        );
      }
    } catch {
      // Fallback if extract year fails
      availableYears = [currentYear, currentYear - 1];
    }

    return NextResponse.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        onlineRevenue: Math.round(onlineRevenue * 100) / 100,
        onlineCount,
        cashRevenue: Math.round(cashRevenue * 100) / 100,
        cashCount,
        totalInvoices,
        averageInvoiceValue: Math.round(averageInvoiceValue * 100) / 100,
        plantsRevenue: Math.round(allPlantsRevenue * 100) / 100,
        plantsCount: allPlantsCount,
        nonPlantsRevenue: Math.round(allNonPlantsRevenue * 100) / 100,
        nonPlantsCount: allNonPlantsCount,
        selectedCategory: categoryParam || "all",
      },
      invoices: filteredRows,
      staffList,
      availableYears,
      isAdmin,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
