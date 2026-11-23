<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeePayment extends Model
{
    protected $fillable = ['invoice_id', 'recorded_by', 'reference', 'amount', 'method', 'status', 'paid_at'];
    protected $casts = ['amount' => 'decimal:2', 'paid_at' => 'datetime'];

    public function invoice() { return $this->belongsTo(FeeInvoice::class, 'invoice_id'); }
}
