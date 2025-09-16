<?php

use Illuminate\Support\Facades\Route;

Route::get('/test-spotify-connection', function() {
    try {
        $user = auth()->user() ?? \App\Models\User::first();
        
        // Create test connection
        $connection = \App\Models\ApiConnection::create([
            'user_id' => $user->id,
            'provider' => 'spotify',
            'provider_id' => 'spotify_test_' . time(),
            'email' => 'test@spotify.com',
            'scopes' => ['user-read-recently-played', 'user-library-read'],
            'metadata' => [
                'account_name' => 'Test Spotify Account',
                'setup_method' => 'manual'
            ],
            'is_active' => false,
            'last_sync_at' => null
        ]);
        
        // Generate OAuth URL
        $spotifyService = new \App\Services\SpotifyService();
        $state = base64_encode(json_encode(['connection_id' => $connection->id, 'provider' => 'spotify']));
        $oauthUrl = $spotifyService->getAuthUrl($state);
        
        return response()->json([
            'connection' => $connection,
            'oauth_url' => $oauthUrl,
            'state' => $state,
            'decoded_state' => json_decode(base64_decode($state), true)
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
})->middleware(['web', 'auth']);