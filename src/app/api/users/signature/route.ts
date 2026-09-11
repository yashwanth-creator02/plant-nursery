import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuthenticatedUser, handleApiError } from "@/lib/api-utils";
import { uploadUserSignature, deleteUserSignature } from "@/lib/supabase-storage";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    return NextResponse.json({
      signature: user.signature || null,
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
    const user = await getAuthenticatedUser();
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
      await deleteUserSignature(user.id);
      await db
        .update(users)
        .set({ signature: null })
        .where(eq(users.id, user.id));

      return NextResponse.json({ signature: null });
    }

    // Case 2: Drawn signature (base64 data URL)
    if (rawSignature.startsWith("data:image")) {
      const commaIdx = rawSignature.indexOf(",");
      if (commaIdx === -1) {
        return NextResponse.json(
          { error: "Invalid signature image format." },
          { status: 400 }
        );
      }

      const header = rawSignature.slice(0, commaIdx);
      const base64Data = rawSignature.slice(commaIdx + 1).replace(/\s+/g, "");
      const mimeMatch = header.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64/);
      const contentType = mimeMatch ? mimeMatch[1] : "image/png";
      const buffer = Buffer.from(base64Data, "base64");

      const { imageUrl } = await uploadUserSignature({
        userId: user.id,
        fileBuffer: buffer,
        contentType,
      });

      await db
        .update(users)
        .set({ signature: imageUrl })
        .where(eq(users.id, user.id));

      return NextResponse.json({ signature: imageUrl });
    }

    // Case 3: Typed signature (e.g. "text:S. V. Lakshmi") or existing URL
    await db
      .update(users)
      .set({ signature: rawSignature })
      .where(eq(users.id, user.id));

    return NextResponse.json({ signature: rawSignature });
  } catch (err) {
    console.error("Signature save error:", err);
    return handleApiError(err);
  }
}
