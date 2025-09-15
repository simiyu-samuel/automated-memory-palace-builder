<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Memory;
use App\Models\MemoryObject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class MemoryController extends Controller
{
    /**
     * Display a listing of memories with filters
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = Memory::where('user_id', $user->id)
            ->where('is_processed', true)
            ->with(['palaceRoom:id,name,theme', 'memoryObjects']);

        // Apply filters
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }
        
        if ($request->has('room_id')) {
            $query->where('palace_room_id', $request->input('room_id'));
        }
        
        if ($request->has('sentiment')) {
            $query->where('sentiment', $request->input('sentiment'));
        }
        
        if ($request->has('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'ILIKE', "%{$searchTerm}%")
                  ->orWhere('content', 'ILIKE', "%{$searchTerm}%")
                  ->orWhere('description', 'ILIKE', "%{$searchTerm}%");
            });
        }
        
        if ($request->has('date_from')) {
            $query->where('memory_date', '>=', $request->input('date_from'));
        }
        
        if ($request->has('date_to')) {
            $query->where('memory_date', '<=', $request->input('date_to'));
        }
        
        if ($request->has('tags')) {
            $tags = is_array($request->input('tags')) ? $request->input('tags') : [$request->input('tags')];
            foreach ($tags as $tag) {
                $query->whereJsonContains('tags', $tag);
            }
        }

        $memories = $query->orderBy($request->input('sort_by', 'memory_date'), 
                                   $request->input('sort_direction', 'desc'))
                          ->get();

        return response()->json(['data' => $memories]);
    }

    /**
     * Get memory statistics
     */
    public function stats(Request $request)
    {
        $user = Auth::user();
        $cacheKey = "memory_stats_{$user->id}";
        
        $stats = Cache::remember($cacheKey, 600, function () use ($user) {
            $baseQuery = Memory::where('user_id', $user->id);
            
            return [
                'total' => $baseQuery->count(),
                'processed' => $baseQuery->where('is_processed', true)->count(),
                'favorites' => $baseQuery->where('is_favorite', true)->count(),
                'by_type' => $baseQuery->groupBy('type')
                    ->selectRaw('type, COUNT(*) as count')
                    ->pluck('count', 'type'),
                'by_sentiment' => $baseQuery->whereNotNull('sentiment')
                    ->groupBy('sentiment')
                    ->selectRaw('sentiment, COUNT(*) as count')
                    ->pluck('count', 'sentiment'),
                'recent_activity' => $baseQuery->where('created_at', '>=', now()->subDays(30))
                    ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
                    ->pluck('count', 'date'),
            ];
        });
        
        return response()->json($stats);
    }

    /**
     * Display the specified memory with full details
     */
    public function show(Memory $memory)
    {
        $user = Auth::user();
        
        if ($memory->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $memory->load([
            'palaceRoom:id,name,theme,mood',
            'memoryObjects:id,memory_id,object_type,title,position,metadata',
            'apiConnection:id,provider,email'
        ]);
        
        return response()->json($memory);
    }

    /**
     * Update the specified memory
     */
    public function update(Request $request, Memory $memory)
    {
        $user = Auth::user();
        
        if ($memory->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'is_favorite' => 'sometimes|boolean',
            'is_private' => 'sometimes|boolean',
            'tags' => 'sometimes|array',
            'tags.*' => 'string|max:50',
            'palace_room_id' => 'sometimes|exists:palace_rooms,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $updateData = $request->only(['is_favorite', 'is_private', 'tags', 'palace_room_id']);
        
        // Ensure palace room belongs to user
        if (isset($updateData['palace_room_id'])) {
            $room = \App\Models\PalaceRoom::where('id', $updateData['palace_room_id'])
                ->where('user_id', $user->id)
                ->first();
            
            if (!$room) {
                return response()->json(['error' => 'Invalid palace room'], 422);
            }
        }
        
        $memory->update($updateData);
        
        // Clear cache
        Cache::forget("palace_data_{$user->id}");
        Cache::forget("memory_stats_{$user->id}");
        
        return response()->json($memory->fresh());
    }

    /**
     * Remove the specified memory from storage
     */
    public function destroy(Memory $memory)
    {
        $user = Auth::user();
        
        if ($memory->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $memory->delete();
        
        // Clear cache
        Cache::forget("palace_data_{$user->id}");
        Cache::forget("memory_stats_{$user->id}");
        
        return response()->json(['message' => 'Memory deleted successfully']);
    }

    /**
     * Get memories for 3D palace rendering
     */
    public function for3D(Request $request)
    {
        $user = Auth::user();
        $roomId = $request->input('room_id');
        
        $query = Memory::where('user_id', $user->id)
            ->where('is_processed', true)
            ->with(['memoryObjects' => function ($q) {
                $q->where('is_visible', true);
            }]);
        
        if ($roomId) {
            $query->where('palace_room_id', $roomId);
        }
        
        $memories = $query->get()->map(function ($memory) {
            return [
                'id' => $memory->id,
                'type' => $memory->type,
                'title' => $memory->title,
                'description' => $memory->description,
                'memory_date' => $memory->memory_date->toISOString(),
                'sentiment' => $memory->sentiment,
                'sentiment_score' => $memory->sentiment_score,
                'is_favorite' => $memory->is_favorite,
                'objects' => $memory->memoryObjects->map(function ($obj) {
                    return [
                        'id' => $obj->id,
                        'type' => $obj->object_type,
                        'title' => $obj->title,
                        'position' => $obj->position,
                        'rotation' => $obj->rotation,
                        'scale' => $obj->scale,
                        'color' => $obj->color,
                        'interactions' => $obj->interactions,
                        'metadata' => $obj->metadata,
                    ];
                }),
            ];
        });
        
        return response()->json($memories);
    }

    /**
     * Get related memories
     */
    public function related(Memory $memory, Request $request)
    {
        $user = Auth::user();
        
        if ($memory->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Get memories with similar tags, categories, or people
        $relatedMemories = Memory::where('user_id', $user->id)
            ->where('id', '!=', $memory->id)
            ->where('is_processed', true)
            ->where(function ($query) use ($memory) {
                // Similar tags
                if ($memory->tags) {
                    foreach ($memory->tags as $tag) {
                        $query->orWhereJsonContains('tags', $tag);
                    }
                }
                
                // Similar categories  
                if ($memory->categories) {
                    foreach ($memory->categories as $category) {
                        $query->orWhereJsonContains('categories', $category);
                    }
                }
                
                // Same people
                if ($memory->people) {
                    foreach ($memory->people as $person) {
                        $query->orWhereJsonContains('people', $person);
                    }
                }
            })
            ->limit(10)
            ->get(['id', 'type', 'title', 'memory_date', 'sentiment']);
        
        return response()->json($relatedMemories);
    }
}
