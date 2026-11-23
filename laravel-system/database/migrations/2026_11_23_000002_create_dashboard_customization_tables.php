<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('dashboard_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->string('preset')->default('executive');
            $table->json('layout');
            $table->timestamps();
            $table->unique(['user_id', 'role']);
        });

        Schema::create('dashboard_widget_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('widget_key');
            $table->unsignedBigInteger('views')->default(0);
            $table->timestamp('last_viewed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'widget_key']);
            $table->index(['widget_key', 'views']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_widget_usage');
        Schema::dropIfExists('dashboard_preferences');
    }
};
