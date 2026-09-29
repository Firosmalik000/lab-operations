<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StorageLocation extends Model
{
    protected $fillable = ['laboratory_id', 'name', 'code', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return BelongsTo<Laboratory, $this> */
    public function laboratory(): BelongsTo
    {
        return $this->belongsTo(Laboratory::class);
    }
}
