<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Course;
use App\Models\DashboardPreference;
use App\Models\DashboardWidgetUsage;
use App\Models\Enrollment;
use App\Models\ExamAttempt;
use App\Models\User;
use App\Support\DashboardWidgetRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardWidgetRegistry $widgets) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $available = collect($this->widgets->all())
            ->filter(fn (array $widget) => in_array($user->role, $widget['roles'] ?? [], true));
        $defaultPreset = config('edupro_dashboard.role_presets.' . $user->role, 'executive');
        $preference = DashboardPreference::where('user_id', $user->id)->where('role', $user->role)->first();
        $preset = $preference?->preset ?? $defaultPreset;
        $saved = collect($preference?->layout ?? [])->keyBy('id');
        $presetKeys = config('edupro_dashboard.presets.' . $preset, config('edupro_dashboard.presets.' . $defaultPreset, []));

        $layout = $available->map(function (array $definition, string $key) use ($saved, $presetKeys) {
            $item = $saved->get($key, []);
            return [
                'id' => $key,
                'visible' => $item['visible'] ?? in_array($key, $presetKeys, true),
                'size' => $item['size'] ?? $definition['size'] ?? 'medium',
                'order' => $item['order'] ?? (array_search($key, $presetKeys, true) ?: 0),
            ];
        })->sortBy('order')->values();

        return view('portal.dashboard', [
            'user' => $user,
            'widgets' => $available,
            'layout' => $layout,
            'preset' => $preset,
            'presets' => config('edupro_dashboard.presets'),
            'data' => $this->dashboardData($request),
        ]);
    }

    public function save(Request $request): JsonResponse
    {
        $user = $request->user();
        $availableKeys = collect($this->widgets->all())
            ->filter(fn (array $widget) => in_array($user->role, $widget['roles'] ?? [], true))
            ->keys()->all();

        $validated = $request->validate([
            'preset' => ['required', 'string', Rule::in(array_keys(config('edupro_dashboard.presets', [])))],
            'layout' => ['required', 'array', 'max:20'],
            'layout.*.id' => ['required', 'string', Rule::in($availableKeys)],
            'layout.*.visible' => ['required', 'boolean'],
            'layout.*.size' => ['required', Rule::in(['small', 'medium', 'large'])],
            'layout.*.order' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        DashboardPreference::updateOrCreate(
            ['user_id' => $user->id, 'role' => $user->role],
            ['preset' => $validated['preset'], 'layout' => $validated['layout']]
        );

        return response()->json(['saved' => true, 'message' => 'Dashboard layout saved.']);
    }

    public function reset(Request $request): JsonResponse
    {
        DashboardPreference::where('user_id', $request->user()->id)
            ->where('role', $request->user()->role)
            ->delete();

        return response()->json(['saved' => true, 'message' => 'Dashboard restored to the role default.']);
    }

    public function refresh(Request $request): JsonResponse
    {
        return response()->json($this->dashboardData($request));
    }

    public function search(Request $request): JsonResponse
    {
        $term = trim((string) $request->validate(['q' => 'required|string|min:2|max:80'])['q']);
        $user = $request->user();
        $results = [];

        $courses = Course::query()->where('status', 'active')
            ->where(fn ($query) => $query->where('title', 'like', '%' . $term . '%')->orWhere('category', 'like', '%' . $term . '%'))
            ->limit(5)->get(['id', 'title', 'slug']);
        foreach ($courses as $course) {
            $results[] = ['type' => 'Course', 'label' => $course->title, 'url' => route('courses.show', $course->slug)];
        }

        if (in_array($user->role, ['admin', 'super_admin', 'branch_manager', 'teacher', 'staff'], true)) {
            $people = User::query()->where('name', 'like', '%' . $term . '%');
            if ($user->role === 'branch_manager') {
                $people->where('branch_id', $user->branch_id);
            }
            foreach ($people->limit(5)->get(['id', 'name', 'role']) as $person) {
                $results[] = ['type' => ucfirst($person->role), 'label' => $person->name, 'url' => route('portal.index')];
            }
        }

        return response()->json(['results' => $results]);
    }

    private function dashboardData(Request $request): array
    {
        $user = $request->user();
        $global = in_array($user->role, ['admin', 'super_admin'], true);
        $enrollmentQuery = Enrollment::query();
        $courseQuery = Course::query();
        $attendanceQuery = AttendanceRecord::query();
        $attemptQuery = ExamAttempt::query();

        if ($user->role === 'student') {
            $enrollmentQuery->where('user_id', $user->id);
            $attemptQuery->where('user_id', $user->id);
        } elseif ($user->role === 'guardian') {
            $childIds = $user->linkedStudents()->pluck('users.id');
            $enrollmentQuery->whereIn('user_id', $childIds);
            $attemptQuery->whereIn('user_id', $childIds);
        } elseif (!$global && $user->branch_id) {
            $enrollmentQuery->where('branch_id', $user->branch_id);
            $courseQuery->whereHas('batches', fn ($query) => $query->where('branch_id', $user->branch_id));
            $attendanceQuery->where('branch_id', $user->branch_id);
            $attemptQuery->whereHas('user', fn ($query) => $query->where('branch_id', $user->branch_id));
        }

        $countStudents = User::where('role', 'student');
        if (!$global && $user->role === 'branch_manager') {
            $countStudents->where('branch_id', $user->branch_id);
        } elseif ($user->role === 'student') {
            $countStudents->whereKey($user->id);
        } elseif ($user->role === 'guardian') {
            $countStudents->whereIn('id', $user->linkedStudents()->pluck('users.id'));
        }

        $attendanceToday = (clone $attendanceQuery)->whereDate('attendance_date', today())->count();
        $revenue = in_array($user->role, ['admin', 'super_admin', 'branch_manager', 'accountant'], true)
            ? (int) (clone $enrollmentQuery)->where('status', 'approved')->sum('amount_paid')
            : null;

        $activity = Schema::hasTable('audit_logs')
            ? DB::table('audit_logs')->latest('created_at')->limit(6)->get(['action', 'entity_type', 'created_at'])
            : collect();

        $usage = $user->role === 'admin' || $user->role === 'super_admin'
            ? DashboardWidgetUsage::query()->select('widget_key', DB::raw('SUM(views) as total_views'))
                ->groupBy('widget_key')->orderByDesc('total_views')->limit(5)->get()
            : collect();

        $visibleKeys = collect($this->widgets->all())
            ->filter(fn (array $widget) => in_array($user->role, $widget['roles'] ?? [], true))
            ->keys();
        foreach ($visibleKeys as $key) {
            $usageRow = DashboardWidgetUsage::firstOrCreate(
                ['user_id' => $user->id, 'widget_key' => $key],
                ['views' => 0]
            );
            $usageRow->increment('views', 1, ['last_viewed_at' => now()]);
        }

        return [
            'students' => $countStudents->count(),
            'courses' => (clone $courseQuery)->count(),
            'enrollments' => (clone $enrollmentQuery)->count(),
            'pending_enrollments' => (clone $enrollmentQuery)->where('status', 'pending')->count(),
            'attendance_today' => $attendanceToday,
            'attendance_total_today' => $attendanceToday,
            'average_performance' => round((float) (clone $attemptQuery)->avg('percentage'), 1),
            'revenue' => $revenue,
            'activity' => $activity,
            'widget_usage' => $usage,
            'system' => [
                'database' => DB::connection()->getPdo() !== null,
                'storage_writable' => is_writable(storage_path()),
                'environment' => app()->environment(),
            ],
            'updated_at' => now()->toIso8601String(),
        ];
    }
}
