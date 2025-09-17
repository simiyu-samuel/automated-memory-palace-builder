<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserInsight extends Model
{
    protected $table = 'user_insights';

    protected $fillable = [
        'user_id',
        'type',
        'category',
        'title',
        'description',
        'data',
        'recommendations',
        'confidence_score',
        'relevance_score',
        'period_start',
        'period_end',
        'related_memories',
        'is_active',
        'is_read',
        'expires_at',
    ];

    protected $casts = [
        'data' => 'array',
        'recommendations' => 'array',
        'related_memories' => 'array',
        'period_start' => 'date',
        'period_end' => 'date',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'is_read' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
