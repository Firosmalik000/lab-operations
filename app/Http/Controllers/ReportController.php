<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\Laboratory;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request, ReportService $reports): Response
    {
        $filters = $reports->validated($request);
        $type = $filters['type'] ?? 'usage';
        $laboratoryIds = $this->laboratoryIds($request);

        return Inertia::render('reports/index', [
            'rows' => $reports->query($request, $laboratoryIds)->paginate(25)->withQueryString(),
            'columns' => $reports->columns($type),
            'reportTypes' => ReportService::TYPES,
            'filters' => $filters,
            'laboratories' => Laboratory::whereIn('id', $laboratoryIds)->orderBy('name')->get(['id', 'name']),
            'items' => Item::whereHas('laboratories', fn ($query) => $query->whereIn('laboratories.id', $laboratoryIds))->orderBy('name')->get(['id', 'code', 'name']),
            'categories' => ItemCategory::orderBy('name')->get(['id', 'name']),
            'users' => User::whereHas('laboratories', fn ($query) => $query->whereIn('laboratories.id', $laboratoryIds))->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function export(Request $request, ReportService $reports): StreamedResponse
    {
        $filters = $reports->validated($request);
        $type = $filters['type'] ?? 'usage';
        $columns = $reports->columns($type);
        $rows = $reports->query($request, $this->laboratoryIds($request))->cursor();

        return response()->streamDownload(function () use ($rows, $columns): void {
            $handle = fopen('php://output', 'wb');
            if ($handle === false) {
                throw new RuntimeException('Tidak dapat membuka output CSV.');
            }
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, array_values($columns));
            foreach ($rows as $row) {
                fputcsv($handle, array_map(fn (string $key): string => $this->safeCsv((string) ($row->{$key} ?? '')), array_keys($columns)));
            }
            fclose($handle);
        }, $type.'-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** @return array<int, int> */
    private function laboratoryIds(Request $request): array
    {
        return $request->user()->hasRole('super-admin')
            ? Laboratory::pluck('id')->map(fn ($id): int => (int) $id)->all()
            : $request->user()->laboratoryIds();
    }

    private function safeCsv(string $value): string
    {
        return preg_match('/^[=+\-@]/', $value) === 1 ? "'{$value}" : $value;
    }
}
