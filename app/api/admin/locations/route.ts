import { NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { listEmployeeLocations } from "@/lib/db";

export async function GET() {
  const locations = await listEmployeeLocations();
  return cached(NextResponse.json({ locations }), 8);
}
