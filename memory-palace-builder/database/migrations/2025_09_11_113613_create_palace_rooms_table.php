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
        Schema::create('palace_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('theme'); // work, personal, travel, music, etc.
            $table->string('mood')->nullable(); // happy, calm, energetic, etc.
            $table->json('color_scheme')->nullable(); // Primary colors for the room
            $table->string('texture_url')->nullable(); // Default room texture
            $table->json('dimensions')->nullable(); // Room size and shape data
            $table->json('lighting')->nullable(); // Lighting configuration
            $table->json('position')->nullable(); // Position in the palace layout
            $table->json('connections')->nullable(); // Connected rooms
            $table->integer('memory_count')->default(0);
            $table->timestamp('last_updated_at')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['user_id', 'theme']);
            $table->index(['user_id', 'is_active']);
            $table->index(['theme', 'mood']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('palace_rooms');
    }
};
