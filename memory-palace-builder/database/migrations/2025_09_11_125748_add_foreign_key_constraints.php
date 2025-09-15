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
        // Add foreign key constraint to memories table
        Schema::table('memories', function (Blueprint $table) {
            $table->foreign('palace_room_id')->references('id')->on('palace_rooms')->onDelete('set null');
        });
        
        // Add any other foreign key constraints that need to be added after table creation
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('memories', function (Blueprint $table) {
            $table->dropForeign(['palace_room_id']);
        });
    }
};
