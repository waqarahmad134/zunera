// Proxies address text -> lat/lng via OpenStreetMap's free Nominatim search
// (same provider already used for the live map's tiles). Proxied server-side
// rather than called directly from the browser so we can set the User-Agent
// their usage policy requires and cache repeat lookups for the same address.
import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";

interface NominatimResult {
  lat: string;
  lon: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "A query is required." }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "JubileeWaterAdmin/1.0 (internal order-assignment tool)" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding service unavailable." }, { status: 502 });
    }

    const results = (await res.json()) as NominatimResult[];
    if (!Array.isArray(results) || results.length === 0) {
      return cached(NextResponse.json({ location: null }), 3600);
    }

    const location = { lat: Number(results[0].lat), lng: Number(results[0].lon) };
    return cached(NextResponse.json({ location }), 3600);
  } catch {
    return NextResponse.json({ error: "Geocoding service unavailable." }, { status: 502 });
  }
}
