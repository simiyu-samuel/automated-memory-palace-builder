<?php

use App\Http\Controllers\API\MemoryController;
use App\Http\Controllers\API\ApiConnectionController;
use App\Http\Controllers\API\PalaceDataController;
use App\Http\Controllers\API\GmailSyncController;
use Illuminate\Support\Facades\Route;



// API routes protected by web middleware (uses session authentication)
Route::middleware(['web', 'auth'])->group(function () {
    
    // Memory Management API
    Route::apiResource('memories', MemoryController::class)->name('api.memories');
    
    // API Connection Management  
    Route::post('connections', function(\Illuminate\Http\Request $request) {
        $user = auth()->user();
        
        $validated = $request->validate([
            'provider' => 'required|string',
            'email' => 'required|string', // Allow non-email for Spotify usernames
            'client_id' => 'nullable|string',
            'client_secret' => 'nullable|string',
            'account_name' => 'required|string',
            'scopes' => 'array'
        ]);
        
        $connection = \App\Models\ApiConnection::create([
            'user_id' => $user->id,
            'provider' => $validated['provider'],
            'provider_id' => $validated['provider'] . '_' . $user->id . '_' . time(),
            'email' => $validated['email'],
            'access_token' => null, // Will be set during OAuth
            'refresh_token' => null,
            'token_expires_at' => null,
            'scopes' => $validated['scopes'] ?? [],
            'metadata' => [
                'account_name' => $validated['account_name'],
                'client_id' => $validated['client_id'] ?? null,
                'client_secret' => $validated['client_secret'] ?? null,
                'setup_method' => 'manual'
            ],
            'is_active' => false, // Will be activated after OAuth
            'last_sync_at' => null
        ]);
        
        // Generate OAuth URL using services
        $oauthUrl = null;
        $state = base64_encode(json_encode(['connection_id' => $connection->id, 'provider' => $validated['provider']]));
        
        try {
            if (in_array($validated['provider'], ['gmail', 'google_calendar', 'google_photos'])) {
                if (config('services.google.client_id') && config('services.google.client_secret')) {
                    $googleService = new \App\Services\GoogleOAuthService();
                    $oauthUrl = $googleService->getAuthUrl($validated['scopes'] ?? [], $state);
                } else {
                    \Log::warning('Google OAuth credentials not configured');
                }
            } elseif ($validated['provider'] === 'spotify') {
                if (config('services.spotify.client_id') && config('services.spotify.client_secret')) {
                    $spotifyService = new \App\Services\SpotifyService();
                    $oauthUrl = $spotifyService->getAuthUrl($state);
                } else {
                    \Log::warning('Spotify OAuth credentials not configured');
                }
            }
        } catch (\Exception $e) {
            \Log::error('OAuth URL generation failed: ' . $e->getMessage());
            // Continue without OAuth URL - user will need to set up credentials
        }
        
        $response = [
            'message' => 'Connection created successfully', 
            'connection' => $connection,
            'oauth_url' => $oauthUrl
        ];
        
        if (!$oauthUrl) {
            $response['setup_required'] = true;
            $response['instructions'] = "Please add {$validated['provider']} credentials to your .env file and restart the server";
        }
        
        return response()->json($response);
    });
    
    Route::put('connections/{connection}', function(\Illuminate\Http\Request $request, $connectionId) {
        $user = auth()->user();
        $connection = \App\Models\ApiConnection::where('user_id', $user->id)->findOrFail($connectionId);
        
        $validated = $request->validate([
            'email' => 'required|email',
            'client_id' => 'nullable|string',
            'client_secret' => 'nullable|string',
            'api_key' => 'nullable|string',
            'webhook_url' => 'nullable|url',
            'account_name' => 'required|string',
            'scopes' => 'array',
            'sync_frequency' => 'nullable|string'
        ]);
        
        $connection->update([
            'email' => $validated['email'],
            'scopes' => $validated['scopes'] ?? $connection->scopes,
            'metadata' => array_merge($connection->metadata ?? [], [
                'account_name' => $validated['account_name'],
                'client_id' => $validated['client_id'],
                'client_secret' => $validated['client_secret'],
                'api_key' => $validated['api_key'],
                'webhook_url' => $validated['webhook_url'],
                'sync_frequency' => $validated['sync_frequency'] ?? 'hourly'
            ])
        ]);
        
        return response()->json(['message' => 'Connection updated successfully', 'connection' => $connection]);
    });
    
    // MCP-based sync routes
    Route::post('connections/{connection}/sync', [\App\Http\Controllers\API\MCPSyncController::class, 'syncViaMP']);
    Route::post('connections/{connection}/refresh-token', function(\App\Models\ApiConnection $connection) {
        $tokenService = new \App\Services\TokenRefreshService();
        try {
            $accessToken = $tokenService->ensureValidToken($connection);
            return response()->json(['access_token' => $accessToken]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    });

    Route::post('sync-all', [\App\Http\Controllers\API\MCPSyncController::class, 'syncViaMP']);
    Route::post('search-mcp', [\App\Http\Controllers\API\MCPSyncController::class, 'searchViaMP']);
    
    // Legacy sync routes (fallback)
    Route::post('connections/{connection}/sync-direct', [\App\Http\Controllers\API\SyncController::class, 'syncConnection']);
    Route::post('sync-all-direct', [\App\Http\Controllers\API\SyncController::class, 'syncAll']);
    Route::get('connections/{connection}/status', [\App\Http\Controllers\API\SyncController::class, 'getConnectionStatus']);
    
    // Test routes for MCP integration
    Route::post('test-sync', [\App\Http\Controllers\API\TestController::class, 'testSync']);
    Route::get('test-mcp', [\App\Http\Controllers\API\TestController::class, 'testMcpFlow']);
    
    // Production Gmail sync route
    Route::post('simple-sync/{connectionId}', function($connectionId) {
        $user = auth()->user();
        $connection = \App\Models\ApiConnection::where('user_id', $user->id)->find($connectionId);
        
        if (!$connection || !$connection->is_active || !$connection->access_token) {
            return response()->json(['error' => 'Connection not found or not authorized'], 404);
        }
        
        try {
            $memoryService = app(\App\Services\MemoryCollectionService::class);
            $memoriesImported = $memoryService->collectFromConnection($connection);
            
            return response()->json([
                'message' => 'Real Gmail data synced successfully',
                'memories_imported' => $memoriesImported,
                'total_memories' => $user->memories()->count(),
                'provider' => $connection->provider
            ]);
        } catch (\Exception $e) {
            \Log::error('Gmail sync error: ' . $e->getMessage());
            return response()->json(['error' => 'Sync failed: ' . $e->getMessage()], 500);
        }
    });
    
    Route::delete('connections/{connection}', function($connectionId) {
        $connection = \App\Models\ApiConnection::where('user_id', auth()->id())->findOrFail($connectionId);
        $connection->delete();
        return response()->json(['message' => 'Connection removed successfully']);
    });
    
    // Additional memory endpoints
    Route::get('memories/stats', [MemoryController::class, 'stats'])->name('memories.stats');
    Route::get('memories/for-3d', [MemoryController::class, 'for3D'])->name('memories.for3d');
    Route::get('memories/{memory}/related', [MemoryController::class, 'related'])->name('memories.related');
    
    // API Connection Management
    Route::apiResource('api-connections', ApiConnectionController::class);

    Route::post('api-connections/{apiConnection}/refresh-token', [ApiConnectionController::class, 'refreshToken']);
    Route::post('api-connections/{apiConnection}/test', [ApiConnectionController::class, 'test']);
    Route::post('api-connections/{apiConnection}/sync', [ApiConnectionController::class, 'sync']);
    
    // 3D Palace Data API
    Route::get('palace/rooms', [PalaceDataController::class, 'getRooms']);
    
    Route::get('palace/memory-objects/{roomId?}', [PalaceDataController::class, 'getMemoryObjects']);
    
    // Palace Rooms API (for 3D rendering)
    Route::get('palace-rooms', function () {
        $user = auth()->user();
        $rooms = \App\Models\PalaceRoom::where('user_id', $user->id)
            ->where('is_active', true)
            ->withCount('memories')
            ->get()
            ->map(function ($room) {
                return [
                    'id' => $room->id,
                    'name' => $room->name,
                    'description' => $room->description,
                    'theme' => $room->theme,
                    'mood' => $room->mood,
                    'color_scheme' => $room->color_scheme,
                    'position' => $room->position,
                    'dimensions' => $room->dimensions,
                    'lighting' => $room->lighting,
                    'connections' => $room->connections,
                    'memory_count' => $room->memories_count,
                ];
            });
        
        return response()->json($rooms);
    })->name('palace-rooms.index');
    
    // Memory Objects for 3D rendering
    Route::get('memory-objects', function () {
        $user = auth()->user();
        $roomId = request('room_id');
        
        $query = \App\Models\MemoryObject::whereHas('memory', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->where('is_visible', true);
        
        if ($roomId) {
            $query->where('palace_room_id', $roomId);
        }
        
        $objects = $query->with(['memory:id,type,title,sentiment,is_favorite'])
            ->get()
            ->map(function ($obj) {
                return [
                    'id' => $obj->id,
                    'memory_id' => $obj->memory_id,
                    'object_type' => $obj->object_type,
                    'title' => $obj->title,
                    'description' => $obj->description,
                    'position' => $obj->position,
                    'rotation' => $obj->rotation,
                    'scale' => $obj->scale,
                    'color' => $obj->color,
                    'texture_url' => $obj->texture_url,
                    'model_url' => $obj->model_url,
                    'interactions' => $obj->interactions,
                    'animations' => $obj->animations,
                    'importance_score' => $obj->importance_score,
                    'is_interactive' => $obj->is_interactive,
                    'memory' => $obj->memory,
                ];
            });
        
        return response()->json($objects);
    })->name('memory-objects.index');
    
    // User Insights API
    Route::get('insights', function () {
        $user = auth()->user();
        $insights = \App\Models\UserInsight::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
        
        return response()->json($insights);
    })->name('insights.index');
    
    // Processing Logs (for monitoring)
    Route::get('processing-logs', function () {
        $user = auth()->user();
        $logs = \App\Models\ProcessingLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get(['id', 'job_type', 'status', 'message', 'created_at', 'processing_time']);
        
        return response()->json($logs);
    })->name('processing-logs.index');
    
    // Real-time palace updates endpoint
    Route::get('palace/updates', function () {
        $user = auth()->user();
        $lastUpdate = request('since', now()->subMinutes(5)->toISOString());
        
        $recentMemories = \App\Models\Memory::where('user_id', $user->id)
            ->where('updated_at', '>=', $lastUpdate)
            ->with(['palaceRoom:id,name,theme', 'memoryObjects:id,memory_id,position,object_type'])
            ->limit(10)
            ->get()
            ->map(function ($memory) {
                return [
                    'id' => $memory->id,
                    'type' => $memory->type,
                    'title' => $memory->title,
                    'memory_date' => $memory->memory_date->toISOString(),
                    'updated_at' => $memory->updated_at->toISOString(),
                    'room' => $memory->palaceRoom,
                    'objects' => $memory->memoryObjects,
                ];
            });
        
        return response()->json([
            'memories' => $recentMemories,
            'timestamp' => now()->toISOString(),
        ]);
    })->name('palace.updates');
    
    // Trigger manual data collection
    Route::post('collect-memories', function () {
        $user = auth()->user();
        $provider = request('provider');
        
        $connections = \App\Models\ApiConnection::where('user_id', $user->id)
            ->where('is_active', true);
        
        if ($provider) {
            $connections->where('provider', $provider);
        }
        
        $connections = $connections->get();
        
        if ($connections->isEmpty()) {
            return response()->json(['error' => 'No active API connections found'], 404);
        }
        
        $jobsDispatched = 0;
        foreach ($connections as $connection) {
            \App\Jobs\CollectMemoriesJob::dispatch($connection);
            $jobsDispatched++;
        }
        
        return response()->json([
            'message' => "Data collection started for {$jobsDispatched} connections",
            'jobs_dispatched' => $jobsDispatched,
            'providers' => $connections->pluck('provider')->toArray()
        ]);
    })->name('collect-memories.manual');
    
    // Search memories with advanced filters
    Route::post('memories/search', function () {
        $user = auth()->user();
        
        $query = \App\Models\Memory::where('user_id', $user->id)
            ->where('is_processed', true);
        
        // Full-text search
        if (request('q')) {
            $searchTerm = request('q');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'ILIKE', "%{$searchTerm}%")
                  ->orWhere('content', 'ILIKE', "%{$searchTerm}%")
                  ->orWhere('description', 'ILIKE', "%{$searchTerm}%");
            });
        }
        
        // Filters
        if (request('type')) {
            $query->where('type', request('type'));
        }
        
        if (request('sentiment')) {
            $query->where('sentiment', request('sentiment'));
        }
        
        if (request('room_id')) {
            $query->where('palace_room_id', request('room_id'));
        }
        
        if (request('tags')) {
            $tags = is_array(request('tags')) ? request('tags') : [request('tags')];
            foreach ($tags as $tag) {
                $query->whereJsonContains('tags', $tag);
            }
        }
        
        if (request('date_from')) {
            $query->where('memory_date', '>=', request('date_from'));
        }
        
        if (request('date_to')) {
            $query->where('memory_date', '<=', request('date_to'));
        }
        
        if (request('is_favorite')) {
            $query->where('is_favorite', true);
        }
        
        $memories = $query->with(['palaceRoom:id,name,theme'])
            ->orderBy('memory_date', 'desc')
            ->paginate(20);
        
        return response()->json($memories);
    })->name('memories.advanced-search');
});

// MCP Server endpoints (no auth required)
Route::get('users/{user}/connections', function($userId) {
    $connections = \App\Models\ApiConnection::where('user_id', $userId)
        ->where('is_active', true)
        ->get();
    return response()->json(['data' => $connections]);
});

Route::post('memories', function(\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'title' => 'required|string',
        'content' => 'nullable|string',
        'type' => 'required|string',
        'user_id' => 'required|integer',
        'api_connection_id' => 'nullable|integer',
        'source_data' => 'nullable|array',
        'memory_date' => 'required|date',
        'sentiment' => 'nullable|string'
    ]);
    
    $memory = \App\Models\Memory::create($validated);
    return response()->json($memory, 201);
});

Route::post('connections/{connectionId}/refresh-token', function($connectionId) {
    $connection = \App\Models\ApiConnection::findOrFail($connectionId);
    $tokenService = new \App\Services\TokenRefreshService();
    try {
        $accessToken = $tokenService->ensureValidToken($connection);
        return response()->json(['access_token' => $accessToken]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 400);
    }
});

Route::get('palace-rooms', function(\Illuminate\Http\Request $request) {
    $userId = $request->get('user_id');
    $name = $request->get('name');
    
    $query = \App\Models\PalaceRoom::query();
    
    if ($userId) {
        $query->where('user_id', $userId);
    }
    
    if ($name) {
        $query->where('name', $name);
    }
    
    $rooms = $query->get();
    return response()->json($rooms);
});

Route::post('palace-rooms', function(\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'user_id' => 'required|integer',
        'name' => 'required|string',
        'description' => 'nullable|string',
        'theme' => 'nullable|string',
        'mood' => 'nullable|string',
        'color_scheme' => 'nullable|array',
        'position' => 'nullable|array',
        'dimensions' => 'nullable|array',
        'lighting' => 'nullable|array',
        'connections' => 'nullable|array',
        'is_active' => 'boolean'
    ]);
    
    $room = \App\Models\PalaceRoom::create($validated);
    return response()->json($room, 201);
});

Route::post('memory-objects', function(\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'memory_id' => 'required|integer',
        'palace_room_id' => 'required|integer',
        'object_type' => 'required|string',
        'title' => 'required|string',
        'description' => 'nullable|string',
        'position' => 'required|array',
        'rotation' => 'nullable|array',
        'scale' => 'nullable|array',
        'color' => 'nullable|array',
        'importance_score' => 'nullable|numeric',
        'is_visible' => 'boolean',
        'is_interactive' => 'boolean'
    ]);
    
    $object = \App\Models\MemoryObject::create($validated);
    return response()->json($object, 201);
});

// Health check endpoint (no auth required)
Route::get('health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0',
        'services' => [
            'database' => \DB::connection()->getPdo() ? 'connected' : 'disconnected',
            'cache' => \Cache::store()->getStore() ? 'connected' : 'disconnected',
            'queue' => 'active', // Could add actual queue health check
        ]
    ]);
})->name('api.health');

// Test endpoint to verify API is working
Route::get('test', function () {
    $user = auth()->user();
    return response()->json([
        'message' => 'API is working',
        'authenticated' => $user ? true : false,
        'user' => $user ? $user->name : null,
        'timestamp' => now()->toISOString(),
    ]);
})->name('api.test');
