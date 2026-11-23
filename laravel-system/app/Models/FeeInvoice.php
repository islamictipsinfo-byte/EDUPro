<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeInvoice extends Model
{
    protected $fillable = ['student_id', 'branch_id', 'course_id', 'invoice_number', 'description', 'amount_due', 'amount_paid', 'due_at', 'status', 'created_by'];
    protected $casts = ['amount_due' => 'decimal:2', 'amount_paid' => 'decimal:2', 'due_at' => 'datetime'];

    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function payments() { return $this->hasMany(FeePayment::class, 'invoice_id'); }
    public function course() { return $this->belongsTo(Course::class); }
}
