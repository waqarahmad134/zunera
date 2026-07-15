<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'address',
        'house_no',
        'default_rate_per_bottle',
        'opening_balance',
        'notes',
        'password_hash',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'default_rate_per_bottle' => 'decimal:2',
            'opening_balance' => 'decimal:2',
        ];
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function paymentsIn()
    {
        return $this->hasMany(PaymentIn::class);
    }
}
