<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // In-app + push notifications. for_role + for_id scope who sees it:
        // for_role='admin' (for_id NULL) goes to every admin session; for_role in
        // ('employee','customer') with for_id set goes to that one user only.
        // for_id isn't a real foreign key since it points at a different table
        // (employees or customers) depending on for_role.
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('for_role');
            $table->unsignedBigInteger('for_id')->nullable();
            $table->string('title');
            $table->text('body');
            $table->string('url')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['for_role', 'for_id', 'created_at'], 'idx_notifications_recipient');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
