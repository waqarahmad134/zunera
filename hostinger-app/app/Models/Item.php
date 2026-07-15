<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'cost',
        'margin',
        'returnable',
        'opening_stock',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'cost' => 'decimal:2',
            'margin' => 'decimal:2',
            'returnable' => 'boolean',
        ];
    }

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function getCurrentStockAttribute(): int
    {
        return $this->opening_stock + (int) $this->purchaseItems()->sum('qty');
    }
}
