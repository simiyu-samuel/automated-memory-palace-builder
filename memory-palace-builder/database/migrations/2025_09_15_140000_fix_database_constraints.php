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
        // Make provider_id nullable in api_connections
        Schema::table('api_connections', function (Blueprint $table) {
            $table->string('provider_id')->nullable()->change();
        });

        // Make api_connection_id nullable in memories
        Schema::table('memories', function (Blueprint $table) {
            $table->foreignId('api_connection_id')->nullable()->change();
        });

        // Add missing external_id column as nullable if it doesn't exist
        if (!Schema::hasColumn('memories', 'external_id')) {
            Schema::table('memories', function (Blueprint $table) {
                $table->string('external_id')->nullable();
            });
        } else {
            Schema::table('memories', function (Blueprint $table) {
                $table->string('external_id')->nullable()->change();
            });
        }
    }

    /**\n     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('api_connections', function (Blueprint $table) {
            $table->string('provider_id')->nullable(false)->change();
        });

        Schema::table('memories', function (Blueprint $table) {
            $table->foreignId('api_connection_id')->nullable(false)->change();
            $table->string('external_id')->nullable(false)->change();
        });
    }
};