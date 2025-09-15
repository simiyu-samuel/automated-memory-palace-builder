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
        $apiConnections = \App\Models\ApiConnection::where('user_id', $user->id)->get();
        
        return inertia('Settings/Index', [
            'apiConnections' => $apiConnections
        ]);
    })->name('settings.index');
});

// API OAuth routes (for API connections)
Route::middleware(['auth', 'verified'])->group(function () {
    // OAuth initiation routes
    Route::get('/auth/google', function (\Illuminate\Http\Request $request) {
        $service = $request->get('service', 'gmail');
        $user = auth()->user();
        
        // Create or update API connection
        // Validate Google OAuth is configured
        if (!config('services.google.client_id') || config('services.google.client_id') === 'your_google_client_id_here') {
            return redirect()->route('settings.index')->with('error', 'Google OAuth not configured. Please add your Client ID and Secret to .env file.');
        }
        
        $connection = \App\Models\ApiConnection::updateOrCreate(
            ['user_id' => $user->id, 'provider' => $service],
            [
                'provider_id' => 'google_' . $service . '_' . $user->id,
                'email' => $user->email,
                'scopes' => ['https://www.googleapis.com/auth/gmail.readonly'],
                'metadata' => [
                    'account_name' => ucfirst($service) . ' Account',
                    'client_id' => config('services.google.client_id'),
                    'redirect_uri' => config('services.google.redirect')
                ],
                'is_active' => true,
                'last_sync_at' => now()
            ]
        );
        
        return redirect()->route('settings.index')->with('success', ucfirst($service) . ' connected successfully!');
    })->name('auth.google');
    
    Route::get('/auth/spotify', function () {
        $user = auth()->user();
        
        // Validate Spotify OAuth is configured
        if (!config('services.spotify.client_id') || config('services.spotify.client_id') === 'your_spotify_client_id_here') {
            return redirect()->route('settings.index')->with('error', 'Spotify OAuth not configured. Please add your Client ID and Secret to .env file.');
        }
        
        \App\Models\ApiConnection::updateOrCreate(
            ['user_id' => $user->id, 'provider' => 'spotify'],
            [
                'provider_id' => 'spotify_' . $user->id,
                'email' => $user->email,
                'scopes' => ['user-read-recently-played'],
                'metadata' => [
                    'account_name' => 'Spotify Account',
                    'client_id' => config('services.spotify.client_id'),
                    'redirect_uri' => config('services.spotify.redirect')
                ],
                'is_active' => true,
                'last_sync_at' => now()
            ]
        );
        
        return redirect()->route('settings.index')->with('success', 'Spotify connected successfully!');
    })->name('auth.spotify');
    
    Route::get('/auth/location', function () {
        $user = auth()->user();
        
        \App\Models\ApiConnection::updateOrCreate(
            ['user_id' => $user->id, 'provider' => 'location_services'],
            [
                'provider_id' => 'location_' . $user->id,
                'email' => $user->email,
                'scopes' => ['location-read'],
                'metadata' => ['account_name' => 'Location Services'],
                'is_active' => true,
                'last_sync_at' => now()
            ]
        );
        
        return redirect()->route('settings.index')->with('success', 'Location services connected successfully!');
    })->name('auth.location');
});

require __DIR__.'/auth.php';