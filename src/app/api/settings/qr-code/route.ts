import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    await requireUser();

    const [settings] = await db
      .select({ qrCodeData: businessSettings.qrCodeData })
      .from(businessSettings)
      .orderBy(desc(businessSettings.version))
      .limit(1);

    return NextResponse.json({
      qrCodeData: settings?.qrCodeData ?? null,
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
        { error: "Only admins can update the payment QR code." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const qrCodeData: string | null = body.qrCodeData ?? null;

    // Validate it is a data URI if provided
    if (qrCodeData && !qrCodeData.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "QR code must be a valid image data URI (e.g. data:image/png;base64,...)." },
        { status: 400 }
      );
    }

    const [latest] = await db
      .select({ id: businessSettings.id })
      .from(businessSettings)
      .orderBy(desc(businessSettings.version))
      .limit(1);

    if (latest) {
      await db
        .update(businessSettings)
        .set({ qrCodeData, updatedAt: new Date() })
        .where(eq(businessSettings.id, latest.id));
    } else {
      await db.insert(businessSettings).values({ qrCodeData });
    }

    return NextResponse.json({ success: true, qrCodeData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
