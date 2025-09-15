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
        Schema::create('memory_objects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memory_id')->constrained()->onDelete('cascade');
            $table->foreignId('palace_room_id')->constrained()->onDelete('cascade');
            $table->string('object_type'); // book, photo_frame, music_box, letter, etc.
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('position'); // x, y, z coordinates in the room
            $table->json('rotation')->nullable(); // Object rotation
            $table->json('scale')->nullable(); // Object scale
            $table->json('color')->nullable(); // Object color scheme
            $table->string('texture_url')->nullable(); // Custom texture
            $table->string('model_url')->nullable(); // 3D model file
            $table->json('interactions')->nullable(); // Available interactions
            $table->json('animations')->nullable(); // Object animations
            $table->json('metadata')->nullable(); // Object-specific data
            $table->decimal('importance_score', 3, 2)->default(0.50); // 0.00 to 1.00
            $table->integer('interaction_count')->default(0);
            $table->timestamp('last_interacted_at')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->boolean('is_interactive')->default(true);
            $table->timestamps();
            
            $table->index(['palace_room_id', 'is_visible']);
            $table->index(['memory_id']);
            $table->index(['object_type', 'importance_score']);
            $table->index(['last_interacted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memory_objects');
    }
};
