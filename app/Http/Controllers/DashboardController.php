<?php

namespace App\Http\Controllers;

use App\Enums\MaterialUsageStatus;
use App\Models\Laboratory;
use App\Models\MaterialUsage;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user->hasRole('super-admin');
        $labIds = $isSuperAdmin ? Laboratory::pluck('id')->all() : $user->laboratoryIds();

        $today = today();
        $yesterday = today()->subDay();

        // 1. Base today & yesterday usage query
        $todayUsages = MaterialUsage::query()->visibleTo($user)
            ->whereDate('usage_date', $today)
            ->where('status', '!=', MaterialUsageStatus::Voided->value);

        $yesterdayUsages = MaterialUsage::query()->visibleTo($user)
            ->whereDate('usage_date', $yesterday)
            ->where('status', '!=', MaterialUsageStatus::Voided->value);

        $txToday = (clone $todayUsages)->count();
        $txYesterday = (clone $yesterdayUsages)->count();

        $itemsToday = (clone $todayUsages)->withCount('items')->get()->sum('items_count');
        $itemsYesterday = (clone $yesterdayUsages)->withCount('items')->get()->sum('items_count');

        $myTxToday = (clone $todayUsages)->where('created_by', $user->id)->count();
        $myTxYesterday = (clone $yesterdayUsages)->where('created_by', $user->id)->count();

        // 2. Low stock calculation with comparison/status
        $lowStockQuery = DB::table('item_laboratory')
            ->join('items', 'items.id', '=', 'item_laboratory.item_id')
            ->join('laboratories', 'laboratories.id', '=', 'item_laboratory.laboratory_id')
            ->join('units', 'units.id', '=', 'items.default_unit_id')
            ->leftJoin('stock_movements', function ($join): void {
                $join->on('stock_movements.item_id', '=', 'items.id')
                    ->on('stock_movements.laboratory_id', '=', 'laboratories.id')
                    ->on('stock_movements.unit_id', '=', 'units.id');
            })
            ->selectRaw('items.id, laboratories.id as laboratory_id, items.minimum_stock, COALESCE(SUM(stock_movements.quantity), 0) as balance')
            ->where('items.inventory_mode', 'STOCK')
            ->whereNotNull('items.minimum_stock')
            ->whereIn('laboratories.id', $labIds)
            ->groupBy('items.id', 'laboratories.id', 'items.minimum_stock');

        $stockBalances = (clone $lowStockQuery)->get();
        $lowStockCount = $stockBalances->filter(fn ($row) => $row->balance <= $row->minimum_stock)->count();
        $safeStockCount = $stockBalances->filter(fn ($row) => $row->balance > $row->minimum_stock)->count();
        $outOfStockCount = $stockBalances->filter(fn ($row) => $row->balance <= 0)->count();

        // 3. Trends (Last 7 Days Usage & Stock Movement)
        $sevenDaysAgo = today()->subDays(6);
        $trendDaily = [];
        $dailyRaw = MaterialUsage::query()->visibleTo($user)
            ->where('status', '!=', MaterialUsageStatus::Voided->value)
            ->whereBetween('usage_date', [$sevenDaysAgo->toDateString(), $today->toDateString()])
            ->selectRaw('usage_date, count(*) as tx_count')
            ->groupBy('usage_date')
            ->pluck('tx_count', 'usage_date')
            ->all();

        $dailyItemsRaw = DB::table('material_usage_items')
            ->join('material_usages', 'material_usages.id', '=', 'material_usage_items.material_usage_id')
            ->whereIn('material_usages.laboratory_id', $labIds)
            ->where('material_usages.status', '!=', MaterialUsageStatus::Voided->value)
            ->whereBetween('material_usages.usage_date', [$sevenDaysAgo->toDateString(), $today->toDateString()])
            ->selectRaw('material_usages.usage_date, sum(material_usage_items.quantity) as total_qty')
            ->groupBy('material_usages.usage_date')
            ->pluck('total_qty', 'usage_date')
            ->all();

        for ($i = 6; $i >= 0; $i--) {
            $d = today()->subDays($i);
            $dateStr = $d->toDateString();
            $trendDaily[] = [
                'date' => $dateStr,
                'day' => $d->locale('id')->translatedFormat('D'),
                'label' => $d->format('d M'),
                'transactions' => (int) ($dailyRaw[$dateStr] ?? 0),
                'quantity' => round((float) ($dailyItemsRaw[$dateStr] ?? 0), 1),
            ];
        }

        // 4. Status distribution for doughnut chart
        $statusCounts = MaterialUsage::query()->visibleTo($user)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        $statusDistribution = [
            [
                'status' => 'SUBMITTED',
                'label' => 'Submitted / Selesai',
                'count' => (int) ($statusCounts[MaterialUsageStatus::Submitted->value] ?? 0),
                'color' => '#10b981', // Emerald
            ],
            [
                'status' => 'DRAFT',
                'label' => 'Draft',
                'count' => (int) ($statusCounts[MaterialUsageStatus::Draft->value] ?? 0),
                'color' => '#f59e0b', // Amber
            ],
            [
                'status' => 'VOIDED',
                'label' => 'Dibatalkan (Void)',
                'count' => (int) ($statusCounts[MaterialUsageStatus::Voided->value] ?? 0),
                'color' => '#f43f5e', // Rose
            ],
        ];

        // 5. Stock status breakdown for visual bar
        $stockDistribution = [
            'safe' => $safeStockCount,
            'low' => $lowStockCount - $outOfStockCount,
            'empty' => $outOfStockCount,
            'total' => count($stockBalances),
        ];

        // 6. Recent usage activities
        $recent = MaterialUsage::query()->visibleTo($user)
            ->with(['laboratory:id,name', 'creator:id,name'])
            ->withCount('items')
            ->latest('usage_date')->latest('id')->limit(5)->get();

        return Inertia::render('dashboard', [
            'metrics' => [
                'transactions_today' => $txToday,
                'transactions_diff' => $txToday - $txYesterday,
                'items_today' => $itemsToday,
                'items_diff' => $itemsToday - $itemsYesterday,
                'my_transactions_today' => $myTxToday,
                'my_transactions_diff' => $myTxToday - $myTxYesterday,
                'low_stock' => $lowStockCount,
                'out_of_stock' => $outOfStockCount,
            ],
            'charts' => [
                'trend' => $trendDaily,
                'status_distribution' => $statusDistribution,
                'stock_distribution' => $stockDistribution,
            ],
            'recent' => $recent,
            'can' => [
                'create_usage' => $user->can('material-usage.create'),
                'view_inventory' => $user->can('inventory.view'),
            ],
        ]);
    }
}
