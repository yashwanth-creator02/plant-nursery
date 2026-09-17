import { NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["en", "kn"];
const DEFAULT_LOCALE = "en";

export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  // 1. Skip API routes, Next.js internal assets, and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Check if pathname already starts with a supported locale (/en or /kn)
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const firstSegment = pathnameSegments[0];
  const isLocaleInPath = SUPPORTED_LOCALES.includes(firstSegment);

  if (isLocaleInPath) {
    const locale = firstSegment;
    // Strip locale from path to rewrite internally to original page route
    // e.g. /en/stock -> /stock, /kn -> /
    const remainingPath = "/" + pathnameSegments.slice(1).join("/");
    const targetUrl = new URL(remainingPath + search, request.url);

    const response = NextResponse.rewrite(targetUrl);
    response.cookies.set("svl_language", locale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    response.headers.set("x-language", locale);
    return response;
  }

  // 3. No locale prefix in URL -> Detect language from Cookie or Accept-Language header
  const savedCookie = request.cookies.get("svl_language")?.value;
  let targetLocale = DEFAULT_LOCALE;

  if (savedCookie && SUPPORTED_LOCALES.includes(savedCookie)) {
    targetLocale = savedCookie;
  } else {
    // Read browser's incoming Accept-Language header
    const acceptLanguage = request.headers.get("accept-language") || "";
    if (acceptLanguage.toLowerCase().includes("kn")) {
      targetLocale = "kn";
    }
  }

  // 4. Redirect to localized URL: e.g. /stock -> /en/stock or /kn/stock
  const redirectUrl = new URL(`/${targetLocale}${pathname}${search}`, request.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("svl_language", targetLocale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};
