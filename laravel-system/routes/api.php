<?php

use App\Http\Controllers\AdvancedLmsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    Route::get('/analytics', [AdvancedLmsController::class, 'analytics']);
    Route::post('/certificates', [AdvancedLmsController::class, 'issueCertificate'])->middleware('role:admin');
});
