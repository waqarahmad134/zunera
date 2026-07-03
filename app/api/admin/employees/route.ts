import { NextRequest, NextResponse } from "next/server";
import { createEmployee, listEmployees } from "@/lib/db";
import { EMPLOYEE_STATUSES, type EmployeeStatus } from "@/lib/employees";
import { hashPassword } from "@/lib/password";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");

  if (status && !EMPLOYEE_STATUSES.includes(status as EmployeeStatus)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  try {
    const employees = await listEmployees({
      status: (status as EmployeeStatus) || undefined,
      search: search || undefined,
    });
    return NextResponse.json({ employees });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load employees" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const name = String(body?.name ?? "").trim();
  const phone = body?.phone ? String(body.phone).trim() : "";
  const role = String(body?.role ?? "").trim();
  const salary = Number(body?.salary);
  const joinedDate = String(body?.joinedDate ?? "").trim();
  const status = (body?.status || "active") as EmployeeStatus;
  const password = body?.password ? String(body.password) : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: "Role is required." }, { status: 400 });
  }
  if (!Number.isFinite(salary) || salary <= 0) {
    return NextResponse.json({ error: "Salary must be a positive number." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joinedDate)) {
    return NextResponse.json({ error: "A valid joining date is required." }, { status: 400 });
  }
  if (!EMPLOYEE_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (password && !phone) {
    return NextResponse.json(
      { error: "A phone number is required to set a staff login password." },
      { status: 400 }
    );
  }

  try {
    const passwordHash = password ? await hashPassword(password) : null;
    const employee = await createEmployee({ name, phone, role, salary, joinedDate, status }, passwordHash);
    return NextResponse.json({ employee }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create employee" },
      { status: 500 }
    );
  }
}
