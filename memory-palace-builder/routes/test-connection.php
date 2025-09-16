<?php

use Illuminate\Support\Facades\Route;

Route::post('/test-spotify-connection-direct', function(\Illuminate\Http\Request $request) {
    try {
        $user = \App\Models\User::first(); // Use first user for testing
        
        $data = [
            'provider' => 'spotify',
            'email' => 'test@spotify.com',
            'account_name' => 'Test Spotify Account',
            'scopes' => ['user-read-recently-played', 'user-library-read']
        ];
        
        $connection = \App\Models\ApiConnection::create([
            'user_id' => $user->id,
            'provider' => $data['provider'],
            'provider_id' => $data['provider'] . '_' . $user->id . '_' . time(),
            'email' => $data['email'],
            'access_token' => null,
            'refresh_token' => null,
            'token_expires_at' => null,
            'scopes' => $data['scopes'],
            'metadata' => [
                'account_name' => $data['account_name'],
                'setup_method' => 'manual'
            ],
            'is_active' => false,
            'last_sync_at' => null
        ]);
        
        // Generate OAuth URL
        $state = base64_encode(json_encode(['connection_id' => $connection->id, 'provider' => 'spotify']));
        $spotifyService = new \App\Services\SpotifyService();
        $oauthUrl = $spotifyService->getAuthUrl($state);
        
        return response()->json([
            'success' => true,
            'connection' => $connection,
            'oauth_url' => $oauthUrl,
            'message' => 'Connection created successfully'
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});