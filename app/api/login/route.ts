import { NextRequest, NextResponse } from "next/server";
import { adminSecret } from "@/lib/auth";
import { getCustomerByPhone, getEmployeeByPhone } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTS, type Role } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  let role: Role;
  let id: number | undefined;
  let name: string | undefined;
  let redirect: string;

  if (!phone) {
    const secret = await adminSecret();
    if (!secret) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD is not configured on the server." },
        { status: 500 }
      );
    }
    if (password !== secret) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    role = "admin";
    redirect = "/admin";
  } else {
    const employee = await getEmployeeByPhone(phone);
    if (
      employee?.passwordHash &&
      employee.status === "active" &&
      (await verifyPassword(password, employee.passwordHash))
    ) {
      role = "employee";
      id = employee.id;
      name = employee.name;
      redirect = "/staff";
    } else {
      const customer = await getCustomerByPhone(phone);
      if (customer?.passwordHash && (await verifyPassword(password, customer.passwordHash))) {
        role = "customer";
        id = customer.id;
        name = customer.name;
        redirect = "/portal";
      } else {
        return NextResponse.json({ error: "Incorrect phone number or password." }, { status: 401 });
      }
    }
  }

  const token = await createSessionToken({ role, id, name });
  if (!token) {
    return NextResponse.json({ error: "Could not create session." }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, role, redirect });
  res.cookies.set(SESSION_COOKIE, token, {
    ...SESSION_COOKIE_OPTS,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
