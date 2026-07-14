import { NextResponse } from "next/server";
import { suggestReceiptNo } from "@/lib/db";

export async function GET() {
  try {
    const receiptNo = await suggestReceiptNo();
    return NextResponse.json({ receiptNo });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not suggest a receipt number" },
      { status: 500 }
    );
  }
}
