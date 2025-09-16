<?php

namespace App\Services;

use App\Models\ApiConnection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TokenRefreshService
{
    public function refreshGoogleToken(ApiConnection $connection)
    {
        $credentials = $connection->credentials;
        
        if (!isset($credentials['refresh_token'])) {
            throw new \Exception('No refresh token available');
        }
        
        $response = Http::post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'refresh_token',
            'refresh_token' => $credentials['refresh_token'],
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
        ]);
        
        if (!$response->successful()) {
            throw new \Exception('Token refresh failed: ' . $response->body());
        }
        
        $tokenData = $response->json();
        
        $connection->update([
            'credentials' => array_merge($credentials, [
                'access_token' => $tokenData['access_token'],
            ]),
            'token_expires_at' => now()->addSeconds($tokenData['expires_in'])
        ]);
        
        return $tokenData['access_token'];
    }
    
    public function refreshSpotifyToken(ApiConnection $connection)
    {
        $credentials = $connection->credentials;
        
        if (!isset($credentials['refresh_token'])) {
            throw new \Exception('No refresh token available');
        }
        
        $response = Http::asForm()->post('https://accounts.spotify.com/api/token', [
            'grant_type' => 'refresh_token',
            'refresh_token' => $credentials['refresh_token'],
            'client_id' => config('services.spotify.client_id'),
            'client_secret' => config('services.spotify.client_secret'),
        ]);
        
        if (!$response->successful()) {
            throw new \Exception('Spotify token refresh failed: ' . $response->body());
        }
        
        $tokenData = $response->json();
        
        $connection->update([
            'credentials' => array_merge($credentials, [
                'access_token' => $tokenData['access_token'],
            ]),
            'token_expires_at' => now()->addSeconds($tokenData['expires_in'])
        ]);
        
        return $tokenData['access_token'];
    }
    
    public function ensureValidToken(ApiConnection $connection)
    {
        if ($connection->token_expires_at && $connection->token_expires_at->isPast()) {
            Log::info("Token expired for {$connection->provider}, refreshing...");
            
            switch ($connection->provider) {
                case 'gmail':
                case 'calendar':
                    return $this->refreshGoogleToken($connection);
                case 'spotify':
                    return $this->refreshSpotifyToken($connection);
                default:
                    throw new \Exception("Token refresh not supported for {$connection->provider}");
            }
        }
        
        return $connection->credentials['access_token'];
    }
}