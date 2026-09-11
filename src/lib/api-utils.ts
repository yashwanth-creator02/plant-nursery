import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ForbiddenError, UnauthorizedError, getSession } from "./session";

export async function getAuthenticatedUser() {
  const session = await getSession();
  if (!session.user) {
    throw new UnauthorizedError();
  }

  const isUuid =
    typeof session.user.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      session.user.id
    );

  let dbUser = null;

  if (isUuid) {
    const [found] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    dbUser = found;
  }

  if (!dbUser && session.user.username) {
    const [found] = await db
      .select()
      .from(users)
      .where(eq(users.username, session.user.username.toLowerCase()))
      .limit(1);
    dbUser = found;

    // Self-heal the session cookie with the real DB user UUID
    if (dbUser) {
      session.user = {
        id: dbUser.id,
        username: dbUser.username,
        role: dbUser.role,
      };
      await session.save();
    }
  }

  if (!dbUser) {
    throw new UnauthorizedError();
  }

  return dbUser;
}

export function handleApiError(err: unknown) {
  if (
    err instanceof UnauthorizedError ||
    (typeof err === "object" && err !== null && (err as any).name === "UnauthorizedError")
  ) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (
    err instanceof ForbiddenError ||
    (typeof err === "object" && err !== null && (err as any).name === "ForbiddenError")
  ) {
    return NextResponse.json(
      { error: "You don't have access to do that" },
      { status: 403 }
    );
  }
  console.error("API Error:", err);
  const message =
    err instanceof Error ? err.message : "Something went wrong. Please try again.";
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}
