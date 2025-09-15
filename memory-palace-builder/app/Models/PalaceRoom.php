<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PalaceRoom extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'theme',
        'mood',
        'color_scheme',
        'texture_url',
        'dimensions',
        'lighting',
        'position',
        'connections',
        'memory_count',
        'last_updated_at',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'color_scheme' => 'array',
        'dimensions' => 'array',
        'lighting' => 'array',
        'position' => 'array',
        'connections' => 'array',
        'last_updated_at' => 'datetime',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected $attributes = [
        'memory_count' => 0,
        'is_default' => false,
        'is_active' => true,
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function memories(): HasMany
    {
        return $this->hasMany(Memory::class);
    }

    public function memoryObjects(): HasMany
    {
        return $this->hasMany(MemoryObject::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByTheme($query, $theme)
    {
        return $query->where('theme', $theme);
    }

    public function scopeByMood($query, $mood)
    {
        return $query->where('mood', $mood);
    }

    // Methods
    public function updateMemoryCount(): void
    {
        $count = $this->memories()->where('is_processed', true)->count();
        $this->update([
            'memory_count' => $count,
            'last_updated_at' => now(),
        ]);
    }

    public function getDefaultColorScheme(): array
    {
        return match ($this->theme) {
            'work' => ['primary' => '#1e3a8a', 'secondary' => '#64748b', 'accent' => '#f59e0b'],
            'personal' => ['primary' => '#7c3aed', 'secondary' => '#a855f7', 'accent' => '#ec4899'],
            'travel' => ['primary' => '#059669', 'secondary' => '#10b981', 'accent' => '#f59e0b'],
            'music' => ['primary' => '#dc2626', 'secondary' => '#ef4444', 'accent' => '#fbbf24'],
            'photos' => ['primary' => '#0ea5e9', 'secondary' => '#38bdf8', 'accent' => '#fb7185'],
            default => ['primary' => '#4b5563', 'secondary' => '#6b7280', 'accent' => '#9ca3af'],
        };
    }

    public function getDefaultDimensions(): array
    {
        return match ($this->theme) {
            'work' => ['width' => 20, 'height' => 8, 'depth' => 15],
            'personal' => ['width' => 15, 'height' => 10, 'depth' => 15],
            'travel' => ['width' => 25, 'height' => 6, 'depth' => 20],
            'music' => ['width' => 18, 'height' => 12, 'depth' => 12],
            'photos' => ['width' => 22, 'height' => 8, 'depth' => 18],
            default => ['width' => 16, 'height' => 8, 'depth' => 16],
        };
    }

    public function getDefaultLighting(): array
    {
        return match ($this->mood) {
            'energetic' => ['ambient' => 0.8, 'directional' => 1.2, 'color' => '#ffffff'],
            'calm' => ['ambient' => 0.4, 'directional' => 0.6, 'color' => '#e0f2fe'],
            'cozy' => ['ambient' => 0.3, 'directional' => 0.5, 'color' => '#fff7ed'],
            'mysterious' => ['ambient' => 0.2, 'directional' => 0.4, 'color' => '#1a1a2e'],
            default => ['ambient' => 0.5, 'directional' => 0.8, 'color' => '#f8fafc'],
        };
    }
}
