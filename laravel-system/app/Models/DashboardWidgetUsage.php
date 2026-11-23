<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardWidgetUsage extends Model
{
    protected $fillable = ['user_id', 'widget_key', 'views', 'last_viewed_at'];

    protected $casts = ['last_viewed_at' => 'datetime'];
}
