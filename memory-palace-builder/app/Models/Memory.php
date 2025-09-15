<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Carbon\Carbon;

class Memory extends Model
{
    protected $fillable = [
        'user_id',
        'api_connection_id',
        'palace_room_id',
        'type',
        'title',
        'content',
        'description',
        'raw_data',
        'processed_data',
        'metadata',
        'external_id',
        'external_url',
        'memory_date',
        'sentiment',
        'sentiment_score',
        'tags',
        'categories',
        'location',
        'people',
        'is_processed',
        'is_favorite',
        'is_private',
    ];

    protected $casts = [
        'memory_date' => 'datetime',
        'raw_data' => 'array',
        'processed_data' => 'array',
        'metadata' => 'array',
        'tags' => 'array',
        'categories' => 'array',
        'people' => 'array',
        'sentiment_score' => 'decimal:2',
        'is_processed' => 'boolean',
        'is_favorite' => 'boolean',
        'is_private' => 'boolean',
    ];

    protected $attributes = [
        'is_processed' => false,
        'is_favorite' => false,
        'is_private' => false,
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function apiConnection(): BelongsTo
    {
        return $this->belongsTo(ApiConnection::class);
    }

    public function palaceRoom(): BelongsTo
    {
        return $this->belongsTo(PalaceRoom::class);
    }

    public function memoryObjects(): HasMany
    {
        return $this->hasMany(MemoryObject::class);
    }

    public function relatedMemoriesAsA(): HasMany
    {
        return $this->hasMany(MemoryRelationship::class, 'memory_a_id');
    }

    public function relatedMemoriesAsB(): HasMany
    {
        return $this->hasMany(MemoryRelationship::class, 'memory_b_id');
    }

    // Scopes
    public function scopeProcessed($query)
    {
        return $query->where('is_processed', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeBySentiment($query, $sentiment)
    {
        return $query->where('sentiment', $sentiment);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('memory_date', '>=', now()->subDays($days));
    }

    public function scopeWithTags($query, $tags)
    {
        if (!is_array($tags)) {
            $tags = [$tags];
        }
        
        foreach ($tags as $tag) {
            $query->whereJsonContains('tags', $tag);
        }
        
        return $query;
    }

    // Accessors
    public function getShortContentAttribute(): string
    {
        if (!$this->content) {
            return '';
        }
        
        return strlen($this->content) > 200 
            ? substr($this->content, 0, 200) . '...'
            : $this->content;
    }

    public function getSentimentColorAttribute(): string
    {
        return match ($this->sentiment) {
            'positive' => 'text-green-500',
            'negative' => 'text-red-500',
            'neutral' => 'text-yellow-500',
            default => 'text-gray-500',
        };
    }

    // Methods
    public function getRelatedMemories(int $limit = 5): \Illuminate\Database\Eloquent\Collection
    {
        $relatedIds = collect();
        
        // Get IDs from both relationship directions
        $relatedIds = $relatedIds->merge(
            $this->relatedMemoriesAsA()->pluck('memory_b_id')
        )->merge(
            $this->relatedMemoriesAsB()->pluck('memory_a_id')
        );
        
        return self::whereIn('id', $relatedIds->unique())
            ->where('is_processed', true)
            ->limit($limit)
            ->get();
    }

    public function addTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        if (!in_array($tag, $tags)) {
            $tags[] = $tag;
            $this->update(['tags' => $tags]);
        }
    }

    public function removeTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        $tags = array_filter($tags, fn($t) => $t !== $tag);
        $this->update(['tags' => array_values($tags)]);
    }

    public function toggleFavorite(): void
    {
        $this->update(['is_favorite' => !$this->is_favorite]);
    }
}
