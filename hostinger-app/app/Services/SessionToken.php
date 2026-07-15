<?php

namespace App\Services;

// Signed bearer tokens for all three roles (admin/employee/customer),
// stored client-side and sent as `Authorization: Bearer <token>`. Same
// signed-payload shape as the old Next.js app's session cookie, just
// delivered as a token instead of a cookie so a same-origin cookie/CSRF
// story isn't required for the decoupled SPA.
class SessionToken
{
    private const TTL_SECONDS = 60 * 60 * 24 * 30;

    public static function create(string $role, ?int $id = null, ?string $name = null): string
    {
        $payload = [
            'role' => $role,
            'id' => $id,
            'name' => $name,
            'exp' => time() + self::TTL_SECONDS,
        ];
        $payloadB64 = self::base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', $payloadB64, self::secret());

        return "{$payloadB64}.{$signature}";
    }

    /** @return array{role:string,id:?int,name:?string,exp:int}|null */
    public static function verify(?string $token): ?array
    {
        if (!$token) {
            return null;
        }

        $dot = strrpos($token, '.');
        if ($dot === false) {
            return null;
        }

        $payloadB64 = substr($token, 0, $dot);
        $signature = substr($token, $dot + 1);
        $expected = hash_hmac('sha256', $payloadB64, self::secret());

        if (!hash_equals($expected, $signature)) {
            return null;
        }

        $decoded = json_decode(self::base64UrlDecode($payloadB64), true);
        if (!is_array($decoded) || !isset($decoded['exp']) || !is_int($decoded['exp']) || $decoded['exp'] < time()) {
            return null;
        }
        if (!in_array($decoded['role'] ?? null, ['admin', 'employee', 'customer'], true)) {
            return null;
        }

        return $decoded;
    }

    private static function secret(): string
    {
        return config('app.key');
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
