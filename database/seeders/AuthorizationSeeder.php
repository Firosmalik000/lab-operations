<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class AuthorizationSeeder extends Seeder
{
    /** @var array<string, string> */
    private array $permissions = [
        'dashboard.view' => 'Melihat dashboard',
        'material-usage.view' => 'Melihat penggunaan bahan',
        'material-usage.create' => 'Mencatat penggunaan bahan',
        'material-usage.update' => 'Mengubah penggunaan bahan',
        'material-usage.void' => 'Membatalkan penggunaan bahan',
        'material-usage.delete' => 'Menghapus draf penggunaan bahan',
        'inventory.view' => 'Melihat inventory',
        'inventory.opening' => 'Mencatat stok awal',
        'inventory.receive' => 'Mencatat penerimaan',
        'inventory.adjust' => 'Menyesuaikan stok',
        'items.view' => 'Melihat item',
        'items.create' => 'Membuat item',
        'items.update' => 'Mengubah item',
        'items.delete' => 'Menghapus item',
        'item-types.manage' => 'Mengelola jenis item',
        'categories.manage' => 'Mengelola kategori',
        'units.manage' => 'Mengelola satuan',
        'laboratories.manage' => 'Mengelola laboratorium',
        'storage-locations.manage' => 'Mengelola lokasi penyimpanan',
        'users.manage' => 'Mengelola user',
        'roles.manage' => 'Mengelola role',
        'reports.view' => 'Melihat laporan',
        'audit.view' => 'Melihat audit log',
    ];

    public function run(): void
    {
        foreach ($this->permissions as $name => $label) {
            Permission::updateOrCreate(['name' => $name], ['label' => $label]);
        }

        $roles = [
            'super-admin' => ['Super Admin', array_keys($this->permissions)],
            'lab-admin' => ['Lab Admin', array_values(array_filter(array_keys($this->permissions), fn (string $permission): bool => ! in_array($permission, ['users.manage', 'roles.manage', 'audit.view'], true)))],
            'supervisor' => ['Supervisor', ['dashboard.view', 'material-usage.view', 'material-usage.create', 'material-usage.update', 'material-usage.void', 'material-usage.delete', 'inventory.view', 'reports.view']],
            'staff' => ['Staff', ['dashboard.view', 'material-usage.view', 'material-usage.create']],
            'inventory-admin' => ['Inventory Admin', ['dashboard.view', 'inventory.view', 'inventory.opening', 'inventory.receive', 'inventory.adjust', 'items.view', 'items.create', 'items.update', 'items.delete', 'reports.view']],
            'qa-qc' => ['QA/QC', ['dashboard.view', 'material-usage.view', 'inventory.view', 'reports.view', 'audit.view']],
        ];

        foreach ($roles as $name => [$label, $permissions]) {
            $role = Role::updateOrCreate(['name' => $name], ['label' => $label]);
            $role->permissions()->sync(Permission::whereIn('name', $permissions)->pluck('id'));
        }
    }
}
