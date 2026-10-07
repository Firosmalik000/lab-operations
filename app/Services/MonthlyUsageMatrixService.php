<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Laboratory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MonthlyUsageMatrixService
{
    /**
     * Grouping mapping according to Excel sheets:
     * - bahan: Media, Reagen, Standard / Control, Bioindikator, Kit / Test Kit
     * - alat: Consumable, Equipment, Other
     */
    public const TYPE_GROUPS = [
        'bahan' => ['Media', 'Reagen', 'Standard / Control', 'Bioindikator', 'Kit / Test Kit'],
        'alat' => ['Consumable', 'Equipment', 'Other'],
    ];

    /**
     * @return array<string, mixed>
     */
    public function getMatrixData(
        User $user,
        int $laboratoryId,
        int $year,
        int $month,
        string $categoryGroup = 'bahan'
    ): array {
        $laboratory = Laboratory::findOrFail($laboratoryId);

        // Security check: ensure user has access to this lab unless super-admin
        if (! $user->hasRole('super-admin') && ! $user->laboratories()->where('laboratories.id', $laboratoryId)->exists()) {
            abort(403, 'Akses ke laboratorium ini tidak diizinkan.');
        }

        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();
        $daysInMonth = $endDate->day;

        // Determine item types to include
        $types = self::TYPE_GROUPS[$categoryGroup] ?? self::TYPE_GROUPS['bahan'];

        $items = Item::query()
            ->whereHas('laboratories', fn ($q) => $q->where('laboratories.id', $laboratoryId))
            ->whereHas('itemType', fn ($q) => $q->whereIn('name', $types))
            ->with(['defaultUnit:id,name,symbol', 'itemType:id,name', 'category:id,name'])
            ->active()
            ->orderBy('name')
            ->get();

        $itemIds = $items->pluck('id')->all();

        // 1. Daily usage query for this month
        $dailyUsages = DB::table('material_usage_items')
            ->join('material_usages', 'material_usages.id', '=', 'material_usage_items.material_usage_id')
            ->where('material_usages.laboratory_id', $laboratoryId)
            ->where('material_usages.status', 'SUBMITTED')
            ->whereIn('material_usage_items.item_id', $itemIds)
            ->whereBetween('material_usages.usage_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->select([
                'material_usage_items.item_id',
                'material_usages.usage_date',
                DB::raw('SUM(material_usage_items.quantity) as qty'),
            ])
            ->groupBy('material_usage_items.item_id', 'material_usages.usage_date')
            ->get();

        $usageMatrix = [];
        foreach ($dailyUsages as $row) {
            $day = (int) Carbon::parse($row->usage_date)->format('j');
            $usageMatrix[$row->item_id][$day] = (float) $row->qty;
        }

        // 2. Stock movements for calculating opening balance and incoming stock
        $priorMovements = DB::table('stock_movements')
            ->where('laboratory_id', $laboratoryId)
            ->whereIn('item_id', $itemIds)
            ->where('created_at', '<', $startDate->toDateTimeString())
            ->select(['item_id', DB::raw('SUM(quantity) as balance')])
            ->groupBy('item_id')
            ->pluck('balance', 'item_id');

        $incomingMovements = DB::table('stock_movements')
            ->where('laboratory_id', $laboratoryId)
            ->whereIn('item_id', $itemIds)
            ->whereBetween('created_at', [$startDate->toDateTimeString(), $endDate->endOfDay()->toDateTimeString()])
            ->whereIn('type', ['OPENING', 'RECEIVING', 'ADJUSTMENT_IN'])
            ->select(['item_id', DB::raw('SUM(quantity) as incoming')])
            ->groupBy('item_id')
            ->pluck('incoming', 'item_id');

        $rows = [];
        $totalMonthlyOut = 0;

        foreach ($items as $index => $item) {
            $itemDaily = [];
            $totalOut = 0;

            for ($d = 1; $d <= $daysInMonth; $d++) {
                $qty = $usageMatrix[$item->id][$d] ?? 0;
                $itemDaily[$d] = $qty > 0 ? (float) $qty : null;
                $totalOut += $qty;
            }

            $priorBalance = (float) ($priorMovements[$item->id] ?? 0);
            $incoming = (float) ($incomingMovements[$item->id] ?? 0);
            $totalIn = $priorBalance + $incoming;

            // If no prior stock movement exists yet for this item, default total masuk to baseline or totalOut
            if ($totalIn <= 0 && $totalOut > 0) {
                $totalIn = $totalOut;
            }

            $stockAkhir = max(0, $totalIn - $totalOut);
            $stockFisik = $stockAkhir; // Default aligned with book stock
            $minStock = (float) ($item->minimum_stock ?? 0);
            $status = ($stockAkhir < $minStock && $minStock > 0) ? 'KRITIS' : 'AMAN';

            $totalMonthlyOut += $totalOut;

            $rows[] = [
                'no' => $index + 1,
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'type' => $item->itemType?->name ?? '—',
                'category' => $item->category?->name ?? '—',
                'unit' => $item->defaultUnit?->symbol ?? '—',
                'notes' => $item->notes,
                'total_masuk' => round($totalIn, 2),
                'daily' => $itemDaily,
                'total_keluar' => round($totalOut, 2),
                'stock_akhir' => round($stockAkhir, 2),
                'stock_fisik' => round($stockFisik, 2),
                'minimum_stock' => round($minStock, 2),
                'status' => $status,
                'is_expired' => $item->notes && (stripos($item->notes, 'expired') !== false || stripos($item->notes, 'kadaluarsa') !== false),
            ];
        }

        $monthName = Carbon::create($year, $month, 1)->locale('id')->translatedFormat('F');

        return [
            'laboratory' => [
                'id' => $laboratory->id,
                'name' => $laboratory->name,
                'code' => $laboratory->code,
            ],
            'period' => [
                'year' => $year,
                'month' => $month,
                'month_name' => $monthName,
                'days_in_month' => $daysInMonth,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'category_group' => $categoryGroup,
            'officer_name' => $user->name,
            'rows' => $rows,
            'summary' => [
                'total_items' => count($rows),
                'total_keluar_all' => round($totalMonthlyOut, 2),
            ],
        ];
    }

    /**
     * Export Monthly Matrix to CSV with identical spreadsheet layout
     */
    public function exportCsv(
        User $user,
        int $laboratoryId,
        int $year,
        int $month,
        string $categoryGroup = 'bahan'
    ): StreamedResponse {
        $matrix = $this->getMatrixData($user, $laboratoryId, $year, $month, $categoryGroup);
        $daysInMonth = $matrix['period']['days_in_month'];
        $title = $categoryGroup === 'alat' ? 'STOCK OPNAME ALAT & CONSUMABLE' : 'STOCK OPNAME BAHAN KIMIA';

        $filename = sprintf(
            'Stock_Opname_%s_%s_%d_%d.csv',
            $categoryGroup,
            str_replace(' ', '_', $matrix['laboratory']['name']),
            $year,
            $month
        );

        return response()->streamDownload(function () use ($matrix, $daysInMonth, $title): void {
            $handle = fopen('php://output', 'wb');
            if ($handle === false) {
                return;
            }

            // UTF-8 BOM for Microsoft Excel
            fwrite($handle, "\xEF\xBB\xBF");

            // Document Header block (matching Excel example)
            fputcsv($handle, [$title]);
            fputcsv($handle, ['Lokasi', ': ' . $matrix['laboratory']['name']]);
            fputcsv($handle, ['Periode', ': ' . $matrix['period']['month_name'] . ' ' . $matrix['period']['year']]);
            fputcsv($handle, ['Petugas / Analis', ': ' . $matrix['officer_name']]);
            fputcsv($handle, []); // empty line

            // Column Header
            $headers = ['No', 'Kode / CAS No', 'Nama Bahan / Item', 'Satuan', 'Total Masuk'];
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $headers[] = (string) $d;
            }
            $headers[] = 'Total Keluar';
            $headers[] = 'Stock Akhir';
            $headers[] = 'Stock Fisik';
            $headers[] = 'Minimum Stock';
            $headers[] = 'Status';

            fputcsv($handle, $headers);

            // Data Rows
            foreach ($matrix['rows'] as $row) {
                $line = [
                    $row['no'],
                    $row['code'],
                    $row['name'],
                    $row['unit'],
                    $row['total_masuk'],
                ];

                for ($d = 1; $d <= $daysInMonth; $d++) {
                    $val = $row['daily'][$d] ?? '';
                    $line[] = $val !== '' && $val !== null ? $val : '';
                }

                $line[] = $row['total_keluar'];
                $line[] = $row['stock_akhir'];
                $line[] = $row['stock_fisik'];
                $line[] = $row['minimum_stock'];
                $line[] = $row['status'];

                fputcsv($handle, $line);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
