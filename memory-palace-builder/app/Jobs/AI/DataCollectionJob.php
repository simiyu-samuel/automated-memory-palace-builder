<?php

namespace App\Jobs\AI;

use App\Models\ApiConnection;
use App\Models\Memory;
use App\Models\ProcessingLog;
use App\Services\MCP\BaseMCPService;
use App\Services\MCP\GmailMCPService;
use App\Services\MCP\GooglePhotosMCPService;
use App\Services\MCP\SpotifyMCPService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DataCollectionJob implements ShouldQueue
{
    use Queueable;

    protected ApiConnection $connection;
    protected array $options;
    protected ProcessingLog $processingLog;

    /**
     * Create a new job instance.
     */
    public function __construct(ApiConnection $connection, array $options = [])
    {
        $this->connection = $connection;
        $this->options = $options;
        
        // Create processing log
        $this->processingLog = ProcessingLog::create([
            'user_id' => $connection->user_id,
            'job_type' => 'data_collection',
            'job_class' => self::class,
            'status' => 'pending',
            'input_data' => [
                'connection_id' => $connection->id,
                'provider' => $connection->provider,
                'options' => $options,
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

            Log::info('Starting data collection', [
                'connection_id' => $this->connection->id,
                'provider' => $this->connection->provider,
                'user_id' => $this->connection->user_id,
            ]);

            // Get the appropriate MCP service
            $mcpService = $this->getMCPService();
            
            if (!$mcpService) {
                throw new \Exception('Unsupported provider: ' . $this->connection->provider);
            }

            // Fetch data from the external API
            $rawData = $mcpService->fetchData($this->options);
            
            // Transform data into Memory format
            $memoryData = $mcpService->transformToMemories($rawData);
            
            // Store memories in the database
            $createdCount = 0;
            $updatedCount = 0;
            $skippedCount = 0;
            
            foreach ($memoryData as $memoryItem) {
                $result = $this->createOrUpdateMemory($memoryItem);
                
                if ($result['created']) {
                    $createdCount++;
                } elseif ($result['updated']) {
                    $updatedCount++;
                } else {
                    $skippedCount++;
                }
            }
            
            $endTime = now();
            $processingTime = $startTime->diffInSeconds($endTime);
            
            $this->processingLog->update([
                'status' => 'completed',
                'completed_at' => $endTime,
                'processing_time' => $processingTime,
                'output_data' => [
                    'memories_created' => $createdCount,
                    'memories_updated' => $updatedCount,
                    'memories_skipped' => $skippedCount,
                    'total_processed' => count($memoryData),
                ],
                'message' => "Successfully processed {$createdCount} new memories, updated {$updatedCount}, skipped {$skippedCount}"
            ]);

            Log::info('Data collection completed', [
                'connection_id' => $this->connection->id,
                'memories_created' => $createdCount,
                'memories_updated' => $updatedCount,
                'processing_time' => $processingTime,
            ]);
            
            // Dispatch follow-up jobs for AI processing
            $this->dispatchFollowUpJobs($createdCount, $updatedCount);
            
        } catch (\Exception $e) {
            $this->handleJobFailure($e, $startTime);
            throw $e;
        }
    }

    /**
     * Get the appropriate MCP service for the connection
     */
    private function getMCPService(): ?BaseMCPService
    {
        return match($this->connection->provider) {
            'gmail' => new GmailMCPService($this->connection),
            'google_photos' => new GooglePhotosMCPService($this->connection),
            'spotify' => new SpotifyMCPService($this->connection),
            default => null,
        };
    }

    /**
     * Create or update a memory record
     */
    private function createOrUpdateMemory(array $memoryData): array
    {
        $existingMemory = Memory::where('api_connection_id', $this->connection->id)
            ->where('external_id', $memoryData['external_id'])
            ->first();
        
        $memoryData['api_connection_id'] = $this->connection->id;
        $memoryData['user_id'] = $this->connection->user_id;
        
        if ($existingMemory) {
            // Check if the memory needs updating
            $needsUpdate = $this->memoryNeedsUpdate($existingMemory, $memoryData);
            
            if ($needsUpdate) {
                $existingMemory->update($memoryData);
                return ['created' => false, 'updated' => true, 'memory' => $existingMemory];
            } else {
                return ['created' => false, 'updated' => false, 'memory' => $existingMemory];
            }
        } else {
            $memory = Memory::create($memoryData);
            return ['created' => true, 'updated' => false, 'memory' => $memory];
        }
    }

    /**
     * Check if an existing memory needs to be updated
     */
    private function memoryNeedsUpdate(Memory $existing, array $newData): bool
    {
        // Compare key fields to determine if update is needed
        $fieldsToCompare = ['title', 'content', 'metadata', 'tags', 'categories'];
        
        foreach ($fieldsToCompare as $field) {
            $existingValue = $existing->getAttribute($field);
            $newValue = $newData[$field] ?? null;
            
            // Handle JSON fields
            if (in_array($field, ['metadata', 'tags', 'categories'])) {
                $existingValue = is_string($existingValue) ? json_decode($existingValue, true) : $existingValue;
                $newValue = is_string($newValue) ? json_decode($newValue, true) : $newValue;
            }
            
            if ($existingValue !== $newValue) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Dispatch follow-up AI processing jobs
     */
    private function dispatchFollowUpJobs(int $createdCount, int $updatedCount): void
    {
        if ($createdCount > 0 || $updatedCount > 0) {
            // Queue content analysis for new/updated memories
            ContentAnalysisJob::dispatch($this->connection->user_id, $this->connection->id)
                ->delay(now()->addMinutes(2));
            
            // Queue memory categorization
            MemoryCategorizationJob::dispatch($this->connection->user_id)
                ->delay(now()->addMinutes(5));
            
            // Queue palace structure updates if significant changes
            if ($createdCount >= 10 || $updatedCount >= 20) {
                PalaceStructureJob::dispatch($this->connection->user_id)
                    ->delay(now()->addMinutes(10));
            }
        }
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
            'message' => 'Data collection failed: ' . $e->getMessage()
        ]);

        Log::error('Data collection failed', [
            'connection_id' => $this->connection->id,
            'error' => $e->getMessage(),
            'processing_log_id' => $this->processingLog->id,
        ]);
    }

    /**
     * Handle job failure (Laravel queue system)
     */
    public function failed(\Throwable $exception): void
    {
        $this->processingLog->update([
            'status' => 'failed',
            'completed_at' => now(),
            'error_data' => [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ],
            'message' => 'Job failed with exception: ' . $exception->getMessage()
        ]);
    }
}
