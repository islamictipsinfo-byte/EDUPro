<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
    protected $fillable = ['author_id', 'branch_id', 'audience', 'title', 'body', 'published_at', 'expires_at'];
    protected $casts = ['published_at' => 'datetime', 'expires_at' => 'datetime'];
    public function readers() { return $this->belongsToMany(User::class, 'notice_reads')->withPivot('read_at'); }
}
