<?php

namespace App\Services;

use GuzzleHttp\Client;

class SpotifyService
{
    private $client;
    private $clientId;
    private $clientSecret;
    private $redirectUri;

    public function __construct()
    {
        $this->client = new Client();
        $this->clientId = config('services.spotify.client_id');
        $this->clientSecret = config('services.spotify.client_secret');
        $this->redirectUri = config('services.spotify.redirect');
    }

    public function getAuthUrl($state)
    {
        $scopes = 'user-read-recently-played user-library-read user-top-read';
        
        return 'https://accounts.spotify.com/authorize?' . http_build_query([
            'client_id' => $this->clientId,
            'response_type' => 'code',
            'redirect_uri' => $this->redirectUri,
            'scope' => $scopes,
            'state' => $state
        ]);
    }

    public function exchangeCodeForTokens($code)
    {
        $response = $this->client->post('https://accounts.spotify.com/api/token', [
            'form_params' => [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $this->redirectUri,
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret
            ]
        ]);

        return json_decode($response->getBody(), true);
    }

    public function refreshToken($refreshToken)
    {
        $response = $this->client->post('https://accounts.spotify.com/api/token', [
            'form_params' => [
                'grant_type' => 'refresh_token',
                'refresh_token' => $refreshToken,
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret
            ]
        ]);

        return json_decode($response->getBody(), true);
    }

    public function getRecentlyPlayed($accessToken, $limit = 20)
    {
        $response = $this->client->get('https://api.spotify.com/v1/me/player/recently-played', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken
            ],
            'query' => ['limit' => $limit]
        ]);

        $data = json_decode($response->getBody(), true);
        
        $tracks = [];
        foreach ($data['items'] as $item) {
            $tracks[] = [
                'id' => $item['track']['id'],
                'name' => $item['track']['name'],
                'artist' => $item['track']['artists'][0]['name'],
                'album' => $item['track']['album']['name'],
                'played_at' => $item['played_at'],
                'duration_ms' => $item['track']['duration_ms'],
                'external_url' => $item['track']['external_urls']['spotify']
            ];
        }

        return $tracks;
    }

    public function getTopTracks($accessToken, $timeRange = 'medium_term', $limit = 20)
    {
        $response = $this->client->get('https://api.spotify.com/v1/me/top/tracks', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken
            ],
            'query' => [
                'time_range' => $timeRange,
                'limit' => $limit
            ]
        ]);

        $data = json_decode($response->getBody(), true);
        
        $tracks = [];
        foreach ($data['items'] as $track) {
            $tracks[] = [
                'id' => $track['id'],
                'name' => $track['name'],
                'artist' => $track['artists'][0]['name'],
                'album' => $track['album']['name'],
                'popularity' => $track['popularity'],
                'external_url' => $track['external_urls']['spotify']
            ];
        }

        return $tracks;
    }
}