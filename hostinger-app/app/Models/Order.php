<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'address',
        'bottles',
        'rate_per_bottle',
        'total_price',
        'status',
        'payment_status',
        'assigned_employee_id',
        'status_locked_by_employee',
        'payment_locked_by_employee',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'rate_per_bottle' => 'decimal:2',
            'total_price' => 'decimal:2',
            'status_locked_by_employee' => 'boolean',
            'payment_locked_by_employee' => 'boolean',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignedEmployee()
    {
        return $this->belongsTo(Employee::class, 'assigned_employee_id');
    }
}
