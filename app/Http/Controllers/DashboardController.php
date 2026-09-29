<?php

namespace App\Http\Controllers;

use App\Enums\MaterialUsageStatus;
use App\Models\Laboratory;
use App\Models\MaterialUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $base = MaterialUsage::query()->visibleTo($user)->whereDate('usage_date', today());
        $recent = MaterialUsage::query()->visibleTo($user)
            ->with(['laboratory:id,name', 'creator:id,name'])
            ->withCount('items')
            ->latest('usage_date')->latest('id')->limit(6)->get();

        $lowStock = DB::table('item_laboratory')
            ->join('items', 'items.id', '=', 'item_laboratory.item_id')
            ->join('laboratories', 'laboratories.id', '=', 'item_laboratory.laboratory_id')
            ->join('units', 'units.id', '=', 'items.default_unit_id')
            ->leftJoin('stock_movements', function ($join): void {
                $join->on('stock_movements.item_id', '=', 'items.id')
                    ->on('stock_movements.laboratory_id', '=', 'laboratories.id')
                    ->on('stock_movements.unit_id', '=', 'units.id');
            })
            ->selectRaw('items.id, laboratories.id as laboratory_id, COALESCE(SUM(stock_movements.quantity), 0) as balance')
            ->where('items.inventory_mode', 'STOCK')
            ->whereNotNull('items.minimum_stock')
            ->whereIn('laboratories.id', $user->hasRole('super-admin') ? Laboratory::pluck('id') : $user->laboratoryIds())
            ->groupBy('items.id', 'laboratories.id', 'items.minimum_stock')
            ->havingRaw('COALESCE(SUM(stock_movements.quantity), 0) <= items.minimum_stock')
            ->count();

        return Inertia::render('dashboard', [
            'metrics' => [
                'transactions_today' => (clone $base)->where('status', '!=', MaterialUsageStatus::Voided->value)->count(),
                'items_today' => (clone $base)->where('status', '!=', MaterialUsageStatus::Voided->value)->withCount('items')->get()->sum('items_count'),
                'my_transactions_today' => (clone $base)->where('created_by', $user->id)->count(),
                'low_stock' => $lowStock,
            ],
            'recent' => $recent,
            'can' => [
                'create_usage' => $user->can('material-usage.create'),
                'view_inventory' => $user->can('inventory.view'),
            ],
        ]);
    }
}
