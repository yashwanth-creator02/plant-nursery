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

    // Fetch matching invoices with staff details
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
      },
    });

    // Compute aggregations
    let totalRevenue = 0;
    let onlineRevenue = 0;
    let onlineCount = 0;
    let cashRevenue = 0;
    let cashCount = 0;

    const filteredRows = searchParam
      ? rows.filter(
          (r) =>
            r.invoiceNumber?.toLowerCase().includes(searchParam) ||
            r.customerName?.toLowerCase().includes(searchParam) ||
            r.customerDetails?.toLowerCase().includes(searchParam)
        )
      : rows;

    for (const row of rows) {
      const amount = Number(row.total) || 0;
      totalRevenue += amount;
      if (row.paymentMode === "online") {
        onlineRevenue += amount;
        onlineCount++;
      } else {
        cashRevenue += amount;
        cashCount++;
      }
    }

    const totalInvoices = rows.length;
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
        totalRevenue,
        onlineRevenue,
        onlineCount,
        cashRevenue,
        cashCount,
        totalInvoices,
        averageInvoiceValue,
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
