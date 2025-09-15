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
        Schema::create('processing_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('memory_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('job_type'); // data_collection, content_analysis, etc.
            $table->string('job_class'); // Laravel job class name
            $table->string('status'); // pending, running, completed, failed
            $table->text('message')->nullable(); // Status message or error
            $table->json('input_data')->nullable(); // Job input parameters
            $table->json('output_data')->nullable(); // Job results
            $table->json('error_data')->nullable(); // Error details
            $table->integer('attempts')->default(1);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('processing_time')->nullable(); // Seconds
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index(['job_type', 'status']);
            $table->index(['memory_id', 'job_type']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('processing_logs');
    }
};
