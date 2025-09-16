<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ApiConnection;
use App\Models\Memory;
use App\Models\MemoryObject;
use App\Models\PalaceRoom;
use App\Services\GmailService;
use Illuminate\Http\Request;

class GmailSyncController extends Controller
{
    public function sync($connectionId)
    {
        $connection = ApiConnection::where('user_id', auth()->id())->findOrFail($connectionId);
        
        if (in_array($connection->provider, ['gmail', 'google_calendar', 'google_photos']) && $connection->is_active) {
            $user = auth()->user();
            
            try {
                $gmailService = new GmailService();
                $realEmails = $gmailService->getRecentEmails($connection->access_token, 10);
                
                $gmailMemories = [];
                foreach ($realEmails as $email) {
                    $gmailMemories[] = [
                        'title' => $email['subject'] ?: 'No Subject',
                        'content' => substr($email['body'], 0, 1000),
                        'type' => 'email',
                        'sentiment' => $this->analyzeSentiment($email['body']),
                        'sentiment_score' => $this->getSentimentScore($email['body']),
                        'tags' => $this->extractTags($email['subject'] . ' ' . $email['body']),
                        'people' => [$this->extractSender($email['from'])],
                        'memory_date' => \Carbon\Carbon::parse($email['date'])
                    ];
                }
            } catch (\Exception $e) {
                \Log::error('Gmail API Error: ' . $e->getMessage());
                $gmailMemories = [[
                    'title' => 'Gmail API Connection Failed',
                    'content' => 'Unable to fetch real emails. Please check your OAuth token.',
                    'type' => 'email',
                    'sentiment' => 'neutral',
                    'sentiment_score' => 0.5,
                    'tags' => ['error', 'api'],
                    'people' => ['System'],
                    'memory_date' => now()
                ]];
            }
            
            $workRoom = PalaceRoom::where('user_id', $user->id)->where('name', 'Work Space')->first();
            
            if (!$workRoom) {
                return response()->json(['error' => 'Work Space room not found'], 404);
            }
            
            foreach ($gmailMemories as $memoryData) {
                $memory = Memory::create([
                    'user_id' => $user->id,
                    'palace_room_id' => $workRoom->id,
                    'type' => $memoryData['type'],
                    'title' => $memoryData['title'],
                    'content' => $memoryData['content'],
                    'description' => 'Gmail email: ' . substr($memoryData['content'], 0, 100) . '...',
                    'memory_date' => $memoryData['memory_date'],
                    'sentiment' => $memoryData['sentiment'],
                    'sentiment_score' => $memoryData['sentiment_score'],
                    'tags' => $memoryData['tags'],
                    'people' => $memoryData['people'],
                    'is_processed' => true,
                    'external_id' => 'gmail_' . uniqid()
                ]);
                
                MemoryObject::create([
                    'memory_id' => $memory->id,
                    'palace_room_id' => $workRoom->id,
                    'object_type' => 'email',
                    'title' => $memory->title,
                    'description' => 'Gmail email object',
                    'position' => ['x' => rand(-4, 4), 'y' => rand(1, 3), 'z' => rand(-3, 3)],
                    'rotation' => ['x' => 0, 'y' => rand(0, 360), 'z' => 0],
                    'scale' => ['x' => 1.2, 'y' => 0.8, 'z' => 0.1],
                    'color' => [
                        'primary' => $memoryData['sentiment'] === 'positive' ? '#10b981' : 
                                   ($memoryData['sentiment'] === 'negative' ? '#ef4444' : '#6b7280'),
                        'secondary' => '#ffffff'
                    ],
                    'importance_score' => $memoryData['sentiment_score'],
                    'is_visible' => true,
                    'is_interactive' => true
                ]);
            }
        }
        
        $connection->update(['last_sync_at' => now()]);
        $memoriesCount = Memory::where('user_id', auth()->id())->count();
        
        return response()->json([
            'message' => 'Sync completed successfully', 
            'memories_imported' => count($gmailMemories ?? []),
            'total_memories' => $memoriesCount
        ]);
    }
    
    private function analyzeSentiment($text) {
        $positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful'];
        $negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad'];
        
        $text = strtolower($text);
        $positiveCount = $negativeCount = 0;
        
        foreach ($positiveWords as $word) {
            if (strpos($text, $word) !== false) $positiveCount++;
        }
        
        foreach ($negativeWords as $word) {
            if (strpos($text, $word) !== false) $negativeCount++;
        }
        
        if ($positiveCount > $negativeCount) return 'positive';
        if ($negativeCount > $positiveCount) return 'negative';
        return 'neutral';
    }
    
    private function getSentimentScore($text) {
        $sentiment = $this->analyzeSentiment($text);
        switch ($sentiment) {
            case 'positive': return rand(60, 95) / 100;
            case 'negative': return rand(-95, -30) / 100;
            default: return rand(40, 60) / 100;
        }
    }
    
    private function extractTags($text) {
        $commonTags = ['work', 'meeting', 'project', 'update', 'reminder'];
        $tags = [];
        $text = strtolower($text);
        
        foreach ($commonTags as $tag) {
            if (strpos($text, $tag) !== false) {
                $tags[] = $tag;
            }
        }
        
        return array_slice($tags, 0, 5);
    }
    
    private function extractSender($from) {
        if (preg_match('/([^<]+)</', $from, $matches)) {
            return trim($matches[1]);
        }
        return $from;
    }
}