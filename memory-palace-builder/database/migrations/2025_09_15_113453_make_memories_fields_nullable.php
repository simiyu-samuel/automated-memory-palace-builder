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
        Schema::table('memories', function (Blueprint $table) {
            $table->dropForeign(['api_connection_id']);
            $table->foreignId('api_connection_id')->nullable()->change();
            $table->string('external_id')->nullable()->change();
            
            $table->foreign('api_connection_id')->references('id')->on('api_connections')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('memories', function (Blueprint $table) {
            $table->dropForeign(['api_connection_id']);
            $table->foreignId('api_connection_id')->nullable(false)->change();
            $table->string('external_id')->nullable(false)->change();
            
            $table->foreign('api_connection_id')->references('id')->on('api_connections')->onDelete('cascade');
        });
    }
};