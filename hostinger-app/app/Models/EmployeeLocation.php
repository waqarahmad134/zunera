<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeLocation extends Model
{
    use HasFactory;

    protected $primaryKey = 'employee_id';

    public $incrementing = false;

    const CREATED_AT = null;

    protected $fillable = [
        'employee_id',
        'lat',
        'lng',
        'accuracy',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
            'accuracy' => 'decimal:2',
        ];
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
