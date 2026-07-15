<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers');
            // Per-order delivery address — defaults from the customer but is editable per order.
            $table->text('address');
            $table->integer('bottles');
            $table->decimal('rate_per_bottle', 10, 2);
            $table->decimal('total_price', 12, 2);
            $table->enum('status', ['pending', 'delivered', 'cancelled'])->default('pending');
            $table->enum('payment_status', ['unpaid', 'cash', 'online'])->default('unpaid');
            $table->foreignId('assigned_employee_id')->nullable()->constrained('employees');
            // Once an employee (not admin) sets status/paymentStatus, the matching flag
            // flips true and the staff app can never change that field again — only admin can.
            $table->boolean('status_locked_by_employee')->default(false);
            $table->boolean('payment_locked_by_employee')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
