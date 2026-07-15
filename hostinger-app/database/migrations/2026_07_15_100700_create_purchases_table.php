<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Stock received from a supplier — a receipt header; line items are in
        // purchase_items. Item current stock is computed as opening_stock plus
        // all purchased quantities (no separate mutable stock column to drift
        // out of sync).
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->string('receipt_no')->nullable();
            $table->date('received_date');
            $table->text('notes')->nullable();
            $table->decimal('total_cost', 12, 2)->default(0);
            $table->timestamps();
            $table->index('supplier_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
