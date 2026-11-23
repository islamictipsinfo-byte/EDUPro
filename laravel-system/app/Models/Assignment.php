<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    protected $fillable = ['teacher_id', 'course_id', 'batch_id', 'title', 'instructions', 'due_at', 'max_marks', 'status'];
    protected $casts = ['due_at' => 'datetime'];

    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }
    public function course() { return $this->belongsTo(Course::class); }
    public function batch() { return $this->belongsTo(Batch::class); }
    public function submissions() { return $this->hasMany(AssignmentSubmission::class); }
}
