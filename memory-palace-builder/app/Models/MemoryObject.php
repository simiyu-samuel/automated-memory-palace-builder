<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemoryObject extends Model
{
    protected $fillable = [
        'memory_id',
        'palace_room_id',
        'object_type',
        'title',
        'description',
        'position',
        'rotation',
        'scale',
        'color',
        'texture_url',
        'model_url',
        'interactions',
        'animations',
        'metadata',
        'importance_score',
        'interaction_count',
        'last_interacted_at',
        'is_visible',
        'is_interactive',
    ];

    protected $casts = [
        'position' => 'array',
        'rotation' => 'array',
        'scale' => 'array',
        'color' => 'array',
        'interactions' => 'array',
        'animations' => 'array',
        'metadata' => 'array',
        'importance_score' => 'decimal:2',
        'last_interacted_at' => 'datetime',
        'is_visible' => 'boolean',
        'is_interactive' => 'boolean',
    ];

    protected $attributes = [
        'importance_score' => 0.50,
        'interaction_count' => 0,
        'is_visible' => true,
        'is_interactive' => true,
    ];

    // Relationships
    public function memory(): BelongsTo
    {
        return $this->belongsTo(Memory::class);
    }

    public function palaceRoom(): BelongsTo
    {
        return $this->belongsTo(PalaceRoom::class);
    }

    // Scopes
    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function scopeInteractive($query)
    {
        return $query->where('is_interactive', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('object_type', $type);
    }

    // Methods
    public function interact(): void
    {
        $this->increment('interaction_count');
        $this->update(['last_interacted_at' => now()]);
    }
}
