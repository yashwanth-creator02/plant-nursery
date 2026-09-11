// src/app/api/export/image/route.ts

import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { businessSettings, users } from "@/db/schema";
import { requireUser } from "@/lib/session";

function dataUriToBuffer(dataUri: string): { buffer: Buffer; contentType: string } | null {
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  return { buffer, contentType };
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireUser();
    if (sessionUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");

    // 1. Payment QR code
    if (type === "qr") {
      const [latest] = await db
        .select({ qrCodeData: businessSettings.qrCodeData })
        .from(businessSettings)
        .orderBy(desc(businessSettings.version))
        .limit(1);

      if (!latest?.qrCodeData) {
        return NextResponse.json({ error: "No QR code configured" }, { status: 404 });
      }

      const parsed = dataUriToBuffer(latest.qrCodeData);
      if (parsed) {
        return new NextResponse(new Uint8Array(parsed.buffer), {
          headers: {
            "Content-Type": parsed.contentType,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 });
    }

    // 2. User Signature
    if (userId) {
      const [u] = await db
        .select({ signature: users.signature })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!u?.signature) {
        return NextResponse.json({ error: "No signature found for user" }, { status: 404 });
      }

      if (u.signature.startsWith("data:image")) {
        const parsed = dataUriToBuffer(u.signature);
        if (parsed) {
          return new NextResponse(new Uint8Array(parsed.buffer), {
            headers: {
              "Content-Type": parsed.contentType,
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      }

      if (u.signature.startsWith("http")) {
        const res = await fetch(u.signature);
        if (!res.ok) throw new Error(`Failed to fetch signature image: ${res.statusText}`);
        const arrayBuf = await res.arrayBuffer();
        const contentType = res.headers.get("content-type") || "image/png";
        return new NextResponse(arrayBuf, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }

      return NextResponse.json({ error: "Unsupported signature format" }, { status: 400 });
    }

    // 3. Direct URL proxy
    if (url) {
      if (url.startsWith("data:image")) {
        const parsed = dataUriToBuffer(url);
        if (parsed) {
          return new NextResponse(new Uint8Array(parsed.buffer), {
            headers: {
              "Content-Type": parsed.contentType,
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to proxy image: ${res.statusText}`);
      const arrayBuf = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || "image/jpeg";
      return new NextResponse(arrayBuf, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    return NextResponse.json({ error: "Missing url, userId, or type parameter" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Image export proxy error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
