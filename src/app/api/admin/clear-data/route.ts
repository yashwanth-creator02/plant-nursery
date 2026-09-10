import { NextResponse } from "next/server";
import { ne } from "drizzle-orm";
import { db } from "@/db";
import { invoiceItems, invoices, stockItems, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

export async function POST() {
  try {
    const admin = await requireAdmin();

    await db.transaction(async (tx) => {
      // 1. Delete all invoice line items
      await tx.delete(invoiceItems);
      // 2. Delete all invoices
      await tx.delete(invoices);
      // 3. Delete all stock items
      await tx.delete(stockItems);
      // 4. Delete all other users except the current admin
      await tx.delete(users).where(ne(users.id, admin.id));
    });

    return NextResponse.json({
      ok: true,
      message: "Database wiped successfully.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

