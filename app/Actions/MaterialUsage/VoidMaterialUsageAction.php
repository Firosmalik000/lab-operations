<?php

namespace App\Actions\MaterialUsage;

use App\Enums\MaterialUsageStatus;
use App\Enums\StockMovementType;
use App\Models\MaterialUsage;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoidMaterialUsageAction
{
    public function __construct(private AuditService $audit) {}

    public function handle(MaterialUsage $usage, string $reason, User $actor): MaterialUsage
    {
        return DB::transaction(function () use ($usage, $reason, $actor): MaterialUsage {
            $usage = MaterialUsage::query()->lockForUpdate()->findOrFail($usage->id);
            if ($usage->status !== MaterialUsageStatus::Submitted) {
                throw ValidationException::withMessages(['usage' => 'Hanya transaksi SUBMITTED yang dapat dibatalkan.']);
            }

            $old = $usage->toArray();
            $movements = StockMovement::query()
                ->where('reference_type', MaterialUsage::class)
                ->where('reference_id', $usage->id)
                ->where('type', StockMovementType::Usage->value)
                ->get();
            foreach ($movements as $line) {
                StockMovement::create([
                    'item_id' => $line->item_id,
                    'laboratory_id' => $usage->laboratory_id,
                    'type' => StockMovementType::Reversal,
                    'quantity' => abs((float) $line->quantity),
                    'unit_id' => $line->unit_id,
                    'storage_location_id' => $line->storage_location_id,
                    'reference_type' => MaterialUsage::class,
                    'reference_id' => $usage->id,
                    'notes' => "Pembatalan {$usage->number}: {$reason}",
                    'created_by' => $actor->id,
                ]);
            }

            $usage->update([
                'status' => MaterialUsageStatus::Voided,
                'void_reason' => $reason,
                'voided_by' => $actor->id,
                'voided_at' => now(),
                'updated_by' => $actor->id,
            ]);
            $this->audit->record('void', $usage, $old, $usage->fresh()->toArray(), request());

            return $usage->fresh();
        }, 3);
    }
}
