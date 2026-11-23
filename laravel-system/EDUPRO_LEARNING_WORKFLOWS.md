# EduPro Student and Teacher Workflows

This increment adds assignment publishing and grading, authenticated student submissions with private validated uploads, private student document storage/download authorization, learner invoice/payment records with row locking against overpayment, branch- and audience-scoped notices, student/teacher workspaces, and self-service attendance check-in/out.

Run migrations from `laravel-system` with `php artisan migrate`. Uploaded documents and submissions use Laravel's private `local` disk; do not expose that disk through a public symlink. Payment submissions are recorded as pending for verification and do not claim to charge a gateway. External payment callbacks and gateway-specific integrations remain separate work.
