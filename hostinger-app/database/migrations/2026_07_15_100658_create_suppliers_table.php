<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vendors the business buys stock from.
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->decimal('opening_balance', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
