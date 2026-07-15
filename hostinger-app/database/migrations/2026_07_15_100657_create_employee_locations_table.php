<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Latest known location per employee — one row each, upserted on every
        // ping, not a full history log.
        Schema::create('employee_locations', function (Blueprint $table) {
            $table->foreignId('employee_id')->constrained('employees')->primary();
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->decimal('accuracy', 10, 2)->nullable();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_locations');
    }
};
