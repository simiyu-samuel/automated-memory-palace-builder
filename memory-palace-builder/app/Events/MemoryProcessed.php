<?php

namespace App\Events;

use App\Models\Memory;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MemoryProcessed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $memory;

    public function __construct(Memory $memory)
    {
        $this->memory = $memory;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('palace.' . $this->memory->user_id);
    }

    public function broadcastWith()
    {
        return [
            'memory' => [
                'id' => $this->memory->id,
                'type' => $this->memory->type,
                'title' => $this->memory->title,
                'description' => $this->memory->description,
                'sentiment' => $this->memory->sentiment,
                'memory_date' => $this->memory->memory_date->toISOString(),
                'room_id' => $this->memory->palace_room_id,
                'created_at' => $this->memory->created_at->toISOString(),
            ]
        ];
    }

    public function broadcastAs()
    {
        return 'memory.processed';
    }
}