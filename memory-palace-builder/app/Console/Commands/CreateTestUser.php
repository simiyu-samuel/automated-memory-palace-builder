<?php

namespace App\Console\Commands;

use App\Jobs\AI\InsightGenerationJob;
use App\Models\Memory;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateTestUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-test-user';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a test user and generate some insights.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $name = $this->ask('Enter user name', 'Test User');
        $email = $this->ask('Enter user email', 'test@example.com');
        $password = $this->secret('Enter user password (default: password)', 'password');

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
            ]
        );

        if ($user->wasRecentlyCreated) {
            $this->info("User {$user->name} ({$user->email}) created successfully.");
        } else {
            $this->info("User {$user->name} ({$user->email}) already exists.");
        }

        // Create a dummy API connection for the user
        $apiConnection = \App\Models\ApiConnection::firstOrCreate(
            ['user_id' => $user->id, 'provider' => 'manual_test'],
            [
                'access_token' => 'dummy_access_token',
                'refresh_token' => 'dummy_refresh_token',
                'token_expires_at' => now()->addDays(7),
                'scope' => 'test_scope',
            ]
        );
        $this->info('Dummy API connection created for the user.');

        // Create some dummy memories for the user
        Memory::create([
            'user_id' => $user->id,
            'api_connection_id' => $apiConnection->id,
            'external_id' => 'mem_1_' . uniqid(),
            'title' => 'Coding Day',
            'content' => 'Had a great day coding and learning new things about AI and Laravel jobs. Feeling positive about the progress.',
            'source' => 'manual',
            'type' => 'thought',
            'memory_date' => now()->subHours(2)->toDateString(),
            'timestamp' => now()->subHours(2),
            'is_processed' => false,
        ]);

        Memory::create([
            'user_id' => $user->id,
            'api_connection_id' => $apiConnection->id,
            'external_id' => 'mem_2_' . uniqid(),
            'title' => 'AI Article',
            'content' => 'Read an interesting article about the future of AI in personal assistants. It discussed ethical concerns and potential benefits.',
            'source' => 'manual',
            'type' => 'reading',
            'memory_date' => now()->subHours(5)->toDateString(),
            'timestamp' => now()->subHours(5),
            'is_processed' => false,
        ]);

        Memory::create([
            'user_id' => $user->id,
            'api_connection_id' => $apiConnection->id,
            'external_id' => 'mem_3_' . uniqid(),
            'title' => 'Project Discussion',
            'content' => 'Discussed project ideas with a colleague, focusing on memory palace concepts. We identified some challenges but also exciting opportunities.',
            'source' => 'manual',
            'type' => 'conversation',
            'memory_date' => now()->subDay()->toDateString(),
            'timestamp' => now()->subDay(),
            'is_processed' => false,
        ]);

        $this->info('Dummy memories created for the user.');

        // Dispatch the InsightGenerationJob for the new user
        InsightGenerationJob::dispatch($user);

        $this->info('InsightGenerationJob dispatched for the user. This will trigger ContentAnalysisJobs.');
        $this->info('You can check the `memories` table for processed data and `user_insights` for generated insights.');
    }
}
