<?php

use Illuminate\Support\Facades\Route;

Route::get('/oauth-redirect/{provider}', function($provider, \Illuminate\Http\Request $request) {
    $connectionId = $request->get('connection_id');
    
    if (!$connectionId) {
        return redirect()->route('settings.index')->with('error', 'Invalid connection ID');
    }
    
    $connection = \App\Models\ApiConnection::find($connectionId);
    if (!$connection) {
        return redirect()->route('settings.index')->with('error', 'Connection not found');
    }
    
    try {
        $state = base64_encode(json_encode(['connection_id' => $connection->id, 'provider' => $provider]));
        
        if ($provider === 'spotify') {
            $spotifyService = new \App\Services\SpotifyService();
            $oauthUrl = $spotifyService->getAuthUrl($state);
            return redirect($oauthUrl);
        } elseif (in_array($provider, ['gmail', 'google_calendar', 'google_photos'])) {
            $googleService = new \App\Services\GoogleOAuthService();
            $oauthUrl = $googleService->getAuthUrl($connection->scopes ?? [], $state);
            return redirect($oauthUrl);
        }
        
        return redirect()->route('settings.index')->with('error', 'Unsupported provider');
        
    } catch (\Exception $e) {
        return redirect()->route('settings.index')->with('error', 'OAuth setup failed: ' . $e->getMessage());
    }
})->middleware(['web', 'auth']);