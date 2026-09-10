// src/app/api/settings/invoice-details/route.ts

import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { getSession } from "@/lib/session";

const DEFAULT_SETTINGS = {
  version: 1,
  businessName: "SRI VIJAYA LAKSHMI NURSERY",
  subheading1: "(Approved by Department of Horticulture)",
  subheading2: "(All Kinds of Plants Production and Suppliers)",
  address: "Harige B. H. Road, Shimoga - 577203",
  mobiles: "7353025302, 9448140483, 9606602194",
  gstin: "29ADXPV1295N2Z6",
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
      .orderBy(desc(businessSettings.version))
      .limit(1);

    if (records.length === 0) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    return NextResponse.json({ settings: records[0] });
  } catch (error) {
    console.error("Failed to load invoice settings:", error);
    return NextResponse.json(
      { settings: DEFAULT_SETTINGS },
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
