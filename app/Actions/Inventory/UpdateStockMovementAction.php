<?php

namespace App\Actions\Inventory;

use App\Enums\StockMovementType;
use App\Models\StockMovement;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;

class UpdateStockMovementAction
{
    public function __construct(private AuditService $audit) {}

    /** @param array<string, mixed> $data */
    public function handle(StockMovement $movement, array $data): StockMovement
    {
        return DB::transaction(function () use ($movement, $data): StockMovement {
            $movement = StockMovement::query()->lockForUpdate()->findOrFail($movement->id);
            $old = $movement->toArray();
            $type = StockMovementType::from($data['type']);
            $negative = $type === StockMovementType::AdjustmentOut;

            $movement->update([
                ...$data,
                'quantity' => ($negative ? -1 : 1) * abs((float) $data['quantity']),
            ]);
            $this->audit->record('update', $movement, $old, $movement->fresh()->toArray(), request());

            return $movement->fresh();
        }, 3);
    }
}
