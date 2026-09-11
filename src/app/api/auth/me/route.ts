import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-utils";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const dbUser = await getAuthenticatedUser();
    return NextResponse.json({
      user: {
        id: dbUser.id,
        username: dbUser.username,
        role: dbUser.role,
        signature: dbUser.signature || null,
      },
    });
  } catch {
    return NextResponse.json({ user: session.user }, { status: 200 });
  }
}
