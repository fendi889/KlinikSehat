<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(240)->by($r->user()?->id ?: $r->ip()));

        ResetPassword::createUrlUsing(fn ($user, string $token) =>
            rtrim(trim(explode(',', env('FRONTEND_URL', 'http://localhost:5173'))[0]), '/').'/reset-password?token='.$token.'&email='.urlencode($user->email));
    }
}
