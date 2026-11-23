<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->string('check_out_time')->nullable()->after('check_in_time');
        });

        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->longText('instructions');
            $table->timestamp('due_at')->nullable();
            $table->unsignedInteger('max_marks')->default(100);
            $table->string('status')->default('published');
            $table->timestamps();
            $table->index(['course_id', 'batch_id', 'status']);
        });

        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->longText('answer_text')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamp('submitted_at');
            $table->string('status')->default('submitted');
            $table->unsignedInteger('marks_awarded')->nullable();
            $table->longText('teacher_feedback')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->unique(['assignment_id', 'student_id']);
            $table->index(['status', 'submitted_at']);
        });

        Schema::create('student_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('document_type');
            $table->string('original_name');
            $table->string('storage_path');
            $table->unsignedBigInteger('size_bytes');
            $table->string('mime_type', 120);
            $table->timestamps();
            $table->index(['student_id', 'document_type']);
        });

        Schema::create('notices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('audience')->default('all');
            $table->string('title');
            $table->longText('body');
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index(['branch_id', 'audience', 'published_at']);
        });

        Schema::create('notice_reads', function (Blueprint $table) {
            $table->foreignId('notice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('read_at')->useCurrent();
            $table->primary(['notice_id', 'user_id']);
        });

        Schema::create('fee_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->string('description');
            $table->decimal('amount_due', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->timestamp('due_at')->nullable();
            $table->string('status')->default('unpaid');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['student_id', 'status', 'due_at']);
        });

        Schema::create('fee_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('fee_invoices')->cascadeOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reference')->unique();
            $table->decimal('amount', 12, 2);
            $table->string('method');
            $table->string('status')->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['invoice_id', 'status']);
        });

        $groupId = DB::table('permission_groups')->where('name', 'learning')->value('id');
        $permissionIds = [];
        foreach ([
            'assignments.manage' => 'Manage assignments and grading',
            'attendance.manage' => 'Manage attendance records',
            'fees.manage' => 'Manage student fees and invoices',
        ] as $name => $label) {
            $permissionIds[$name] = DB::table('permissions')->insertGetId([
                'name' => $name, 'label' => $label, 'permission_group_id' => $groupId,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $roleIds = DB::table('roles')->pluck('id', 'name');
        $grants = [
            'admin' => array_keys($permissionIds),
            'super_admin' => array_keys($permissionIds),
            'teacher' => ['assignments.manage', 'attendance.manage'],
            'branch_manager' => array_keys($permissionIds),
            'accountant' => ['fees.manage'],
        ];
        foreach ($grants as $role => $permissions) {
            foreach ($permissions as $permission) {
                DB::table('permission_role')->updateOrInsert([
                    'role_id' => $roleIds[$role], 'permission_id' => $permissionIds[$permission],
                ], []);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_payments');
        Schema::dropIfExists('fee_invoices');
        Schema::dropIfExists('notice_reads');
        Schema::dropIfExists('notices');
        Schema::dropIfExists('student_documents');
        Schema::dropIfExists('assignment_submissions');
        Schema::dropIfExists('assignments');
        DB::table('permission_role')->whereIn('permission_id', DB::table('permissions')->whereIn('name', ['assignments.manage', 'attendance.manage', 'fees.manage'])->select('id'))->delete();
        DB::table('permissions')->whereIn('name', ['assignments.manage', 'attendance.manage', 'fees.manage'])->delete();
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn('check_out_time');
        });
    }
};
