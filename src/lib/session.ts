import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  username: string;
  role: "admin" | "staff";
};

export type AppSession = {
  user?: SessionUser;
};

const sessionPassword = process.env.SESSION_SECRET;

if (!sessionPassword || sessionPassword.length < 32) {
  // Only throw at request time (not build time) in production usage;
  // for local dev, set SESSION_SECRET in .env.local to any string 32+ chars.
  console.warn(
    "SESSION_SECRET is missing or shorter than 32 characters. Set it in .env.local."
  );
}

export const sessionOptions: SessionOptions = {
  password: sessionPassword || "dev-only-insecure-secret-change-me-please-32+",
  cookieName: "invoiceapp_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<AppSession>> {
  const cookieStore = await cookies();
  return getIronSession<AppSession>(cookieStore, sessionOptions);
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session.user) {
    throw new UnauthorizedError();
  }
  return session.user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new ForbiddenError();
  }
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}
