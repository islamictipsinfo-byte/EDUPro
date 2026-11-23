<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();
        if (!$user || ($user->account_status ?? 'active') !== 'active') abort(403, 'This account is not active.');
        foreach ($permissions as $permission) {
            if ($user->hasPermission($permission)) return $next($request);
        }
        abort(403, 'The account does not have the required permission.');
    }
}
