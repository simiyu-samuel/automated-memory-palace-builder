<?php

use Illuminate\Support\Facades\Route;

Route::get('/debug-spotify', function() {
    try {
        // Test Spotify service directly
        $spotifyService = new \App\Services\SpotifyService();
        $testState = base64_encode(json_encode(['connection_id' => 999, 'provider' => 'spotify']));
        $oauthUrl = $spotifyService->getAuthUrl($testState);
        
        return response()->json([
            'spotify_client_id' => config('services.spotify.client_id'),
            'spotify_client_secret' => config('services.spotify.client_secret') ? 'SET' : 'NOT SET',
            'oauth_url' => $oauthUrl,
            'test_state' => $testState,
            'decoded_state' => json_decode(base64_decode($testState), true)
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

Route::get('/debug-connection-create', function() {
    try {
        $user = \App\Models\User::first();
        
        $validated = [
            'provider' => 'spotify',
            'email' => 'test@spotify.com',
            'account_name' => 'Test Spotify',
            'scopes' => ['user-read-recently-played', 'user-library-read']
        ];
        
        $connection = \App\Models\ApiConnection::create([
            'user_id' => $user->id,
            'provider' => $validated['provider'],
            'provider_id' => $validated['provider'] . '_' . $user->id . '_' . time(),
            'email' => $validated['email'],
            'access_token' => null,
            'refresh_token' => null,
            'token_expires_at' => null,
            'scopes' => $validated['scopes'] ?? [],
            'metadata' => [
                'account_name' => $validated['account_name'],
                'setup_method' => 'manual'
            ],
            'is_active' => false,
            'last_sync_at' => null
        ]);
        
        $state = base64_encode(json_encode(['connection_id' => $connection->id, 'provider' => $validated['provider']]));
        $spotifyService = new \App\Services\SpotifyService();
        $oauthUrl = $spotifyService->getAuthUrl($state);
        
        return response()->json([
            'connection' => $connection,
            'oauth_url' => $oauthUrl,
            'message' => 'Connection created successfully'
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});