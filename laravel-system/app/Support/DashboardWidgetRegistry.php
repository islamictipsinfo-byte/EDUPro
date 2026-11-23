<?php

namespace App\Support;

/**
 * Config-backed widget registry. Extensions can add widget definitions through
 * config/edupro_dashboard.php without changing the dashboard renderer.
 */
class DashboardWidgetRegistry
{
    public function all(): array
    {
        return config('edupro_dashboard.widgets', []);
    }

    public function get(string $key): ?array
    {
        return $this->all()[$key] ?? null;
    }

    public function keys(): array
    {
        return array_keys($this->all());
    }
}
