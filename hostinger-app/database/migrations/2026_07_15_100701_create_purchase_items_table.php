<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Line items for a purchase receipt.
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('purchases');
            $table->foreignId('item_id')->constrained('items');
            $table->integer('qty');
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('line_total', 12, 2);
            $table->index('purchase_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};
