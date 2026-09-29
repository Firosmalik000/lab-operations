<?php

namespace App\Http\Controllers;

use App\Actions\Inventory\CreateStockMovementAction;
use App\Http\Requests\InventoryMovementRequest;
use App\Models\Item;
use App\Models\Laboratory;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function stock(Request $request): Response
    {
        $laboratoryIds = $this->laboratoryIds($request);
        $query = DB::table('item_laboratory')
            ->join('items', 'items.id', '=', 'item_laboratory.item_id')
            ->join('laboratories', 'laboratories.id', '=', 'item_laboratory.laboratory_id')
            ->join('units', 'units.id', '=', 'items.default_unit_id')
            ->leftJoin('item_categories', 'item_categories.id', '=', 'items.category_id')
            ->leftJoin('stock_movements', function ($join): void {
                $join->on('stock_movements.item_id', '=', 'items.id')
                    ->on('stock_movements.laboratory_id', '=', 'laboratories.id')
                    ->on('stock_movements.unit_id', '=', 'units.id');
            })
            ->where('items.inventory_mode', 'STOCK')
            ->whereIn('laboratories.id', $laboratoryIds)
            ->selectRaw('items.id as item_id, items.code, items.name, items.minimum_stock, item_categories.name as category, laboratories.id as laboratory_id, laboratories.name as laboratory, units.id as unit_id, units.symbol, COALESCE(SUM(stock_movements.quantity), 0) as balance')
            ->groupBy('items.id', 'items.code', 'items.name', 'items.minimum_stock', 'item_categories.name', 'laboratories.id', 'laboratories.name', 'units.id', 'units.symbol');

        $query->when($request->filled('laboratory_id'), fn ($q) => $q->where('laboratories.id', $request->integer('laboratory_id')));
        $query->when($request->filled('search'), function ($q) use ($request): void {
            $search = '%'.$request->string('search')->value().'%';
            $q->where(fn ($inner) => $inner->where('items.name', 'like', $search)->orWhere('items.code', 'like', $search));
        });
        $query->when($request->input('status') === 'low', fn ($q) => $q->havingRaw('items.minimum_stock IS NOT NULL AND COALESCE(SUM(stock_movements.quantity), 0) <= items.minimum_stock AND COALESCE(SUM(stock_movements.quantity), 0) > 0'));
        $query->when($request->input('status') === 'empty', fn ($q) => $q->havingRaw('COALESCE(SUM(stock_movements.quantity), 0) <= 0'));

        return Inertia::render('inventory/stock', [
            'stocks' => $query->orderBy('items.name')->paginate(20)->withQueryString(),
            'laboratories' => Laboratory::whereIn('id', $laboratoryIds)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'laboratory_id', 'status']),
        ]);
    }

    public function movements(Request $request): Response
    {
        $query = StockMovement::query()->whereIn('laboratory_id', $this->laboratoryIds($request))
            ->with(['item:id,code,name', 'laboratory:id,name', 'unit:id,symbol', 'creator:id,name']);
        $query->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')->value()));
        $query->when($request->filled('laboratory_id'), fn ($q) => $q->where('laboratory_id', $request->integer('laboratory_id')));

        return Inertia::render('inventory/movements', [
            'movements' => $query->latest('created_at')->paginate(20)->withQueryString(),
            'filters' => $request->only(['type', 'laboratory_id']),
            'laboratories' => Laboratory::whereIn('id', $this->laboratoryIds($request))->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(Request $request): Response
    {
        $type = $request->string('type', 'RECEIVING')->value();
        abort_unless(in_array($type, ['OPENING', 'RECEIVING', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'], true), 404);
        $permission = match ($type) {
            'OPENING' => 'inventory.opening',
            'RECEIVING' => 'inventory.receive',
            default => 'inventory.adjust',
        };
        abort_unless($request->user()->can($permission), 403);

        return Inertia::render('inventory/create', [
            'type' => $type,
            'laboratories' => Laboratory::whereIn('id', $this->laboratoryIds($request))->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'items' => Item::query()->active()->where('inventory_mode', 'STOCK')
                ->whereHas('laboratories', fn ($query) => $query->whereIn('laboratories.id', $this->laboratoryIds($request)))
                ->with(['defaultUnit:id,name,symbol', 'laboratories:id'])->orderBy('name')->get(['id', 'code', 'name', 'default_unit_id']),
            'units' => Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'symbol']),
            'locations' => StorageLocation::where('is_active', true)->orderBy('name')->get(['id', 'laboratory_id', 'name']),
        ]);
    }

    public function store(InventoryMovementRequest $request, CreateStockMovementAction $action): RedirectResponse
    {
        $action->handle($request->validated(), $request->user());

        return to_route('inventory.movements')->with('success', 'Pergerakan stok berhasil dicatat.');
    }

    /** @return array<int, int> */
    private function laboratoryIds(Request $request): array
    {
        return $request->user()->hasRole('super-admin') ? Laboratory::pluck('id')->map(fn ($id): int => (int) $id)->all() : $request->user()->laboratoryIds();
    }
}
