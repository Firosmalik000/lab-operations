<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Laboratory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
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

        $officerName = $this->resolveOfficerNames($laboratoryId, $startDate, $endDate, $user);
        $approver = $this->resolveApprover($laboratory);

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
            'officer_name' => $officerName,
            'approver' => $approver,
            'rows' => $rows,
            'summary' => [
                'total_items' => count($rows),
                'total_keluar_all' => round($totalMonthlyOut, 2),
            ],
        ];
    }

    /**
     * Resolves names of officers who inputted usage in the period (e.g. "Cucun, Zhafran, Alghifari").
     * Fallback to logged-in user if no transactions recorded yet.
     */
    public function resolveOfficerNames(
        int $laboratoryId,
        Carbon $startDate,
        Carbon $endDate,
        User $currentUser
    ): string {
        $creatorNames = DB::table('material_usages')
            ->join('users', 'users.id', '=', 'material_usages.created_by')
            ->where('material_usages.laboratory_id', $laboratoryId)
            ->where('material_usages.status', 'SUBMITTED')
            ->whereBetween('material_usages.usage_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->select('users.name')
            ->distinct()
            ->orderBy('users.name')
            ->pluck('name')
            ->all();

        if (! empty($creatorNames)) {
            return implode(', ', $creatorNames);
        }

        return $currentUser->name;
    }

    /**
     * Resolves the approver (Penyelia) for the laboratory following priority:
     * 1. User with 'supervisor' role assigned to this laboratory
     * 2. User with 'lab-admin' role assigned to this laboratory
     * 3. User with 'super-admin' role other than 'admin@lab.test' (e.g. Aisyatul Faizah)
     * 4. Fallback to any active super-admin or default label
     *
     * @return array{name: string, title: string}
     */
    public function resolveApprover(Laboratory $laboratory): array
    {
        $labTitle = 'Penyelia Lab. '.$laboratory->name;

        // 1. Supervisor in this lab
        $supervisor = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'supervisor'))
            ->where(function ($q) use ($laboratory) {
                $q->whereHas('laboratories', fn ($lab) => $lab->where('laboratories.id', $laboratory->id))
                    ->orWhere('default_laboratory_id', $laboratory->id);
            })
            ->where('is_active', true)
            ->first();

        if ($supervisor) {
            return [
                'name' => $supervisor->name,
                'title' => $labTitle,
            ];
        }

        // 2. Lab Admin in this lab
        $labAdmin = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'lab-admin'))
            ->where(function ($q) use ($laboratory) {
                $q->whereHas('laboratories', fn ($lab) => $lab->where('laboratories.id', $laboratory->id))
                    ->orWhere('default_laboratory_id', $laboratory->id);
            })
            ->where('is_active', true)
            ->first();

        if ($labAdmin) {
            return [
                'name' => $labAdmin->name,
                'title' => $labTitle,
            ];
        }

        // 3. Super Admin other than default 'admin@lab.test' (e.g. Aisyatul Faizah)
        $customSuperAdmin = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'super-admin'))
            ->where('email', '!=', 'admin@lab.test')
            ->where('is_active', true)
            ->first();

        if ($customSuperAdmin) {
            return [
                'name' => $customSuperAdmin->name,
                'title' => $labTitle,
            ];
        }

        // 4. Fallback
        $fallback = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'super-admin'))
            ->where('is_active', true)
            ->first();

        return [
            'name' => $fallback?->name ?? 'Aisyatul Faizah',
            'title' => $labTitle,
        ];
    }

    /**
     * Export Monthly Matrix to genuine Microsoft Excel (.xlsx) with borders, styling, and identical layout
     */
    public function exportExcel(
        User $user,
        int $laboratoryId,
        int $year,
        int $month,
        string $categoryGroup = 'bahan'
    ): StreamedResponse {
        $matrix = $this->getMatrixData($user, $laboratoryId, $year, $month, $categoryGroup);
        $daysInMonth = $matrix['period']['days_in_month'];
        $title = $categoryGroup === 'alat' ? 'STOCK OPNAME ALAT & CONSUMABLE' : 'STOCK OPNAME BAHAN KIMIA';

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(substr($title, 0, 31));
        $sheet->setShowGridLines(true);

        // Header Title (Row 2, centered across table)
        // Table columns: No(A), Kode(B), CAS(C), Nama(D), Bentuk(E), Volume(F), Satuan(G), Total Masuk(H),
        // Day 1..daysInMonth (I ...), Total Keluar, Stock Akhir, Stock Fisik, Minimum Stock, Status
        $startDayColIdx = 9; // Column I is index 9
        $endDayColIdx = 8 + $daysInMonth;
        $totalKeluarColIdx = $endDayColIdx + 1;
        $stockAkhirColIdx = $endDayColIdx + 2;
        $stockFisikColIdx = $endDayColIdx + 3;
        $minStockColIdx = $endDayColIdx + 4;
        $statusColIdx = $endDayColIdx + 5;
        $lastColLetter = Coordinate::stringFromColumnIndex($statusColIdx);

        // Row 2: Document Title
        $sheet->setCellValue('A2', $title);
        $sheet->mergeCells("A2:{$lastColLetter}2");
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'name' => 'Calibri'],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(24);

        // Metadata block (Rows 4-7)
        // Lokasi
        $sheet->setCellValue('A4', 'Lokasi');
        $sheet->setCellValue('B4', ': ' . $matrix['laboratory']['name']);

        // Tanggal S.O
        $sheet->setCellValue('A5', 'Tanggal S.O');
        $sheet->setCellValue('B5', ': ' . $matrix['period']['days_in_month'] . ' ' . $matrix['period']['month_name'] . ' ' . $matrix['period']['year']);

        // Nama Petugas & Jabatan
        $sheet->setCellValue('A6', 'Nama Petugas');
        $sheet->setCellValue('B6', ': ' . $matrix['officer_name']);
        $sheet->setCellValue('D6', 'Jabatan / Paraf : Analis');

        // Disetujui Oleh & Jabatan
        $sheet->setCellValue('A7', 'Disetujui Oleh');
        $sheet->setCellValue('B7', ': ' . $matrix['approver']['name']);
        $sheet->setCellValue('D7', 'Jabatan / Paraf : ' . $matrix['approver']['title']);

        $sheet->getStyle('A4:D7')->applyFromArray([
            'font' => ['size' => 10, 'name' => 'Calibri'],
        ]);

        // Table Header (Rows 8 and 9)
        // Row 8: Multi-row or merged headers
        $sheet->setCellValue('A8', 'No.');
        $sheet->mergeCells('A8:A9');

        $sheet->setCellValue('B8', 'Kode');
        $sheet->mergeCells('B8:B9');

        $sheet->setCellValue('C8', 'CAS / Catalog No.');
        $sheet->mergeCells('C8:C9');

        $sheet->setCellValue('D8', 'Nama Bahan');
        $sheet->mergeCells('D8:D9');

        $sheet->setCellValue('E8', 'Rumus');
        $sheet->mergeCells('E8:E9');

        $sheet->setCellValue('F8', 'Volume');
        $sheet->mergeCells('F8:F9');

        $sheet->setCellValue('G8', 'Satuan');
        $sheet->mergeCells('G8:G9');

        $sheet->setCellValue('H8', 'Total Masuk');
        $sheet->mergeCells('H8:H9');

        // "tanggal" merged across all days
        $startDayLetter = Coordinate::stringFromColumnIndex($startDayColIdx);
        $endDayLetter = Coordinate::stringFromColumnIndex($endDayColIdx);
        $sheet->setCellValue("{$startDayLetter}8", 'tanggal');
        $sheet->mergeCells("{$startDayLetter}8:{$endDayLetter}8");

        for ($d = 1; $d <= $daysInMonth; $d++) {
            $colLetter = Coordinate::stringFromColumnIndex(8 + $d);
            $sheet->setCellValue("{$colLetter}9", (string) $d);
        }

        $totalKeluarColLetter = Coordinate::stringFromColumnIndex($totalKeluarColIdx);
        $sheet->setCellValue("{$totalKeluarColLetter}8", 'Total Keluar');
        $sheet->mergeCells("{$totalKeluarColLetter}8:{$totalKeluarColLetter}9");

        $stockAkhirColLetter = Coordinate::stringFromColumnIndex($stockAkhirColIdx);
        $sheet->setCellValue("{$stockAkhirColLetter}8", 'Stock Akhir');
        $sheet->mergeCells("{$stockAkhirColLetter}8:{$stockAkhirColLetter}9");

        $stockFisikColLetter = Coordinate::stringFromColumnIndex($stockFisikColIdx);
        $sheet->setCellValue("{$stockFisikColLetter}8", 'Stock Fisik');
        $sheet->mergeCells("{$stockFisikColLetter}8:{$stockFisikColLetter}9");

        $minStockColLetter = Coordinate::stringFromColumnIndex($minStockColIdx);
        $sheet->setCellValue("{$minStockColLetter}8", 'Minimum Stock');
        $sheet->mergeCells("{$minStockColLetter}8:{$minStockColLetter}9");

        $sheet->setCellValue("{$lastColLetter}8", 'Status');
        $sheet->mergeCells("{$lastColLetter}8:{$lastColLetter}9");

        // Style Table Header (Navy Blue Background like Excel template, White Text, Bold, Centered)
        $headerRange = "A8:{$lastColLetter}9";
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 9,
                'name' => 'Calibri',
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1B365D'], // Deep Navy Blue
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
            ],
        ]);
        $sheet->getRowDimension(8)->setRowHeight(20);
        $sheet->getRowDimension(9)->setRowHeight(18);

        // Data Rows
        $currentRow = 10;
        foreach ($matrix['rows'] as $row) {
            $sheet->setCellValue("A{$currentRow}", $row['no']);
            $sheet->setCellValue("B{$currentRow}", ''); // Kode internal
            $sheet->setCellValue("C{$currentRow}", $row['code']); // CAS / Catalog No
            $sheet->setCellValue("D{$currentRow}", $row['name']);
            $sheet->setCellValue("E{$currentRow}", ''); // Rumus
            $sheet->setCellValue("F{$currentRow}", $row['notes'] ?? '');
            $sheet->setCellValue("G{$currentRow}", $row['unit']);
            $sheet->setCellValue("H{$currentRow}", $row['total_masuk'] > 0 ? $row['total_masuk'] : 0);

            for ($d = 1; $d <= $daysInMonth; $d++) {
                $colLetter = Coordinate::stringFromColumnIndex(8 + $d);
                $val = $row['daily'][$d] ?? null;
                $sheet->setCellValue("{$colLetter}{$currentRow}", $val !== null ? $val : '');
            }

            $sheet->setCellValue("{$totalKeluarColLetter}{$currentRow}", $row['total_keluar']);
            $sheet->setCellValue("{$stockAkhirColLetter}{$currentRow}", $row['stock_akhir']);
            $sheet->setCellValue("{$stockFisikColLetter}{$currentRow}", $row['stock_fisik']);
            $sheet->setCellValue("{$minStockColLetter}{$currentRow}", $row['minimum_stock']);
            $sheet->setCellValue("{$lastColLetter}{$currentRow}", $row['status']);

            // Row Highlighting:
            // 1. Red for expired
            // 2. Yellow for active usage (like in user's Excel rows 1, 2, 16)
            if ($row['is_expired']) {
                $sheet->getStyle("A{$currentRow}:{$lastColLetter}{$currentRow}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'FF0000'], // Red expired highlight
                    ],
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                ]);
            } elseif ($row['total_keluar'] > 0) {
                $sheet->getStyle("A{$currentRow}:{$lastColLetter}{$currentRow}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'FFFF00'], // Yellow highlight for items with usage
                    ],
                ]);
            }

            $sheet->getRowDimension($currentRow)->setRowHeight(18);
            $currentRow++;
        }

        $lastDataRow = max(10, $currentRow - 1);

        // Apply Borders to entire table data block
        $dataRange = "A10:{$lastColLetter}{$lastDataRow}";
        $sheet->getStyle($dataRange)->applyFromArray([
            'font' => ['size' => 9, 'name' => 'Calibri'],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'A6B9D0'],
                ],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Specific alignments
        // Center: No, Kode, CAS, Bentuk, Volume, Satuan, Days 1..N, Status
        $sheet->getStyle("A10:C{$lastDataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("D10:D{$lastDataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
        $sheet->getStyle("E10:G{$lastDataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("H10:H{$lastDataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        $startDaysRange = "{$startDayLetter}10:{$endDayLetter}{$lastDataRow}";
        $sheet->getStyle($startDaysRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->getStyle("{$totalKeluarColLetter}10:{$minStockColLetter}{$lastDataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("{$lastColLetter}10:{$lastColLetter}{$lastDataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Legend box at the bottom (Row $currentRow + 1)
        $legendRow = $currentRow + 1;
        $sheet->setCellValue("A{$legendRow}", '   ');
        $sheet->getStyle("A{$legendRow}")->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'FF3333'],
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ]);
        $sheet->setCellValue("B{$legendRow}", 'reagen expired');
        $sheet->getStyle("B{$legendRow}")->applyFromArray([
            'font' => ['size' => 9, 'italic' => true, 'name' => 'Calibri'],
        ]);

        // Auto column widths or fixed calibrated sizes
        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(14);
        $sheet->getColumnDimension('C')->setWidth(20);
        $sheet->getColumnDimension('D')->setWidth(34);
        $sheet->getColumnDimension('E')->setWidth(18);
        $sheet->getColumnDimension('F')->setWidth(10);
        $sheet->getColumnDimension('G')->setWidth(10);
        $sheet->getColumnDimension('H')->setWidth(14);

        for ($d = 1; $d <= $daysInMonth; $d++) {
            $colLetter = Coordinate::stringFromColumnIndex(8 + $d);
            $sheet->getColumnDimension($colLetter)->setWidth(5.5);
        }

        $sheet->getColumnDimension($totalKeluarColLetter)->setWidth(13);
        $sheet->getColumnDimension($stockAkhirColLetter)->setWidth(13);
        $sheet->getColumnDimension($stockFisikColLetter)->setWidth(13);
        $sheet->getColumnDimension($minStockColLetter)->setWidth(14);
        $sheet->getColumnDimension($lastColLetter)->setWidth(12);

        $filename = sprintf(
            'Stock_Opname_%s_%s_%d_%02d.xlsx',
            $categoryGroup,
            str_replace(' ', '_', $matrix['laboratory']['name']),
            $year,
            $month
        );

        return response()->streamDownload(function () use ($spreadsheet): void {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Backward-compatible fallback for CSV export
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
            'Stock_Opname_%s_%s_%d_%02d.csv',
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

            // Document Header block (matching exact Excel CSV template)
            fputcsv($handle, [$title]);
            fputcsv($handle, ['Lokasi', '', ': ' . $matrix['laboratory']['name']]);
            fputcsv($handle, ['Tanggal S.O', '', ': ' . $matrix['period']['days_in_month'] . ' ' . $matrix['period']['month_name'] . ' ' . $matrix['period']['year']]);
            fputcsv($handle, ['Nama Petugas', '', ': ' . $matrix['officer_name'], 'Jabatan / Paraf : Analis']);
            fputcsv($handle, ['Disetujui Oleh ', '', ': ' . $matrix['approver']['name'], 'Jabatan / Paraf : ' . $matrix['approver']['title']]);

            // Column Header (matching: No., Kode, CAS / Catalog No., Nama Bahan, Rumus, Volume, Satuan, Total Masuk, 1..N, Total Keluar, Stock Akhir, Stock Fisik, Minimum Stock, Status)
            $headers = ['No.', 'Kode', 'CAS / Catalog No.', 'Nama Bahan', 'Rumus', 'Volume', 'Satuan', 'Total Masuk'];
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
                    '', // Kode
                    $row['code'], // CAS / Catalog No.
                    $row['name'], // Nama Bahan
                    '', // Rumus
                    $row['notes'] ?? '', // Volume
                    $row['unit'], // Satuan
                    $row['total_masuk'], // Total Masuk
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

            fputcsv($handle, []);
            fputcsv($handle, []);
            fputcsv($handle, ['', '', 'reagen expired']);

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
