<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('category', ['fuel', 'stock', 'salaries', 'maintenance', 'other']);
            $table->decimal('amount', 12, 2);
            $table->date('expense_date');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('expense_date');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
