<?php

namespace App\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReportService
{
    public const TYPES = [
        'usage' => 'Laporan Penggunaan',
        'usage-item' => 'Penggunaan per Item',
        'usage-user' => 'Penggunaan per User',
        'usage-laboratory' => 'Penggunaan per Laboratorium',
        'inventory-movements' => 'Pergerakan Inventory',
        'current-stock' => 'Stok Saat Ini',
        'low-stock' => 'Stok Rendah',
    ];

    /** @return array<string, mixed> */
    public function validated(Request $request): array
    {
        return $request->validate([
            'type' => ['nullable', Rule::in(array_keys(self::TYPES))],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'laboratory_id' => ['nullable', 'integer', 'exists:laboratories,id'],
            'item_id' => ['nullable', 'integer', 'exists:items,id'],
            'category_id' => ['nullable', 'integer', 'exists:item_categories,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);
    }

    /** @param array<int, int> $laboratoryIds */
    public function query(Request $request, array $laboratoryIds): Builder
    {
        return match ($request->string('type', 'usage')->value()) {
            'usage-item' => $this->usageAggregate($request, $laboratoryIds, 'items.id', ['items.code as code', 'items.name as item']),
            'usage-user' => $this->usageAggregate($request, $laboratoryIds, 'users.id', ['users.name as user']),
            'usage-laboratory' => $this->usageAggregate($request, $laboratoryIds, 'laboratories.id', ['laboratories.name as laboratory']),
            'inventory-movements' => $this->inventoryMovements($request, $laboratoryIds),
            'current-stock' => $this->stock($request, $laboratoryIds, false),
            'low-stock' => $this->stock($request, $laboratoryIds, true),
            default => $this->usage($request, $laboratoryIds),
        };
    }

    /** @return array<string, string> */
    public function columns(string $type): array
    {
        return match ($type) {
            'usage-item' => ['code' => 'Kode', 'item' => 'Item', 'quantity' => 'Total', 'symbol' => 'Satuan'],
            'usage-user' => ['user' => 'Petugas', 'quantity' => 'Total', 'symbol' => 'Satuan'],
            'usage-laboratory' => ['laboratory' => 'Laboratorium', 'quantity' => 'Total', 'symbol' => 'Satuan'],
            'inventory-movements' => ['date' => 'Tanggal', 'laboratory' => 'Laboratorium', 'item' => 'Item', 'movement_type' => 'Jenis', 'quantity' => 'Jumlah', 'symbol' => 'Satuan', 'user' => 'Petugas'],
            'current-stock', 'low-stock' => ['laboratory' => 'Laboratorium', 'code' => 'Kode', 'item' => 'Item', 'quantity' => 'Stok', 'symbol' => 'Satuan', 'minimum_stock' => 'Minimum'],
            default => ['number' => 'Nomor', 'date' => 'Tanggal', 'laboratory' => 'Laboratorium', 'item' => 'Item', 'quantity' => 'Jumlah', 'symbol' => 'Satuan', 'user' => 'Petugas', 'status' => 'Status'],
        };
    }

    /** @param array<int, int> $laboratoryIds */
    private function usageBase(Request $request, array $laboratoryIds): Builder
    {
        return DB::table('material_usage_items')
            ->join('material_usages', 'material_usages.id', '=', 'material_usage_items.material_usage_id')
            ->join('items', 'items.id', '=', 'material_usage_items.item_id')
            ->join('units', 'units.id', '=', 'material_usage_items.unit_id')
            ->join('laboratories', 'laboratories.id', '=', 'material_usages.laboratory_id')
            ->join('users', 'users.id', '=', 'material_usages.created_by')
            ->whereIn('material_usages.laboratory_id', $laboratoryIds)
            ->when($request->filled('date_from'), fn ($query) => $query->whereDate('material_usages.usage_date', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($query) => $query->whereDate('material_usages.usage_date', '<=', $request->date('date_to')))
            ->when($request->filled('laboratory_id'), fn ($query) => $query->where('material_usages.laboratory_id', $request->integer('laboratory_id')))
            ->when($request->filled('item_id'), fn ($query) => $query->where('items.id', $request->integer('item_id')))
            ->when($request->filled('category_id'), fn ($query) => $query->where('items.category_id', $request->integer('category_id')))
            ->when($request->filled('user_id'), fn ($query) => $query->where('users.id', $request->integer('user_id')));
    }

    /** @param array<int, int> $laboratoryIds */
    private function usage(Request $request, array $laboratoryIds): Builder
    {
        return $this->usageBase($request, $laboratoryIds)
            ->select(['material_usages.number', 'material_usages.usage_date as date', 'material_usages.status', 'laboratories.name as laboratory', 'items.name as item', 'material_usage_items.quantity', 'units.symbol', 'users.name as user'])
            ->orderByDesc('material_usages.usage_date')->orderByDesc('material_usages.id');
    }

    /**
     * @param  array<int, int>  $laboratoryIds
     * @param  array<int, string>  $select
     */
    private function usageAggregate(Request $request, array $laboratoryIds, string $groupKey, array $select): Builder
    {
        $selectedColumns = array_map(fn (string $column): string => explode(' as ', $column)[0], $select);

        return $this->usageBase($request, $laboratoryIds)
            ->where('material_usages.status', 'SUBMITTED')
            ->select($select)->addSelect('units.symbol')->selectRaw('SUM(material_usage_items.quantity) as quantity')
            ->groupBy(array_merge([$groupKey], $selectedColumns, ['units.id', 'units.symbol']))
            ->orderByDesc('quantity');
    }

    /** @param array<int, int> $laboratoryIds */
    private function inventoryMovements(Request $request, array $laboratoryIds): Builder
    {
        return DB::table('stock_movements')
            ->join('items', 'items.id', '=', 'stock_movements.item_id')
            ->join('laboratories', 'laboratories.id', '=', 'stock_movements.laboratory_id')
            ->join('units', 'units.id', '=', 'stock_movements.unit_id')
            ->join('users', 'users.id', '=', 'stock_movements.created_by')
            ->whereIn('stock_movements.laboratory_id', $laboratoryIds)
            ->when($request->filled('date_from'), fn ($query) => $query->whereDate('stock_movements.created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($query) => $query->whereDate('stock_movements.created_at', '<=', $request->date('date_to')))
            ->when($request->filled('laboratory_id'), fn ($query) => $query->where('stock_movements.laboratory_id', $request->integer('laboratory_id')))
            ->when($request->filled('item_id'), fn ($query) => $query->where('items.id', $request->integer('item_id')))
            ->when($request->filled('category_id'), fn ($query) => $query->where('items.category_id', $request->integer('category_id')))
            ->when($request->filled('user_id'), fn ($query) => $query->where('users.id', $request->integer('user_id')))
            ->selectRaw('stock_movements.created_at as date, laboratories.name as laboratory, items.name as item, stock_movements.type as movement_type, stock_movements.quantity, units.symbol, users.name as user')
            ->orderByDesc('stock_movements.created_at');
    }

    /** @param array<int, int> $laboratoryIds */
    private function stock(Request $request, array $laboratoryIds, bool $lowOnly): Builder
    {
        $query = DB::table('item_laboratory')
            ->join('items', 'items.id', '=', 'item_laboratory.item_id')
            ->join('laboratories', 'laboratories.id', '=', 'item_laboratory.laboratory_id')
            ->join('units', 'units.id', '=', 'items.default_unit_id')
            ->leftJoin('stock_movements', function ($join): void {
                $join->on('stock_movements.item_id', '=', 'items.id')->on('stock_movements.laboratory_id', '=', 'laboratories.id')->on('stock_movements.unit_id', '=', 'units.id');
            })
            ->where('items.inventory_mode', 'STOCK')->whereIn('laboratories.id', $laboratoryIds)
            ->when($request->filled('laboratory_id'), fn ($builder) => $builder->where('laboratories.id', $request->integer('laboratory_id')))
            ->when($request->filled('item_id'), fn ($builder) => $builder->where('items.id', $request->integer('item_id')))
            ->when($request->filled('category_id'), fn ($builder) => $builder->where('items.category_id', $request->integer('category_id')))
            ->selectRaw('laboratories.name as laboratory, items.code, items.name as item, COALESCE(SUM(stock_movements.quantity), 0) as quantity, units.symbol, items.minimum_stock')
            ->groupBy('laboratories.id', 'laboratories.name', 'items.id', 'items.code', 'items.name', 'units.id', 'units.symbol', 'items.minimum_stock');

        if ($lowOnly) {
            $query->whereNotNull('items.minimum_stock')->havingRaw('COALESCE(SUM(stock_movements.quantity), 0) <= items.minimum_stock');
        }

        return $query->orderBy('items.name');
    }
}
