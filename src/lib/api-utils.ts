import { NextResponse } from "next/server";
import { ForbiddenError, UnauthorizedError } from "./session";

export function handleApiError(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json(
      { error: "You don't have access to do that" },
      { status: 403 }
    );
  }
  console.error(err);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
