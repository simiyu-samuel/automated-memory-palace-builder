<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PalaceRoom;
use App\Models\Memory;
use App\Models\MemoryObject;
use App\Models\ApiConnection;
use Carbon\Carbon;

class MemoryPalaceSeeder extends Seeder
{
    public function run(): void
    {
        // Create or get user with specific email
        $user = User::firstOrCreate(
            ['email' => 'simiyusamuel869@gmail.com'],
            [
                'name' => 'Samuel Simiyu',
                'password' => \Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $this->command->info("Creating memory palace data for user: {$user->name}");

        // Create Palace Rooms
        $rooms = $this->createPalaceRooms($user);
        
        // Create Memories and Memory Objects
        $this->createMemoriesAndObjects($user, $rooms);
        
        // Create API Connection (optional)
        $this->createApiConnection($user);

        $this->command->info('Memory palace seeded successfully!');
    }

    private function createPalaceRooms($user): array
    {
        $rooms = [];

        // Main Hall
        $rooms['main'] = PalaceRoom::create([
            'user_id' => $user->id,
            'name' => 'Main Hall',
            'description' => 'Your primary memory space where important memories are stored',
            'theme' => 'modern',
            'mood' => 'calm',
            'color_scheme' => ['primary' => '#4f46e5', 'secondary' => '#e0e7ff', 'accent' => '#fbbf24'],
            'dimensions' => ['width' => 12, 'height' => 8, 'depth' => 12],
            'lighting' => ['ambient' => 0.5, 'directional' => 0.8, 'color' => '#ffffff'],
            'position' => ['x' => 0, 'y' => 0, 'z' => 0],
            'connections' => [],
            'is_default' => true,
            'is_active' => true,
        ]);

        // Work Space
        $rooms['work'] = PalaceRoom::create([
            'user_id' => $user->id,
            'name' => 'Work Space',
            'description' => 'Professional memories, emails, and work-related documents',
            'theme' => 'work',
            'mood' => 'focused',
            'color_scheme' => ['primary' => '#059669', 'secondary' => '#d1fae5', 'accent' => '#f59e0b'],
            'dimensions' => ['width' => 15, 'height' => 8, 'depth' => 10],
            'lighting' => ['ambient' => 0.6, 'directional' => 0.9, 'color' => '#f8fafc'],
            'position' => ['x' => 15, 'y' => 0, 'z' => 0],
            'connections' => [$rooms['main']->id ?? null],
            'is_active' => true,
        ]);

        // Personal Space
        $rooms['personal'] = PalaceRoom::create([
            'user_id' => $user->id,
            'name' => 'Personal Gallery',
            'description' => 'Family photos, personal moments, and cherished memories',
            'theme' => 'personal',
            'mood' => 'cozy',
            'color_scheme' => ['primary' => '#7c3aed', 'secondary' => '#ede9fe', 'accent' => '#ec4899'],
            'dimensions' => ['width' => 10, 'height' => 10, 'depth' => 8],
            'lighting' => ['ambient' => 0.4, 'directional' => 0.6, 'color' => '#fff7ed'],
            'position' => ['x' => -12, 'y' => 0, 'z' => 0],
            'connections' => [$rooms['main']->id ?? null],
            'is_active' => true,
        ]);

        return $rooms;
    }

    private function createMemoriesAndObjects($user, $rooms): void
    {
        // Main Hall Memories
        $this->createMainHallMemories($user, $rooms['main']);
        
        // Work Space Memories
        $this->createWorkMemories($user, $rooms['work']);
        
        // Personal Space Memories
        $this->createPersonalMemories($user, $rooms['personal']);

        // Update room memory counts
        foreach ($rooms as $room) {
            $room->updateMemoryCount();
        }
    }

    private function createMainHallMemories($user, $room): void
    {
        // Important Email
        $memory1 = Memory::create([
            'user_id' => $user->id,
            'palace_room_id' => $room->id,
            'type' => 'email',
            'title' => 'Project Approval Email',
            'content' => 'Great news! Your project proposal has been approved. We are excited to move forward with the implementation phase.',
            'description' => 'Important email about project approval from the management team',
            'memory_date' => Carbon::now()->subDays(3),
            'sentiment' => 'positive',
            'sentiment_score' => 0.85,
            'tags' => ['work', 'project', 'approval', 'important'],
            'people' => ['Sarah Johnson', 'Management Team'],
            'is_processed' => true,
            'is_favorite' => true,
        ]);

        MemoryObject::create([
            'memory_id' => $memory1->id,
            'palace_room_id' => $room->id,
            'object_type' => 'email',
            'title' => 'Project Approval Letter',
            'description' => 'A glowing letter representing the project approval',
            'position' => ['x' => -3, 'y' => 1.5, 'z' => -2],
            'rotation' => ['x' => 0, 'y' => 0, 'z' => 0],
            'scale' => ['x' => 1.2, 'y' => 0.8, 'z' => 0.1],
            'color' => ['primary' => '#10b981', 'secondary' => '#ffffff'],
            'importance_score' => 0.90,
            'is_visible' => true,
            'is_interactive' => true,
        ]);

        // Meeting Notes
        $memory2 = Memory::create([
            'user_id' => $user->id,
            'palace_room_id' => $room->id,
            'type' => 'document',
            'title' => 'Weekly Team Meeting Notes',
            'content' => 'Discussed project milestones, resource allocation, and upcoming deadlines. Team morale is high.',
            'description' => 'Notes from the weekly team meeting covering project progress',
            'memory_date' => Carbon::now()->subDays(1),
            'sentiment' => 'neutral',
            'sentiment_score' => 0.60,
            'tags' => ['meeting', 'team', 'notes', 'work'],
            'people' => ['Team Lead', 'Colleagues'],
            'location' => 'Conference Room A',
            'is_processed' => true,
        ]);

        MemoryObject::create([
            'memory_id' => $memory2->id,
            'palace_room_id' => $room->id,
            'object_type' => 'document',
            'title' => 'Meeting Notes Scroll',
            'description' => 'A rolled document containing meeting notes',
            'position' => ['x' => 0, 'y' => 0.8, 'z' => 3],
            'rotation' => ['x' => 0, 'y' => 45, 'z' => 0],
            'scale' => ['x' => 1, 'y' => 1.5, 'z' => 0.1],
            'color' => ['primary' => '#6366f1', 'secondary' => '#ffffff'],
            'importance_score' => 0.70,
            'is_visible' => true,
            'is_interactive' => true,
        ]);
    }

    private function createWorkMemories($user, $room): void
    {
        // Client Presentation
        $memory1 = Memory::create([
            'user_id' => $user->id,
            'palace_room_id' => $room->id,
            'type' => 'document',
            'title' => 'Q4 Client Presentation',
            'content' => 'Comprehensive presentation covering Q4 results, achievements, and future roadmap for our key client.',
            'description' => 'Important client presentation with quarterly results',
            'memory_date' => Carbon::now()->subDays(5),
            'sentiment' => 'positive',
            'sentiment_score' => 0.75,
            'tags' => ['presentation', 'client', 'Q4', 'results'],
            'people' => ['Alex Smith', 'Client Team'],
            'location' => 'Client Office',
            'is_processed' => true,
            'is_favorite' => true,
        ]);

        MemoryObject::create([
            'memory_id' => $memory1->id,
            'palace_room_id' => $room->id,
            'object_type' => 'document',
            'title' => 'Presentation Folder',
            'description' => 'A professional folder containing the client presentation',
            'position' => ['x' => -4, 'y' => 1, 'z' => -1],
            'rotation' => ['x' => 0, 'y' => 0, 'z' => 0],
            'scale' => ['x' => 1.2, 'y' => 1.5, 'z' => 0.2],
            'color' => ['primary' => '#059669', 'secondary' => '#ffffff'],
            'importance_score' => 0.85,
            'is_visible' => true,
            'is_interactive' => true,
        ]);

        // Video Call
        $memory2 = Memory::create([
            'user_id' => $user->id,
            'palace_room_id' => $room->id,
            'type' => 'call',
            'title' => 'Strategy Planning Call',
            'content' => 'Productive call with the strategy team discussing next quarter planning and resource allocation.',
            'description' => 'Video call about strategic planning for next quarter',
            'memory_date' => Carbon::now()->subDays(2),
            'sentiment' => 'positive',
            'sentiment_score' => 0.80,
            'tags' => ['call', 'strategy', 'planning', 'team'],
            'people' => ['Strategy Team', 'Department Head'],
            'location' => 'Video Call',
            'is_processed' => true,
        ]);

        MemoryObject::create([
            'memory_id' => $memory2->id,
            'palace_room_id' => $room->id,
            'object_type' => 'call',
            'title' => 'Communication Orb',
            'description' => 'A glowing orb representing the video call',
            'position' => ['x' => 3, 'y' => 1.2, 'z' => 1],
            'rotation' => ['x' => 0, 'y' => 0, 'z' => 0],
            'scale' => ['x' => 0.8, 'y' => 0.8, 'z' => 0.8],
            'color' => ['primary' => '#dc2626', 'secondary' => '#ffffff'],
            'importance_score' => 0.75,
            'is_visible' => true,
            'is_interactive' => true,
        ]);
    }

    private function createPersonalMemories($user, $room): void
    {
        // Family Photo
        $memory1 = Memory::create([
            'user_id' => $user->id,
            'palace_room_id' => $room->id,
            'type' => 'photo',
            'title' => 'Family Beach Vacation',
            'content' => 'Beautiful family photo from our summer vacation at the beach. Everyone looks so happy and relaxed.',
            'description' => 'Cherished family photo from beach vacation',
            'memory_date' => Carbon::now()->subDays(30),
            'sentiment' => 'positive',
            'sentiment_score' => 0.95,
            'tags' => ['family', 'vacation', 'beach', 'summer'],
            'people' => ['Mom', 'Dad', 'Sister', 'Brother'],
            'location' => 'Sunset Beach Resort',
            'is_processed' => true,
            'is_favorite' => true,
        ]);

        MemoryObject::create([
            'memory_id' => $memory1->id,
            'palace_room_id' => $room->id,
            'object_type' => 'photo',
            'title' => 'Family Portrait Frame',
            'description' => 'An elegant frame displaying the family beach photo',
            'position' => ['x' => 0, 'y' => 2, 'z' => -3],
            'rotation' => ['x' => 0, 'y' => 0, 'z' => 0],
            'scale' => ['x' => 1.5, 'y' => 1, 'z' => 0.1],
            'color' => ['primary' => '#f59e0b', 'secondary' => '#ffffff'],
            'importance_score' => 0.95,
            'is_visible' => true,
            'is_interactive' => true,
        ]);

        // Birthday Memory
        $memory2 = Memory::create([
            'user_id' => $user->id,
            'palace_room_id' => $room->id,
            'type' => 'event',
            'title' => 'Mom\'s Birthday Celebration',
            'content' => 'Wonderful birthday celebration for mom with the whole family. She was so surprised and happy with the party.',
            'description' => 'Special birthday celebration for mom',
            'memory_date' => Carbon::now()->subDays(14),
            'sentiment' => 'positive',
            'sentiment_score' => 0.90,
            'tags' => ['birthday', 'family', 'celebration', 'mom'],
            'people' => ['Mom', 'Family Members'],
            'location' => 'Home',
            'is_processed' => true,
            'is_favorite' => true,
        ]);

        MemoryObject::create([
            'memory_id' => $memory2->id,
            'palace_room_id' => $room->id,
            'object_type' => 'event',
            'title' => 'Birthday Cake',
            'description' => 'A festive birthday cake representing the celebration',
            'position' => ['x' => -2, 'y' => 1, 'z' => 2],
            'rotation' => ['x' => 0, 'y' => 0, 'z' => 0],
            'scale' => ['x' => 1, 'y' => 1, 'z' => 1],
            'color' => ['primary' => '#ec4899', 'secondary' => '#ffffff'],
            'importance_score' => 0.88,
            'is_visible' => true,
            'is_interactive' => true,
        ]);
    }

    private function createApiConnection($user): void
    {
        ApiConnection::create([
            'user_id' => $user->id,
            'provider' => 'gmail',
            'provider_id' => 'user123',
            'email' => 'simiyusamuel869@gmail.com',
            'scopes' => ['https://www.googleapis.com/auth/gmail.readonly'],
            'metadata' => [
                'connected_at' => now()->toISOString(),
                'account_name' => 'Personal Gmail',
            ],
            'last_sync_at' => Carbon::now()->subHours(2),
            'is_active' => true,
        ]);
    }
}