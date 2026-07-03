import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type Role } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/api/login"];

const ROLE_PREFIXES: { prefix: string; role: Role }[] = [
  { prefix: "/api/admin", role: "admin" },
  { prefix: "/admin", role: "admin" },
  { prefix: "/api/staff", role: "employee" },
  { prefix: "/staff", role: "employee" },
  { prefix: "/api/portal", role: "customer" },
  { prefix: "/portal", role: "customer" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const match = ROLE_PREFIXES.find((r) => pathname.startsWith(r.prefix));
  if (!match) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (session && session.role === match.role) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/staff/:path*",
    "/api/staff/:path*",
    "/portal/:path*",
    "/api/portal/:path*",
  ],
};
