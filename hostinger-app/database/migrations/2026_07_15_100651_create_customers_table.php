<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->text('address');
            // House/unit number, separate from the full address text — free-form.
            $table->string('house_no')->nullable();
            // Prefills the rate-per-bottle on any new order for them; still editable per order.
            $table->decimal('default_rate_per_bottle', 10, 2)->nullable();
            // Amount they already owed before being added to the system.
            $table->decimal('opening_balance', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->string('password_hash')->nullable();
            $table->timestamps();
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
