<?php

namespace App\Actions\MaterialUsage;

use App\Enums\InventoryMode;
use App\Enums\MaterialUsageStatus;
use App\Enums\StockMovementType;
use App\Models\Item;
use App\Models\MaterialUsage;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateMaterialUsageAction
{
    public function __construct(
        private GenerateMaterialUsageNumber $numberGenerator,
        private AuditService $audit,
    ) {}

    /**
     * @param array{
     *     usage_date: string,
     *     laboratory_id: int,
     *     purpose?: string|null,
     *     notes?: string|null,
     *     status?: string,
     *     items: list<array{item_id: int, quantity: int|float|string, unit_id: int, notes?: string|null}>
     * } $data
     */
    public function handle(array $data, User $actor, ?MaterialUsage $existingUsage = null): MaterialUsage
    {
        return DB::transaction(function () use ($data, $actor, $existingUsage): MaterialUsage {
            $date = Carbon::parse($data['usage_date']);
            if ($existingUsage !== null) {
                $existingUsage = MaterialUsage::whereKey($existingUsage->id)->lockForUpdate()->firstOrFail();
                abort_unless($actor->can('material-usage.update') && $actor->canAccessLaboratory($existingUsage->laboratory_id), 403);
                if (! in_array($existingUsage->status, [MaterialUsageStatus::Draft, MaterialUsageStatus::Voided], true)) {
                    throw ValidationException::withMessages(['status' => 'Hanya transaksi DRAFT atau VOIDED yang dapat diubah.']);
                }
            }
            $before = $existingUsage?->load('items')->toArray();
            if ($existingUsage?->status === MaterialUsageStatus::Voided) {
                $before['stock_movements'] = StockMovement::query()
                    ->where('reference_type', MaterialUsage::class)
                    ->where('reference_id', $existingUsage->id)
                    ->get()
                    ->toArray();
            }
            $attributes = [
                'usage_date' => $date,
                'laboratory_id' => $data['laboratory_id'],
                'purpose' => $data['purpose'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => $data['status'] ?? MaterialUsageStatus::Submitted->value,
                'void_reason' => null,
                'voided_by' => null,
                'voided_at' => null,
            ];
            if ($existingUsage !== null) {
                if ($existingUsage->status === MaterialUsageStatus::Voided) {
                    StockMovement::query()
                        ->where('reference_type', MaterialUsage::class)
                        ->where('reference_id', $existingUsage->id)
                        ->delete();
                }
                $existingUsage->update($attributes + ['updated_by' => $actor->id]);
                $existingUsage->items()->delete();
                $usage = $existingUsage;
            } else {
                $usage = MaterialUsage::create($attributes + [
                    'number' => $this->numberGenerator->handle($date),
                    'created_by' => $actor->id,
                ]);
            }

            $items = Item::whereIn('id', collect($data['items'])->pluck('item_id'))->lockForUpdate()->get()->keyBy('id');
            foreach ($data['items'] as $line) {
                $usage->items()->create($line);
                $item = $items->get((int) $line['item_id']);

                if ($usage->status === MaterialUsageStatus::Submitted && $item->inventory_mode === InventoryMode::Stock) {
                    $usage->morphMany(StockMovement::class, 'reference')->create([
                        'item_id' => $item->id,
                        'laboratory_id' => $usage->laboratory_id,
                        'type' => StockMovementType::Usage,
                        'quantity' => -abs((float) $line['quantity']),
                        'unit_id' => $line['unit_id'],
                        'notes' => "Penggunaan {$usage->number}",
                        'created_by' => $actor->id,
                    ]);
                }
            }

            $this->audit->record($existingUsage ? 'update' : 'create', $usage, $before, $usage->fresh()->load('items')->toArray(), request());

            return $usage->load(['items.item', 'items.unit', 'laboratory', 'creator']);
        }, 3);
    }
}
