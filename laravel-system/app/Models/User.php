<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Schema;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name', 'email', 'phone', 'role', 'branch_id', 'roll_number', 'student_code', 'password', 'account_status', 'suspended_at', 'suspension_reason',
    ];

    protected $hidden = ['password', 'remember_token'];
    protected $casts = ['suspended_at' => 'datetime'];

    public function branch() { return $this->belongsTo(Branch::class); }
    public function enrollments() { return $this->hasMany(Enrollment::class); }
    public function examAttempts() { return $this->hasMany(ExamAttempt::class); }
    public function linkedStudents() { return $this->belongsToMany(User::class, 'guardian_student', 'guardian_id', 'student_id'); }
    public function roles() { return $this->belongsToMany(Role::class)->withPivot('assigned_by')->withTimestamps(); }

    public function hasRole(string $role): bool
    {
        if ($this->role === $role) return true;
        if (!$this->exists || !Schema::hasTable('role_user')) return false;
        return $this->roles()->where('roles.name', $role)->exists();
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->hasRole('super_admin')) return true;
        if (!$this->exists || !Schema::hasTable('permission_role')) return in_array($this->role, ['admin'], true);
        return $this->roles()->whereHas('permissions', fn ($query) => $query->where('permissions.name', $permission))->exists();
    }

    public function scopeInBranch($query, ?int $branchId) { return $query->where('branch_id', $branchId); }
}
