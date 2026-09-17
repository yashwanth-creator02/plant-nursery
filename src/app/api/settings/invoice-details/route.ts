// src/app/api/settings/invoice-details/route.ts

import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { businessSettings, invoices } from "@/db/schema";
import { getSession } from "@/lib/session";

const DEFAULT_SETTINGS = {
  version: 1,
  businessName: "SRI VIJAYA LAKSHMI NURSERY",
  subheading1: "(Approved by Department of Horticulture)",
  subheading2: "(All Kinds of Plants Production and Suppliers)",
  address: "Harige B. H. Road, Shimoga - 577203",
  mobiles: "7353025302, 9448140483, 9606602194",
  gstin: "29ADXPV1295N2Z6",
  cgstRate: "2.50",
  sgstRate: "2.50",
};

export async function GET() {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const records = await db
      .select()
      .from(businessSettings)
      .orderBy(desc(businessSettings.version));

    if (records.length === 0) {
      return NextResponse.json({
        settings: DEFAULT_SETTINGS,
        versions: [{ ...DEFAULT_SETTINGS, isCurrent: true, invoiceCount: 0, totalRevenue: 0 }],
      });
    }

    // Invoice count and revenue grouped by invoice version
    let versionsWithStats = records.map((r, idx) => ({
      ...r,
      isCurrent: idx === 0,
      invoiceCount: 0,
      totalRevenue: 0,
    }));

    try {
      const invoiceCountsByVersion = await db
        .select({
          version: sql<number>`coalesce(${invoices.version}, 1)::int`,
          count: sql<number>`count(*)::int`,
          total: sql<string>`coalesce(sum(${invoices.total}), 0)`,
        })
        .from(invoices)
        .groupBy(sql`coalesce(${invoices.version}, 1)`);

      const countsMap = new Map(
        invoiceCountsByVersion.map((c) => [c.version, { count: c.count, total: Number(c.total || 0) }])
      );

      versionsWithStats = records.map((r, idx) => ({
        ...r,
        isCurrent: idx === 0,
        invoiceCount: countsMap.get(r.version)?.count || 0,
        totalRevenue: countsMap.get(r.version)?.total || 0,
      }));
    } catch (countErr) {
      console.warn("Could not calculate version invoice counts:", countErr);
    }

    return NextResponse.json({
      settings: records[0],
      versions: versionsWithStats,
    });
  } catch (error) {
    console.error("Failed to load invoice settings:", error);
    return NextResponse.json(
      { settings: DEFAULT_SETTINGS, versions: [{ ...DEFAULT_SETTINGS, isCurrent: true, invoiceCount: 0, totalRevenue: 0 }] },
      { status: 200 },
    );
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.user || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const {
      businessName,
      subheading1,
      subheading2,
      address,
      mobiles,
      gstin,
      cgstRate,
      sgstRate,
    } = body;

    if (!businessName || !address) {
      return NextResponse.json(
        { error: "Business name and address are required." },
        { status: 400 },
      );
    }

    // Get highest current version
    const latest = await db
      .select()
      .from(businessSettings)
      .orderBy(desc(businessSettings.version))
      .limit(1);

    const nextVersion = latest.length > 0 ? latest[0].version + 1 : 2;

    const validatedCgst =
      cgstRate !== undefined && cgstRate !== null && String(cgstRate).trim() !== ""
        ? String(Number(cgstRate) || 0)
        : latest[0]?.cgstRate || "2.50";
    const validatedSgst =
      sgstRate !== undefined && sgstRate !== null && String(sgstRate).trim() !== ""
        ? String(Number(sgstRate) || 0)
        : latest[0]?.sgstRate || "2.50";

    const [created] = await db
      .insert(businessSettings)
      .values({
        version: nextVersion,
        businessName: businessName.trim(),
        subheading1: (subheading1 || "").trim(),
        subheading2: (subheading2 || "").trim(),
        address: address.trim(),
        mobiles: (mobiles || "").trim(),
        gstin: (gstin || "").trim(),
        cgstRate: validatedCgst,
        sgstRate: validatedSgst,
        qrCodeData: latest.length > 0 ? latest[0].qrCodeData : null,
        logoData: latest.length > 0 ? latest[0].logoData : null,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      settings: created,
      message: `Invoice details updated to Version ${nextVersion}`,
    });
  } catch (error) {
    console.error("Failed to update invoice settings:", error);
    return NextResponse.json(
      { error: "Failed to update invoice settings." },
      { status: 500 },
    );
  }
}
