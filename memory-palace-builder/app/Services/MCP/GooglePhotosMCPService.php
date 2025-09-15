<?php

namespace App\Services\MCP;

use Carbon\Carbon;

class GooglePhotosMCPService extends BaseMCPService
{
    protected function getProviderName(): string
    {
        return 'google';
    }

    protected function getBaseUrl(): string
    {
        return 'https://photoslibrary.googleapis.com/v1';
    }

    protected function getRequiredScopes(): array
    {
        return [
            'https://www.googleapis.com/auth/photoslibrary.readonly',
        ];
    }

    protected function getTokenRefreshUrl(): string
    {
        return 'https://oauth2.googleapis.com/token';
    }

    public function fetchData(array $options = []): array
    {
        $this->logSyncActivity('fetch_start', $options);

        $results = [];
        
        try {
            $pageSize = $options['page_size'] ?? 100;
            $maxItems = $options['max_items'] ?? 500;
            $fetchedItems = 0;
            
            // Fetch media items
            $results['mediaItems'] = [];
            $nextPageToken = null;
            
            do {
                $params = ['pageSize' => min($pageSize, $maxItems - $fetchedItems)];
                if ($nextPageToken) {
                    $params['pageToken'] = $nextPageToken;
                }
                
                // Add filters if specified
                if (isset($options['filters'])) {
                    $params['filters'] = $options['filters'];
                }
                
                $response = $this->makeAuthenticatedRequest('mediaItems:search', [
                    'query' => $params
                ]);
                
                $mediaItems = $response['mediaItems'] ?? [];
                $results['mediaItems'] = array_merge($results['mediaItems'], $mediaItems);
                
                $fetchedItems += count($mediaItems);
                $nextPageToken = $response['nextPageToken'] ?? null;
                
                // Rate limiting
                usleep(200000); // 200ms delay
                
            } while ($nextPageToken && $fetchedItems < $maxItems);
            
            // Fetch albums
            $results['albums'] = [];
            $nextPageToken = null;
            $maxAlbums = $options['max_albums'] ?? 50;
            $fetchedAlbums = 0;
            
            do {
                $params = ['pageSize' => min(50, $maxAlbums - $fetchedAlbums)];
                if ($nextPageToken) {
                    $params['pageToken'] = $nextPageToken;
                }
                
                $response = $this->makeAuthenticatedRequest('albums', [
                    'query' => $params
                ]);
                
                $albums = $response['albums'] ?? [];
                $results['albums'] = array_merge($results['albums'], $albums);
                
                $fetchedAlbums += count($albums);
                $nextPageToken = $response['nextPageToken'] ?? null;
                
                usleep(200000); // Rate limiting
                
            } while ($nextPageToken && $fetchedAlbums < $maxAlbums);
            
            $this->updateLastSync();
            $this->logSyncActivity('fetch_complete', [
                'media_item_count' => count($results['mediaItems']),
                'album_count' => count($results['albums'])
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
        
        // Process media items (photos/videos)
        foreach ($data['mediaItems'] ?? [] as $item) {
            $mediaMetadata = $item['mediaMetadata'] ?? [];
            $creationTime = $this->parseGoogleDateTime($mediaMetadata['creationTime'] ?? null);
            
            $memory = [
                'type' => $this->getMediaType($item['mimeType'] ?? ''),
                'title' => $item['filename'] ?? 'Untitled Media',
                'content' => $item['description'] ?? '',
                'external_id' => $item['id'],
                'external_url' => $item['productUrl'] ?? null,
                'memory_date' => $creationTime,
                'raw_data' => $item,
                'metadata' => [
                    'filename' => $item['filename'] ?? null,
                    'mime_type' => $item['mimeType'] ?? null,
                    'base_url' => $item['baseUrl'] ?? null,
                    'width' => $mediaMetadata['width'] ?? null,
                    'height' => $mediaMetadata['height'] ?? null,
                    'creation_time' => $mediaMetadata['creationTime'] ?? null,
                    'photo_metadata' => $mediaMetadata['photo'] ?? null,
                    'video_metadata' => $mediaMetadata['video'] ?? null,
                ],
                'location' => $this->extractLocation($mediaMetadata),
                'people' => $this->extractPeople($item),
                'tags' => $this->generatePhotoTags($item, $data['albums'] ?? []),
                'categories' => $this->categorizeMedia($item, $mediaMetadata),
            ];
            
            $memories[] = $memory;
        }
        
        return $memories;
    }

    private function parseGoogleDateTime(?string $dateTimeString): Carbon
    {
        if (!$dateTimeString) {
            return now();
        }
        
        try {
            return Carbon::parse($dateTimeString);
        } catch (\Exception $e) {
            return now();
        }
    }

    private function getMediaType(string $mimeType): string
    {
        if (strpos($mimeType, 'image/') === 0) {
            return 'photo';
        } elseif (strpos($mimeType, 'video/') === 0) {
            return 'video';
        }
        
        return 'media';
    }

    private function extractLocation(array $mediaMetadata): ?array
    {
        // Google Photos doesn't directly provide location in the API
        // But we can check for geo data in EXIF if available
        $photoMetadata = $mediaMetadata['photo'] ?? [];
        
        if (isset($photoMetadata['cameraModel']) || isset($photoMetadata['focalLength'])) {
            // This indicates EXIF data is available, location might be too
            // In a full implementation, you'd extract GPS coordinates
            return null;
        }
        
        return null;
    }

    private function extractPeople(array $item): array
    {
        // Google Photos API doesn't provide face detection results directly
        // This would require additional API calls to Google Cloud Vision API
        // or similar service for face detection and recognition
        
        return [];
    }

    private function generatePhotoTags(array $item, array $albums): array
    {
        $tags = [];
        
        // Add album names as tags
        foreach ($albums as $album) {
            // This is simplified - you'd need to check if the item belongs to the album
            if (isset($album['title'])) {
                $tags[] = strtolower(str_replace(' ', '_', $album['title']));
            }
        }
        
        // Generate tags based on filename
        $filename = strtolower($item['filename'] ?? '');
        
        if (strpos($filename, 'screenshot') !== false) {
            $tags[] = 'screenshot';
        }
        if (strpos($filename, 'img_') === 0) {
            $tags[] = 'camera_photo';
        }
        if (strpos($filename, 'vid_') === 0) {
            $tags[] = 'camera_video';
        }
        
        // Add date-based tags
        $creationTime = $item['mediaMetadata']['creationTime'] ?? null;
        if ($creationTime) {
            $date = Carbon::parse($creationTime);
            $tags[] = $date->format('Y');
            $tags[] = $date->format('F'); // Month name
            
            $dayOfWeek = $date->format('l');
            if (in_array($dayOfWeek, ['Saturday', 'Sunday'])) {
                $tags[] = 'weekend';
            } else {
                $tags[] = 'weekday';
            }
        }
        
        return array_unique($tags);
    }

    private function categorizeMedia(array $item, array $mediaMetadata): array
    {
        $categories = [];
        
        $mimeType = $item['mimeType'] ?? '';
        
        if (strpos($mimeType, 'image/') === 0) {
            $categories[] = 'photography';
            
            // Check for specific image types
            if (strpos($mimeType, 'image/png') === 0) {
                $categories[] = 'screenshot_or_graphic';
            } elseif (strpos($mimeType, 'image/jpeg') === 0) {
                $categories[] = 'photo';
            }
        } elseif (strpos($mimeType, 'video/') === 0) {
            $categories[] = 'videography';
            
            $videoMetadata = $mediaMetadata['video'] ?? [];
            $fps = $videoMetadata['fps'] ?? 0;
            
            if ($fps >= 60) {
                $categories[] = 'high_fps_video';
            }
        }
        
        // Categorize by camera make/model if available
        $photoMetadata = $mediaMetadata['photo'] ?? [];
        $cameraMake = $photoMetadata['cameraMake'] ?? '';
        
        if (stripos($cameraMake, 'canon') !== false || 
            stripos($cameraMake, 'nikon') !== false ||
            stripos($cameraMake, 'sony') !== false) {
            $categories[] = 'professional_camera';
        } elseif (stripos($cameraMake, 'apple') !== false ||
                  stripos($cameraMake, 'samsung') !== false) {
            $categories[] = 'mobile_phone';
        }
        
        return array_unique($categories);
    }
}
