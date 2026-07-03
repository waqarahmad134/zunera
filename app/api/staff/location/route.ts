// Employee's own device posts its location periodically while the staff
// app is open. employeeId comes strictly from the verified session.
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/current-session";
import { saveEmployeeLocation } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "employee" || !session.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const accuracy = body?.accuracy !== undefined && body?.accuracy !== null ? Number(body.accuracy) : null;

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  await saveEmployeeLocation(session.id, lat, lng, Number.isFinite(accuracy) ? accuracy : null);
  return NextResponse.json({ ok: true });
}
