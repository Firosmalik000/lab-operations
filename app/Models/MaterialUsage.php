<?php

namespace App\Models;

use App\Enums\MaterialUsageStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property MaterialUsageStatus $status
 */
class MaterialUsage extends Model
{
    protected $fillable = [
        'number', 'usage_date', 'laboratory_id', 'purpose', 'notes', 'status',
        'created_by', 'updated_by', 'void_reason', 'voided_by', 'voided_at',
    ];

    protected function casts(): array
    {
        return [
            'usage_date' => 'date:Y-m-d',
            'status' => MaterialUsageStatus::class,
            'voided_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<MaterialUsage>  $query
     * @return Builder<MaterialUsage>
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasRole('super-admin')) {
            return $query;
        }

        return $query->whereIn('laboratory_id', $user->laboratories()->select('laboratories.id'));
    }

    /** @return BelongsTo<Laboratory, $this> */
    public function laboratory(): BelongsTo
    {
        return $this->belongsTo(Laboratory::class);
    }

    /** @return HasMany<MaterialUsageItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(MaterialUsageItem::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return BelongsTo<User, $this> */
    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }
}
