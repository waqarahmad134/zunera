<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The stock catalog purchased from suppliers.
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('cost', 12, 2)->default(0);
            $table->decimal('margin', 12, 2)->default(0);
            // True if riders must collect an empty back from the customer (e.g. 19L refills).
            $table->boolean('returnable')->default(false);
            $table->integer('opening_stock')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
