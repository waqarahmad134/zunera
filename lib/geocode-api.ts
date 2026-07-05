// Shared forward/reverse geocode handlers, reused by the /api/admin and
// /api/staff geocode routes. Proxies OpenStreetMap's free Nominatim service
// server-side so we can set the User-Agent their usage policy requires and
// cache repeat lookups.
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cached } from "./api-cache";

const USER_AGENT = "JubileeWaterAdmin/1.0 (internal order-assignment tool)";

interface NominatimSearchResult {
  lat: string;
  lon: string;
}

interface NominatimReverseResult {
  display_name?: string;
}

export async function handleGeocode(req: NextRequest): Promise<NextResponse> {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "A query is required." }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding service unavailable." }, { status: 502 });
    }

    const results = (await res.json()) as NominatimSearchResult[];
    if (!Array.isArray(results) || results.length === 0) {
      return cached(NextResponse.json({ location: null }), 3600);
    }

    const location = { lat: Number(results[0].lat), lng: Number(results[0].lon) };
    return cached(NextResponse.json({ location }), 3600);
  } catch {
    return NextResponse.json({ error: "Geocoding service unavailable." }, { status: 502 });
  }
}

export async function handleReverseGeocode(req: NextRequest): Promise<NextResponse> {
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
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      return NextResponse.json({ error: "Reverse geocoding service unavailable." }, { status: 502 });
    }

    const result = (await res.json()) as NominatimReverseResult;
    return cached(NextResponse.json({ address: result.display_name ?? null }), 3600);
  } catch {
    return NextResponse.json({ error: "Reverse geocoding service unavailable." }, { status: 502 });
  }
}
