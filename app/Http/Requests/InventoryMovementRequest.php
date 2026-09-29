<?php

namespace App\Http\Requests;

use App\Enums\InventoryMode;
use App\Models\Item;
use App\Models\StorageLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class InventoryMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $permission = match ((string) $this->input('type')) {
            'OPENING' => 'inventory.opening',
            'RECEIVING' => 'inventory.receive',
            default => 'inventory.adjust',
        };

        return $this->user()?->can($permission) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['OPENING', 'RECEIVING', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'])],
            'item_id' => ['required', 'integer', 'exists:items,id'],
            'laboratory_id' => ['required', 'integer', Rule::exists('laboratories', 'id')->where('is_active', true)],
            'storage_location_id' => ['nullable', 'integer', 'exists:storage_locations,id'],
            'quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,4', 'max:999999999999.9999'],
            'unit_id' => ['required', 'integer', Rule::exists('units', 'id')->where('is_active', true)],
            'notes' => [Rule::requiredIf(fn (): bool => str_starts_with((string) $this->input('type'), 'ADJUSTMENT_')), 'nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $laboratoryId = (int) $this->input('laboratory_id');
            if (! $this->user()?->canAccessLaboratory($laboratoryId)) {
                $validator->errors()->add('laboratory_id', 'Anda tidak memiliki akses ke laboratorium ini.');
            }

            $item = Item::find($this->integer('item_id'));
            if ($this->filled('storage_location_id') && ! StorageLocation::query()
                ->whereKey($this->integer('storage_location_id'))
                ->where('is_active', true)
                ->where(fn ($query) => $query->whereNull('laboratory_id')->orWhere('laboratory_id', $laboratoryId))
                ->exists()) {
                $validator->errors()->add('storage_location_id', 'Lokasi tidak aktif atau berada di laboratorium lain.');
            }
            if (! $item || ! $item->is_active || $item->inventory_mode !== InventoryMode::Stock) {
                $validator->errors()->add('item_id', 'Inventory hanya dapat dicatat untuk item aktif dengan mode STOCK.');
            } elseif (! $item->laboratories()->whereKey($laboratoryId)->exists()) {
                $validator->errors()->add('item_id', 'Item tidak dipetakan ke laboratorium terpilih.');
            } elseif ((int) $this->input('unit_id') !== (int) $item->default_unit_id) {
                $validator->errors()->add('unit_id', 'Pergerakan STOCK harus menggunakan satuan default item.');
            }
        });
    }
}
