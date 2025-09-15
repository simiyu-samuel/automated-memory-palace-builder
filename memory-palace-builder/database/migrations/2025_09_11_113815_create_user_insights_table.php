<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // pattern, recommendation, trend, summary, etc.
            $table->string('category'); // behavioral, emotional, temporal, social, etc.
            $table->string('title');
            $table->text('description');
            $table->json('data')->nullable(); // Insight-specific data
            $table->json('recommendations')->nullable(); // Action recommendations
            $table->decimal('confidence_score', 3, 2)->default(0.50); // 0.00 to 1.00
            $table->integer('relevance_score')->default(50); // 0 to 100
            $table->date('period_start')->nullable(); // Insight time period
            $table->date('period_end')->nullable();
            $table->json('related_memories')->nullable(); // Memory IDs that generated this insight
            $table->boolean('is_active')->default(true);
            $table->boolean('is_read')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'is_active', 'is_read']);
            $table->index(['category', 'confidence_score']);
            $table->index(['expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_insights');
    }
};
