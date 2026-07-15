<?php

namespace App\Http\Middleware;

use App\Services\SessionToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $session = SessionToken::verify($request->bearerToken());

        if (!$session || $session['role'] !== $role) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $request->attributes->set('session', $session);

        return $next($request);
    }
}
