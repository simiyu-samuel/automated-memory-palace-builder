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
        Schema::create('memories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('api_connection_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('palace_room_id')->nullable();
            $table->string('type'); // email, photo, event, song, location, etc.
            $table->string('title');
            $table->text('content')->nullable(); // Main memory content
            $table->text('description')->nullable(); // AI-generated description
            $table->json('raw_data')->nullable(); // Original API response
            $table->json('processed_data')->nullable(); // AI-processed insights
            $table->json('metadata')->nullable(); // Type-specific metadata
            $table->string('external_id'); // ID from the external service
            $table->string('external_url')->nullable(); // Link to original content
            $table->timestamp('memory_date'); // When the memory occurred
            $table->string('sentiment')->nullable(); // positive, negative, neutral
            $table->decimal('sentiment_score', 3, 2)->nullable(); // -1.00 to 1.00
            $table->json('tags')->nullable(); // AI-generated tags
            $table->json('categories')->nullable(); // Categorization labels
            $table->string('location')->nullable(); // Location information
            $table->json('people')->nullable(); // People involved
            $table->boolean('is_processed')->default(false);
            $table->boolean('is_favorite')->default(false);
            $table->boolean('is_private')->default(false);
            $table->timestamps();
            
            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'memory_date']);
            $table->index(['api_connection_id', 'external_id']);
            $table->index(['is_processed', 'created_at']);
            $table->index(['sentiment', 'sentiment_score']);
            $table->fullText(['title', 'content', 'description']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memories');
    }
};
