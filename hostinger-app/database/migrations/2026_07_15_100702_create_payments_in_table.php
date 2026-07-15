<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cash/bank payments received from customers, applied against their balance.
        Schema::create('payments_in', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers');
            $table->decimal('amount', 12, 2);
            $table->date('payment_date');
            $table->enum('method', ['cash', 'bank'])->default('cash');
            $table->text('note')->nullable();
            $table->timestamps();
            $table->index('customer_id');
            $table->index('payment_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments_in');
    }
};
