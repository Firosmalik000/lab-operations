<?php

namespace App\Http\Controllers;

use App\Enums\InventoryMode;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\ItemType;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(Request $request): Response
    {
        $editingItem = null;
        if ($request->filled('edit')) {
            abort_unless($request->user()->can('items.update'), 403);
            $editingItem = Item::query()
                ->with(['itemType:id,name', 'category:id,name', 'defaultUnit:id,name,symbol', 'laboratories:id,name'])
                ->findOrFail($request->integer('edit'));
            $this->assertItemScope($request, $editingItem);
        }

        $query = Item::query()->with(['itemType:id,name', 'category:id,name', 'defaultUnit:id,name,symbol', 'laboratories:id,name']);
        if (! $request->user()->hasRole('super-admin')) {
            $query->whereHas('laboratories', fn ($builder) => $builder->whereIn('laboratories.id', $request->user()->laboratoryIds()));
        }
        $query->when($request->filled('search'), function ($query) use ($request): void {
            $search = '%'.$request->string('search')->value().'%';
            $query->where(fn ($inner) => $inner->where('name', 'like', $search)->orWhere('code', 'like', $search));
        });
        foreach (['item_type_id', 'category_id'] as $filter) {
            $query->when($request->filled($filter), fn ($q) => $q->where($filter, $request->integer($filter)));
        }
        $query->when($request->filled('inventory_mode'), fn ($q) => $q->where('inventory_mode', $request->string('inventory_mode')->value()));
        $query->when($request->input('active') !== null && $request->input('active') !== '', fn ($q) => $q->where('is_active', $request->boolean('active')));
        $sort = in_array($request->input('sort'), ['code', 'name', 'inventory_mode', 'is_active'], true) ? $request->input('sort') : 'name';
        $direction = $request->input('direction') === 'desc' ? 'desc' : 'asc';

        return Inertia::render('master/items', [
            'items' => $query->orderBy($sort, $direction)->paginate(15)->withQueryString(),
            'filters' => $request->only(['search', 'item_type_id', 'category_id', 'inventory_mode', 'active', 'sort', 'direction']),
            'editingItem' => $editingItem,
            'returnTo' => $request->query('return_to') === 'stock' ? 'stock' : null,
            ...$this->options($request),
            'can' => [
                'create' => $request->user()->can('items.create'),
                'update' => $request->user()->can('items.update'),
                'delete' => $request->user()->can('items.delete'),
            ],
        ]);
    }

    public function store(Request $request, AuditService $audit): RedirectResponse
    {
        abort_unless($request->user()->can('items.create'), 403);
        $data = $this->validateItem($request);
        $laboratoryIds = $data['laboratory_ids'];
        unset($data['laboratory_ids']);
        $this->assertLaboratoryScope($request, $laboratoryIds);
        DB::transaction(function () use ($data, $laboratoryIds, $audit, $request): void {
            $item = Item::create($data + ['created_by' => $request->user()->id, 'updated_by' => $request->user()->id]);
            $item->laboratories()->sync($laboratoryIds);
            $audit->record('create', $item, null, $item->fresh()->toArray(), $request);
        });

        return back()->with('success', 'Item berhasil dibuat.');
    }

    public function update(Request $request, Item $item, AuditService $audit): RedirectResponse
    {
        abort_unless($request->user()->can('items.update'), 403);
        $old = $item->toArray();
        $data = $this->validateItem($request, $item);
        $laboratoryIds = $data['laboratory_ids'];
        unset($data['laboratory_ids']);
        $this->assertLaboratoryScope($request, $laboratoryIds);
        $this->assertItemScope($request, $item);
        DB::transaction(function () use ($item, $data, $laboratoryIds, $audit, $request, $old): void {
            $item->update($data + ['updated_by' => $request->user()->id]);
            $item->laboratories()->sync($laboratoryIds);
            $audit->record('update', $item, $old, $item->fresh()->toArray(), $request);
        });

        if ($request->query('return_to') === 'stock') {
            return to_route('inventory.stock')->with('success', 'Item berhasil diperbarui.');
        }

        return back()->with('success', 'Item berhasil diperbarui.');
    }

    public function destroy(Request $request, Item $item, AuditService $audit): RedirectResponse
    {
        abort_unless($request->user()->can('items.delete'), 403);
        $this->assertItemScope($request, $item);

        if ($item->stockMovements()->exists() || $item->materialUsageItems()->exists()) {
            return back()->with('error', 'Item tidak dapat dihapus karena sudah memiliki riwayat mutasi stok atau penggunaan. Anda dapat menonaktifkannya.');
        }

        $old = $item->toArray();
        DB::transaction(function () use ($item, $audit, $request, $old): void {
            $item->laboratories()->detach();
            $audit->record('delete', $item, $old, null, $request);
            $item->delete();
        });

        return back()->with('success', 'Item berhasil dihapus.');
    }

    /** @return array<string, mixed> */
    private function validateItem(Request $request, ?Item $item = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('items')->ignore($item)],
            'name' => ['required', 'string', 'max:255'],
            'item_type_id' => ['required', 'exists:item_types,id'],
            'category_id' => ['nullable', Rule::exists('item_categories', 'id')->where('item_type_id', $request->integer('item_type_id'))],
            'default_unit_id' => [Rule::requiredIf($request->input('inventory_mode') === 'STOCK'), 'nullable', 'exists:units,id'],
            'inventory_mode' => ['required', Rule::enum(InventoryMode::class)],
            'minimum_stock' => ['nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'is_active' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'laboratory_ids' => ['required', 'array', 'min:1'],
            'laboratory_ids.*' => ['integer', 'distinct', 'exists:laboratories,id'],
        ]);
    }

    /** @return array<string, mixed> */
    private function options(Request $request): array
    {
        return [
            'itemTypes' => ItemType::orderBy('name')->get(['id', 'name']),
            'categories' => ItemCategory::with('itemType:id,name')->orderBy('name')->get(['id', 'name', 'item_type_id']),
            'units' => Unit::orderBy('name')->get(['id', 'name', 'symbol']),
            'laboratories' => Laboratory::when(! $request->user()->hasRole('super-admin'), fn ($query) => $query->whereIn('id', $request->user()->laboratoryIds()))->orderBy('name')->get(['id', 'name']),
            'inventoryModes' => collect(InventoryMode::cases())->map(fn ($case) => ['value' => $case->value, 'label' => $case->value]),
        ];
    }

    /** @param array<int, int|string> $laboratoryIds */
    private function assertLaboratoryScope(Request $request, array $laboratoryIds): void
    {
        if (! $request->user()->hasRole('super-admin') && array_diff(array_map('intval', $laboratoryIds), $request->user()->laboratoryIds()) !== []) {
            abort(403);
        }
    }

    private function assertItemScope(Request $request, Item $item): void
    {
        if (! $request->user()->hasRole('super-admin') && ! $item->laboratories()->whereIn('laboratories.id', $request->user()->laboratoryIds())->exists()) {
            abort(403);
        }
    }
}
