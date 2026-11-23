<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('account_status')->default('active');
            $table->timestamp('suspended_at')->nullable();
            $table->string('suspension_reason')->nullable();
            $table->string('student_code')->nullable()->unique();
            $table->index(['branch_id', 'account_status']);
        });

        Schema::create('permission_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permission_group_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name')->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        Schema::create('permission_role', function (Blueprint $table) {
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->primary(['permission_id', 'role_id']);
        });

        Schema::create('role_user', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->primary(['user_id', 'role_id']);
        });

        Schema::create('user_login_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email');
            $table->boolean('successful')->default(false);
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
        });

        DB::table('permission_groups')->insert([
            ['name' => 'users', 'label' => 'User management', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'learning', 'label' => 'Learning and courses', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'finance', 'label' => 'Finance and payments', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'operations', 'label' => 'Branch operations', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('permissions')->insert([
            ['name' => 'users.manage', 'label' => 'Manage users and roles', 'permission_group_id' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'learning.manage', 'label' => 'Manage courses and learning', 'permission_group_id' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'finance.view', 'label' => 'View finance reports', 'permission_group_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'operations.manage', 'label' => 'Manage branch operations', 'permission_group_id' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $roles = [
            ['name' => 'super_admin', 'label' => 'Super Admin', 'is_system' => true],
            ['name' => 'admin', 'label' => 'Admin', 'is_system' => true],
            ['name' => 'branch_manager', 'label' => 'Branch Manager', 'is_system' => true],
            ['name' => 'teacher', 'label' => 'Teacher', 'is_system' => true],
            ['name' => 'student', 'label' => 'Student', 'is_system' => true],
            ['name' => 'guardian', 'label' => 'Guardian', 'is_system' => true],
            ['name' => 'accountant', 'label' => 'Accountant', 'is_system' => true],
            ['name' => 'staff', 'label' => 'Staff', 'is_system' => true],
        ];
        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(['name' => $role['name']], $role + ['created_at' => now(), 'updated_at' => now()]);
        }

        $permissions = DB::table('permissions')->pluck('id', 'name');
        $roleIds = DB::table('roles')->pluck('id', 'name');
        $grants = [
            'super_admin' => ['users.manage', 'learning.manage', 'finance.view', 'operations.manage'],
            'admin' => ['users.manage', 'learning.manage', 'finance.view', 'operations.manage'],
            'branch_manager' => ['learning.manage', 'finance.view', 'operations.manage'],
            'teacher' => ['learning.manage'],
            'accountant' => ['finance.view'],
        ];
        foreach ($grants as $roleName => $names) {
            foreach ($names as $permissionName) {
                DB::table('permission_role')->updateOrInsert([
                    'role_id' => $roleIds[$roleName], 'permission_id' => $permissions[$permissionName],
                ], []);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_login_history');
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('permission_groups');
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'account_status']);
            $table->dropUnique(['student_code']);
            $table->dropColumn(['account_status', 'suspended_at', 'suspension_reason', 'student_code']);
        });
    }
};
