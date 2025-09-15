<?php

namespace App\Services\MCP;

use App\Models\ApiConnection;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

abstract class BaseMCPService
{
    protected ApiConnection $connection;
    protected array $config;

    public function __construct(ApiConnection $connection)
    {
        $this->connection = $connection;
        $this->config = config('services.' . $this->getProviderName(), []);
    }

    /**
     * Get the provider name (e.g., 'google', 'spotify')
     */
    abstract protected function getProviderName(): string;

    /**
     * Get the base API URL for this service
     */
    abstract protected function getBaseUrl(): string;

    /**
     * Get the required scopes for this service
     */
    abstract protected function getRequiredScopes(): array;

    /**
     * Fetch data from the external API
     */
    abstract public function fetchData(array $options = []): array;

    /**
     * Transform raw API data into Memory format
     */
    abstract public function transformToMemories(array $data): array;

    /**
     * Check if the connection is valid and tokens are not expired
     */
    public function isValidConnection(): bool
    {
        if (!$this->connection->is_active) {
            return false;
        }

        if ($this->connection->token_expires_at && 
            $this->connection->token_expires_at->isPast()) {
            return $this->refreshToken();
        }

        return true;
    }

    /**
     * Refresh the OAuth token
     */
    protected function refreshToken(): bool
    {
        if (!$this->connection->refresh_token) {
            Log::error('No refresh token available for connection', [
                'connection_id' => $this->connection->id,
                'provider' => $this->connection->provider
            ]);
            return false;
        }

        try {
            $response = Http::asForm()->post($this->getTokenRefreshUrl(), [
                'grant_type' => 'refresh_token',
                'refresh_token' => decrypt($this->connection->refresh_token),
                'client_id' => $this->config['client_id'],
                'client_secret' => $this->config['client_secret'],
            ]);

            if ($response->successful()) {
                $tokenData = $response->json();
                
                $this->connection->update([
                    'access_token' => encrypt($tokenData['access_token']),
                    'refresh_token' => isset($tokenData['refresh_token']) 
                        ? encrypt($tokenData['refresh_token']) 
                        : $this->connection->refresh_token,
                    'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
                ]);

                return true;
            }

            Log::error('Failed to refresh token', [
                'connection_id' => $this->connection->id,
                'response' => $response->body()
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('Exception during token refresh', [
                'connection_id' => $this->connection->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Get the token refresh URL for this provider
     */
    abstract protected function getTokenRefreshUrl(): string;

    /**
     * Make an authenticated request to the API
     */
    protected function makeAuthenticatedRequest(string $endpoint, array $options = []): array
    {
        if (!$this->isValidConnection()) {
            throw new \Exception('Invalid or expired connection');
        }

        $url = $this->getBaseUrl() . '/' . ltrim($endpoint, '/');
        $accessToken = decrypt($this->connection->access_token);

        $response = Http::withToken($accessToken)
            ->withOptions($options)
            ->get($url);

        if ($response->successful()) {
            return $response->json();
        }

        if ($response->status() === 401) {
            // Try to refresh token and retry
            if ($this->refreshToken()) {
                $accessToken = decrypt($this->connection->access_token);
                $response = Http::withToken($accessToken)
                    ->withOptions($options)
                    ->get($url);
                
                if ($response->successful()) {
                    return $response->json();
                }
            }
        }

        throw new \Exception('API request failed: ' . $response->body());
    }

    /**
     * Get cached data with a specific key
     */
    protected function getCachedData(string $key, \Closure $callback, int $ttl = 3600): mixed
    {
        $cacheKey = sprintf('%s.%s.%s', 
            $this->getProviderName(), 
            $this->connection->id, 
            $key
        );

        return Cache::remember($cacheKey, $ttl, $callback);
    }

    /**
     * Clear cached data for this connection
     */
    public function clearCache(): void
    {
        $pattern = sprintf('%s.%s.*', $this->getProviderName(), $this->connection->id);
        
        // Note: This is a simplified cache clearing method
        // In production, you might want to use Redis tags or similar
        Cache::flush();
    }

    /**
     * Log sync activity
     */
    protected function logSyncActivity(string $action, array $data = []): void
    {
        Log::info('MCP Sync Activity', [
            'provider' => $this->getProviderName(),
            'connection_id' => $this->connection->id,
            'user_id' => $this->connection->user_id,
            'action' => $action,
            'data' => $data
        ]);
    }

    /**
     * Update last sync timestamp
     */
    protected function updateLastSync(): void
    {
        $this->connection->update(['last_sync_at' => now()]);
    }
}
