<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule automated memory collection
Schedule::command('memories:collect')
    ->everyTwoHours()
    ->withoutOverlapping()
    ->runInBackground()
    ->onSuccess(function () {
        \Illuminate\Support\Facades\Log::info('Memory collection completed successfully');
    })
    ->onFailure(function () {
        \Illuminate\Support\Facades\Log::error('Memory collection failed');
    });

// Schedule AI content analysis every 3 hours
Schedule::command('queue:work --queue=ai-processing --stop-when-empty')
    ->everyThreeHours()
    ->withoutOverlapping()
    ->runInBackground();

// Schedule daily insight generation
Schedule::call(function () {
    $users = \App\Models\User::whereHas('apiConnections', function ($query) {
        $query->where('is_active', true);
    })->get();
    
    foreach ($users as $user) {
        \App\Jobs\AI\InsightGenerationJob::dispatch($user->id)
            ->delay(now()->addMinutes(rand(1, 30))); // Spread the load
    }
})->daily()->at('02:00');

// Clean up old processing logs (keep last 30 days)
Schedule::call(function () {
    \App\Models\ProcessingLog::where('created_at', '<', now()->subDays(30))->delete();
})->weekly();
