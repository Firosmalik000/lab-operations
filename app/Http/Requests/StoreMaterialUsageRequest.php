<?php

namespace App\Http\Requests;

use App\Models\Item;
use App\Models\Laboratory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreMaterialUsageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('material-usage.create') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'usage_date' => ['required', 'date'],
            'laboratory_id' => ['required', 'integer', Rule::exists('laboratories', 'id')->where('is_active', true)],
            'purpose' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::in(['DRAFT', 'SUBMITTED'])],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,4', 'max:999999999999.9999'],
            'items.*.unit_id' => ['required', 'integer', Rule::exists('units', 'id')->where('is_active', true)],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
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

            if (! Laboratory::whereKey($laboratoryId)->where('is_active', true)->exists()) {
                return;
            }

            $lines = $this->input('items', []);
            if (! is_array($lines)) {
                return;
            }

            $ids = collect($lines)->pluck('item_id')->filter()->map(fn ($id): int => (int) $id);
            $validItems = Item::active()
                ->whereIn('id', $ids)
                ->whereHas('laboratories', fn ($query) => $query->whereKey($laboratoryId))
                ->get(['id', 'inventory_mode', 'default_unit_id'])
                ->keyBy('id');

            foreach ($ids as $index => $id) {
                $item = $validItems->get($id);
                if (! $item) {
                    $validator->errors()->add("items.$index.item_id", 'Item tidak aktif atau tidak dipetakan ke laboratorium terpilih.');
                } elseif ($item->inventory_mode->value === 'STOCK' && (int) $this->input("items.$index.unit_id") !== (int) $item->default_unit_id) {
                    $validator->errors()->add("items.$index.unit_id", 'Item STOCK harus menggunakan satuan default agar saldo tetap konsisten.');
                }
            }
        });
    }

    /**
     * @return array{
     *     usage_date: string,
     *     laboratory_id: int,
     *     purpose: string|null,
     *     notes: string|null,
     *     status: string,
     *     items: list<array{item_id: int, quantity: int|float|string, unit_id: int, notes: string|null}>
     * }
     */
    public function payload(): array
    {
        $items = [];
        foreach ($this->array('items') as $line) {
            if (! is_array($line)) {
                continue;
            }

            $quantity = $line['quantity'] ?? 0;
            $items[] = [
                'item_id' => is_numeric($line['item_id'] ?? null) ? (int) $line['item_id'] : 0,
                'quantity' => is_int($quantity) || is_float($quantity) || is_string($quantity) ? $quantity : 0,
                'unit_id' => is_numeric($line['unit_id'] ?? null) ? (int) $line['unit_id'] : 0,
                'notes' => is_string($line['notes'] ?? null) ? $line['notes'] : null,
            ];
        }

        $purpose = $this->input('purpose');
        $notes = $this->input('notes');

        return [
            'usage_date' => $this->string('usage_date')->value(),
            'laboratory_id' => $this->integer('laboratory_id'),
            'purpose' => is_string($purpose) ? $purpose : null,
            'notes' => is_string($notes) ? $notes : null,
            'status' => $this->string('status', 'SUBMITTED')->value(),
            'items' => $items,
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'items.required' => 'Tambahkan sedikitnya satu bahan.',
            'items.*.item_id.distinct' => 'Item yang sama tidak boleh ditambahkan dua kali.',
            'items.*.quantity.gt' => 'Jumlah harus lebih besar dari nol.',
        ];
    }
}
