import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { getCustomerBalance } from "@/lib/db";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const balance = await getCustomerBalance(id);
    return cached(NextResponse.json({ balance }), 8);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load balance" },
      { status: 500 }
    );
  }
}
