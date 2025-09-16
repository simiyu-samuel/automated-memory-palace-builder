<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ApiConnection;
use App\Models\Memory;
use Illuminate\Http\Request;

class TestController extends Controller
{
    public function testSync()
    {
        $user = auth()->user();
        
        // Create a test connection if none exists
        $connection = ApiConnection::firstOrCreate([
            'user_id' => $user->id,
            'provider' => 'test'
        ], [
            'provider_id' => 'test_' . $user->id,
            'email' => $user->email,
            'access_token' => 'test_token',
            'is_active' => true,
            'scopes' => ['test'],
            'metadata' => ['account_name' => 'Test Connection']
        ]);

        // Create a test memory
        $memory = Memory::create([
            'user_id' => $user->id,
            'api_connection_id' => $connection->id,
            'palace_room_id' => $user->palaceRooms()->first()->id,
            'type' => 'test',
            'title' => 'Test Memory from MCP',
            'content' => 'This is a test memory created via MCP integration',
            'description' => 'MCP Test Memory',
            'memory_date' => now(),
            'sentiment' => 'positive',
            'sentiment_score' => 0.8,
            'tags' => ['test', 'mcp'],
            'is_processed' => true,
            'external_id' => 'test_' . time()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Test sync completed',
            'connection' => $connection,
            'memory' => $memory,
            'total_memories' => $user->memories()->count()
        ]);
    }

    public function testMcpFlow()
    {
        $user = auth()->user();
        
        return response()->json([
            'user' => $user->name,
            'connections' => $user->apiConnections()->count(),
            'memories' => $user->memories()->count(),
            'rooms' => $user->palaceRooms()->count(),
            'mcp_status' => 'ready',
            'timestamp' => now()->toISOString()
        ]);
    }
}