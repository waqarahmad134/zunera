<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'address',
        'opening_balance',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:2',
        ];
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }
}
