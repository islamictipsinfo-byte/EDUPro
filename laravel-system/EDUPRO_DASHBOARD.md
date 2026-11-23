# EduPro Dashboard

The role-aware dashboard is available at `/portal/dashboard` after installation and login. It includes configurable widget visibility, drag-and-drop ordering, small/medium/large sizes, Executive/Operations/Teaching/Finance presets, per-user/per-role saved layouts, 30-second data refresh, global course and people search, health checks, and admin widget usage analytics.

Widgets are registered in `config/edupro_dashboard.php`. Add a widget definition (title, description, default size, permitted roles), then add its data and Blade renderer in `DashboardController` and `resources/views/portal/dashboard.blade.php`. Dashboard preferences are isolated by user and role. Branch managers' search and dashboard counts are constrained to their assigned branch.

This dashboard is branded EduPro; it does not depend on Google AI Studio or any AI Studio-named directory.
