<?php

namespace Tests\Feature;

use App\Enums\InventoryMode;
use App\Enums\MaterialUsageStatus;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\ItemType;
use App\Models\Laboratory;
use App\Models\MaterialUsage;
use App\Models\Permission;
use App\Models\Role;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LaboratoryOperationsTest extends TestCase
{
    use RefreshDatabase;

    private Laboratory $laboratory;

    private Laboratory $otherLaboratory;

    private Unit $unit;

    private ItemType $type;

    private ItemCategory $category;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(AuthorizationSeeder::class);
        $this->laboratory = Laboratory::create(['code' => 'MIKRO', 'name' => 'Mikrobiologi', 'is_active' => true]);
        $this->otherLaboratory = Laboratory::create(['code' => 'KIMIA', 'name' => 'Kimia', 'is_active' => true]);
        $this->unit = Unit::create(['name' => 'Gram', 'symbol' => 'g', 'is_active' => true]);
        $this->type = ItemType::create(['name' => 'Media', 'is_active' => true]);
        $this->category = ItemCategory::create(['item_type_id' => $this->type->id, 'name' => 'Media Agar', 'is_active' => true]);
        $this->staff = User::factory()->create(['default_laboratory_id' => $this->laboratory->id]);
        $this->staff->roles()->attach(Role::where('name', 'staff')->firstOrFail());
        $this->staff->laboratories()->attach($this->laboratory);
    }

    public function test_guest_cannot_access_authenticated_application(): void
    {
        $this->get('/material-usages')->assertRedirect('/login');
    }

    public function test_staff_without_permission_cannot_access_administration(): void
    {
        $this->actingAs($this->staff)->get('/administration/users')->assertForbidden();
        $this->actingAs($this->staff)->get('/administration/roles')->assertForbidden();
    }

    public function test_staff_only_sees_permitted_laboratory_data(): void
    {
        $visible = $this->usage($this->laboratory, 'USE-20260929-0001');
        $hidden = $this->usage($this->otherLaboratory, 'USE-20260929-0002');

        $this->actingAs($this->staff)->get('/material-usages')
            ->assertOk()
            ->assertSee($visible->number)
            ->assertDontSee($hidden->number);
        $this->actingAs($this->staff)->get("/material-usages/{$hidden->id}")->assertForbidden();
    }

    public function test_none_item_usage_succeeds_without_stock_movement_and_supports_multiple_items(): void
    {
        $first = $this->item('NONE-1', InventoryMode::None);
        $second = $this->item('NONE-2', InventoryMode::None);

        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$first, $second]))
            ->assertRedirect();

        $usage = MaterialUsage::firstOrFail();
        $this->assertCount(2, $usage->items);
        $this->assertDatabaseCount('stock_movements', 0);
        $this->assertSame($this->staff->id, $usage->created_by);
    }

    public function test_stock_item_usage_creates_negative_movement_and_void_creates_reversal(): void
    {
        $item = $this->item('STOCK-1', InventoryMode::Stock);

        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$item], '5'))->assertRedirect();
        $usage = MaterialUsage::firstOrFail();
        $this->assertDatabaseHas('stock_movements', ['item_id' => $item->id, 'type' => 'USAGE', 'quantity' => -5]);
        $item->update(['inventory_mode' => InventoryMode::None]);

        $supervisor = User::factory()->create();
        $supervisor->roles()->attach(Role::where('name', 'supervisor')->firstOrFail());
        $supervisor->laboratories()->attach($this->laboratory);
        $this->actingAs($supervisor)->post("/material-usages/{$usage->id}/void", ['reason' => 'Salah pencatatan jumlah'])->assertRedirect();

        $this->assertDatabaseHas('material_usages', ['id' => $usage->id, 'status' => 'VOIDED']);
        $this->assertDatabaseHas('stock_movements', ['item_id' => $item->id, 'type' => 'REVERSAL', 'quantity' => 5]);
        $this->assertDatabaseCount('material_usages', 1);
    }

    public function test_inactive_or_unmapped_item_and_invalid_values_are_rejected(): void
    {
        $inactive = $this->item('INACTIVE', InventoryMode::None, false);
        $unmapped = $this->item('UNMAPPED', InventoryMode::None, true, false);

        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$inactive]))->assertSessionHasErrors('items.0.item_id');
        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$unmapped]))->assertSessionHasErrors('items.0.item_id');
        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$this->item('VALID', InventoryMode::None)], '0'))->assertSessionHasErrors('items.0.quantity');
        $this->assertDatabaseCount('material_usages', 0);
    }

    public function test_inventory_opening_receiving_and_adjustment_rules(): void
    {
        $item = $this->item('STOCK-2', InventoryMode::Stock);
        $inventoryAdmin = User::factory()->create();
        $inventoryAdmin->roles()->attach(Role::where('name', 'inventory-admin')->firstOrFail());
        $inventoryAdmin->laboratories()->attach($this->laboratory);
        $base = ['item_id' => $item->id, 'laboratory_id' => $this->laboratory->id, 'unit_id' => $this->unit->id, 'quantity' => 10];

        $this->actingAs($inventoryAdmin)->post('/inventory/movements', $base + ['type' => 'OPENING'])->assertRedirect();
        $this->actingAs($inventoryAdmin)->post('/inventory/movements', $base + ['type' => 'RECEIVING'])->assertRedirect();
        $this->actingAs($inventoryAdmin)->post('/inventory/movements', $base + ['type' => 'ADJUSTMENT_OUT'])->assertSessionHasErrors('notes');
        $this->actingAs($inventoryAdmin)->post('/inventory/movements', $base + ['type' => 'ADJUSTMENT_OUT', 'notes' => 'Koreksi hasil stock opname'])->assertRedirect();

        $this->assertSame(10.0, (float) StockMovement::sum('quantity'));
    }

    public function test_inventory_admin_can_edit_and_delete_manual_stock_movements(): void
    {
        $item = $this->item('MOVEMENT-CRUD', InventoryMode::Stock);
        $inventoryAdmin = User::factory()->create();
        $inventoryAdmin->roles()->attach(Role::where('name', 'inventory-admin')->firstOrFail());
        $inventoryAdmin->laboratories()->attach($this->laboratory);
        $payload = [
            'type' => 'RECEIVING',
            'item_id' => $item->id,
            'laboratory_id' => $this->laboratory->id,
            'unit_id' => $this->unit->id,
            'quantity' => 10,
            'notes' => 'Penerimaan awal',
        ];

        $this->actingAs($inventoryAdmin)->post('/inventory/movements', $payload)->assertRedirect();
        $movement = StockMovement::firstOrFail();

        $this->get('/inventory/movements')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('can.create', true)
                ->where('can.update', true)
                ->where('can.delete', true));
        $this->get("/inventory/movements/{$movement->id}/edit")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory/create')
                ->where('movement.id', $movement->id));

        $this->put("/inventory/movements/{$movement->id}", [...$payload, 'quantity' => 6, 'notes' => 'Jumlah dikoreksi'])
            ->assertRedirect('/inventory/movements');
        $this->assertDatabaseHas('stock_movements', ['id' => $movement->id, 'quantity' => 6, 'notes' => 'Jumlah dikoreksi']);
        $this->assertDatabaseHas('audit_logs', ['entity_type' => 'StockMovement', 'entity_id' => (string) $movement->id, 'action' => 'update']);

        $this->delete("/inventory/movements/{$movement->id}")->assertSessionHas('success');
        $this->assertDatabaseMissing('stock_movements', ['id' => $movement->id]);
        $this->assertDatabaseHas('audit_logs', ['entity_type' => 'StockMovement', 'entity_id' => (string) $movement->id, 'action' => 'delete']);
    }

    public function test_current_stock_exposes_item_actions_and_edit_link(): void
    {
        $item = $this->item('STOCK-ACTIONS', InventoryMode::Stock);
        $inventoryAdmin = User::factory()->create();
        $inventoryAdmin->roles()->attach(Role::where('name', 'inventory-admin')->firstOrFail());
        $inventoryAdmin->laboratories()->attach($this->laboratory);

        $this->actingAs($inventoryAdmin)->get('/inventory/stock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('can.update', true)
                ->where('can.delete', true)
                ->where('stocks.data.0.item_id', $item->id));

        $this->get("/master/items?edit={$item->id}&return_to=stock")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('editingItem.id', $item->id)
                ->where('returnTo', 'stock'));

        $payload = [
            'code' => $item->code,
            'name' => 'Item stok diperbarui',
            'item_type_id' => $this->type->id,
            'category_id' => $this->category->id,
            'default_unit_id' => $this->unit->id,
            'inventory_mode' => InventoryMode::Stock->value,
            'minimum_stock' => 2,
            'is_active' => true,
            'laboratory_ids' => [$this->laboratory->id],
        ];
        $this->put("/master/items/{$item->id}?return_to=stock", $payload)
            ->assertRedirect('/inventory/stock');
        $this->assertDatabaseHas('items', ['id' => $item->id, 'name' => 'Item stok diperbarui']);
    }

    public function test_automatic_stock_movements_cannot_be_edited_or_deleted_from_inventory(): void
    {
        $item = $this->item('MOVEMENT-AUTO', InventoryMode::Stock);
        $inventoryAdmin = User::factory()->create();
        $inventoryAdmin->roles()->attach(Role::where('name', 'inventory-admin')->firstOrFail());
        $inventoryAdmin->laboratories()->attach($this->laboratory);

        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$item], '4'))->assertRedirect();
        $movement = StockMovement::where('type', 'USAGE')->firstOrFail();

        $this->actingAs($inventoryAdmin)->get("/inventory/movements/{$movement->id}/edit")->assertStatus(409);
        $this->delete("/inventory/movements/{$movement->id}")->assertStatus(409);
        $this->assertDatabaseHas('stock_movements', ['id' => $movement->id]);
    }

    public function test_inventory_view_permission_does_not_allow_movement_changes(): void
    {
        $viewer = User::factory()->create();
        $viewer->roles()->attach(Role::where('name', 'qa-qc')->firstOrFail());
        $viewer->laboratories()->attach($this->laboratory);
        $movement = StockMovement::create([
            'item_id' => $this->item('MOVEMENT-VIEW-ONLY', InventoryMode::Stock)->id,
            'laboratory_id' => $this->laboratory->id,
            'type' => 'RECEIVING',
            'quantity' => 2,
            'unit_id' => $this->unit->id,
            'created_by' => $this->staff->id,
        ]);

        $this->actingAs($viewer)->get('/inventory/movements')->assertOk();
        $this->get("/inventory/movements/{$movement->id}/edit")->assertForbidden();
        $this->delete("/inventory/movements/{$movement->id}")->assertForbidden();
        $this->assertDatabaseHas('stock_movements', ['id' => $movement->id]);
    }

    public function test_inventory_management_permission_migration_backfills_existing_roles(): void
    {
        $permissionIds = Permission::whereIn('name', ['inventory.update', 'inventory.delete'])->pluck('id');
        Role::whereIn('name', ['super-admin', 'lab-admin', 'inventory-admin', 'supervisor'])
            ->get()
            ->each(fn (Role $role) => $role->permissions()->detach($permissionIds));

        $migration = require database_path('migrations/2026_10_01_000001_add_inventory_movement_management_permissions.php');
        $migration->up();

        foreach (['super-admin', 'lab-admin', 'inventory-admin'] as $roleName) {
            $this->assertSame(
                ['inventory.delete', 'inventory.update'],
                Role::where('name', $roleName)->firstOrFail()->permissions()
                    ->whereIn('name', ['inventory.update', 'inventory.delete'])
                    ->orderBy('name')
                    ->pluck('name')
                    ->all(),
            );
        }
        $this->assertFalse(
            Role::where('name', 'supervisor')->firstOrFail()->permissions()
                ->whereIn('name', ['inventory.update', 'inventory.delete'])
                ->exists(),
        );
    }

    public function test_stock_movements_reject_a_non_default_unit(): void
    {
        $item = $this->item('STOCK-UNIT', InventoryMode::Stock);
        $otherUnit = Unit::create(['name' => 'Liter', 'symbol' => 'L', 'is_active' => true]);
        $payload = $this->payload([$item]);
        $payload['items'][0]['unit_id'] = $otherUnit->id;

        $this->actingAs($this->staff)->post('/material-usages', $payload)->assertSessionHasErrors('items.0.unit_id');

        $inventoryAdmin = User::factory()->create();
        $inventoryAdmin->roles()->attach(Role::where('name', 'inventory-admin')->firstOrFail());
        $inventoryAdmin->laboratories()->attach($this->laboratory);
        $this->actingAs($inventoryAdmin)->post('/inventory/movements', [
            'type' => 'RECEIVING', 'item_id' => $item->id, 'laboratory_id' => $this->laboratory->id,
            'quantity' => 1, 'unit_id' => $otherUnit->id,
        ])->assertSessionHasErrors('unit_id');
        $this->assertDatabaseCount('stock_movements', 0);
    }

    public function test_transaction_numbers_are_unique(): void
    {
        $item = $this->item('NUMBERED', InventoryMode::None);
        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$item]))->assertRedirect();
        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$item]))->assertRedirect();
        $numbers = MaterialUsage::pluck('number');

        $this->assertCount(2, $numbers);
        $this->assertCount(2, $numbers->unique());
    }

    public function test_draft_can_be_edited_and_submitted_only_once(): void
    {
        $item = $this->item('DRAFT-1', InventoryMode::Stock);
        $payload = $this->payload([$item]);
        $payload['status'] = 'DRAFT';
        $this->actingAs($this->staff)->post('/material-usages', $payload)->assertRedirect();
        $usage = MaterialUsage::firstOrFail();
        $number = $usage->number;
        $this->assertDatabaseCount('stock_movements', 0);
        $this->put("/material-usages/{$usage->id}", $payload)->assertForbidden();

        $supervisor = User::factory()->create();
        $supervisor->roles()->attach(Role::where('name', 'supervisor')->firstOrFail());
        $supervisor->laboratories()->attach($this->laboratory);
        $payload['items'][0]['quantity'] = '7';
        $this->actingAs($supervisor)->put("/material-usages/{$usage->id}", $payload)->assertRedirect();
        $this->assertDatabaseCount('stock_movements', 0);
        $this->assertSame($number, $usage->fresh()->number);
        $this->assertDatabaseCount('material_usage_items', 1);

        $payload['status'] = 'SUBMITTED';
        $this->put("/material-usages/{$usage->id}", $payload)->assertRedirect();
        $this->assertDatabaseHas('stock_movements', ['item_id' => $item->id, 'quantity' => -7]);
        $this->put("/material-usages/{$usage->id}", $payload)->assertSessionHasErrors('status');
        $this->assertDatabaseCount('stock_movements', 1);
    }

    public function test_draft_in_another_laboratory_cannot_be_changed(): void
    {
        $item = $this->item('DRAFT-SCOPE', InventoryMode::None);
        $usage = $this->usage($this->otherLaboratory, 'USE-20260929-0008');
        $usage->update(['status' => 'DRAFT']);
        $this->staff->roles()->sync(Role::where('name', 'supervisor')->pluck('id'));
        $this->actingAs($this->staff)->put("/material-usages/{$usage->id}", $this->payload([$item]))->assertForbidden();
        $this->assertSame('DRAFT', $usage->fresh()->status->value);
    }

    public function test_all_report_types_render_and_remain_laboratory_scoped(): void
    {
        $item = $this->item('REPORT-1', InventoryMode::Stock);
        $supervisor = User::factory()->create();
        $supervisor->roles()->attach(Role::where('name', 'supervisor')->firstOrFail());
        $supervisor->laboratories()->attach($this->laboratory);
        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$item], '3'))->assertRedirect();
        StockMovement::create([
            'item_id' => $item->id, 'laboratory_id' => $this->laboratory->id, 'type' => 'OPENING',
            'quantity' => 10, 'unit_id' => $this->unit->id, 'created_by' => $supervisor->id,
        ]);

        foreach (['usage', 'usage-item', 'usage-user', 'usage-laboratory', 'inventory-movements', 'current-stock', 'low-stock'] as $type) {
            $this->actingAs($supervisor)->get('/reports?type='.$type)->assertOk();
            $this->get('/reports/export?type='.$type)->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        }
        $this->get('/reports?type=usage&laboratory_id='.$this->otherLaboratory->id)
            ->assertOk()->assertInertia(fn (Assert $page) => $page->has('rows.data', 0));
    }

    public function test_last_active_super_admin_cannot_be_disabled(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());
        $admin->laboratories()->attach($this->laboratory);
        $payload = [
            'role_ids' => [Role::where('name', 'staff')->value('id')],
            'laboratory_ids' => [$this->laboratory->id], 'default_laboratory_id' => $this->laboratory->id, 'is_active' => false,
        ];

        $this->actingAs($admin)->put("/administration/users/{$admin->id}", $payload)->assertSessionHasErrors('role_ids');
        $this->assertTrue($admin->fresh()->is_active);
        $this->assertTrue($admin->fresh()->hasRole('super-admin'));
    }

    public function test_inactive_user_cannot_log_in(): void
    {
        $user = User::factory()->create(['email' => 'inactive@example.test', 'password' => 'password', 'is_active' => false]);

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_staff_without_permission_cannot_delete_item(): void
    {
        $item = $this->item('DEL-1', InventoryMode::Stock);

        $this->actingAs($this->staff)->delete("/master/items/{$item->id}")->assertForbidden();
    }

    public function test_super_admin_can_delete_clean_item(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());
        $item = $this->item('DEL-2', InventoryMode::Stock);

        $this->actingAs($admin)->delete("/master/items/{$item->id}")->assertSessionHas('success');
        $this->assertDatabaseMissing('items', ['id' => $item->id]);
    }

    public function test_item_with_stock_movement_cannot_be_deleted(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());
        $item = $this->item('DEL-3', InventoryMode::Stock);

        StockMovement::create([
            'item_id' => $item->id,
            'laboratory_id' => $this->laboratory->id,
            'type' => 'RECEIVING',
            'quantity' => 10,
            'unit_id' => $this->unit->id,
            'created_by' => $admin->id,
        ]);

        $this->actingAs($admin)->delete("/master/items/{$item->id}")->assertSessionHas('error');
        $this->assertDatabaseHas('items', ['id' => $item->id]);
    }

    public function test_user_cannot_delete_self_or_last_super_admin(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());

        // Self-delete attempt
        $this->actingAs($admin)->delete("/administration/users/{$admin->id}")->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_can_delete_draft_material_usage_but_not_submitted(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());

        $draft = MaterialUsage::create([
            'number' => 'DRAFT-001',
            'usage_date' => '2026-09-29',
            'laboratory_id' => $this->laboratory->id,
            'status' => 'DRAFT',
            'created_by' => $admin->id,
        ]);

        $this->actingAs($admin)->delete("/material-usages/{$draft->id}")->assertSessionHas('success');
        $this->assertDatabaseMissing('material_usages', ['id' => $draft->id]);

        $submitted = $this->usage($this->laboratory, 'SUB-001');
        $this->actingAs($admin)->delete("/material-usages/{$submitted->id}")->assertSessionHas('error');
        $this->assertDatabaseHas('material_usages', ['id' => $submitted->id]);
    }

    public function test_material_usage_update_and_delete_permissions_are_independent(): void
    {
        $draft = $this->usage($this->laboratory, 'DRAFT-PERMISSION-001');
        $draft->update(['status' => 'DRAFT']);

        $updateRole = Role::create(['name' => 'usage-editor', 'label' => 'Usage Editor']);
        $updateRole->permissions()->attach(Permission::where('name', 'material-usage.update')->firstOrFail());
        $editor = User::factory()->create();
        $editor->roles()->attach($updateRole);
        $editor->laboratories()->attach($this->laboratory);

        $this->actingAs($editor)->get("/material-usages/{$draft->id}/edit")->assertOk();
        $this->delete("/material-usages/{$draft->id}")->assertForbidden();
        $this->assertDatabaseHas('material_usages', ['id' => $draft->id]);

        $deleteRole = Role::create(['name' => 'usage-deleter', 'label' => 'Usage Deleter']);
        $deleteRole->permissions()->attach(Permission::where('name', 'material-usage.delete')->firstOrFail());
        $deleter = User::factory()->create();
        $deleter->roles()->attach($deleteRole);
        $deleter->laboratories()->attach($this->laboratory);

        $this->actingAs($deleter)->get("/material-usages/{$draft->id}/edit")->assertForbidden();
        $this->delete("/material-usages/{$draft->id}")->assertSessionHas('success');
        $this->assertDatabaseMissing('material_usages', ['id' => $draft->id]);
    }

    public function test_voided_usage_can_be_edited_and_resubmitted_without_duplicating_stock(): void
    {
        $item = $this->item('RESUBMIT-VOIDED', InventoryMode::Stock);
        $supervisor = User::factory()->create();
        $supervisor->roles()->attach(Role::where('name', 'supervisor')->firstOrFail());
        $supervisor->laboratories()->attach($this->laboratory);

        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$item], '5'))->assertRedirect();
        $usage = MaterialUsage::firstOrFail();
        $this->actingAs($supervisor)->post("/material-usages/{$usage->id}/void", ['reason' => 'Jumlah perlu diperbaiki'])->assertRedirect();

        $payload = $this->payload([$item], '7');
        $payload['status'] = 'SUBMITTED';
        $this->put("/material-usages/{$usage->id}", $payload)->assertRedirect();

        $this->assertSame(MaterialUsageStatus::Submitted, $usage->fresh()->status);
        $this->assertNull($usage->fresh()->void_reason);
        $this->assertDatabaseCount('stock_movements', 1);
        $this->assertSame(-7.0, (float) StockMovement::sum('quantity'));

        $this->post("/material-usages/{$usage->id}/void", ['reason' => 'Dibatalkan kembali'])->assertRedirect();
        $this->assertDatabaseCount('stock_movements', 2);
        $this->assertSame(0.0, (float) StockMovement::sum('quantity'));
    }

    public function test_voided_usage_can_be_deleted_with_its_stock_movements(): void
    {
        $item = $this->item('DELETE-VOIDED', InventoryMode::Stock);
        $supervisor = User::factory()->create();
        $supervisor->roles()->attach(Role::where('name', 'supervisor')->firstOrFail());
        $supervisor->laboratories()->attach($this->laboratory);

        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$item], '3'))->assertRedirect();
        $usage = MaterialUsage::firstOrFail();
        $this->actingAs($supervisor)->post("/material-usages/{$usage->id}/void", ['reason' => 'Transaksi salah input'])->assertRedirect();
        $this->assertDatabaseCount('stock_movements', 2);

        $this->delete("/material-usages/{$usage->id}")->assertSessionHas('success');

        $this->assertDatabaseMissing('material_usages', ['id' => $usage->id]);
        $this->assertDatabaseMissing('material_usage_items', ['material_usage_id' => $usage->id]);
        $this->assertDatabaseMissing('stock_movements', [
            'reference_type' => MaterialUsage::class,
            'reference_id' => $usage->id,
        ]);
    }

    public function test_super_admin_receives_material_usage_history_actions(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());

        $this->actingAs($superAdmin)->get('/material-usages')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('can.create', true)
                ->where('can.update', true)
                ->where('can.delete', true));

        $draft = $this->usage($this->otherLaboratory, 'DRAFT-SUPER-ADMIN-001');
        $draft->update(['status' => 'DRAFT']);

        $this->get("/material-usages/{$draft->id}/edit")->assertOk();
        $this->delete("/material-usages/{$draft->id}")->assertSessionHas('success');
        $this->assertDatabaseMissing('material_usages', ['id' => $draft->id]);
    }

    public function test_decimal_inputs_are_limited_to_maximum_two_decimal_places(): void
    {
        $admin = User::factory()->create(['default_laboratory_id' => $this->laboratory->id]);
        $admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());
        $admin->laboratories()->attach($this->laboratory);

        $item = $this->item('DEC01', InventoryMode::Stock);

        // Usage quantity with 2 decimals passes
        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$item], '10.25'))
            ->assertRedirect();

        // Usage quantity with > 2 decimals fails validation
        $this->actingAs($this->staff)->post('/material-usages', $this->payload([$item], '10.255'))
            ->assertSessionHasErrors('items.0.quantity');

        // Inventory movement quantity with 2 decimals passes
        $this->actingAs($admin)->post('/inventory/movements', [
            'type' => 'RECEIVING',
            'item_id' => $item->id,
            'laboratory_id' => $this->laboratory->id,
            'quantity' => '5.50',
            'unit_id' => $this->unit->id,
        ])->assertRedirect();

        // Inventory movement quantity with > 2 decimals fails validation
        $this->actingAs($admin)->post('/inventory/movements', [
            'type' => 'RECEIVING',
            'item_id' => $item->id,
            'laboratory_id' => $this->laboratory->id,
            'quantity' => '5.555',
            'unit_id' => $this->unit->id,
        ])->assertSessionHasErrors('quantity');

        // Item creation with 2 decimals minimum stock passes
        $this->actingAs($admin)->post('/master/items', [
            'code' => 'DEC02',
            'name' => 'Item Dec 2',
            'item_type_id' => $this->type->id,
            'inventory_mode' => InventoryMode::Stock->value,
            'default_unit_id' => $this->unit->id,
            'minimum_stock' => '2.50',
            'is_active' => true,
            'laboratory_ids' => [$this->laboratory->id],
        ])->assertRedirect();

        // Item creation with > 2 decimals minimum stock fails validation
        $this->actingAs($admin)->post('/master/items', [
            'code' => 'DEC03',
            'name' => 'Item Dec 3',
            'item_type_id' => $this->type->id,
            'inventory_mode' => InventoryMode::Stock->value,
            'default_unit_id' => $this->unit->id,
            'minimum_stock' => '2.555',
            'is_active' => true,
            'laboratory_ids' => [$this->laboratory->id],
        ])->assertSessionHasErrors('minimum_stock');
    }

    public function test_unit_can_be_deleted_when_only_referenced_by_non_stock_items(): void
    {
        $admin = User::factory()->create(['default_laboratory_id' => $this->laboratory->id]);
        $admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());
        $admin->laboratories()->attach($this->laboratory);

        $kitUnit = Unit::create(['name' => 'Kit', 'symbol' => 'kit', 'is_active' => true]);
        $nonStockItem = Item::create([
            'code' => 'TEST-KIT-01',
            'name' => 'Test Kit Item',
            'item_type_id' => $this->type->id,
            'category_id' => $this->category->id,
            'default_unit_id' => $kitUnit->id,
            'inventory_mode' => InventoryMode::None,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->delete("/master/units/{$kitUnit->id}")
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('units', ['id' => $kitUnit->id]);
        $this->assertDatabaseHas('items', ['id' => $nonStockItem->id, 'default_unit_id' => null]);
    }

    public function test_unit_cannot_be_deleted_when_referenced_by_stock_items(): void
    {
        $admin = User::factory()->create(['default_laboratory_id' => $this->laboratory->id]);
        $admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());
        $admin->laboratories()->attach($this->laboratory);

        $stockUnit = Unit::create(['name' => 'Bottle', 'symbol' => 'btl', 'is_active' => true]);
        Item::create([
            'code' => 'TEST-STK-01',
            'name' => 'Test Stock Item',
            'item_type_id' => $this->type->id,
            'category_id' => $this->category->id,
            'default_unit_id' => $stockUnit->id,
            'inventory_mode' => InventoryMode::Stock,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->delete("/master/units/{$stockUnit->id}")
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('units', ['id' => $stockUnit->id]);
    }

    public function test_unit_cannot_be_deleted_when_referenced_by_stock_movements(): void
    {
        $admin = User::factory()->create(['default_laboratory_id' => $this->laboratory->id]);
        $admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());
        $admin->laboratories()->attach($this->laboratory);

        $movUnit = Unit::create(['name' => 'Roll', 'symbol' => 'roll', 'is_active' => true]);
        $item = $this->item('TEST-MOV-01', InventoryMode::Stock);

        StockMovement::create([
            'item_id' => $item->id,
            'laboratory_id' => $this->laboratory->id,
            'type' => 'RECEIVING',
            'quantity' => 10,
            'unit_id' => $movUnit->id,
            'created_by' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->delete("/master/units/{$movUnit->id}")
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('units', ['id' => $movUnit->id]);
    }

    public function test_unit_cannot_be_deleted_when_referenced_by_material_usage_items(): void
    {
        $admin = User::factory()->create(['default_laboratory_id' => $this->laboratory->id]);
        $admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());
        $admin->laboratories()->attach($this->laboratory);

        $usageUnit = Unit::create(['name' => 'Tube', 'symbol' => 'tube', 'is_active' => true]);
        $item = $this->item('TEST-USG-01', InventoryMode::None);
        $usage = $this->usage($this->laboratory, 'USG-TEST-001');

        $usage->items()->create([
            'item_id' => $item->id,
            'quantity' => 1,
            'unit_id' => $usageUnit->id,
        ]);

        $this->actingAs($admin)
            ->delete("/master/units/{$usageUnit->id}")
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('units', ['id' => $usageUnit->id]);
    }

    private function item(string $code, InventoryMode $mode, bool $active = true, bool $mapped = true): Item
    {
        $item = Item::create([
            'code' => $code, 'name' => "Item {$code}", 'item_type_id' => $this->type->id,
            'category_id' => $this->category->id, 'default_unit_id' => $this->unit->id,
            'inventory_mode' => $mode, 'is_active' => $active,
        ]);
        if ($mapped) {
            $item->laboratories()->attach($this->laboratory);
        }

        return $item;
    }

    /** @param array<int, Item> $items */
    private function payload(array $items, string $quantity = '2'): array
    {
        return [
            'usage_date' => '2026-09-29', 'laboratory_id' => $this->laboratory->id,
            'purpose' => 'Pengujian rutin', 'status' => 'SUBMITTED',
            'items' => collect($items)->map(fn (Item $item): array => ['item_id' => $item->id, 'quantity' => $quantity, 'unit_id' => $this->unit->id])->all(),
        ];
    }

    private function usage(Laboratory $laboratory, string $number): MaterialUsage
    {
        return MaterialUsage::create([
            'number' => $number, 'usage_date' => '2026-09-29', 'laboratory_id' => $laboratory->id,
            'status' => 'SUBMITTED', 'created_by' => $this->staff->id,
        ]);
    }
}
