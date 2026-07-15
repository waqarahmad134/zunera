<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Web Push subscriptions (one row per browser/device), scoped the same
        // way as notifications (for_role + for_id).
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('for_role');
            $table->unsignedBigInteger('for_id')->nullable();
            $table->string('endpoint', 512)->unique();
            $table->text('p256dh');
            $table->text('auth');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['for_role', 'for_id'], 'idx_push_subscriptions_recipient');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
