import { NextRequest, NextResponse } from "next/server";
import { deleteEmployee, updateEmployee } from "@/lib/db";
import { EMPLOYEE_STATUSES, type EmployeeStatus } from "@/lib/employees";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const update: {
    name?: string;
    phone?: string | null;
    role?: string;
    salary?: number;
    joinedDate?: string;
    status?: EmployeeStatus;
  } = {};

  if (body.name !== undefined) {
    const v = String(body.name).trim();
    if (!v) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    update.name = v;
  }
  if (body.phone !== undefined) {
    update.phone = body.phone ? String(body.phone).trim() : null;
  }
  if (body.role !== undefined) {
    const v = String(body.role).trim();
    if (!v) return NextResponse.json({ error: "Role cannot be empty." }, { status: 400 });
    update.role = v;
  }
  if (body.salary !== undefined) {
    const v = Number(body.salary);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json({ error: "Salary must be a positive number." }, { status: 400 });
    }
    update.salary = v;
  }
  if (body.joinedDate !== undefined) {
    const v = String(body.joinedDate).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return NextResponse.json({ error: "A valid joining date is required." }, { status: 400 });
    }
    update.joinedDate = v;
  }
  if (body.status !== undefined) {
    if (!EMPLOYEE_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    update.status = body.status;
  }

  try {
    const employee = await updateEmployee(id, update);
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    return NextResponse.json({ employee });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await deleteEmployee(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not delete employee" },
      { status: 500 }
    );
  }
}
