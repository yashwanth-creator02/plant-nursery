import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { uploadUserSignature, deleteUserSignature } from "@/lib/supabase-storage";

export async function GET() {
  try {
    const sessionUser = await requireUser();

    const [dbUser] = await db
      .select({
        id: users.id,
        signature: users.signature,
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    return NextResponse.json({
      signature: dbUser?.signature || null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const saveSignatureSchema = z.object({
  signature: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const body = await req.json().catch(() => null);

    const parsed = saveSignatureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const rawSignature = parsed.data.signature?.trim();

    // Case 1: Clearing signature
    if (!rawSignature) {
      await deleteUserSignature(sessionUser.id);
      await db
        .update(users)
        .set({ signature: null })
        .where(eq(users.id, sessionUser.id));

      return NextResponse.json({ signature: null });
    }

    // Case 2: Drawn signature (base64 data URL)
    if (rawSignature.startsWith("data:image")) {
      const match = rawSignature.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid signature image format." },
          { status: 400 }
        );
      }

      const contentType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");

      const { imageUrl } = await uploadUserSignature({
        userId: sessionUser.id,
        fileBuffer: buffer,
        contentType,
      });

      await db
        .update(users)
        .set({ signature: imageUrl })
        .where(eq(users.id, sessionUser.id));

      return NextResponse.json({ signature: imageUrl });
    }

    // Case 3: Typed signature (e.g. "text:S. V. Lakshmi") or existing URL
    await db
      .update(users)
      .set({ signature: rawSignature })
      .where(eq(users.id, sessionUser.id));

    return NextResponse.json({ signature: rawSignature });
  } catch (err) {
    console.error("Signature save error:", err);
    return handleApiError(err);
  }
}
