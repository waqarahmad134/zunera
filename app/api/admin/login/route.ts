import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminSecret, adminToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const secret = await adminSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured on the server." },
      { status: 500 }
    );
  }

  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || password !== secret) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await adminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
