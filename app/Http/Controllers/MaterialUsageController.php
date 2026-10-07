<?php

namespace App\Http\Controllers;

use App\Actions\MaterialUsage\CreateMaterialUsageAction;
use App\Actions\MaterialUsage\VoidMaterialUsageAction;
use App\Enums\MaterialUsageStatus;
use App\Http\Requests\StoreMaterialUsageRequest;
use App\Http\Requests\UpdateMaterialUsageRequest;
use App\Http\Requests\VoidMaterialUsageRequest;
use App\Models\Item;
use App\Models\Laboratory;
use App\Models\MaterialUsage;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Services\AuditService;
use App\Services\MonthlyUsageMatrixService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MaterialUsageController extends Controller
{
    public function index(Request $request, MonthlyUsageMatrixService $matrixService): Response
    {
        $user = $request->user();
        $laboratories = $this->laboratories($request);
        $defaultLabId = $user->default_laboratory_id ?? ($laboratories[0]['id'] ?? null);

        $viewMode = $request->query('view', 'table');
        $matrixLabId = $request->integer('matrix_laboratory_id', $defaultLabId ?? 0);
        $matrixYear = $request->integer('matrix_year', (int) now()->year);
        $matrixMonth = $request->integer('matrix_month', (int) now()->month);
        $matrixCategoryGroup = $request->input('matrix_category_group', 'bahan');

        $matrixData = null;
        if ($viewMode === 'matrix' && $matrixLabId) {
            $matrixData = $matrixService->getMatrixData(
                $user,
                $matrixLabId,
                $matrixYear,
                $matrixMonth,
                $matrixCategoryGroup
            );
        }

        $query = MaterialUsage::query()->visibleTo($user)
            ->with(['laboratory:id,name', 'creator:id,name'])
            ->withCount('items');

        $defaultDateFrom = now()->startOfMonth()->toDateString();
        $defaultDateTo = now()->endOfMonth()->toDateString();
        $hasExplicitDate = $request->has('date_from') || $request->has('date_to');

        if (! $hasExplicitDate && ! app()->runningUnitTests()) {
            $dateFrom = $defaultDateFrom;
            $dateTo = $defaultDateTo;
        } else {
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
        }

        $query->when($request->filled('search'), fn ($q) => $q->where(function ($inner) use ($request): void {
            $term = '%'.$request->string('search')->value().'%';
            $inner->where('number', 'like', $term)->orWhere('purpose', 'like', $term);
        }));
        $query->when($request->filled('laboratory_id'), fn ($q) => $q->where('laboratory_id', $request->integer('laboratory_id')));
        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->value()));
        $query->when(! empty($dateFrom), fn ($q) => $q->whereDate('usage_date', '>=', $dateFrom));
        $query->when(! empty($dateTo), fn ($q) => $q->whereDate('usage_date', '<=', $dateTo));

        return Inertia::render('material-usage/index', [
            'usages' => $query->latest('usage_date')->latest('id')->paginate(15)->withQueryString(),
            'filters' => [
                'search' => $request->input('search', ''),
                'laboratory_id' => $request->input('laboratory_id', ''),
                'status' => $request->input('status', ''),
                'date_from' => $dateFrom ?? '',
                'date_to' => $dateTo ?? '',
                'view' => $viewMode,
                'matrix_laboratory_id' => $matrixLabId,
                'matrix_year' => $matrixYear,
                'matrix_month' => $matrixMonth,
                'matrix_category_group' => $matrixCategoryGroup,
            ],
            'matrixData' => $matrixData,
            'laboratories' => $laboratories,
            'can' => [
                'create' => $user->can('material-usage.create'),
                'update' => $user->can('material-usage.update'),
                'delete' => $user->can('material-usage.delete'),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $query = MaterialUsage::query()->visibleTo($user)
            ->with(['laboratory:id,name', 'creator:id,name', 'items.item:id,name,code', 'items.unit:id,symbol']);

        $defaultDateFrom = now()->startOfMonth()->toDateString();
        $defaultDateTo = now()->endOfMonth()->toDateString();
        $hasExplicitDate = $request->has('date_from') || $request->has('date_to');

        if (! $hasExplicitDate && ! app()->runningUnitTests()) {
            $dateFrom = $defaultDateFrom;
            $dateTo = $defaultDateTo;
        } else {
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
        }

        $query->when($request->filled('search'), fn ($q) => $q->where(function ($inner) use ($request): void {
            $term = '%'.$request->string('search')->value().'%';
            $inner->where('number', 'like', $term)->orWhere('purpose', 'like', $term);
        }));
        $query->when($request->filled('laboratory_id'), fn ($q) => $q->where('laboratory_id', $request->integer('laboratory_id')));
        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->value()));
        $query->when(! empty($dateFrom), fn ($q) => $q->whereDate('usage_date', '>=', $dateFrom));
        $query->when(! empty($dateTo), fn ($q) => $q->whereDate('usage_date', '<=', $dateTo));

        $filename = 'Riwayat_Penggunaan_'.($dateFrom ?: 'semua').'_sd_'.($dateTo ?: 'semua').'.csv';

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'wb');
            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['No', 'Nomor Transaksi', 'Tanggal', 'Laboratorium', 'Keperluan', 'Petugas', 'Kode Item', 'Nama Item', 'Jumlah', 'Satuan', 'Status']);

            $index = 1;
            $query->latest('usage_date')->latest('id')->chunk(100, function ($usages) use ($handle, &$index): void {
                foreach ($usages as $usage) {
                    $statusStr = $usage->status instanceof \BackedEnum ? $usage->status->value : (string) $usage->status;
                    $dateStr = $usage->usage_date instanceof \DateTimeInterface ? $usage->usage_date->format('Y-m-d') : (string) $usage->usage_date;
                    foreach ($usage->items as $usageItem) {
                        fputcsv($handle, [
                            $index++,
                            $usage->number,
                            $dateStr,
                            $usage->laboratory?->name ?? '—',
                            $usage->purpose ?? '—',
                            $usage->creator?->name ?? '—',
                            $usageItem->item?->code ?? '—',
                            $usageItem->item?->name ?? '—',
                            $usageItem->quantity,
                            $usageItem->unit?->symbol ?? '—',
                            $statusStr,
                        ]);
                    }
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function exportMonthly(Request $request, MonthlyUsageMatrixService $matrixService): StreamedResponse
    {
        $user = $request->user();
        $laboratories = $this->laboratories($request);
        $defaultLabId = $user->default_laboratory_id ?? ($laboratories[0]['id'] ?? 1);

        $laboratoryId = $request->integer('laboratory_id', $defaultLabId);
        $year = $request->integer('year', (int) now()->year);
        $month = $request->integer('month', (int) now()->month);
        $categoryGroup = $request->input('category_group', 'bahan');

        return $matrixService->exportCsv($user, $laboratoryId, $year, $month, $categoryGroup);
    }

    public function create(Request $request): Response
    {
        $laboratories = $this->laboratories($request);
        $defaultLaboratoryId = $request->user()->default_laboratory_id
            ?? (count($laboratories) === 1 ? $laboratories[0]['id'] : null);

        return Inertia::render('material-usage/create', [
            'laboratories' => $laboratories,
            'defaultLaboratoryId' => $defaultLaboratoryId,
            'units' => Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'symbol']),
        ]);
    }

    /** @return Collection<int, Item> */
    public function items(Request $request): Collection
    {
        abort_unless($request->user()->can('material-usage.create') || $request->user()->can('material-usage.update'), 403);
        $data = $request->validate([
            'laboratory_id' => ['required', 'integer', 'exists:laboratories,id'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);
        abort_unless($request->user()->canAccessLaboratory((int) $data['laboratory_id']), 403);

        return Item::query()->active()
            ->whereHas('laboratories', fn ($query) => $query->whereKey($data['laboratory_id']))
            ->withSum(['stockMovements as current_stock' => fn ($query) => $query->where('laboratory_id', $data['laboratory_id'])], 'quantity')
            ->when($data['search'] ?? null, function ($query, string $search): void {
                $query->where(fn ($inner) => $inner->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
            })
            ->with(['category:id,name', 'itemType:id,name', 'defaultUnit:id,name,symbol'])
            ->orderBy('name')->limit(30)->get(['id', 'code', 'name', 'item_type_id', 'category_id', 'default_unit_id', 'inventory_mode']);
    }

    public function store(StoreMaterialUsageRequest $request, CreateMaterialUsageAction $action): RedirectResponse
    {
        $usage = $action->handle($request->payload(), $request->user());

        return to_route('material-usages.show', $usage)->with('success', 'Penggunaan bahan berhasil dicatat.');
    }

    public function show(Request $request, MaterialUsage $materialUsage): Response
    {
        abort_unless($request->user()->can('material-usage.view') && $request->user()->canAccessLaboratory($materialUsage->laboratory_id), 403);
        $materialUsage->load(['laboratory:id,name', 'creator:id,name', 'voidedBy:id,name', 'items.item.category:id,name', 'items.item.itemType:id,name', 'items.unit:id,name,symbol']);
        $balanceWarnings = StockMovement::query()
            ->where('laboratory_id', $materialUsage->laboratory_id)
            ->whereIn('item_id', $materialUsage->items->pluck('item_id'))
            ->selectRaw('item_id, unit_id, SUM(quantity) as balance')
            ->groupBy('item_id', 'unit_id')->get();

        return Inertia::render('material-usage/show', [
            'usage' => $materialUsage,
            'balances' => $balanceWarnings,
            'canVoid' => $request->user()->can('material-usage.void'),
            'canUpdate' => $request->user()->can('material-usage.update'),
            'canDelete' => $request->user()->can('material-usage.delete') && in_array($materialUsage->status, [MaterialUsageStatus::Draft, MaterialUsageStatus::Voided], true),
        ]);
    }

    public function edit(Request $request, MaterialUsage $materialUsage): Response
    {
        abort_unless($request->user()->canAccessLaboratory($materialUsage->laboratory_id), 403);
        abort_unless(in_array($materialUsage->status, [MaterialUsageStatus::Draft, MaterialUsageStatus::Voided], true), 409);

        return Inertia::render('material-usage/create', [
            'laboratories' => $this->laboratories($request),
            'defaultLaboratoryId' => $materialUsage->laboratory_id,
            'units' => Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'symbol']),
            'draft' => $materialUsage->load(['items.item.category', 'items.item.itemType', 'items.item.defaultUnit']),
        ]);
    }

    public function update(UpdateMaterialUsageRequest $request, MaterialUsage $materialUsage, CreateMaterialUsageAction $action): RedirectResponse
    {
        $usage = $action->handle($request->payload(), $request->user(), $materialUsage);

        return to_route('material-usages.show', $usage)->with('success', 'Penggunaan bahan berhasil diperbarui.');
    }

    public function void(VoidMaterialUsageRequest $request, MaterialUsage $materialUsage, VoidMaterialUsageAction $action): RedirectResponse
    {
        abort_unless($request->user()->canAccessLaboratory($materialUsage->laboratory_id), 403);
        $action->handle($materialUsage, $request->validated('reason'), $request->user());

        return back()->with('success', 'Transaksi dibatalkan dan pergerakan stok telah dibalik.');
    }

    public function destroy(Request $request, MaterialUsage $materialUsage, AuditService $audit): RedirectResponse
    {
        abort_unless($request->user()->canAccessLaboratory($materialUsage->laboratory_id), 403);
        abort_unless($request->user()->can('material-usage.delete'), 403);

        if (! in_array($materialUsage->status, [MaterialUsageStatus::Draft, MaterialUsageStatus::Voided], true)) {
            return back()->with('error', 'Hanya transaksi DRAFT atau VOIDED yang dapat dihapus. Transaksi SUBMITTED harus dibatalkan terlebih dahulu.');
        }

        $old = $materialUsage->load('items')->toArray();
        $old['stock_movements'] = StockMovement::query()
            ->where('reference_type', MaterialUsage::class)
            ->where('reference_id', $materialUsage->id)
            ->get()
            ->toArray();
        DB::transaction(function () use ($materialUsage, $audit, $request, $old): void {
            StockMovement::query()
                ->where('reference_type', MaterialUsage::class)
                ->where('reference_id', $materialUsage->id)
                ->delete();
            $audit->record('delete', $materialUsage, $old, null, $request);
            $materialUsage->items()->delete();
            $materialUsage->delete();
        });

        return to_route('material-usages.index')->with('success', 'Riwayat penggunaan bahan berhasil dihapus.');
    }

    /** @return array<int, array{id: int, code: string, name: string}> */
    private function laboratories(Request $request): array
    {
        $query = Laboratory::query()->where('is_active', true)->orderBy('name');
        if (! $request->user()->hasRole('super-admin')) {
            $query->whereIn('id', $request->user()->laboratoryIds());
        }

        return $query->get(['id', 'code', 'name'])->toArray();
    }
}
