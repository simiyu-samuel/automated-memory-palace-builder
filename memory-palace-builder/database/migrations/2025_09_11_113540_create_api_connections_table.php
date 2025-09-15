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
        Schema::create('api_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('provider'); // gmail, google_calendar, google_photos, spotify, etc.
            $table->string('provider_id'); // External service user ID
            $table->string('email')->nullable(); // Associated email for the connection
            $table->text('access_token')->nullable(); // Encrypted OAuth token
            $table->text('refresh_token')->nullable(); // Encrypted OAuth refresh token
            $table->timestamp('token_expires_at')->nullable();
            $table->json('scopes')->nullable(); // Granted permissions
            $table->json('metadata')->nullable(); // Additional provider-specific data
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'provider', 'provider_id']);
            $table->index(['user_id', 'provider']);
            $table->index(['is_active', 'last_sync_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_connections');
    }
};
