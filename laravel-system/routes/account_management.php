<?php

use App\Http\Controllers\AccountManagementController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:users.manage'])->prefix('portal/users')->name('portal.users.')->group(function () {
    Route::get('/', [AccountManagementController::class, 'index'])->name('index');
    Route::post('/', [AccountManagementController::class, 'store'])->name('store');
    Route::patch('/{user}/status', [AccountManagementController::class, 'updateStatus'])->name('status');
    Route::post('/{user}/roles', [AccountManagementController::class, 'assignRole'])->name('roles.assign');
    Route::delete('/{user}/roles/{role}', [AccountManagementController::class, 'removeRole'])->name('roles.remove');
    Route::put('/{user}/password', [AccountManagementController::class, 'resetPassword'])->name('password.reset');
});
