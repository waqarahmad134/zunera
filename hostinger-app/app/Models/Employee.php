<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'role',
        'salary',
        'joined_date',
        'status',
        'notes',
        'password_hash',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'salary' => 'decimal:2',
            'joined_date' => 'date',
        ];
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'assigned_employee_id');
    }

    public function location()
    {
        return $this->hasOne(EmployeeLocation::class);
    }
}
