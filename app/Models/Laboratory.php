<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laboratory extends Model
{
    protected $fillable = ['code', 'name', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    /** @return BelongsToMany<Item, $this> */
    public function items(): BelongsToMany
    {
        return $this->belongsToMany(Item::class);
    }

    /** @return HasMany<MaterialUsage, $this> */
    public function materialUsages(): HasMany
    {
        return $this->hasMany(MaterialUsage::class);
    }
}
