<?php

namespace App\Services;

use App\Models\ApiConnection;
use App\Models\Memory;
use App\Models\MemoryObject;
use App\Models\PalaceRoom;
use Carbon\Carbon;

class MemoryCollectionService
{
    private $googleService;
    private $spotifyService;

    public function __construct(GoogleOAuthService $googleService, SpotifyService $spotifyService)
    {
        $this->googleService = $googleService;
        $this->spotifyService = $spotifyService;
    }

    public function collectFromConnection(ApiConnection $connection)
    {
        if (!$connection->is_active || !$connection->access_token) {
            throw new \Exception('Connection is not active or missing access token');
        }

        switch ($connection->provider) {
            case 'gmail':
                return $this->collectGmailData($connection);
            case 'google_calendar':
                return $this->collectCalendarData($connection);
            case 'google_photos':
                return $this->collectPhotosData($connection);
            case 'spotify':
                return $this->collectSpotifyData($connection);
            case 'location_services':
                return $this->collectLocationData($connection);
            default:
                throw new \Exception('Unsupported provider: ' . $connection->provider);
        }
    }

    private function collectGmailData(ApiConnection $connection)
    {
        $emails = $this->googleService->getGmailEmails($connection->access_token, 10);
        $user = $connection->user;
        $workRoom = $this->ensureWorkRoom($user);

        $memoriesCreated = 0;
        foreach ($emails as $email) {
            // Check if memory already exists
            $existingMemory = Memory::where('user_id', $user->id)
                ->where('external_id', 'gmail_' . $email['id'])
                ->first();

            if ($existingMemory) {
                continue;
            }

            $sentiment = $this->analyzeSentiment($email['subject'] . ' ' . $email['body']);
            
            $memory = Memory::create([
                'user_id' => $user->id,
                'api_connection_id' => $connection->id,
                'palace_room_id' => $workRoom->id,
                'type' => 'email',
                'title' => $this->sanitizeText($email['subject'] ?: 'No Subject'),
                'content' => $this->sanitizeText(substr($email['body'], 0, 2000)),
                'description' => 'Gmail: ' . $this->sanitizeText(substr($email['body'], 0, 150)),
                'memory_date' => Carbon::parse($email['date']),
                'sentiment' => $sentiment['label'],
                'sentiment_score' => $sentiment['score'],
                'tags' => ['gmail', 'email', 'work'],
                'people' => [$this->extractSenderName($email['from'])],
                'is_processed' => true,
                'external_id' => 'gmail_' . $email['id']
            ]);

            // Create 3D object
            MemoryObject::create([
                'memory_id' => $memory->id,
                'palace_room_id' => $workRoom->id,
                'object_type' => 'email',
                'title' => $memory->title,
                'description' => 'Gmail email from ' . $this->extractSenderName($email['from']),
                'position' => ['x' => rand(-4, 4), 'y' => rand(1, 3), 'z' => rand(-3, 3)],
                'rotation' => ['x' => 0, 'y' => rand(0, 360), 'z' => 0],
                'scale' => ['x' => 1.2, 'y' => 0.8, 'z' => 0.1],
                'color' => $this->getSentimentColor($sentiment['label']),
                'importance_score' => min(0.9, 0.5 + (strlen($email['body']) / 2000)),
                'is_visible' => true,
                'is_interactive' => true
            ]);

            $memoriesCreated++;
        }

        $connection->update(['last_sync_at' => now()]);
        return $memoriesCreated;
    }

    private function collectCalendarData(ApiConnection $connection)
    {
        $events = $this->googleService->getCalendarEvents($connection->access_token, 15);
        $user = $connection->user;
        $workRoom = $this->ensureWorkRoom($user);

        $memoriesCreated = 0;
        foreach ($events as $event) {
            $existingMemory = Memory::where('user_id', $user->id)
                ->where('external_id', 'calendar_' . $event['id'])
                ->first();

            if ($existingMemory) {
                continue;
            }

            $memory = Memory::create([
                'user_id' => $user->id,
                'api_connection_id' => $connection->id,
                'palace_room_id' => $workRoom->id,
                'type' => 'event',
                'title' => $event['summary'] ?: 'Untitled Event',
                'content' => $event['description'] ?: 'No description',
                'description' => 'Calendar: ' . ($event['summary'] ?: 'Event'),
                'memory_date' => Carbon::parse($event['start']),
                'sentiment' => 'neutral',
                'sentiment_score' => 0.5,
                'tags' => ['calendar', 'event', 'meeting'],
                'location' => $event['location'] ? [$event['location']] : null,
                'is_processed' => true,
                'external_id' => 'calendar_' . $event['id']
            ]);

            MemoryObject::create([
                'memory_id' => $memory->id,
                'palace_room_id' => $workRoom->id,
                'object_type' => 'calendar',
                'title' => $memory->title,
                'description' => 'Calendar event',
                'position' => ['x' => rand(-3, 3), 'y' => rand(2, 4), 'z' => rand(-2, 2)],
                'rotation' => ['x' => 0, 'y' => rand(0, 360), 'z' => 0],
                'scale' => ['x' => 1.0, 'y' => 1.5, 'z' => 0.2],
                'color' => ['primary' => '#3b82f6', 'secondary' => '#ffffff'],
                'importance_score' => 0.7,
                'is_visible' => true,
                'is_interactive' => true
            ]);

            $memoriesCreated++;
        }

        $connection->update(['last_sync_at' => now()]);
        return $memoriesCreated;
    }

    private function collectPhotosData(ApiConnection $connection)
    {
        // Check if connection has Photos Library scope
        $requiredScope = 'https://www.googleapis.com/auth/photoslibrary.readonly';
        if (!in_array($requiredScope, $connection->scopes ?? [])) {
            throw new \Exception('Google Photos access requires Photos Library scope. Please create a new Google Photos connection.');
        }
        
        $photos = $this->googleService->getPhotos($connection->access_token, 10);
        $user = $connection->user;
        $personalRoom = $this->ensurePersonalRoom($user);

        $memoriesCreated = 0;
        foreach ($photos as $photo) {
            $existingMemory = Memory::where('user_id', $user->id)
                ->where('external_id', 'photos_' . $photo['id'])
                ->first();

            if ($existingMemory) {
                continue;
            }

            $memory = Memory::create([
                'user_id' => $user->id,
                'api_connection_id' => $connection->id,
                'palace_room_id' => $personalRoom->id,
                'type' => 'photo',
                'title' => $photo['filename'] ?: 'Untitled Photo',
                'content' => $photo['description'] ?: 'Photo from Google Photos',
                'description' => 'Google Photos: ' . ($photo['filename'] ?: 'Photo'),
                'memory_date' => Carbon::parse($photo['mediaMetadata']['creationTime'] ?? now()),
                'sentiment' => 'positive',
                'sentiment_score' => 0.8,
                'tags' => ['photos', 'image', 'memories'],
                'is_processed' => true,
                'external_id' => 'photos_' . $photo['id']
            ]);

            MemoryObject::create([
                'memory_id' => $memory->id,
                'palace_room_id' => $personalRoom->id,
                'object_type' => 'photo',
                'title' => $memory->title,
                'description' => 'Photo from Google Photos',
                'position' => ['x' => rand(-3, 3), 'y' => rand(1, 3), 'z' => rand(-2, 2)],
                'rotation' => ['x' => 0, 'y' => rand(0, 360), 'z' => 0],
                'scale' => ['x' => 1.5, 'y' => 1.0, 'z' => 0.1],
                'color' => ['primary' => '#4285f4', 'secondary' => '#ffffff'],
                'importance_score' => 0.8,
                'is_visible' => true,
                'is_interactive' => true
            ]);

            $memoriesCreated++;
        }

        $connection->update(['last_sync_at' => now()]);
        return $memoriesCreated;
    }

    private function collectSpotifyData(ApiConnection $connection)
    {
        $tracks = $this->spotifyService->getRecentlyPlayed($connection->access_token, 15);
        $user = $connection->user;
        $personalRoom = $this->ensurePersonalRoom($user);

        $memoriesCreated = 0;
        foreach ($tracks as $track) {
            $existingMemory = Memory::where('user_id', $user->id)
                ->where('external_id', 'spotify_' . $track['id'])
                ->first();

            if ($existingMemory) {
                continue;
            }

            $memory = Memory::create([
                'user_id' => $user->id,
                'api_connection_id' => $connection->id,
                'palace_room_id' => $personalRoom->id,
                'type' => 'music',
                'title' => $track['name'] . ' by ' . $track['artist'],
                'content' => 'Album: ' . $track['album'],
                'description' => 'Spotify: ' . $track['name'],
                'memory_date' => Carbon::parse($track['played_at']),
                'sentiment' => 'positive',
                'sentiment_score' => 0.7,
                'tags' => ['spotify', 'music', $track['artist']],
                'people' => [$track['artist']],
                'is_processed' => true,
                'external_id' => 'spotify_' . $track['id']
            ]);

            MemoryObject::create([
                'memory_id' => $memory->id,
                'palace_room_id' => $personalRoom->id,
                'object_type' => 'music',
                'title' => $memory->title,
                'description' => 'Music track from Spotify',
                'position' => ['x' => rand(-2, 2), 'y' => rand(1, 2), 'z' => rand(-2, 2)],
                'rotation' => ['x' => 0, 'y' => rand(0, 360), 'z' => 0],
                'scale' => ['x' => 0.8, 'y' => 0.8, 'z' => 0.8],
                'color' => ['primary' => '#1db954', 'secondary' => '#191414'],
                'importance_score' => 0.6,
                'is_visible' => true,
                'is_interactive' => true
            ]);

            $memoriesCreated++;
        }

        $connection->update(['last_sync_at' => now()]);
        return $memoriesCreated;
    }

    private function analyzeSentiment($text)
    {
        // Simple sentiment analysis - in production, use a proper service
        $positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy'];
        $negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'frustrated', 'disappointed'];
        
        $text = strtolower($text);
        $positiveCount = 0;
        $negativeCount = 0;
        
        foreach ($positiveWords as $word) {
            $positiveCount += substr_count($text, $word);
        }
        
        foreach ($negativeWords as $word) {
            $negativeCount += substr_count($text, $word);
        }
        
        if ($positiveCount > $negativeCount) {
            return ['label' => 'positive', 'score' => min(0.9, 0.6 + ($positiveCount * 0.1))];
        } elseif ($negativeCount > $positiveCount) {
            return ['label' => 'negative', 'score' => max(0.1, 0.4 - ($negativeCount * 0.1))];
        }
        
        return ['label' => 'neutral', 'score' => 0.5];
    }

    private function getSentimentColor($sentiment)
    {
        switch ($sentiment) {
            case 'positive':
                return ['primary' => '#10b981', 'secondary' => '#ffffff'];
            case 'negative':
                return ['primary' => '#ef4444', 'secondary' => '#ffffff'];
            default:
                return ['primary' => '#6b7280', 'secondary' => '#ffffff'];
        }
    }

    private function extractSenderName($from)
    {
        if (preg_match('/([^<]+)</', $from, $matches)) {
            return trim($matches[1]);
        }
        return $from;
    }

    private function ensureWorkRoom($user)
    {
        return PalaceRoom::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Work Space'],
            [
                'description' => 'Professional memories and communications',
                'theme' => 'professional',
                'mood' => 'focused',
                'is_active' => true
            ]
        );
    }

    private function ensurePersonalRoom($user)
    {
        return PalaceRoom::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Personal Space'],
            [
                'description' => 'Personal memories and entertainment',
                'theme' => 'personal',
                'mood' => 'relaxed',
                'is_active' => true
            ]
        );
    }

    private function sanitizeText($text)
    {
        // Strip HTML tags and decode entities
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        
        // Remove excessive whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        
        // Remove or replace problematic UTF-8 characters
        $text = preg_replace('/[\x{1F600}-\x{1F64F}]/u', '', $text); // Emoticons
        $text = preg_replace('/[\x{1F300}-\x{1F5FF}]/u', '', $text); // Misc symbols
        $text = preg_replace('/[\x{1F680}-\x{1F6FF}]/u', '', $text); // Transport
        $text = preg_replace('/[\x{2600}-\x{26FF}]/u', '', $text); // Misc symbols
        $text = preg_replace('/[\x{2700}-\x{27BF}]/u', '', $text); // Dingbats
        
        return mb_convert_encoding($text, 'UTF-8', 'UTF-8');
    }

    private function collectLocationData(ApiConnection $connection)
    {
        $user = $connection->user;
        $personalRoom = $this->ensurePersonalRoom($user);

        // Generate sample location memories (in real app, this would come from GPS/location API)
        $locations = [
            [
                'name' => 'Home',
                'address' => 'Your Home Address',
                'coordinates' => ['lat' => 40.7128, 'lng' => -74.0060],
                'visit_time' => now()->subHours(2),
                'duration' => 120, // minutes
                'activity' => 'relaxing'
            ],
            [
                'name' => 'Coffee Shop',
                'address' => 'Local Coffee Shop',
                'coordinates' => ['lat' => 40.7589, 'lng' => -73.9851],
                'visit_time' => now()->subDays(1),
                'duration' => 45,
                'activity' => 'meeting'
            ],
            [
                'name' => 'Park',
                'address' => 'Central Park',
                'coordinates' => ['lat' => 40.7829, 'lng' => -73.9654],
                'visit_time' => now()->subDays(3),
                'duration' => 90,
                'activity' => 'walking'
            ]
        ];

        $memoriesCreated = 0;
        foreach ($locations as $location) {
            $existingMemory = Memory::where('user_id', $user->id)
                ->where('external_id', 'location_' . md5($location['name'] . $location['visit_time']))
                ->first();

            if ($existingMemory) {
                continue;
            }

            $memory = Memory::create([
                'user_id' => $user->id,
                'api_connection_id' => $connection->id,
                'palace_room_id' => $personalRoom->id,
                'type' => 'location',
                'title' => 'Visit to ' . $location['name'],
                'content' => "Spent {$location['duration']} minutes {$location['activity']} at {$location['name']}",
                'description' => 'Location: ' . $location['address'],
                'memory_date' => Carbon::parse($location['visit_time']),
                'sentiment' => 'positive',
                'sentiment_score' => 0.7,
                'tags' => ['location', 'visit', $location['activity']],
                'location' => [$location['address']],
                'is_processed' => true,
                'external_id' => 'location_' . md5($location['name'] . $location['visit_time'])
            ]);

            MemoryObject::create([
                'memory_id' => $memory->id,
                'palace_room_id' => $personalRoom->id,
                'object_type' => 'location',
                'title' => $memory->title,
                'description' => 'Location visit memory',
                'position' => ['x' => rand(-2, 2), 'y' => rand(1, 2), 'z' => rand(-2, 2)],
                'rotation' => ['x' => 0, 'y' => rand(0, 360), 'z' => 0],
                'scale' => ['x' => 1.0, 'y' => 1.2, 'z' => 1.0],
                'color' => ['primary' => '#10b981', 'secondary' => '#ffffff'],
                'importance_score' => min(0.9, $location['duration'] / 100),
                'is_visible' => true,
                'is_interactive' => true
            ]);

            $memoriesCreated++;
        }

        $connection->update(['last_sync_at' => now()]);
        return $memoriesCreated;
    }
}