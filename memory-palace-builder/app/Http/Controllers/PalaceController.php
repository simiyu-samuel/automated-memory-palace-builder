<?php

namespace App\Http\Controllers;

use App\Models\Memory;
use App\Models\PalaceRoom;
use App\Models\ApiConnection;
use App\Models\UserInsight;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class PalaceController extends Controller
{
    /**
     * Display the main palace interface
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        // Get user's palace data with caching
        $cacheKey = "palace_data_{$user->id}";
        $palaceData = Cache::remember($cacheKey, 300, function () use ($user) {
            return $this->getPalaceData($user->id);
        });

        return Inertia::render('Palace/Index', $palaceData);
    }

    /**
     * Get comprehensive palace data for a user
     */
    private function getPalaceData($userId)
    {
        
        // Get active palace rooms
        $rooms = PalaceRoom::where('user_id', $userId)
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
                    'memory_count' => $room->memories_count,
                    'position' => $room->position,
                    'dimensions' => $room->dimensions,
                    'lighting' => $room->lighting,
                ];
            });

        // Get recent memories
        $memories = Memory::where('user_id', $userId)
            ->where('is_processed', true)
            ->with(['palaceRoom:id,name,theme'])
            ->orderBy('memory_date', 'desc')
            ->get()
            ->map(function ($memory) {
                return [
                    'id' => $memory->id,
                    'type' => $memory->type,
                    'title' => $memory->title,
                    'description' => $memory->description,
                    'content' => $memory->content, // Full content for modal
                    'memory_date' => $memory->memory_date->toISOString(),
                    'created_at' => $memory->created_at->toISOString(),
                    'sentiment' => $memory->sentiment,
                    'sentiment_score' => $memory->sentiment_score,
                    'tags' => $memory->tags ?? [],
                    'categories' => $memory->categories ?? [],
                    'people' => $memory->people ?? [],
                    'location' => $memory->location,
                    'external_url' => $memory->external_url,
                    'is_favorite' => $memory->is_favorite,
                    'room' => $memory->palaceRoom ? [
                        'id' => $memory->palaceRoom->id,
                        'name' => $memory->palaceRoom->name,
                        'theme' => $memory->palaceRoom->theme,
                    ] : null,
                ];
            });

        // Get palace statistics
        $stats = [
            'totalMemories' => Memory::where('user_id', $userId)->count(),
            'totalRooms' => PalaceRoom::where('user_id', $userId)->where('is_active', true)->count(),
            'recentCount' => Memory::where('user_id', $userId)
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
            'processedCount' => Memory::where('user_id', $userId)->where('is_processed', true)->count(),
            'apiConnections' => ApiConnection::where('user_id', $userId)->where('is_active', true)->count(),
            'sentimentBreakdown' => [
                'positive' => Memory::where('user_id', $userId)->where('sentiment', 'positive')->count(),
                'neutral' => Memory::where('user_id', $userId)->where('sentiment', 'neutral')->count(),
                'negative' => Memory::where('user_id', $userId)->where('sentiment', 'negative')->count(),
            ],
        ];

        return [
            'rooms' => $rooms,
            'memories' => $memories,
            'stats' => $stats,
        ];
    }

    /**
     * Display the memory search interface
     */
    public function search(Request $request)
    {
        $user = Auth::user();
        
        return Inertia::render('Palace/Search', [
            'query' => '',
            'filters' => [],
            'rooms' => PalaceRoom::where('user_id', $user->id)
                ->where('is_active', true)
                ->select(['id', 'name', 'theme'])
                ->get(),
        ]);
    }

    /**
     * Display user insights
     */
    public function insights(Request $request)
    {
        $user = Auth::user();
        
        $insights = UserInsight::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        // Get insights data
        $memoryTrends = $this->getMemoryTrends($user->id);
        $topCategories = $this->getTopCategories($user->id);
        $activityPatterns = $this->getActivityPatterns($user->id);

        return Inertia::render('Palace/Insights', [
            'insights' => $insights,
            'trends' => $memoryTrends,
            'categories' => $topCategories,
            'patterns' => $activityPatterns,
        ]);
    }

    /**
     * Get memory trends over time
     */
    private function getMemoryTrends($userId)
    {
        $trends = Memory::where('user_id', $userId)
            ->selectRaw('DATE(memory_date) as date, COUNT(*) as count, AVG(sentiment_score) as avg_sentiment')
            ->where('memory_date', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $trends->map(function ($trend) {
            return [
                'date' => $trend->date,
                'count' => $trend->count,
                'sentiment' => round($trend->avg_sentiment ?? 0, 2),
            ];
        });
    }

    /**
     * Get top memory categories
     */
    private function getTopCategories($userId)
    {
        // This requires a more complex query to extract categories from JSON
        return collect([
            ['name' => 'Work', 'count' => 45, 'percentage' => 30],
            ['name' => 'Personal', 'count' => 38, 'percentage' => 25],
            ['name' => 'Music', 'count' => 32, 'percentage' => 21],
            ['name' => 'Photos', 'count' => 28, 'percentage' => 18],
            ['name' => 'Social', 'count' => 9, 'percentage' => 6],
        ]);
    }

    /**
     * Get activity patterns
     */
    private function getActivityPatterns($userId)
    {
        $patterns = Memory::where('user_id', $userId)
            ->selectRaw('EXTRACT(HOUR FROM memory_date) as hour, COUNT(*) as count')
            ->where('memory_date', '>=', now()->subDays(30))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return $patterns->map(function ($pattern) {
            return [
                'hour' => $pattern->hour,
                'count' => $pattern->count,
                'label' => date('g A', mktime($pattern->hour, 0, 0)),
            ];
        });
    }

    /**
     * Show individual memory
     */
    public function showMemory(Memory $memory)
    {
        if ($memory->user_id !== auth()->id()) {
            abort(403);
        }
        
        $memory->load(['palaceRoom']);
        
        return Inertia::render('Memories/Show', [
            'memory' => $memory
        ]);
    }

    /**
     * Clear palace data cache
     */
    public function clearCache(Request $request)
    {
        $user = Auth::user();
        Cache::forget("palace_data_{$user->id}");
        
        return response()->json(['message' => 'Cache cleared successfully']);
    }
}
