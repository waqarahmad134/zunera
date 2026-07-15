import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/auth";

// NOTE: kept as `middleware.ts` (not the newer `proxy.ts`) on purpose. Next.js
// runs proxy on the Node.js runtime, which the Cloudflare adapter (OpenNext)
// does not support — it requires Edge middleware. The "middleware is
// deprecated" build notice is expected and harmless here.

const PUBLIC_PATHS = ["/admin/login", "/api/admin/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const expected = await adminToken();
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (expected && token === expected) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
