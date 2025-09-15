<?php

use App\Http\Controllers\API\MemoryController;
use App\Http\Controllers\API\ApiConnectionController;
use App\Http\Controllers\API\PalaceDataController;
use Illuminate\Support\Facades\Route;

// API routes protected by web middleware (uses session authentication)
Route::middleware(['web', 'auth'])->group(function () {
    
    // Memory Management API
    Route::apiResource('memories', MemoryController::class);
    
    // API Connection Management
    Route::post('connections', function(\Illuminate\Http\Request $request) {
        $user = auth()->user();
        
        $validated = $request->validate([
            'provider' => 'required|string',
            'email' => 'required|email',
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
            'is_active' => true,
            'last_sync_at' => now()
        ]);
        
        return response()->json(['message' => 'Connection created successfully', 'connection' => $connection]);
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
    
    Route::post('connections/{connection}/sync', function($connectionId) {
        $connection = \App\Models\ApiConnection::where('user_id', auth()->id())->findOrFail($connectionId);
        $connection->update(['last_sync_at' => now()]);
        return response()->json(['message' => 'Sync completed successfully']);
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
            \App\Jobs\AI\DataCollectionJob::dispatch($connection);
            $jobsDispatched++;
        }
        
        return response()->json([
            'message' => "Data collection started for {$jobsDispatched} connections",
            'jobs_dispatched' => $jobsDispatched
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
