<?php

use App\Http\Controllers\PalaceController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Redirect root to palace for authenticated users, welcome for guests
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Keep the default dashboard route for Breeze compatibility
Route::get('/dashboard', function () {
    return redirect()->route('palace.index');
})->middleware(['auth', 'verified'])->name('dashboard');

// Test route to check API data
Route::get('/test-api', function () {
    $user = auth()->user();
    if (!$user) {
        return response()->json(['error' => 'Not authenticated']);
    }
    
    $rooms = \App\Models\PalaceRoom::where('user_id', $user->id)->get();
    $memories = \App\Models\Memory::where('user_id', $user->id)->with('memoryObjects')->get();
    
    return response()->json([
        'user' => $user->name,
        'rooms_count' => $rooms->count(),
        'memories_count' => $memories->count(),
        'rooms' => $rooms,
        'memories' => $memories
    ]);
})->middleware(['auth', 'verified']);

// Main palace routes (protected by auth middleware)
Route::middleware(['auth', 'verified'])->group(function () {
    // Palace main interface
    Route::get('/palace', [PalaceController::class, 'index'])->name('palace.index');
    
    // Individual memory view
    Route::get('/memories/{memory}', [PalaceController::class, 'showMemory'])->name('memories.show');
    
    // Memory search
    Route::get('/palace/search', [PalaceController::class, 'search'])->name('palace.search');
    
    // User insights
    Route::get('/palace/insights', [PalaceController::class, 'insights'])->name('palace.insights');
    Route::get('/insights', [PalaceController::class, 'insights'])->name('insights');
    
    // Timeline view
    Route::get('/palace/timeline', function () {
        return inertia('Palace/Timeline');
    })->name('palace.timeline');

    // Memories route
    Route::get('/memories', function () {
        return inertia('Memories/Index');
    })->name('memories.index');
    
    // Cache management
    Route::post('/palace/clear-cache', [PalaceController::class, 'clearCache'])->name('palace.clear-cache');
    
    // Profile management (Breeze routes)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Settings with API connections data
    Route::get('/settings', function () {
        $user = auth()->user();
        $apiConnections = \App\Models\ApiConnection::where('user_id', $user->id)
            ->get()
            ->map(function ($connection) use ($user) {
                // Count memories directly by api_connection_id
                $memoriesCount = \App\Models\Memory::where('user_id', $user->id)
                    ->where('api_connection_id', $connection->id)
                    ->count();
                
                $connection->memories_count = $memoriesCount;
                return $connection;
            });
        
        return inertia('Settings/Index', [
            'apiConnections' => $apiConnections
        ]);
    })->name('settings.index');
});

// API OAuth routes (for API connections)
Route::middleware(['auth', 'verified'])->group(function () {
    // OAuth initiation routes
    // Google OAuth callback
    Route::get('/auth/google/callback', function (\Illuminate\Http\Request $request) {
        $code = $request->get('code');
        $state = $request->get('state');
        
        if ($code && $state) {
            try {
                $stateData = json_decode(base64_decode($state), true);
                $connection = \App\Models\ApiConnection::find($stateData['connection_id']);
                
                if ($connection) {
                    $googleService = new \App\Services\GoogleOAuthService();
                    $tokens = $googleService->exchangeCodeForTokens($code);
                    
                    // Update connection with new tokens and scopes
                    $connection->update([
                        'access_token' => $tokens['access_token'],
                        'refresh_token' => $tokens['refresh_token'] ?? null,
                        'token_expires_at' => isset($tokens['expires_in']) ? now()->addSeconds($tokens['expires_in']) : null,
                        'is_active' => true,
                        'last_sync_at' => now(),
                        'scopes' => $tokens['scope'] ? explode(' ', $tokens['scope']) : $connection->scopes
                    ]);
                    
                    return redirect()->route('settings.index')->with('success', ucfirst($stateData['provider']) . ' connected and authorized successfully!');
                }
            } catch (\Exception $e) {
                \Log::error('Google OAuth error: ' . $e->getMessage());
                return redirect()->route('settings.index')->with('error', 'OAuth authorization failed: ' . $e->getMessage());
            }
        }
        
        return redirect()->route('settings.index')->with('error', 'OAuth authorization failed. Please try again.');
    })->name('auth.google.callback');
    
    // Spotify OAuth callback
    Route::get('/auth/spotify/callback', function (\Illuminate\Http\Request $request) {
        $code = $request->get('code');
        $state = $request->get('state');
        
        if ($code && $state) {
            try {
                $stateData = json_decode(base64_decode($state), true);
                $connection = \App\Models\ApiConnection::find($stateData['connection_id']);
                
                if ($connection) {
                    $spotifyService = new \App\Services\SpotifyService();
                    $tokens = $spotifyService->exchangeCodeForTokens($code);
                    
                    $connection->update([
                        'access_token' => $tokens['access_token'],
                        'refresh_token' => $tokens['refresh_token'] ?? null,
                        'token_expires_at' => isset($tokens['expires_in']) ? now()->addSeconds($tokens['expires_in']) : null,
                        'is_active' => true,
                        'last_sync_at' => now()
                    ]);
                    
                    return redirect()->route('settings.index')->with('success', 'Spotify connected and authorized successfully!');
                }
            } catch (\Exception $e) {
                \Log::error('Spotify OAuth error: ' . $e->getMessage());
                return redirect()->route('settings.index')->with('error', 'OAuth authorization failed: ' . $e->getMessage());
            }
        }
        
        return redirect()->route('settings.index')->with('error', 'OAuth authorization failed. Please try again.');
    })->name('auth.spotify.callback');
    
    Route::get('/auth/location', function () {
        $user = auth()->user();
        
        $connection = \App\Models\ApiConnection::updateOrCreate(
            ['user_id' => $user->id, 'provider' => 'location_services'],
            [
                'provider_id' => 'location_' . $user->id,
                'email' => $user->email,
                'access_token' => 'location_token_' . time(),
                'refresh_token' => null,
                'token_expires_at' => null,
                'scopes' => ['location-read'],
                'metadata' => ['account_name' => 'Location Services'],
                'is_active' => true,
                'last_sync_at' => now()
            ]
        );
        
        return redirect()->route('settings.index')->with('success', 'Location services connected and activated successfully!');
    })->name('auth.location');
});

require __DIR__.'/auth.php';
require __DIR__.'/test-spotify.php';
require __DIR__.'/debug.php';
require __DIR__.'/debug-simple.php';
require __DIR__.'/test-connection.php';
require __DIR__.'/test-redirect.php';
require __DIR__.'/oauth-redirect.php';