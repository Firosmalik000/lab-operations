<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $email
 * @property string $name
 * @property array<int, int> $laboratory_ids
 * @property int|null $default_laboratory_id
 * @property string $role
 * @property string $token
 * @property int|null $invited_by
 * @property Carbon $expires_at
 * @property Carbon|null $accepted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User|null $inviter
 * @property-read Laboratory|null $defaultLaboratory
 */
class UserInvitation extends Model
{
    protected $fillable = [
        'email',
        'name',
        'laboratory_ids',
        'default_laboratory_id',
        'role',
        'token',
        'invited_by',
        'expires_at',
        'accepted_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'laboratory_ids' => 'array',
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /** @return BelongsTo<Laboratory, $this> */
    public function defaultLaboratory(): BelongsTo
    {
        return $this->belongsTo(Laboratory::class, 'default_laboratory_id');
    }

    public function isPending(): bool
    {
        return is_null($this->accepted_at) && $this->expires_at->isFuture();
    }

    public function isExpired(): bool
    {
        return is_null($this->accepted_at) && $this->expires_at->isPast();
    }

    public function isAccepted(): bool
    {
        return ! is_null($this->accepted_at);
    }
}
