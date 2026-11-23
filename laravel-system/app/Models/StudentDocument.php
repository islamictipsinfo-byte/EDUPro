<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentDocument extends Model
{
    protected $fillable = ['student_id', 'uploaded_by', 'document_type', 'original_name', 'storage_path', 'size_bytes', 'mime_type'];
    public function student() { return $this->belongsTo(User::class, 'student_id'); }
}
