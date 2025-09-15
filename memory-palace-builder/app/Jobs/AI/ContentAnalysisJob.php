<?php

namespace App\Jobs\AI;

use App\Models\Memory;
use App\Models\ProcessingLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ContentAnalysisJob implements ShouldQueue
{
    use Queueable;

    protected int $userId;
    protected ?int $connectionId;
    protected ProcessingLog $processingLog;

    /**
     * Create a new job instance.
     */
    public function __construct(int $userId, ?int $connectionId = null)
    {
        $this->userId = $userId;
        $this->connectionId = $connectionId;
        
        // Create processing log
        $this->processingLog = ProcessingLog::create([
            'user_id' => $userId,
            'job_type' => 'content_analysis',
            'job_class' => self::class,
            'status' => 'pending',
            'input_data' => [
                'user_id' => $userId,
                'connection_id' => $connectionId,
            ],
        ]);
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $startTime = now();
        
        try {
            $this->processingLog->update([
                'status' => 'running',
                'started_at' => $startTime,
            ]);

            Log::info('Starting content analysis', [
                'user_id' => $this->userId,
                'connection_id' => $this->connectionId,
            ]);

            // Get unprocessed memories
            $memories = $this->getUnprocessedMemories();
            
            $processedCount = 0;
            $errorCount = 0;
            
            foreach ($memories as $memory) {
                try {
                    $this->analyzeMemoryContent($memory);
                    $processedCount++;
                    
                    // Rate limiting for AI service
                    usleep(500000); // 500ms delay between requests
                    
                } catch (\Exception $e) {
                    Log::error('Memory analysis failed', [
                        'memory_id' => $memory->id,
                        'error' => $e->getMessage()
                    ]);
                    $errorCount++;
                }
            }
            
            $endTime = now();
            $processingTime = $startTime->diffInSeconds($endTime);
            
            $this->processingLog->update([
                'status' => 'completed',
                'completed_at' => $endTime,
                'processing_time' => $processingTime,
                'output_data' => [
                    'memories_processed' => $processedCount,
                    'errors' => $errorCount,
                    'total_memories' => count($memories),
                ],
                'message' => "Analyzed {$processedCount} memories with {$errorCount} errors"
            ]);

            Log::info('Content analysis completed', [
                'user_id' => $this->userId,
                'processed_count' => $processedCount,
                'error_count' => $errorCount,
            ]);
            
        } catch (\Exception $e) {
            $this->handleJobFailure($e, $startTime);
            throw $e;
        }
    }

    /**
     * Get unprocessed memories for analysis
     */
    private function getUnprocessedMemories()
    {
        $query = Memory::where('user_id', $this->userId)
            ->where('is_processed', false);
        
        if ($this->connectionId) {
            $query->where('api_connection_id', $this->connectionId);
        }
        
        return $query->limit(50)->get(); // Process in batches
    }

    /**
     * Analyze individual memory content using AI
     */
    private function analyzeMemoryContent(Memory $memory): void
    {
        $analysisResults = [];
        
        // Sentiment analysis
        $sentiment = $this->analyzeSentiment($memory);
        if ($sentiment) {
            $analysisResults['sentiment'] = $sentiment;
        }
        
        // Content description generation
        $description = $this->generateDescription($memory);
        if ($description) {
            $analysisResults['description'] = $description;
        }
        
        // Enhanced tag generation
        $enhancedTags = $this->generateEnhancedTags($memory);
        if ($enhancedTags) {
            $analysisResults['enhanced_tags'] = $enhancedTags;
        }
        
        // Theme extraction
        $themes = $this->extractThemes($memory);
        if ($themes) {
            $analysisResults['themes'] = $themes;
        }
        
        // Update memory with analysis results
        $updateData = [
            'is_processed' => true,
            'processed_data' => array_merge(
                $memory->processed_data ?? [],
                ['content_analysis' => $analysisResults]
            ),
        ];
        
        // Update sentiment if available
        if (isset($sentiment['sentiment'])) {
            $updateData['sentiment'] = $sentiment['sentiment'];
            $updateData['sentiment_score'] = $sentiment['score'];
        }
        
        // Update description if generated
        if ($description) {
            $updateData['description'] = $description;
        }
        
        $memory->update($updateData);
    }

    /**
     * Analyze sentiment of memory content
     */
    private function analyzeSentiment(Memory $memory): ?array
    {
        $content = $this->getAnalyzableContent($memory);
        if (!$content) {
            return null;
        }
        
        try {
            // Use a simple sentiment analysis approach
            // In production, you'd integrate with services like:
            // - Google Cloud Natural Language API
            // - Azure Text Analytics
            // - AWS Comprehend
            // - OpenAI API
            
            $sentiment = $this->simpleSentimentAnalysis($content);
            
            return [
                'sentiment' => $sentiment['label'],
                'score' => $sentiment['score'],
                'confidence' => $sentiment['confidence'],
            ];
            
        } catch (\Exception $e) {
            Log::warning('Sentiment analysis failed', [
                'memory_id' => $memory->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Generate AI-powered description for memory
     */
    private function generateDescription(Memory $memory): ?string
    {
        if ($memory->description) {
            return null; // Already has description
        }
        
        $content = $this->getAnalyzableContent($memory);
        if (!$content) {
            return null;
        }
        
        try {
            // Generate a concise description based on content and metadata
            $description = $this->generateSimpleDescription($memory, $content);
            return $description;
            
        } catch (\Exception $e) {
            Log::warning('Description generation failed', [
                'memory_id' => $memory->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Generate enhanced tags using AI
     */
    private function generateEnhancedTags(Memory $memory): ?array
    {
        $content = $this->getAnalyzableContent($memory);
        if (!$content) {
            return null;
        }
        
        try {
            $enhancedTags = $this->extractKeywords($content);
            $existingTags = $memory->tags ?? [];
            
            return array_unique(array_merge($existingTags, $enhancedTags));
            
        } catch (\Exception $e) {
            Log::warning('Enhanced tag generation failed', [
                'memory_id' => $memory->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Extract themes from memory content
     */
    private function extractThemes(Memory $memory): ?array
    {
        $content = $this->getAnalyzableContent($memory);
        if (!$content) {
            return null;
        }
        
        try {
            return $this->identifyThemes($content, $memory);
        } catch (\Exception $e) {
            Log::warning('Theme extraction failed', [
                'memory_id' => $memory->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get analyzable content from memory
     */
    private function getAnalyzableContent(Memory $memory): ?string
    {
        $content = [];
        
        if ($memory->title) {
            $content[] = $memory->title;
        }
        
        if ($memory->content) {
            $content[] = substr($memory->content, 0, 2000); // Limit content length
        }
        
        return empty($content) ? null : implode(' ', $content);
    }

    /**
     * Simple sentiment analysis (placeholder for real AI service)
     */
    private function simpleSentimentAnalysis(string $content): array
    {
        // This is a simplified approach - replace with actual AI service
        $positiveWords = ['happy', 'love', 'great', 'good', 'awesome', 'excellent', 'wonderful', 'amazing'];
        $negativeWords = ['sad', 'hate', 'bad', 'terrible', 'awful', 'horrible', 'disappointing'];
        
        $content = strtolower($content);
        
        $positiveCount = 0;
        $negativeCount = 0;
        
        foreach ($positiveWords as $word) {
            $positiveCount += substr_count($content, $word);
        }
        
        foreach ($negativeWords as $word) {
            $negativeCount += substr_count($content, $word);
        }
        
        if ($positiveCount > $negativeCount) {
            return ['label' => 'positive', 'score' => 0.75, 'confidence' => 0.6];
        } elseif ($negativeCount > $positiveCount) {
            return ['label' => 'negative', 'score' => -0.75, 'confidence' => 0.6];
        } else {
            return ['label' => 'neutral', 'score' => 0.0, 'confidence' => 0.5];
        }
    }

    /**
     * Generate simple description based on memory type and content
     */
    private function generateSimpleDescription(Memory $memory, string $content): string
    {
        $type = $memory->type;
        $date = $memory->memory_date->format('M j, Y');
        
        switch ($type) {
            case 'email':
                return "Email from {$date}: " . substr($content, 0, 100) . '...';
            case 'photo':
            case 'video':
                return "Media from {$date}" . ($memory->location ? " at {$memory->location}" : '');
            case 'song':
                $artist = $memory->people[0] ?? 'Unknown Artist';
                return "Listened to music by {$artist} on {$date}";
            default:
                return "{$type} from {$date}: " . substr($content, 0, 100) . '...';
        }
    }

    /**
     * Extract keywords from content
     */
    private function extractKeywords(string $content): array
    {
        // Simple keyword extraction - replace with NLP library
        $words = str_word_count(strtolower($content), 1);
        $stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        
        $words = array_filter($words, function($word) use ($stopWords) {
            return !in_array($word, $stopWords) && strlen($word) > 3;
        });
        
        $wordCounts = array_count_values($words);
        arsort($wordCounts);
        
        return array_slice(array_keys($wordCounts), 0, 10);
    }

    /**
     * Identify themes in content
     */
    private function identifyThemes(string $content, Memory $memory): array
    {
        $themes = [];
        $content = strtolower($content);
        
        // Work-related themes
        if (preg_match('/\b(meeting|project|deadline|work|office|colleague|boss|client)\b/', $content)) {
            $themes[] = 'work';
        }
        
        // Travel themes
        if (preg_match('/\b(travel|flight|hotel|vacation|trip|airport|destination)\b/', $content)) {
            $themes[] = 'travel';
        }
        
        // Family themes
        if (preg_match('/\b(family|mom|dad|parent|child|daughter|son|brother|sister)\b/', $content)) {
            $themes[] = 'family';
        }
        
        // Health themes
        if (preg_match('/\b(health|doctor|hospital|exercise|workout|fitness|medical)\b/', $content)) {
            $themes[] = 'health';
        }
        
        // Social themes
        if (preg_match('/\b(friend|party|dinner|social|hangout|celebration)\b/', $content)) {
            $themes[] = 'social';
        }
        
        return array_unique($themes);
    }

    /**
     * Handle job failure
     */
    private function handleJobFailure(\Exception $e, Carbon $startTime): void
    {
        $endTime = now();
        $processingTime = $startTime->diffInSeconds($endTime);
        
        $this->processingLog->update([
            'status' => 'failed',
            'completed_at' => $endTime,
            'processing_time' => $processingTime,
            'error_data' => [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ],
            'message' => 'Content analysis failed: ' . $e->getMessage()
        ]);
    }
}
