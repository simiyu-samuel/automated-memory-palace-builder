<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class StartMCPServer extends Command
{
    protected $signature = 'mcp:start';
    protected $description = 'Start the Memory Palace MCP Server';

    public function handle()
    {
        $this->info('Starting Memory Palace MCP Server...');
        
        $process = new Process(['node', base_path('postman-mcp-server.js')]);
        $process->setTimeout(null);
        
        $process->run(function ($type, $buffer) {
            if (Process::ERR === $type) {
                $this->error($buffer);
            } else {
                $this->line($buffer);
            }
        });
        
        if (!$process->isSuccessful()) {
            $this->error('MCP Server failed to start');
            return 1;
        }
        
        return 0;
    }
}