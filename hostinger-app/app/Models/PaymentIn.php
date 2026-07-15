<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentIn extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'amount',
        'payment_date',
        'method',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'date',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
