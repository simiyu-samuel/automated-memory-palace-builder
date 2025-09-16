<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('api_connections', function (Blueprint $table) {
            $table->string('provider_id')->nullable()->change();
        });

        Schema::table('memories', function (Blueprint $table) {
            $table->unsignedBigInteger('api_connection_id')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('api_connections', function (Blueprint $table) {
            $table->string('provider_id')->nullable(false)->change();
        });

        Schema::table('memories', function (Blueprint $table) {
            $table->unsignedBigInteger('api_connection_id')->nullable(false)->change();
        });
    }
};