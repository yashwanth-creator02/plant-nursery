import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    await requireUser();

    const [settings] = await db
      .select({ logoData: businessSettings.logoData })
      .from(businessSettings)
      .orderBy(desc(businessSettings.version))
      .limit(1);

    return NextResponse.json({
      logoData: settings?.logoData ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update the nursery logo." },
        { status: 403 }
      );
    }

    const body = await req.json();
    let logoData: string | null = body.logoData ?? null;

    // Validate format if provided
    if (logoData) {
      const trimmed = logoData.trim();
      const isDataUri = trimmed.startsWith("data:image/");
      const isRawSvg = trimmed.startsWith("<svg") && trimmed.includes("</svg>");
      const isHttpUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://");

      if (!isDataUri && !isRawSvg && !isHttpUrl) {
        return NextResponse.json(
          { error: "Logo must be a valid SVG or image file (PNG, JPG, SVG)." },
          { status: 400 }
        );
      }
      logoData = trimmed;
    }

    const [latest] = await db
      .select({ id: businessSettings.id })
      .from(businessSettings)
      .orderBy(desc(businessSettings.version))
      .limit(1);

    if (latest) {
      await db
        .update(businessSettings)
        .set({ logoData, updatedAt: new Date() })
        .where(eq(businessSettings.id, latest.id));
    } else {
      await db.insert(businessSettings).values({ logoData });
    }

    return NextResponse.json({ success: true, logoData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
