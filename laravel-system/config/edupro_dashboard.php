<?php

return [
    'presets' => [
        'executive' => ['overview', 'revenue', 'enrollments', 'performance', 'activity', 'system_health'],
        'operations' => ['overview', 'enrollments', 'attendance', 'activity', 'system_health'],
        'teaching' => ['overview', 'my_courses', 'attendance', 'performance', 'activity'],
        'finance' => ['overview', 'revenue', 'enrollments', 'activity'],
    ],
    'role_presets' => [
        'admin' => 'executive',
        'branch_manager' => 'operations',
        'teacher' => 'teaching',
        'student' => 'teaching',
        'guardian' => 'teaching',
        'accountant' => 'finance',
        'staff' => 'operations',
        'super_admin' => 'executive',
    ],
    'widgets' => [
        'overview' => ['title' => 'Learning overview', 'description' => 'Core activity across your learning space.', 'size' => 'large', 'roles' => ['admin', 'branch_manager', 'teacher', 'student', 'guardian', 'accountant', 'staff', 'super_admin']],
        'revenue' => ['title' => 'Revenue', 'description' => 'Approved enrollment revenue.', 'size' => 'small', 'roles' => ['admin', 'branch_manager', 'accountant', 'super_admin']],
        'enrollments' => ['title' => 'Enrollments', 'description' => 'Enrollment status at a glance.', 'size' => 'medium', 'roles' => ['admin', 'branch_manager', 'teacher', 'accountant', 'staff', 'super_admin']],
        'attendance' => ['title' => 'Attendance', 'description' => 'Today’s recorded attendance.', 'size' => 'medium', 'roles' => ['admin', 'branch_manager', 'teacher', 'staff', 'super_admin']],
        'performance' => ['title' => 'Performance', 'description' => 'Recent exam score trends.', 'size' => 'medium', 'roles' => ['admin', 'branch_manager', 'teacher', 'student', 'guardian', 'super_admin']],
        'my_courses' => ['title' => 'My learning', 'description' => 'Your approved courses and progress.', 'size' => 'medium', 'roles' => ['student', 'teacher', 'guardian']],
        'activity' => ['title' => 'Recent activity', 'description' => 'Latest recorded platform events.', 'size' => 'large', 'roles' => ['admin', 'branch_manager', 'teacher', 'staff', 'super_admin']],
        'system_health' => ['title' => 'System health', 'description' => 'Database and storage availability.', 'size' => 'small', 'roles' => ['admin', 'super_admin']],
        'widget_usage' => ['title' => 'Widget usage', 'description' => 'Most viewed dashboard widgets.', 'size' => 'medium', 'roles' => ['admin', 'super_admin']],
        'quick_actions' => ['title' => 'Quick actions', 'description' => 'Shortcuts to common work.', 'size' => 'medium', 'roles' => ['admin', 'branch_manager', 'teacher', 'student', 'guardian', 'accountant', 'staff', 'super_admin']],
    ],
];
