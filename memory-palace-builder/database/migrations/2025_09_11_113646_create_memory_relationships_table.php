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
        Schema::create('memory_relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memory_a_id')->constrained('memories')->onDelete('cascade');
            $table->foreignId('memory_b_id')->constrained('memories')->onDelete('cascade');
            $table->string('relationship_type'); // related, similar, sequential, causal, etc.
            $table->decimal('strength', 3, 2)->default(0.50); // 0.00 to 1.00
            $table->text('reason')->nullable(); // Why they are related
            $table->json('metadata')->nullable(); // Additional relationship data
            $table->boolean('is_bidirectional')->default(true);
            $table->boolean('is_ai_generated')->default(true);
            $table->timestamps();
            
            $table->unique(['memory_a_id', 'memory_b_id', 'relationship_type']);
            $table->index(['memory_a_id', 'relationship_type']);
            $table->index(['memory_b_id', 'relationship_type']);
            $table->index(['relationship_type', 'strength']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memory_relationships');
    }
};
