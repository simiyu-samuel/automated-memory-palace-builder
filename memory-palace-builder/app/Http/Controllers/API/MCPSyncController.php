<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Log;

class MCPSyncController extends Controller
{
    public function syncViaMP(Request $request, $connection = null)
    {
        try {
            $userId = auth()->id() ?? 1;
            $provider = $request->input('provider');
            
            Log::info('MCP Sync called', [
                'user_id' => $userId,
                'connection_param' => $connection,
                'connection_type' => gettype($connection),
                'provider' => $provider,
                'request_data' => $request->all()
            ]);
            
            // Handle connection parameter (could be ID string or model object)
            if ($connection) {
                if (is_string($connection) || is_numeric($connection)) {
                    Log::info('Connection is string/numeric: ' . $connection);
                    // Connection ID passed as string, fetch the model
                    $connectionModel = \App\Models\ApiConnection::where('user_id', $userId)->find($connection);
                    if (!$connectionModel) {
                        throw new \Exception('Connection not found for ID: ' . $connection);
                    }
                    $connection = $connectionModel;
                } else {
                    Log::info('Connection is object, checking ownership');
                    // Model object passed, verify ownership
                    if ($connection->user_id !== $userId) {
                        throw new \Exception('Unauthorized access to connection');
                    }
                }
                $provider = $connection->provider;
                Log::info('Using provider: ' . $provider);
            }
            
            // Use direct Laravel service instead of MCP server
            Log::info('Using direct Laravel service for sync');
            
            $memoryService = app(\App\Services\MemoryCollectionService::class);
            $memoriesCreated = $memoryService->collectFromConnection($connection);
            
            $message = "Data synced successfully via Laravel service. Created {$memoriesCreated} memories.";
            
            Log::info('Direct sync completed successfully', [
                'memories_created' => $memoriesCreated,
                'provider' => $provider,
                'message' => $message
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Data synced successfully',
                'memories_created' => $memoriesCreated,
                'provider' => $provider ?: 'all'
            ]);
            
        } catch (\Exception $e) {
            Log::error('MCP sync failed: ' . $e->getMessage(), [
                'user_id' => $userId ?? 'unknown',
                'connection_param' => $connection,
                'connection_type' => gettype($connection),
                'stack_trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Sync failed: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function searchViaMP(Request $request)
    {
        try {
            $query = $request->input('q', '');
            $type = $request->input('type');
            $sentiment = $request->input('sentiment');
            
            $mcpInput = json_encode([
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'tools/call',
                'params' => [
                    'name' => 'search_memories',
                    'arguments' => [
                        'query' => $query,
                        'type' => $type,
                        'sentiment' => $sentiment
                    ]
                ]
            ]) . "\n";
            
            $process = Process::input($mcpInput)
                ->timeout(30)
                ->run([
                    'node', 
                    base_path('postman-mcp-server.js')
                ]);
            
            if ($process->failed()) {
                throw new \Exception('MCP search failed: ' . $process->errorOutput());
            }
            
            $output = $process->output();
            $lines = explode("\n", trim($output));
            $lastLine = end($lines);
            
            $mcpResponse = json_decode($lastLine, true);
            
            if (!$mcpResponse) {
                throw new \Exception('Invalid JSON response from MCP server');
            }
            
            if (isset($mcpResponse['error'])) {
                throw new \Exception('MCP server error: ' . $mcpResponse['error']['message']);
            }
            
            $message = $mcpResponse['result']['content'][0]['text'] ?? 'Search completed';
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'query' => $query
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Search failed: ' . $e->getMessage()
            ], 500);
        }
    }
}