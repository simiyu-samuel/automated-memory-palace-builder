<?php

namespace App\Services\MCP;

use Carbon\Carbon;

class SpotifyMCPService extends BaseMCPService
{
    protected function getProviderName(): string
    {
        return 'spotify';
    }

    protected function getBaseUrl(): string
    {
        return 'https://api.spotify.com/v1';
    }

    protected function getRequiredScopes(): array
    {
        return [
            'user-read-recently-played',
            'user-read-playback-state',
            'playlist-read-private',
            'playlist-read-collaborative',
            'user-library-read',
            'user-top-read',
        ];
    }

    protected function getTokenRefreshUrl(): string
    {
        return 'https://accounts.spotify.com/api/token';
    }

    public function fetchData(array $options = []): array
    {
        $this->logSyncActivity('fetch_start', $options);

        $results = [];
        
        try {
            // Get user profile
            $results['profile'] = $this->makeAuthenticatedRequest('me');
            
            // Fetch recently played tracks
            $limit = $options['recent_limit'] ?? 50;
            $results['recentlyPlayed'] = $this->makeAuthenticatedRequest('me/player/recently-played', [
                'query' => ['limit' => $limit]
            ]);
            
            // Fetch user's playlists
            $results['playlists'] = $this->fetchAllPlaylists($options['playlist_limit'] ?? 50);
            
            // Fetch saved albums
            $results['savedAlbums'] = $this->fetchPaginatedData('me/albums', $options['album_limit'] ?? 50);
            
            // Fetch saved tracks
            $results['savedTracks'] = $this->fetchPaginatedData('me/tracks', $options['track_limit'] ?? 50);
            
            // Fetch top artists (short, medium, long term)
            $results['topArtists'] = [];
            foreach (['short_term', 'medium_term', 'long_term'] as $timeRange) {
                $results['topArtists'][$timeRange] = $this->makeAuthenticatedRequest('me/top/artists', [
                    'query' => ['time_range' => $timeRange, 'limit' => 20]
                ]);
                usleep(200000); // Rate limiting
            }
            
            // Fetch top tracks
            $results['topTracks'] = [];
            foreach (['short_term', 'medium_term', 'long_term'] as $timeRange) {
                $results['topTracks'][$timeRange] = $this->makeAuthenticatedRequest('me/top/tracks', [
                    'query' => ['time_range' => $timeRange, 'limit' => 20]
                ]);
                usleep(200000); // Rate limiting
            }
            
            $this->updateLastSync();
            $this->logSyncActivity('fetch_complete', [
                'recently_played_count' => count($results['recentlyPlayed']['items'] ?? []),
                'playlist_count' => count($results['playlists']),
                'saved_album_count' => count($results['savedAlbums']),
                'saved_track_count' => count($results['savedTracks']),
            ]);
            
            return $results;
            
        } catch (\Exception $e) {
            $this->logSyncActivity('fetch_error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function transformToMemories(array $data): array
    {
        $memories = [];
        
        // Process recently played tracks
        foreach ($data['recentlyPlayed']['items'] ?? [] as $item) {
            $track = $item['track'];
            $playedAt = Carbon::parse($item['played_at']);
            
            $memory = [
                'type' => 'song',
                'title' => $track['name'] ?? 'Unknown Track',
                'content' => $this->generateTrackDescription($track),
                'external_id' => $track['id'] ?? uniqid('spotify_'),
                'external_url' => $track['external_urls']['spotify'] ?? null,
                'memory_date' => $playedAt,
                'raw_data' => $item,
                'metadata' => [
                    'artist' => $this->getArtistNames($track['artists'] ?? []),
                    'album' => $track['album']['name'] ?? null,
                    'duration_ms' => $track['duration_ms'] ?? null,
                    'popularity' => $track['popularity'] ?? null,
                    'explicit' => $track['explicit'] ?? false,
                    'preview_url' => $track['preview_url'] ?? null,
                    'played_at' => $item['played_at'],
                    'context' => $item['context'] ?? null,
                ],
                'people' => $this->getArtistNames($track['artists'] ?? []),
                'tags' => $this->generateMusicTags($track, $item),
                'categories' => $this->categorizeMusic($track, $data),
            ];
            
            $memories[] = $memory;
        }
        
        // Process saved tracks as memories
        foreach ($data['savedTracks'] ?? [] as $item) {
            $track = $item['track'];
            $addedAt = Carbon::parse($item['added_at']);
            
            $memory = [
                'type' => 'saved_song',
                'title' => $track['name'] ?? 'Unknown Track',
                'content' => $this->generateTrackDescription($track) . ' (Saved to library)',
                'external_id' => 'saved_' . ($track['id'] ?? uniqid('spotify_')),
                'external_url' => $track['external_urls']['spotify'] ?? null,
                'memory_date' => $addedAt,
                'raw_data' => $item,
                'metadata' => [
                    'artist' => $this->getArtistNames($track['artists'] ?? []),
                    'album' => $track['album']['name'] ?? null,
                    'duration_ms' => $track['duration_ms'] ?? null,
                    'added_at' => $item['added_at'],
                    'saved' => true,
                ],
                'people' => $this->getArtistNames($track['artists'] ?? []),
                'tags' => array_merge(['saved', 'library'], $this->generateMusicTags($track, $item)),
                'categories' => array_merge(['music_library'], $this->categorizeMusic($track, $data)),
            ];
            
            $memories[] = $memory;
        }
        
        // Process playlists as memories
        foreach ($data['playlists'] ?? [] as $playlist) {
            if (!$playlist['tracks']['total']) continue; // Skip empty playlists
            
            $memory = [
                'type' => 'playlist',
                'title' => $playlist['name'] ?? 'Untitled Playlist',
                'content' => ($playlist['description'] ?? '') . "\nPlaylist with {$playlist['tracks']['total']} tracks",
                'external_id' => 'playlist_' . $playlist['id'],
                'external_url' => $playlist['external_urls']['spotify'] ?? null,
                'memory_date' => Carbon::now(), // Playlists don't have creation dates in API
                'raw_data' => $playlist,
                'metadata' => [
                    'track_count' => $playlist['tracks']['total'],
                    'public' => $playlist['public'] ?? false,
                    'collaborative' => $playlist['collaborative'] ?? false,
                    'owner' => $playlist['owner']['display_name'] ?? null,
                    'owner_id' => $playlist['owner']['id'] ?? null,
                    'followers' => $playlist['followers']['total'] ?? 0,
                ],
                'tags' => $this->generatePlaylistTags($playlist),
                'categories' => ['music_curation', 'playlist'],
            ];
            
            $memories[] = $memory;
        }
        
        return $memories;
    }

    private function fetchAllPlaylists(int $limit): array
    {
        $playlists = [];
        $offset = 0;
        $batchSize = 50;
        
        do {
            $response = $this->makeAuthenticatedRequest('me/playlists', [
                'query' => ['limit' => min($batchSize, $limit - count($playlists)), 'offset' => $offset]
            ]);
            
            $items = $response['items'] ?? [];
            $playlists = array_merge($playlists, $items);
            
            $offset += count($items);
            $hasMore = isset($response['next']) && count($playlists) < $limit;
            
            if ($hasMore) {
                usleep(200000); // Rate limiting
            }
            
        } while ($hasMore);
        
        return $playlists;
    }

    private function fetchPaginatedData(string $endpoint, int $limit): array
    {
        $items = [];
        $offset = 0;
        $batchSize = 50;
        
        do {
            $response = $this->makeAuthenticatedRequest($endpoint, [
                'query' => ['limit' => min($batchSize, $limit - count($items)), 'offset' => $offset]
            ]);
            
            $responseItems = $response['items'] ?? [];
            $items = array_merge($items, $responseItems);
            
            $offset += count($responseItems);
            $hasMore = isset($response['next']) && count($items) < $limit;
            
            if ($hasMore) {
                usleep(200000); // Rate limiting
            }
            
        } while ($hasMore);
        
        return $items;
    }

    private function getArtistNames(array $artists): array
    {
        return array_map(function($artist) {
            return $artist['name'] ?? 'Unknown Artist';
        }, $artists);
    }

    private function generateTrackDescription(array $track): string
    {
        $artists = $this->getArtistNames($track['artists'] ?? []);
        $artistString = implode(', ', $artists);
        $album = $track['album']['name'] ?? 'Unknown Album';
        
        $description = "Track by {$artistString}";
        if ($album !== 'Unknown Album') {
            $description .= " from the album '{$album}'";
        }
        
        if (isset($track['duration_ms'])) {
            $minutes = floor($track['duration_ms'] / 60000);
            $seconds = floor(($track['duration_ms'] % 60000) / 1000);
            $description .= sprintf(" (%d:%02d)", $minutes, $seconds);
        }
        
        return $description;
    }

    private function generateMusicTags(array $track, array $context): array
    {
        $tags = [];
        
        // Genre-based tags (would need additional API calls for audio features)
        $album = $track['album'] ?? [];
        $releaseDate = $album['release_date'] ?? '';
        
        if ($releaseDate) {
            $year = substr($releaseDate, 0, 4);
            if ($year) {
                $tags[] = "year_{$year}";
                
                // Decade tags
                $decade = floor($year / 10) * 10;
                $tags[] = "{$decade}s";
            }
        }
        
        // Popularity tags
        $popularity = $track['popularity'] ?? 0;
        if ($popularity > 80) {
            $tags[] = 'popular';
        } elseif ($popularity > 60) {
            $tags[] = 'well_known';
        } elseif ($popularity < 30) {
            $tags[] = 'underground';
        }
        
        // Duration tags
        $duration = $track['duration_ms'] ?? 0;
        if ($duration > 0) {
            if ($duration < 180000) { // < 3 minutes
                $tags[] = 'short_track';
            } elseif ($duration > 360000) { // > 6 minutes
                $tags[] = 'long_track';
            }
        }
        
        // Context tags
        if (isset($context['context'])) {
            $contextType = $context['context']['type'] ?? null;
            if ($contextType === 'playlist') {
                $tags[] = 'from_playlist';
            } elseif ($contextType === 'album') {
                $tags[] = 'from_album';
            }
        }
        
        return array_unique($tags);
    }

    private function generatePlaylistTags(array $playlist): array
    {
        $tags = ['playlist'];
        
        $name = strtolower($playlist['name'] ?? '');
        
        // Common playlist name patterns
        if (strpos($name, 'workout') !== false || strpos($name, 'gym') !== false) {
            $tags[] = 'workout';
        }
        if (strpos($name, 'chill') !== false || strpos($name, 'relax') !== false) {
            $tags[] = 'chill';
        }
        if (strpos($name, 'party') !== false || strpos($name, 'dance') !== false) {
            $tags[] = 'party';
        }
        if (strpos($name, 'focus') !== false || strpos($name, 'study') !== false) {
            $tags[] = 'focus';
        }
        if (strpos($name, 'road trip') !== false || strpos($name, 'drive') !== false) {
            $tags[] = 'driving';
        }
        
        // Ownership tags
        if ($playlist['public']) {
            $tags[] = 'public';
        } else {
            $tags[] = 'private';
        }
        
        if ($playlist['collaborative'] ?? false) {
            $tags[] = 'collaborative';
        }
        
        return array_unique($tags);
    }

    private function categorizeMusic(array $track, array $data): array
    {
        $categories = ['music'];
        
        // Artist-based categories
        $artists = $this->getArtistNames($track['artists'] ?? []);
        
        // Check if this artist appears in top artists (indicates preference)
        $topArtists = array_merge(
            $data['topArtists']['short_term']['items'] ?? [],
            $data['topArtists']['medium_term']['items'] ?? [],
            $data['topArtists']['long_term']['items'] ?? []
        );
        
        foreach ($topArtists as $topArtist) {
            if (in_array($topArtist['name'], $artists)) {
                $categories[] = 'favorite_artist';
                break;
            }
        }
        
        // Album type categories
        $albumType = $track['album']['album_type'] ?? '';
        if ($albumType === 'single') {
            $categories[] = 'single';
        } elseif ($albumType === 'compilation') {
            $categories[] = 'compilation';
        } else {
            $categories[] = 'album';
        }
        
        return array_unique($categories);
    }
}
