<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

// Proxies OpenStreetMap's free Nominatim service server-side so we can set
// the User-Agent their usage policy requires and cache repeat lookups.
class GeocodeController extends Controller
{
    private const USER_AGENT = 'JubileeWaterAdmin/1.0 (internal order-assignment tool)';

    public function geocode(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if ($q === '') {
            return response()->json(['error' => 'A query is required.'], 400);
        }

        $cacheKey = 'geocode:' . md5($q);

        $location = cache()->remember($cacheKey, 3600, function () use ($q) {
            $res = Http::withHeaders(['User-Agent' => self::USER_AGENT])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $q,
                    'format' => 'jsonv2',
                    'limit' => 1,
                ]);

            if (!$res->successful()) {
                return ['__error' => true];
            }

            $results = $res->json();
            if (!is_array($results) || count($results) === 0) {
                return null;
            }

            return ['lat' => (float) $results[0]['lat'], 'lng' => (float) $results[0]['lon']];
        });

        if (is_array($location) && ($location['__error'] ?? false)) {
            return response()->json(['error' => 'Geocoding service unavailable.'], 502);
        }

        return response()->json(['location' => $location]);
    }

    public function reverseGeocode(Request $request): JsonResponse
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        if (!is_numeric($lat) || !is_numeric($lng)) {
            return response()->json(['error' => 'lat and lng are required.'], 400);
        }

        $cacheKey = 'reverse-geocode:' . $lat . ':' . $lng;

        $address = cache()->remember($cacheKey, 3600, function () use ($lat, $lng) {
            $res = Http::withHeaders(['User-Agent' => self::USER_AGENT])
                ->get('https://nominatim.openstreetmap.org/reverse', [
                    'lat' => $lat,
                    'lon' => $lng,
                    'format' => 'jsonv2',
                ]);

            if (!$res->successful()) {
                return ['__error' => true];
            }

            return $res->json('display_name');
        });

        if (is_array($address) && ($address['__error'] ?? false)) {
            return response()->json(['error' => 'Reverse geocoding service unavailable.'], 502);
        }

        return response()->json(['address' => $address]);
    }
}
