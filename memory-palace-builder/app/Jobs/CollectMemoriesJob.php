<?php

namespace App\Jobs;

use App\Models\ApiConnection;
use App\Services\MemoryCollectionService;
use App\Services\GoogleOAuthService;
use App\Services\SpotifyService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CollectMemoriesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $connection;

    public function __construct(ApiConnection $connection)
    {
        $this->connection = $connection;
    }

    public function handle()
    {
        try {
            $collectionService = new MemoryCollectionService(
                new GoogleOAuthService(),
                new SpotifyService()
            );

            $memoriesCreated = $collectionService->collectFromConnection($this->connection);
            
            Log::info("Collected {$memoriesCreated} memories from {$this->connection->provider} for user {$this->connection->user_id}");
            
        } catch (\Exception $e) {
            Log::error("Failed to collect memories from {$this->connection->provider}: " . $e->getMessage());
            throw $e;
        }
    }

    public function failed(\Throwable $exception)
    {
        Log::error("CollectMemoriesJob failed for connection {$this->connection->id}: " . $exception->getMessage());
    }
}