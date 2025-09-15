<?php

namespace App\Console\Commands;

use App\Jobs\AI\DataCollectionJob;
use App\Models\ApiConnection;
use App\Models\ProcessingLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CollectMemories extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'memories:collect {--user-id= : Specific user ID to collect for} {--provider= : Specific provider to collect from} {--force : Force collection even if recently collected}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Collect memories from connected APIs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🏰 Starting Memory Collection Process...');
        
        // Build query for active API connections
        $connectionsQuery = ApiConnection::where('is_active', true);
        
        // Filter by user if specified
        if ($userId = $this->option('user-id')) {
            $connectionsQuery->where('user_id', $userId);
            $this->info("📱 Filtering for user ID: {$userId}");
        }
        
        // Filter by provider if specified
        if ($provider = $this->option('provider')) {
            $connectionsQuery->where('provider', $provider);
            $this->info("🔌 Filtering for provider: {$provider}");
        }
        
        // Get connections that need syncing
        if (!$this->option('force')) {
            // Only sync connections that haven't been synced recently (last 1 hour)
            $connectionsQuery->where(function ($query) {
                $query->whereNull('last_sync_at')
                      ->orWhere('last_sync_at', '<', now()->subHour());
            });
        }
        
        $connections = $connectionsQuery->get();
        
        if ($connections->isEmpty()) {
            $this->warn('⚠️ No API connections found for collection.');
            return 0;
        }
        
        $this->info("📊 Found {$connections->count()} connections to process");
        
        $successCount = 0;
        $failureCount = 0;
        
        // Progress bar
        $bar = $this->output->createProgressBar($connections->count());
        $bar->start();
        
        foreach ($connections as $connection) {
            try {
                $this->processConnection($connection);
                $successCount++;
            } catch (\Exception $e) {
                $this->logError($connection, $e);
                $failureCount++;
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        
        // Summary
        $this->info("\n🎉 Collection Complete!");
        $this->table(
            ['Status', 'Count'],
            [
                ['✅ Successful', $successCount],
                ['❌ Failed', $failureCount],
                ['📊 Total', $connections->count()]
            ]
        );
        
        if ($failureCount > 0) {
            $this->warn("⚠️ Some collections failed. Check logs for details.");
        }
        
        return $failureCount > 0 ? 1 : 0;
    }
    
    /**
     * Process a single API connection
     */
    private function processConnection(ApiConnection $connection)
    {
        $this->line("\n🔄 Processing {$connection->provider} for user {$connection->user_id}...");
        
        // Validate connection before processing
        if (!$this->validateConnection($connection)) {
            throw new \Exception("Invalid connection: {$connection->provider} (ID: {$connection->id})");
        }
        
        // Determine collection options based on provider and last sync
        $options = $this->getCollectionOptions($connection);
        
        // Dispatch the data collection job
        DataCollectionJob::dispatch($connection, $options);
        
        $this->info("  ✅ Job dispatched for {$connection->provider}");
    }
    
    /**
     * Validate API connection before processing
     */
    private function validateConnection(ApiConnection $connection): bool
    {
        // Check if tokens exist
        if (!$connection->access_token) {
            $this->warn("  ⚠️ No access token for {$connection->provider}");
            return false;
        }
        
        // Check if tokens are expired
        if ($connection->token_expires_at && $connection->token_expires_at->isPast()) {
            if (!$connection->refresh_token) {
                $this->warn("  ⚠️ Expired token with no refresh token for {$connection->provider}");
                return false;
            }
            $this->info("  🔄 Token will be refreshed for {$connection->provider}");
        }
        
        return true;
    }
    
    /**
     * Get collection options based on connection and last sync
     */
    private function getCollectionOptions(ApiConnection $connection): array
    {
        $options = [];
        
        // If never synced, get more data
        if (!$connection->last_sync_at) {
            $this->info("  📥 First sync - collecting comprehensive data");
            
            switch ($connection->provider) {
                case 'gmail':
                    $options = [
                        'max_results' => 200,
                        'since' => now()->subDays(90)->format('Y/m/d')
                    ];
                    break;
                    
                case 'google_photos':
                    $options = [
                        'max_items' => 500,
                        'max_albums' => 50
                    ];
                    break;
                    
                case 'spotify':
                    $options = [
                        'recent_limit' => 50,
                        'playlist_limit' => 50,
                        'album_limit' => 50,
                        'track_limit' => 50
                    ];
                    break;
            }
        } else {
            $this->info("  📥 Incremental sync since last update");
            
            // Incremental sync - get only recent data
            switch ($connection->provider) {
                case 'gmail':
                    $options = [
                        'max_results' => 50,
                        'since' => $connection->last_sync_at->format('Y/m/d')
                    ];
                    break;
                    
                case 'google_photos':
                    $options = [
                        'max_items' => 100,
                        'max_albums' => 10
                    ];
                    break;
                    
                case 'spotify':
                    $options = [
                        'recent_limit' => 50,
                        'playlist_limit' => 20,
                        'album_limit' => 20,
                        'track_limit' => 20
                    ];
                    break;
            }
        }
        
        return $options;
    }
    
    /**
     * Log error for failed connection
     */
    private function logError(ApiConnection $connection, \Exception $e)
    {
        $errorMessage = "Failed to process connection {$connection->id} ({$connection->provider}): {$e->getMessage()}";
        
        $this->error("  ❌ {$errorMessage}");
        
        Log::error($errorMessage, [
            'connection_id' => $connection->id,
            'user_id' => $connection->user_id,
            'provider' => $connection->provider,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        // Create processing log entry
        ProcessingLog::create([
            'user_id' => $connection->user_id,
            'job_type' => 'automated_collection',
            'job_class' => self::class,
            'status' => 'failed',
            'message' => $errorMessage,
            'error_data' => [
                'connection_id' => $connection->id,
                'provider' => $connection->provider,
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine()
            ]
        ]);
    }
}
