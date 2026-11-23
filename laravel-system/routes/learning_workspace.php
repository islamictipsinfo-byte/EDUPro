<?php

use App\Http\Controllers\LearningWorkspaceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('portal/workspace')->name('portal.workspace.')->group(function () {
    Route::get('/student', [LearningWorkspaceController::class, 'studentHome'])->name('student')->middleware('role:student');
    Route::get('/teacher', [LearningWorkspaceController::class, 'teacherHome'])->name('teacher')->middleware('role:teacher');
    Route::get('/notices', [LearningWorkspaceController::class, 'notices'])->name('notices');
    Route::post('/notices/{notice}/read', [LearningWorkspaceController::class, 'markNoticeRead'])->name('notices.read');
    Route::post('/attendance/check-in', [LearningWorkspaceController::class, 'checkIn'])->name('attendance.checkin');
    Route::post('/attendance/check-out', [LearningWorkspaceController::class, 'checkOut'])->name('attendance.checkout');
    Route::post('/assignments', [LearningWorkspaceController::class, 'storeAssignment'])->name('assignments.store')->middleware('permission:assignments.manage');
    Route::post('/assignments/{assignment}/submit', [LearningWorkspaceController::class, 'submitAssignment'])->name('assignments.submit')->middleware('role:student');
    Route::patch('/submissions/{submission}/grade', [LearningWorkspaceController::class, 'gradeSubmission'])->name('submissions.grade')->middleware('permission:assignments.manage');
    Route::post('/documents', [LearningWorkspaceController::class, 'uploadDocument'])->name('documents.store')->middleware('role:student');
    Route::get('/documents/{document}', [LearningWorkspaceController::class, 'downloadDocument'])->name('documents.download');
    Route::post('/invoices', [LearningWorkspaceController::class, 'createInvoice'])->name('invoices.store')->middleware('permission:fees.manage');
    Route::post('/invoices/{invoice}/payments', [LearningWorkspaceController::class, 'recordPayment'])->name('invoices.payments.store');
});
