<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Memory;
use App\Models\PalaceRoom;
use App\Models\MemoryObject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PalaceDataController extends Controller
{
    public function getRooms(Request $request)
    {
        $user = Auth::user();
        
        $rooms = PalaceRoom::where('user_id', $user->id)
            ->where('is_active', true)
            ->get()
            ->map(function ($room) {
                return [
                    'id' => $room->id,
                    'name' => $room->name,
                    'description' => $room->description,
                    'theme' => $room->theme,
                    'mood' => $room->mood,
                    'position' => $room->position ?? ['x' => 0, 'y' => 0, 'z' => 0],
                    'dimensions' => $room->dimensions ?? ['width' => 10, 'height' => 8, 'depth' => 10],
                    'color_scheme' => $room->color_scheme ?? ['primary' => '#4f46e5', 'secondary' => '#e0e7ff'],
                    'lighting' => $room->lighting ?? ['ambient' => 0.4, 'directional' => 0.8],
                    'memory_count' => 2,
                ];
            });

        return response()->json(['rooms' => $rooms]);
    }

    public function getMemoryObjects(Request $request, $roomId = null)
    {
        $user = Auth::user();
        
        $memories = Memory::where('user_id', $user->id)
            ->where('is_processed', true)
            ->with('memoryObjects')
            ->get()
            ->map(function ($memory) {
                $objects = $memory->memoryObjects->map(function ($obj) {
                    return [
                        'id' => $obj->id,
                        'type' => $obj->object_type,
                        'position' => $obj->position ?? ['x' => 0, 'y' => 0, 'z' => 0],
                        'rotation' => $obj->rotation ?? ['x' => 0, 'y' => 0, 'z' => 0],
                        'scale' => $obj->scale ?? ['x' => 1, 'y' => 1, 'z' => 1],
                        'color' => is_array($obj->color) ? ($obj->color['primary'] ?? '#ffffff') : ($obj->color ?? '#ffffff'),
                    ];
                });

                return [
                    'memory_id' => $memory->id,
                    'title' => $memory->title,
                    'type' => $memory->type,
                    'sentiment' => $memory->sentiment,
                    'sentiment_score' => $memory->sentiment_score,
                    'room_id' => $memory->palace_room_id,
                    'objects' => $objects,
                    'metadata' => [
                        'date' => $memory->memory_date->toISOString(),
                        'tags' => $memory->tags ?? [],
                        'people' => $memory->people ?? [],
                        'location' => $memory->location,
                    ]
                ];
            });

        return response()->json(['memory_objects' => $memories]);
    }

    public function updateRoomLayout(Request $request, $roomId)
    {
        $user = Auth::user();
        
        $room = PalaceRoom::where('user_id', $user->id)
            ->where('id', $roomId)
            ->firstOrFail();
            
        $validated = $request->validate([
            'position' => 'array',
            'dimensions' => 'array',
            'lighting' => 'array',
            'color_scheme' => 'array',
        ]);
        
        $room->update($validated);
        
        return response()->json(['success' => true, 'room' => $room]);
    }

    public function updateMemoryObject(Request $request, $objectId)
    {
        $user = Auth::user();
        
        $object = MemoryObject::whereHas('memory', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })->findOrFail($objectId);
        
        $validated = $request->validate([
            'position' => 'array',
            'rotation' => 'array',
            'scale' => 'array',
            'color' => 'string',
        ]);
        
        $object->update($validated);
        
        return response()->json(['success' => true, 'object' => $object]);
    }
}