<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'receipt_no',
        'received_date',
        'notes',
        'total_cost',
    ];

    protected function casts(): array
    {
        return [
            'received_date' => 'date',
            'total_cost' => 'decimal:2',
        ];
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
