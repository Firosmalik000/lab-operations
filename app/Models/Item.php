<?php

namespace App\Models;

use App\Enums\InventoryMode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property InventoryMode $inventory_mode
 */
class Item extends Model
{
    protected $fillable = [
        'code', 'name', 'item_type_id', 'category_id', 'default_unit_id',
        'inventory_mode', 'minimum_stock', 'is_active', 'notes', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'inventory_mode' => InventoryMode::class,
            'minimum_stock' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @param  Builder<Item>  $query
     * @return Builder<Item>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** @return BelongsTo<ItemType, $this> */
    public function itemType(): BelongsTo
    {
        return $this->belongsTo(ItemType::class);
    }

    /** @return BelongsTo<ItemCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ItemCategory::class);
    }

    /** @return BelongsTo<Unit, $this> */
    public function defaultUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'default_unit_id');
    }

    /** @return BelongsToMany<Laboratory, $this> */
    public function laboratories(): BelongsToMany
    {
        return $this->belongsToMany(Laboratory::class);
    }

    /** @return HasMany<StockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}
