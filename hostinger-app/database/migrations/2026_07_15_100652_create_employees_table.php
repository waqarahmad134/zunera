<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('role');
            $table->decimal('salary', 12, 2);
            $table->date('joined_date');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('notes')->nullable();
            $table->string('password_hash')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
