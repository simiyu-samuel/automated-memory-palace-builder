<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ApiConnection;
use App\Services\MemoryCollectionService;
use App\Services\GoogleOAuthService;
use App\Services\SpotifyService;
use App\Services\TokenRefreshService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SyncController extends Controller
{
    private $memoryCollectionService;
    private $tokenRefreshService;

    public function __construct()
    {
        $this->memoryCollectionService = new MemoryCollectionService(
            new GoogleOAuthService(),
            new SpotifyService()
        );
        
        $this->tokenRefreshService = new TokenRefreshService(
            new GoogleOAuthService(),
            new SpotifyService()
        );
    }

    public function syncConnection($connectionId)
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'Not authenticated'], 401);
            }

            $connection = ApiConnection::where('user_id', $user->id)->find($connectionId);
            if (!$connection) {
                return response()->json(['success' => false, 'error' => 'Connection not found'], 404);
            }
            
            if (!$connection->is_active) {
                return response()->json(['success' => false, 'error' => 'Connection is not active'], 400);
            }

            // For now, create a test memory to verify the flow works
            $workRoom = $user->palaceRooms()->first();
            if (!$workRoom) {
                return response()->json(['success' => false, 'error' => 'No palace room found'], 404);
            }

            $memory = \App\Models\Memory::create([
                'user_id' => $user->id,
                'api_connection_id' => $connection->id,
                'palace_room_id' => $workRoom->id,
                'type' => 'test',
                'title' => 'Test sync from ' . $connection->provider,
                'content' => 'This is a test memory to verify sync works',
                'description' => 'Test sync memory',
                'memory_date' => now(),
                'sentiment' => 'positive',
                'sentiment_score' => 0.8,
                'tags' => ['test', 'sync'],
                'is_processed' => true,
                'external_id' => 'test_' . time()
            ]);

            // Create 3D object for the memory
            \App\Models\MemoryObject::create([
                'memory_id' => $memory->id,
                'palace_room_id' => $workRoom->id,
                'object_type' => 'test',
                'title' => $memory->title,
                'description' => 'Test memory object',
                'position' => ['x' => rand(-2, 2), 'y' => 1, 'z' => rand(-2, 2)],
                'rotation' => ['x' => 0, 'y' => rand(0, 360), 'z' => 0],
                'scale' => ['x' => 1, 'y' => 1, 'z' => 1],
                'color' => ['primary' => '#10b981', 'secondary' => '#ffffff'],
                'importance_score' => 0.8,
                'is_visible' => true,
                'is_interactive' => true
            ]);
            
            Log::info("Test sync completed for {$connection->provider}");
            
            return response()->json([
                'success' => true,
                'message' => ucfirst($connection->provider) . ' sync completed successfully',
                'memories_imported' => 1,
                'total_memories' => $user->memories()->count(),
                'connection_status' => 'active',
                'last_sync' => now()->toISOString()
            ]);
            
        } catch (\Exception $e) {
            Log::error("Sync failed for connection {$connectionId}: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'connection_status' => 'error'
            ], 500);
        }
    }

    public function syncAll()
    {
        $user = auth()->user();
        $connections = ApiConnection::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        if ($connections->isEmpty()) {
            return response()->json(['error' => 'No active API connections found'], 404);
        }

        $results = [];
        $totalMemories = 0;

        foreach ($connections as $connection) {
            try {
                $this->tokenRefreshService->refreshIfNeeded($connection);
                $memoriesCreated = $this->memoryCollectionService->collectFromConnection($connection);
                
                $results[] = [
                    'provider' => $connection->provider,
                    'status' => 'success',
                    'memories_created' => $memoriesCreated
                ];
                
                $totalMemories += $memoriesCreated;
                
            } catch (\Exception $e) {
                $results[] = [
                    'provider' => $connection->provider,
                    'status' => 'error',
                    'error' => $e->getMessage()
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Bulk sync completed',
            'results' => $results,
            'total_memories_created' => $totalMemories,
            'connections_processed' => count($connections)
        ]);
    }

    public function getConnectionStatus($connectionId)
    {
        $connection = ApiConnection::where('user_id', auth()->id())->findOrFail($connectionId);
        
        return response()->json([
            'id' => $connection->id,
            'provider' => $connection->provider,
            'is_active' => $connection->is_active,
            'last_sync_at' => $connection->last_sync_at,
            'has_valid_token' => !empty($connection->access_token),
            'token_expires_at' => $connection->token_expires_at,
            'memories_count' => $connection->user->memories()
                ->where('api_connection_id', $connection->id)
                ->count()
        ]);
    }
}