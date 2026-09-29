<?php

namespace App\Actions\Inventory;

use App\Enums\StockMovementType;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;

class CreateStockMovementAction
{
    public function __construct(private AuditService $audit) {}

    /** @param array<string, mixed> $data */
    public function handle(array $data, User $actor): StockMovement
    {
        return DB::transaction(function () use ($data, $actor): StockMovement {
            $type = StockMovementType::from($data['type']);
            $negative = in_array($type, [StockMovementType::AdjustmentOut, StockMovementType::Disposal, StockMovementType::TransferOut], true);
            $movement = StockMovement::create([
                ...$data,
                'quantity' => ($negative ? -1 : 1) * abs((float) $data['quantity']),
                'created_by' => $actor->id,
            ]);
            $this->audit->record(strtolower($type->value), $movement, null, $movement->toArray(), request());

            return $movement;
        });
    }
}
