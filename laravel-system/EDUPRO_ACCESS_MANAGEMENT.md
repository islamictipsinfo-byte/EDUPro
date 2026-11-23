# EduPro Access Management

This increment adds role/permission groups, built-in role definitions (including Super Admin, Accountant and Staff), permission-based route authorization, account activation/suspension, branch-scoped user search and management, secure administrator provisioning, password reset primitives, and login history recording. The legacy `users.role` enum remains backward-compatible; additional/custom roles are attached through `role_user` instead of altering the existing enum.

Account management is available at `/portal/users` to accounts granted `users.manage`. New user passwords must be confirmed and at least 12 characters. Public registration continues to permit only Student and Guardian roles. For production, configure throttling and mail-based password reset delivery, and review the built-in role grants before enabling administrator access.
