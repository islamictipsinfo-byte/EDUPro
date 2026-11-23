<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $fillable = ['permission_group_id', 'name', 'label'];

    public function group()
    {
        return $this->belongsTo(PermissionGroup::class, 'permission_group_id');
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }
}
