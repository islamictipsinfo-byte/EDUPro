<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\ExamAttempt;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdvancedLmsController extends Controller
{
    public function analytics()
    {
        return response()->json([
            'students' => User::where('role', 'student')->count(),
            'courses' => Course::count(),
            'enrollments' => Enrollment::count(),
            'exam_attempts' => ExamAttempt::count(),
            'certificates' => Certificate::count(),
            'approved_revenue' => (int) Enrollment::where('status', 'approved')->sum('amount_paid'),
        ]);
    }

    public function issueCertificate(Request $request)
    {
        $data = $request->validate(['user_id' => 'required|exists:users,id', 'course_id' => 'required|exists:courses,id']);
        abort_unless(Enrollment::where($data)->where('status', 'approved')->exists(), 422, 'Approved enrollment required.');

        $certificate = Certificate::updateOrCreate(
            $data,
            ['certificate_number' => 'EDU-' . strtoupper(Str::random(10)), 'issued_at' => now(), 'metadata' => ['issued_by' => $request->user()->id]]
        );

        DB::table('audit_logs')->insert([
            'actor_id' => $request->user()->id, 'action' => 'certificate_issued', 'entity_type' => Certificate::class,
            'entity_id' => $certificate->id, 'new_values' => json_encode(['certificate_number' => $certificate->certificate_number]),
            'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json($certificate, 201);
    }
}
