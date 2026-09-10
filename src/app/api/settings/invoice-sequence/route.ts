// src/app/api/settings/invoice-sequence/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import {
  getNextInvoiceNumber,
  setCustomInvoiceSequence,
} from "@/lib/invoice-number";

export async function GET() {
  try {
    await requireUser();
    const nextInvoiceNumber = await getNextInvoiceNumber();
    return NextResponse.json({ nextInvoiceNumber });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json().catch(() => null);
    const customNumber = body?.nextInvoiceNumber;

    if (!customNumber || typeof customNumber !== "string" || !customNumber.trim()) {
      return NextResponse.json(
        { error: "Please enter a valid invoice number." },
        { status: 400 }
      );
    }

    const updated = await setCustomInvoiceSequence(customNumber.trim());
    return NextResponse.json({
      nextInvoiceNumber: updated,
      message: `Invoice series updated. Next invoice will start from ${updated}.`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
