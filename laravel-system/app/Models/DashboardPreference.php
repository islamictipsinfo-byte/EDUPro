<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardPreference extends Model
{
    protected $fillable = ['user_id', 'role', 'preset', 'layout'];

    protected $casts = ['layout' => 'array'];
}
