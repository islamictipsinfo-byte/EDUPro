<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AccountManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['branch', 'roles'])->latest();
        if ($request->user()->hasRole('branch_manager')) {
            $query->where('branch_id', $request->user()->branch_id);
        }
        if ($request->filled('q')) {
            $term = trim((string) $request->query('q'));
            $query->where(fn ($q) => $q->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('roll_number', 'like', "%{$term}%"));
        }
        return view('portal.users', ['users' => $query->paginate(25)->withQueryString(), 'roles' => Role::orderBy('label')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'role_id' => ['required', 'exists:roles,id'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);
        $actor = $request->user();
        if ($actor->hasRole('branch_manager') && (int) ($data['branch_id'] ?? 0) !== (int) $actor->branch_id) {
            abort(403, 'Branch managers can only provision users in their branch.');
        }
        $role = Role::findOrFail($data['role_id']);
        if ($role->name === 'super_admin' && !$actor->hasRole('super_admin')) {
            abort(403);
        }

        $user = DB::transaction(function () use ($data, $role, $actor) {
            $user = User::create([
                'name' => $data['name'], 'email' => $data['email'], 'phone' => $data['phone'] ?? null,
                'branch_id' => $data['branch_id'] ?? null, 'password' => Hash::make($data['password']),
                'role' => in_array($role->name, ['admin', 'branch_manager', 'teacher', 'student', 'guardian'], true) ? $role->name : 'student',
                'account_status' => 'active',
            ]);
            $user->roles()->attach($role->id, ['assigned_by' => $actor->id]);
            return $user;
        });

        $this->audit($request, 'user_provisioned', $user, ['role' => $role->name]);
        return back()->with('status', "EduPro account {$user->email} created.");
    }

    public function updateStatus(Request $request, User $user)
    {
        $this->ensureManageable($request, $user);
        $data = $request->validate(['account_status' => ['required', Rule::in(['active', 'inactive', 'suspended'])], 'reason' => ['nullable', 'string', 'max:500']]);
        if ($user->hasRole('super_admin') && !$request->user()->hasRole('super_admin')) abort(403);
        $user->update([
            'account_status' => $data['account_status'],
            'suspended_at' => $data['account_status'] === 'suspended' ? now() : null,
            'suspension_reason' => $data['account_status'] === 'suspended' ? ($data['reason'] ?? 'Suspended by administrator') : null,
        ]);
        $this->audit($request, 'user_status_changed', $user, ['account_status' => $data['account_status']]);
        return back()->with('status', 'Account status updated.');
    }

    public function assignRole(Request $request, User $user)
    {
        $this->ensureManageable($request, $user);
        $data = $request->validate(['role_id' => ['required', 'exists:roles,id']]);
        $role = Role::findOrFail($data['role_id']);
        if ($role->name === 'super_admin' && !$request->user()->hasRole('super_admin')) abort(403);
        if ($user->hasRole('super_admin') && !$request->user()->hasRole('super_admin')) abort(403);

        DB::transaction(function () use ($user, $role, $request) {
            $user->roles()->syncWithoutDetaching([$role->id => ['assigned_by' => $request->user()->id]]);
            if (in_array($role->name, ['admin', 'branch_manager', 'teacher', 'student', 'guardian'], true)) {
                $user->forceFill(['role' => $role->name])->save();
            }
        });
        $this->audit($request, 'role_assigned', $user, ['role' => $role->name]);
        return back()->with('status', 'Role assigned.');
    }

    public function removeRole(Request $request, User $user, Role $role)
    {
        $this->ensureManageable($request, $user);
        abort_if($role->name === 'super_admin' || ($user->hasRole('super_admin') && !$request->user()->hasRole('super_admin')), 403);
        $user->roles()->detach($role->id);
        $this->audit($request, 'role_removed', $user, ['role' => $role->name]);
        return back()->with('status', 'Role removed.');
    }

    public function resetPassword(Request $request, User $user)
    {
        $this->ensureManageable($request, $user);
        $data = $request->validate(['password' => ['required', 'string', 'min:12', 'confirmed']]);
        $user->forceFill(['password' => Hash::make($data['password']), 'remember_token' => null])->save();
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $this->audit($request, 'password_reset_by_admin', $user);
        return back()->with('status', 'Password reset and active sessions revoked.');
    }

    private function ensureManageable(Request $request, User $user): void
    {
        if ($request->user()->hasRole('branch_manager') && (int) $request->user()->branch_id !== (int) $user->branch_id) abort(404);
        if ($user->hasRole('super_admin') && !$request->user()->hasRole('super_admin')) abort(403);
    }

    private function audit(Request $request, string $action, User $target, array $new = []): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('audit_logs')) return;
        DB::table('audit_logs')->insert([
            'actor_id' => $request->user()->id, 'action' => $action, 'entity_type' => User::class,
            'entity_id' => $target->id, 'new_values' => json_encode($new), 'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(), 'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
