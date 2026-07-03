import { NextResponse } from "next/server";
import { listEmployeeLocations } from "@/lib/db";

export async function GET() {
  const locations = await listEmployeeLocations();
  return NextResponse.json({ locations });
}
