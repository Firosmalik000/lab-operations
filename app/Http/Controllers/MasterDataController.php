<?php

namespace App\Http\Controllers;

use App\Enums\InventoryMode;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\ItemType;
use App\Models\Laboratory;
use App\Models\MaterialUsage;
use App\Models\MaterialUsageItem;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use App\Models\Unit;
use App\Services\AuditService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MasterDataController extends Controller
{
    /** @var array<string, array{model: class-string<Model>, permission: string, label: string}> */
    private array $resources = [
        'laboratories' => ['model' => Laboratory::class, 'permission' => 'laboratories.manage', 'label' => 'Laboratorium'],
        'item-types' => ['model' => ItemType::class, 'permission' => 'item-types.manage', 'label' => 'Jenis Item'],
        'categories' => ['model' => ItemCategory::class, 'permission' => 'categories.manage', 'label' => 'Kategori'],
        'units' => ['model' => Unit::class, 'permission' => 'units.manage', 'label' => 'Satuan'],
        'storage-locations' => ['model' => StorageLocation::class, 'permission' => 'storage-locations.manage', 'label' => 'Lokasi Penyimpanan'],
    ];

    public function index(Request $request, string $resource): Response
    {
        $config = $this->resource($request, $resource);
        $model = $config['model'];
        $query = $model::query();
        if (! $request->user()->hasRole('super-admin') && $resource === 'laboratories') {
            $query->whereIn('id', $request->user()->laboratoryIds());
        }
        if (! $request->user()->hasRole('super-admin') && $resource === 'storage-locations') {
            $query->where(fn ($builder) => $builder->whereNull('laboratory_id')->orWhereIn('laboratory_id', $request->user()->laboratoryIds()));
        }
        if ($resource === 'categories') {
            $query->with('itemType:id,name');
        } elseif ($resource === 'storage-locations') {
            $query->with('laboratory:id,name');
        }
        $query->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search')->value().'%'));

        return Inertia::render('master/reference', [
            'resource' => $resource,
            'label' => $config['label'],
            'records' => $query->orderBy('name')->paginate(20)->withQueryString(),
            'filters' => $request->only('search'),
            'itemTypes' => $resource === 'categories' ? ItemType::orderBy('name')->get(['id', 'name']) : [],
            'laboratories' => $resource === 'storage-locations' ? Laboratory::when(! $request->user()->hasRole('super-admin'), fn ($builder) => $builder->whereIn('id', $request->user()->laboratoryIds()))->orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function store(Request $request, string $resource, AuditService $audit): RedirectResponse
    {
        $config = $this->resource($request, $resource);
        if ($resource === 'laboratories' && ! $request->user()->hasRole('super-admin')) {
            abort(403);
        }
        $model = $config['model'];
        $record = $model::create($this->validateResource($request, $resource));
        $audit->record('create', $record, null, $record->toArray(), $request);

        return back()->with('success', "{$config['label']} berhasil dibuat.");
    }

    public function update(Request $request, string $resource, int $id, AuditService $audit): RedirectResponse
    {
        $config = $this->resource($request, $resource);
        $model = $config['model'];
        $record = $model::findOrFail($id);
        if (! $request->user()->hasRole('super-admin') && $resource === 'laboratories' && ! in_array($record->getKey(), $request->user()->laboratoryIds(), true)) {
            abort(403);
        }
        $laboratoryId = $record->getAttribute('laboratory_id');
        if (! $request->user()->hasRole('super-admin') && $resource === 'storage-locations' && $laboratoryId !== null && ! in_array((int) $laboratoryId, $request->user()->laboratoryIds(), true)) {
            abort(403);
        }
        $old = $record->toArray();
        $record->update($this->validateResource($request, $resource, $record));
        $audit->record('update', $record, $old, $record->fresh()->toArray(), $request);

        return back()->with('success', "{$config['label']} berhasil diperbarui.");
    }

    public function destroy(Request $request, string $resource, int $id, AuditService $audit): RedirectResponse
    {
        $config = $this->resource($request, $resource);
        if ($resource === 'laboratories' && ! $request->user()->hasRole('super-admin')) {
            abort(403);
        }
        $model = $config['model'];
        $record = $model::findOrFail($id);

        if (! $request->user()->hasRole('super-admin') && $resource === 'storage-locations') {
            $laboratoryId = $record->getAttribute('laboratory_id');
            if ($laboratoryId !== null && ! in_array((int) $laboratoryId, $request->user()->laboratoryIds(), true)) {
                abort(403);
            }
        }

        if ($resource === 'laboratories') {
            $laboratory = Laboratory::findOrFail($id);
            if ($laboratory->users()->exists() || $laboratory->items()->exists() || StockMovement::where('laboratory_id', $id)->exists() || MaterialUsage::where('laboratory_id', $id)->exists()) {
                return back()->with('error', "{$config['label']} tidak dapat dihapus karena masih digunakan oleh user, item, atau transaksi.");
            }
        } elseif ($resource === 'item-types') {
            if (ItemCategory::where('item_type_id', $id)->exists() || Item::where('item_type_id', $id)->exists()) {
                return back()->with('error', "{$config['label']} tidak dapat dihapus karena masih digunakan oleh kategori atau item.");
            }
        } elseif ($resource === 'categories') {
            if (Item::where('category_id', $id)->exists()) {
                return back()->with('error', "{$config['label']} tidak dapat dihapus karena masih digunakan oleh item.");
            }
        } elseif ($resource === 'units') {
            if (StockMovement::where('unit_id', $id)->exists() || MaterialUsageItem::where('unit_id', $id)->exists()) {
                return back()->with('error', "{$config['label']} tidak dapat dihapus karena masih digunakan dalam riwayat mutasi stok atau penggunaan.");
            }

            $stockItems = Item::where('default_unit_id', $id)
                ->where('inventory_mode', InventoryMode::Stock)
                ->pluck('name');

            if ($stockItems->isNotEmpty()) {
                $sampleNames = $stockItems->take(3)->implode(', ');
                return back()->with('error', "{$config['label']} tidak dapat dihapus karena masih digunakan sebagai satuan default oleh item mode STOCK ({$sampleNames}). Ubah satuan default item tersebut terlebih dahulu.");
            }
        } elseif ($resource === 'storage-locations') {
            if (StockMovement::where('storage_location_id', $id)->exists()) {
                return back()->with('error', "{$config['label']} tidak dapat dihapus karena masih digunakan dalam riwayat mutasi stok.");
            }
        }

        $old = $record->toArray();
        DB::transaction(function () use ($record, $audit, $request, $old, $resource, $id): void {
            if ($resource === 'units') {
                Item::where('default_unit_id', $id)->update(['default_unit_id' => null]);
            }
            $audit->record('delete', $record, $old, null, $request);
            $record->delete();
        });

        return back()->with('success', "{$config['label']} berhasil dihapus.");
    }

    /** @return array{model: class-string<Model>, permission: string, label: string} */
    private function resource(Request $request, string $resource): array
    {
        abort_unless(isset($this->resources[$resource]), 404);
        $config = $this->resources[$resource];
        abort_unless($request->user()->can($config['permission']), 403);

        return $config;
    }

    /** @return array<string, mixed> */
    private function validateResource(Request $request, string $resource, ?Model $record = null): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ];
        if ($resource === 'laboratories') {
            $rules['code'] = ['required', 'string', 'max:30', Rule::unique('laboratories')->ignore($record)];
        } elseif ($resource === 'item-types') {
            $rules['name'][] = Rule::unique('item_types')->ignore($record);
        } elseif ($resource === 'categories') {
            $rules['item_type_id'] = ['required', 'exists:item_types,id'];
            $rules['parent_id'] = ['nullable', Rule::exists('item_categories', 'id')->where('item_type_id', $request->integer('item_type_id')), Rule::notIn($record ? [$record->getKey()] : [])];
        } elseif ($resource === 'units') {
            $rules['symbol'] = ['required', 'string', 'max:20', Rule::unique('units')->ignore($record)];
        } elseif ($resource === 'storage-locations') {
            $rules['laboratory_id'] = ['nullable', 'exists:laboratories,id'];
            $rules['code'] = ['nullable', 'string', 'max:30'];
        }

        $data = $request->validate($rules);
        if (! $request->user()->hasRole('super-admin') && $resource === 'storage-locations') {
            if (empty($data['laboratory_id']) || ! in_array((int) $data['laboratory_id'], $request->user()->laboratoryIds(), true)) {
                abort(403);
            }
        }

        return $data;
    }
}
