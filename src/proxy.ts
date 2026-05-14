import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }

  return "dev-only-avivadash-session-secret";
}

const JWT_SECRET = new TextEncoder().encode(getJwtSecret());
const COOKIE_NAME = "avivadash-session";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next/image")) {
    const sourceImage = request.nextUrl.searchParams.get("url") ?? "";
    if (!sourceImage.startsWith("/uploads/")) {
      return NextResponse.next();
    }
  } else if (
    // Allow static assets, API, _next
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    (!pathname.startsWith("/uploads") && pathname.includes("."))
  ) {
    return NextResponse.next();
  }

  // Check session
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Invalid/expired token
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
