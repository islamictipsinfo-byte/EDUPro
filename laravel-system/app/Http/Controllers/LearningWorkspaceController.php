<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\Notice;
use App\Models\StudentDocument;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class LearningWorkspaceController extends Controller
{
    public function studentHome(Request $request)
    {
        $user = $request->user();
        abort_unless($user->hasRole('student'), 403);
        $enrollments = $user->enrollments()->with(['course.lessons', 'branch'])->latest()->get();
        $assignments = Assignment::where('status', 'published')
            ->whereIn('course_id', $enrollments->pluck('course_id'))
            ->with(['course', 'submissions' => fn ($q) => $q->where('student_id', $user->id)])
            ->latest()->get();
        $invoices = FeeInvoice::where('student_id', $user->id)->with('payments')->latest()->get();
        $documents = StudentDocument::where('student_id', $user->id)->latest()->get();
        $notices = $this->visibleNotices($user)->latest('published_at')->limit(20)->get();
        $attendance = AttendanceRecord::where('target_id', $user->id)->latest('attendance_date')->limit(30)->get();
        return view('portal.student_workspace', compact('user', 'enrollments', 'assignments', 'invoices', 'documents', 'notices', 'attendance'));
    }

    public function teacherHome(Request $request)
    {
        $user = $request->user();
        abort_unless($user->hasRole('teacher'), 403);
        $assignments = Assignment::where('teacher_id', $user->id)->with(['course', 'batch'])->withCount(['submissions as pending_submissions' => fn ($q) => $q->where('status', 'submitted')])->latest()->get();
        $pending = AssignmentSubmission::whereHas('assignment', fn ($q) => $q->where('teacher_id', $user->id))
            ->where('status', 'submitted')->with(['student', 'assignment.course'])->latest()->limit(50)->get();
        $attendance = AttendanceRecord::where('target_id', $user->id)->latest('attendance_date')->limit(30)->get();
        return view('portal.teacher_workspace', compact('user', 'assignments', 'pending', 'attendance'));
    }

    public function storeAssignment(Request $request)
    {
        $data = $request->validate([
            'course_id' => ['required', 'exists:courses,id'], 'batch_id' => ['nullable', 'exists:batches,id'],
            'title' => ['required', 'string', 'max:180'], 'instructions' => ['required', 'string', 'max:20000'],
            'due_at' => ['nullable', 'date', 'after:now'], 'max_marks' => ['required', 'integer', 'min:1', 'max:10000'],
        ]);
        if (!empty($data['batch_id'])) abort_unless(DB::table('batches')->where('id', $data['batch_id'])->where('course_id', $data['course_id'])->exists(), 422);
        Assignment::create($data + ['teacher_id' => $request->user()->id, 'status' => 'published']);
        return back()->with('status', 'Assignment published to EduPro learners.');
    }

    public function submitAssignment(Request $request, Assignment $assignment)
    {
        $user = $request->user();
        abort_unless($user->hasRole('student'), 403);
        abort_unless($assignment->status === 'published' && $user->enrollments()->where('course_id', $assignment->course_id)->where('status', 'approved')->exists(), 403);
        $data = $request->validate([
            'answer_text' => ['nullable', 'string', 'max:20000'],
            'file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,doc,docx,txt,jpg,jpeg,png'],
        ]);
        if (empty($data['answer_text']) && !$request->hasFile('file')) return back()->withErrors(['submission' => 'Add an answer or attach a supported file.']);
        $previous = AssignmentSubmission::where('assignment_id', $assignment->id)->where('student_id', $user->id)->first();
        if ($previous && $previous->status === 'graded') return back()->withErrors(['submission' => 'A graded submission cannot be replaced. Contact your teacher.']);
        $path = $request->hasFile('file') ? $request->file('file')->store('edupro/assignments/' . $user->id, 'local') : $previous?->file_path;
        $submittedAt = now();
        $status = $assignment->due_at && $submittedAt->gt($assignment->due_at) ? 'late' : 'submitted';
        AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $assignment->id, 'student_id' => $user->id],
            ['answer_text' => $data['answer_text'] ?? null, 'file_path' => $path, 'submitted_at' => $submittedAt, 'status' => $status]
        );
        return back()->with('status', 'Assignment submission saved.');
    }

    public function gradeSubmission(Request $request, AssignmentSubmission $submission)
    {
        $assignment = $submission->assignment;
        abort_unless($request->user()->hasRole('admin') || $assignment->teacher_id === $request->user()->id, 403);
        $data = $request->validate([
            'marks_awarded' => ['required', 'integer', 'min:0', 'max:' . $assignment->max_marks],
            'teacher_feedback' => ['nullable', 'string', 'max:10000'],
        ]);
        $submission->update($data + ['status' => 'graded', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        return back()->with('status', 'Submission graded and feedback saved.');
    }

    public function uploadDocument(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'document_type' => ['required', 'string', 'max:80'],
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,doc,docx'],
        ]);
        $file = $request->file('file');
        $path = $file->store('edupro/student-documents/' . $user->id, 'local');
        StudentDocument::create([
            'student_id' => $user->id, 'uploaded_by' => $user->id, 'document_type' => $data['document_type'],
            'original_name' => Str::limit(basename($file->getClientOriginalName()), 180, ''),
            'storage_path' => $path, 'size_bytes' => $file->getSize(), 'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
        ]);
        return back()->with('status', 'Document stored in private EduPro storage.');
    }

    public function downloadDocument(Request $request, StudentDocument $document)
    {
        $user = $request->user();
        $allowed = $document->student_id === $user->id
            || $user->hasRole('admin')
            || ($user->hasRole('branch_manager') && User::whereKey($document->student_id)->where('branch_id', $user->branch_id)->exists());
        abort_unless($allowed, 404);
        abort_unless(Storage::disk('local')->exists($document->storage_path), 404);
        return Storage::disk('local')->download($document->storage_path, basename($document->original_name));
    }

    public function checkIn(Request $request)
    {
        $user = $request->user();
        $type = $user->hasRole('student') ? 'student' : ($user->hasRole('teacher') ? 'teacher' : 'staff');
        $record = AttendanceRecord::firstOrCreate(
            ['target_id' => $user->id, 'attendance_date' => today()->toDateString()],
            ['target_type' => $type, 'branch_id' => $user->branch_id, 'status' => 'present', 'check_in_time' => now()->format('H:i:s'), 'recorded_by' => $user->name]
        );
        if (!$record->wasRecentlyCreated && !$record->check_in_time) $record->update(['check_in_time' => now()->format('H:i:s'), 'status' => 'present']);
        return back()->with('status', 'EduPro check-in recorded.');
    }

    public function checkOut(Request $request)
    {
        $record = AttendanceRecord::where('target_id', $request->user()->id)->whereDate('attendance_date', today())->firstOrFail();
        abort_if($record->check_out_time, 409, 'Check-out already recorded.');
        $record->update(['check_out_time' => now()->format('H:i:s')]);
        return back()->with('status', 'EduPro check-out recorded.');
    }

    public function notices(Request $request)
    {
        return view('portal.notices', ['notices' => $this->visibleNotices($request->user())->latest('published_at')->paginate(20)]);
    }

    public function markNoticeRead(Request $request, Notice $notice)
    {
        abort_unless($this->visibleNotices($request->user())->whereKey($notice->id)->exists(), 404);
        $notice->readers()->syncWithoutDetaching([$request->user()->id => ['read_at' => now()]]);
        return back()->with('status', 'Notice marked as read.');
    }

    public function createInvoice(Request $request)
    {
        $data = $request->validate([
            'student_id' => ['required', 'exists:users,id'], 'course_id' => ['nullable', 'exists:courses,id'],
            'description' => ['required', 'string', 'max:180'], 'amount_due' => ['required', 'numeric', 'gt:0', 'max:99999999'],
            'due_at' => ['nullable', 'date', 'after_or_equal:today'],
        ]);
        $student = User::findOrFail($data['student_id']);
        if ($request->user()->hasRole('branch_manager')) abort_unless($student->branch_id === $request->user()->branch_id, 404);
        $invoice = FeeInvoice::create($data + [
            'branch_id' => $student->branch_id,
            'invoice_number' => 'EDU-' . now()->format('ymd') . '-' . strtoupper(Str::random(8)),
            'created_by' => $request->user()->id,
            'status' => 'unpaid',
        ]);
        return back()->with('status', 'Invoice ' . $invoice->invoice_number . ' created.');
    }

    public function recordPayment(Request $request, FeeInvoice $invoice)
    {
        $user = $request->user();
        abort_unless($user->id === $invoice->student_id || $user->hasPermission('fees.manage'), 403);
        if ($user->hasRole('branch_manager')) abort_unless($invoice->branch_id === $user->branch_id, 404);
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0'],
            'method' => ['required', Rule::in(['bKash', 'Nagad', 'Rocket', 'SSLCOMMERZ', 'Bank transfer', 'Cash desk', 'Manual'])],
        ]);
        $payment = DB::transaction(function () use ($invoice, $data, $user) {
            $locked = FeeInvoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            $balance = (float) $locked->amount_due - (float) $locked->amount_paid;
            abort_if((float) $data['amount'] > $balance, 422, 'Payment exceeds the invoice balance.');
            $payment = FeePayment::create([
                'invoice_id' => $locked->id, 'recorded_by' => $user->id,
                'reference' => 'EDUPAY-' . strtoupper(Str::random(12)), 'amount' => $data['amount'],
                'method' => $data['method'], 'status' => 'pending',
            ]);
            return $payment;
        });
        return back()->with('status', 'Payment recorded for verification: ' . $payment->reference);
    }

    private function visibleNotices(User $user)
    {
        return Notice::query()->whereNotNull('published_at')->where('published_at', '<=', now())
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->where(fn ($query) => $query->whereNull('branch_id')->orWhere('branch_id', $user->branch_id))
            ->where(fn ($query) => $query->where('audience', 'all')->orWhere('audience', $user->role));
    }
}
