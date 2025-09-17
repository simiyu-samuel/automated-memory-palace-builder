<?php

namespace App\Console\Commands;

use App\Models\UserInsight;
use Illuminate\Console\Command;

class ListInsights extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:list-insights';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all generated user insights.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $insights = UserInsight::all();

        if ($insights->isEmpty()) {
            $this->info('No insights found.');
            return;
        }

        $this->info('Generated User Insights:');
        foreach ($insights as $insight) {
            $this->comment("User ID: {$insight->user_id}");
            $this->comment("Type: {$insight->type}");
            $this->comment("Content: {$insight->description}");
            $this->comment("Generated At: {$insight->created_at}");
            $this->line('---');
        }
    }
}
