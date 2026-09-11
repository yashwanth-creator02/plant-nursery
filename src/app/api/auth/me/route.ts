import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const [dbUser] = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      signature: users.signature,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!dbUser) {
    return NextResponse.json({ user: session.user }, { status: 200 });
  }

  return NextResponse.json({ user: dbUser });
}
