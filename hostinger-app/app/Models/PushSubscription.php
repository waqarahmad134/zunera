<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PushSubscription extends Model
{
    use HasFactory;

    const UPDATED_AT = null;

    protected $fillable = [
        'for_role',
        'for_id',
        'endpoint',
        'p256dh',
        'auth',
    ];
}
