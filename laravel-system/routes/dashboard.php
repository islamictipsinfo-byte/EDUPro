<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('portal/dashboard')->name('portal.dashboard.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('index');
    Route::get('/data', [DashboardController::class, 'refresh'])->name('data');
    Route::get('/search', [DashboardController::class, 'search'])->name('search');
    Route::put('/layout', [DashboardController::class, 'save'])->name('layout.save');
    Route::delete('/layout', [DashboardController::class, 'reset'])->name('layout.reset');
});
