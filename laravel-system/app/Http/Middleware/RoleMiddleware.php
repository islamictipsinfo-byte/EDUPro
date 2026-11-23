<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (!$user || $user->account_status !== 'active') {
            abort(403, 'This account is not active.');
        }

        foreach ($roles as $required) {
            if ($user->hasRole($required)) {
                return $next($request);
            }
        }

        abort(403, 'Unauthorized role access.');
    }
}
