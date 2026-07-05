// Proxies lat/lng -> a human-readable address via OpenStreetMap's free
// Nominatim reverse endpoint (same provider already used for forward
// geocoding and the live map's tiles). Proxied server-side so we can set the
// User-Agent their usage policy requires and cache repeat lookups.
import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";

interface NominatimReverseResult {
  display_name?: string;
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required." }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "JubileeWaterAdmin/1.0 (internal order-assignment tool)" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Reverse geocoding service unavailable." }, { status: 502 });
    }

    const result = (await res.json()) as NominatimReverseResult;
    return cached(NextResponse.json({ address: result.display_name ?? null }), 3600);
  } catch {
    return NextResponse.json({ error: "Reverse geocoding service unavailable." }, { status: 502 });
  }
}
