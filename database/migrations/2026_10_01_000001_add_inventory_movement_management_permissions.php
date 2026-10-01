<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** @var array<string, string> */
    private array $permissions = [
        'inventory.update' => 'Mengubah mutasi stok manual',
        'inventory.delete' => 'Menghapus mutasi stok manual',
    ];

    public function up(): void
    {
        $now = now();

        foreach ($this->permissions as $name => $label) {
            DB::table('permissions')->insertOrIgnore([
                'name' => $name,
                'label' => $label,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            DB::table('permissions')->where('name', $name)->update([
                'label' => $label,
                'updated_at' => $now,
            ]);

            $permissionId = DB::table('permissions')->where('name', $name)->value('id');
            $roleIds = DB::table('roles')
                ->whereIn('name', ['super-admin', 'lab-admin', 'inventory-admin'])
                ->pluck('id');

            foreach ($roleIds as $roleId) {
                DB::table('permission_role')->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
                ]);
            }
        }
    }

    public function down(): void
    {
        $permissionIds = DB::table('permissions')->whereIn('name', array_keys($this->permissions))->pluck('id');
        $roleIds = DB::table('roles')
            ->whereIn('name', ['super-admin', 'lab-admin', 'inventory-admin'])
            ->pluck('id');

        DB::table('permission_role')
            ->whereIn('permission_id', $permissionIds)
            ->whereIn('role_id', $roleIds)
            ->delete();
    }
};
