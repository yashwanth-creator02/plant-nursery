import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuthenticatedUser, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    return NextResponse.json({
      proprietorName: user.proprietorName || null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const saveProfileSchema = z.object({
  proprietorName: z.string().trim().max(120).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json().catch(() => null);
    const parsed = saveProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const proprietorName = parsed.data.proprietorName?.trim() || null;

    await db
      .update(users)
      .set({ proprietorName })
      .where(eq(users.id, user.id));

    return NextResponse.json({ proprietorName });
  } catch (err) {
    console.error("Profile save error:", err);
    return handleApiError(err);
  }
}
